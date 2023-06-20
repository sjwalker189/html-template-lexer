import { Lexer } from "./lexer.ts"

const html = `
    <x-button.primary id="trigger" @if(darkMode)theme="dark"@endif>
        Press Me ->
        @if(props.icon){{ props.icon }}@endif
    </x-button.primary>
    <span>Plain text</span>
`.trim()

const tokens = new Lexer(html).build()

console.log(tokens)