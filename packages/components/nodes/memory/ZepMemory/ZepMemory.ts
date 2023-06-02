import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { BufferMemory } from 'langchain/memory'
import {ZepMemory,ZepMemoryInput} from 'langchain/memory/zep'
import { Memory,Message,ZepClient } from '@getzep/zep-js';
class BufferMemory_Memory implements INode {
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
        this.name = 'zepMemory'
        this.type = 'ZepMemory'
        this.icon = 'memory.svg'
        this.category = 'zepMemory'
        this.description = 'Remembers previous conversational back and forths directly'
        this.baseClasses = [this.type, ...getBaseClasses(ZepMemory)]
        this.inputs = [
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history'
            },
            {
                label: 'Input Key',
                name: 'inputKey',
                type: 'string',
                default: 'input'
            },
            {
                label: 'Base URL',
                name: 'baseURL',
                type: 'string',
                default: 'http://localhost:8000'
            },
            {
                label: 'Session Id',
                name: 'sessionId',
                type:'string',
                default:"default"
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const memoryKey = nodeData.inputs?.memoryKey as string
        const inputKey = nodeData.inputs?.inputKey as string
        const baseURL = nodeData.inputs?.baseURL  as string
        const sessionId = nodeData.inputs?.sessionId as string
        const zepClient = new ZepClient(baseURL)
        const memory = new ZepMemory({
            sessionId,
            baseURL:baseURL
        })
        const historyLen = (await memory.loadMemoryVariables({})).length
        if(historyLen==0){
            const chat_history = [
                {
                    "role":"human",
                    "content":"hi"
                },
                {
                    "role":"ai",
                    "content":"Hi,how can I help you?"
                }
            ]
            const messages = chat_history.map(
                ({role,content})=> new Message({role,content})
            )
            const zepMemory = new Memory({messages})
            await zepClient.addMemory(sessionId,zepMemory)
        }
        console.log(await memory.loadMemoryVariables({}))
        return new ZepMemory({
            returnMessages: true,
            memoryKey: memoryKey,
            inputKey: inputKey,
            baseURL: baseURL as string,
            sessionId: sessionId as string
        })
    }
}

module.exports = { nodeClass: BufferMemory_Memory }
