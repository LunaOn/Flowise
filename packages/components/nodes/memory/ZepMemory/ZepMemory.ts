import { SystemChatMessage } from 'langchain/schema'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { ZepMemory, ZepMemoryInput } from 'langchain/memory/zep'

class ZepMemory_Memory implements INode {
    label: string
    name: string
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Zep Memory'
        this.name = 'ZepMemory'
        this.type = 'ZepMemory'
        this.icon = 'memory.svg'
        this.category = 'Memory'
        this.description = 'Summarizes the conversation and stores the memory in zep server'
        this.baseClasses = [this.type, ...getBaseClasses(ZepMemory)]
        this.inputs = [
            {
                label: 'Base URL',
                name: 'baseURL',
                type: 'string',
                default: 'http://127.0.0.1:8000'
            },
            {
                label: 'Session Id',
                name: 'sessionId',
                type: 'string',
                default: ''
            },
            {
                label: 'AI Prefix',
                name: 'aiPrefix',
                type: 'string',
                default: 'AI',
                additionalParams: true
            },
            {
                label: 'Human Prefix',
                name: 'humanPrefix',
                type: 'string',
                default: 'Human',
                additionalParams: true
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            },
            {
                label: 'Input Key',
                name: 'inputKey',
                type: 'string',
                default: 'input',
                additionalParams: true
            },
            {
                label: 'Output Key',
                name: 'outputKey',
                type: 'string',
                default: 'text',
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const baseURL = nodeData.inputs?.baseURL as string
        const sessionId = nodeData.inputs?.sessionId as string
        const aiPrefix = nodeData.inputs?.aiPrefix as string
        const humanPrefix = nodeData.inputs?.humanPrefix as string
        const memoryKey = nodeData.inputs?.memoryKey as string
        const inputKey = nodeData.inputs?.inputKey as string

        const obj: ZepMemoryInput = {
            baseURL,
            sessionId,
            aiPrefix,
            humanPrefix,
            returnMessages: true,
            memoryKey,
            inputKey
        }

        let zep = new ZepMemory(obj)

        let tmpFunc = zep.loadMemoryVariables;
        zep.loadMemoryVariables = async (values) => {
            let data = await tmpFunc.bind(zep, values)();
            // fix: Not found for summary
            if (zep.returnMessages && data[zep.memoryKey] && data[zep.memoryKey].length) {
                const memory = await zep.zepClient.getMemory(zep.sessionId, 10);
                // console.log('memory?', memory);
                if (memory?.summary) {
                    // console.log('get summary:', memory.summary.content);
                    data[zep.memoryKey].unshift(new SystemChatMessage(memory?.summary.content));
                }
            }
            console.log('data:', data)
            return data;
        }
        return zep;
    }
}

module.exports = { nodeClass: ZepMemory_Memory }
