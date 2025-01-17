import { ICommonObject, IMessage, INode, INodeData, INodeParams } from '../../../src/Interface'
import { initializeAgentExecutorWithOptions, AgentExecutor, InitializeAgentExecutorOptions } from 'langchain/agents'
import { Tool } from 'langchain/tools'
import { BaseChatMemory, ChatMessageHistory } from 'langchain/memory'
import { getBaseClasses } from '../../../src/utils'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'
import { BaseLanguageModel } from 'langchain/base_language'
import { Memory,Message,ZepClient } from '@getzep/zep-js';
import {ZepMemory,ZepMemoryInput} from 'langchain/memory/zep'

class FilterConversationalAgent_Agents implements INode {
    label: string
    name: string
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Filter Conversational Agent'
        this.name = 'filterConversationalAgent'
        this.type = 'AgentExecutor'
        this.category = 'Agents'
        this.icon = 'agent.svg'
        this.description = 'Conversational agent for a chat model. It will utilize chat specific prompts'
        this.baseClasses = [this.type, ...getBaseClasses(AgentExecutor)]
        this.inputs = [
            {
                label: 'Allowed Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseChatMemory'
            },
            {
                label: 'System Message',
                name: 'systemMessage',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Human Message',
                name: 'humanMessage',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseLanguageModel
        let tools = nodeData.inputs?.tools as Tool[]
        tools = tools.flat()
        const memory = nodeData.inputs?.memory as BaseChatMemory
        const humanMessage = nodeData.inputs?.humanMessage as string
        const systemMessage = nodeData.inputs?.systemMessage as string

        const obj: InitializeAgentExecutorOptions = {
            agentType: 'chat-conversational-react-description',
            verbose: process.env.DEBUG === 'true' ? true : false
        }

        const agentArgs: any = {}
        if (humanMessage) {
            agentArgs.humanMessage = humanMessage
        }
        if (systemMessage) {
            agentArgs.systemMessage = systemMessage
        }

        if (Object.keys(agentArgs).length) obj.agentArgs = agentArgs

        const executor = await initializeAgentExecutorWithOptions(tools, model, obj)
        executor.memory = memory
        return executor
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string> {
        const executor = nodeData.instance as AgentExecutor
        const memory = nodeData.inputs?.memory as BaseChatMemory
        if(input === '\\it'){
            input = '根据之前的对话记录，以用户的视角生成一段文字，保证对话连贯性，注意，你本次以及之后返回的内容只能是你以用户的视角生成的文字，不能有其他内容，尤其需要注意的是，你必须以用户也就是我的视角来说话，同时，你需要确保我们的对话内容是连贯的。'
        }
        if (options && options.chatHistory) {
            const chatHistory = []
            const histories: IMessage[] = options.chatHistory
            // for (const message of histories) {
            //     if(message.message === '\\it'){
            //         // if(!input.startsWith('请将以下文本翻译成英文：')){
            //         //     input = '请将以下文本翻译成英文：'+input
            //         // }
            //         continue
            //     }
            //     if (message.type === 'apiMessage') {
            //         chatHistory.push(new AIChatMessage(message.message))
            //     } else if (message.type === 'userMessage') {
            //         chatHistory.push(new HumanChatMessage(message.message))
            //     }
            // }
            for(const message of histories){
                if(message.type === 'apiMessage'){
                    chatHistory.push({
                        "role":"ai",
                        "content":message.message
                    })
                }
                else if(message.type === "userMessage"){
                    chatHistory.push({
                        "role":"human",
                        "content":message.message
                    })
                }
            }
            const messages = chatHistory.map(
                ({role,content})=> new Message({role,content})
            )
            const zepMemory = new ZepMemory({
                baseURL:"http://localhost:8000",
                sessionId:'default'
            })
            // memory.chatHistory = new ChatMessageHistory(zepMemory)
            executor.memory = zepMemory
        }
        console.log('executor.memory')
        console.log(executor.memory)
        console.log(JSON.stringify(executor.memory))
        console.log('input')
        console.log(input)
        const result = await executor.call({ input })
        console.log('output')
        console.log(JSON.stringify(result?.output))
        return result?.output
    }
}

module.exports = { nodeClass: FilterConversationalAgent_Agents }
