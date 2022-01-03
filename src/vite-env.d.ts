/// <reference types="vite/client" />

declare module '*.pegjs' {
    import { Parser } from 'peggy'
    const parser: Parser
    export default parser
}

declare module '*.pegjs?trace' {
    import { Parser } from 'peggy'
    const parser: Parser
    export default parser
}
