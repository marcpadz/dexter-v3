import { AbstractAgent } from "@ag-ui/client";
import { EventType } from "@ag-ui/core";
import { Observable } from "rxjs";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { compiledGraph } from "./graph";
import type { AgentConfig, Message } from "@ag-ui/client";
import type { RunAgentInput } from "@ag-ui/client";
import type { BaseEvent } from "@ag-ui/core";

class DexterAgent extends AbstractAgent {
  constructor(config?: AgentConfig) {
    super(config || {});
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const runId = input.runId || crypto.randomUUID();
      const threadId = input.threadId || crypto.randomUUID();

      subscriber.next({
        type: EventType.RUN_STARTED,
        runId,
        threadId,
      } as BaseEvent);

      this.executeGraph(input, runId, threadId, subscriber)
        .then(() => {
          subscriber.next({
            type: EventType.RUN_FINISHED,
            runId,
            threadId,
          } as BaseEvent);
          subscriber.complete();
        })
        .catch((err) => {
          subscriber.next({
            type: EventType.RUN_ERROR,
            runId,
            message: err.message || "Agent execution failed",
          } as BaseEvent);
          subscriber.complete();
        });
    });
  }

  private async executeGraph(
    input: RunAgentInput,
    runId: string,
    threadId: string,
    subscriber: any
  ) {
    const lastMessage = input.messages[input.messages.length - 1];
    if (!lastMessage) return;

    const allMessages: any[] = [];

    const graphInput = {
      messages: [new HumanMessage(lastMessage.content || "")],
    };

    const config: any = {
      configurable: {
        thread_id: threadId,
        model: (input.forwardedProps as any)?.model || "anthropic/claude-sonnet-4-20250514",
        apiKeys: (input.forwardedProps as any)?.apiKeys || {},
        conversationId: (input.forwardedProps as any)?.conversationId || threadId,
      },
    };

    const stream = await compiledGraph.streamEvents(graphInput, {
      ...config,
      version: "v2",
      streamMode: ["values", "messages"],
    } as any);

    let currentMessageId: string | null = null;
    let toolCallId: string | null = null;

    for await (const event of stream) {
      const ev = event as any;
      const eventName = ev.event || ev.name;

      if (eventName === "on_chat_model_stream") {
        const chunk = ev.data?.chunk;
        if (!chunk) continue;

        if (chunk.content && chunk.content !== "") {
          const content = typeof chunk.content === "string" ? chunk.content : "";
          if (!currentMessageId) {
            currentMessageId = chunk.id || crypto.randomUUID();
            subscriber.next({
              type: EventType.TEXT_MESSAGE_START,
              messageId: currentMessageId,
              role: "assistant",
            } as BaseEvent);
          }
          subscriber.next({
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: currentMessageId,
            delta: content,
          } as BaseEvent);
        }

        if (chunk.tool_call_chunks?.length) {
          for (const tc of chunk.tool_call_chunks) {
            if (tc.name) {
              toolCallId = tc.id || crypto.randomUUID();
              subscriber.next({
                type: EventType.TOOL_CALL_START,
                toolCallId,
                toolCallName: tc.name,
                parentMessageId: currentMessageId,
              } as BaseEvent);
            }
            if (tc.args) {
              subscriber.next({
                type: EventType.TOOL_CALL_ARGS,
                toolCallId,
                delta: tc.args,
              } as BaseEvent);
            }
          }
        }
      }

      if (eventName === "on_chat_model_end") {
        if (currentMessageId) {
          subscriber.next({
            type: EventType.TEXT_MESSAGE_END,
            messageId: currentMessageId,
          } as BaseEvent);
        }
        if (toolCallId) {
          subscriber.next({
            type: EventType.TOOL_CALL_END,
            toolCallId,
          } as BaseEvent);
        }
      }

      if (eventName === "on_tool_end") {
        const output = ev.data?.output;
        if (toolCallId) {
          subscriber.next({
            type: EventType.TOOL_CALL_RESULT,
            toolCallId,
            content: typeof output === "string" ? output : JSON.stringify(output),
          } as BaseEvent);
          toolCallId = null;
        }
      }
    }
  }
}

export const dexterAgent = new DexterAgent();
