
const _0 = "0".charCodeAt(0);
const _9 = "9".charCodeAt(0);

const a = "a".charCodeAt(0);
const z = "z".charCodeAt(0);

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);

const symbols = {
    dash: "-".charCodeAt(0),
    dot: ".".charCodeAt(0),
    underscore: "_".charCodeAt(0),
}

function isLetter(character: string): boolean {
    const char = character.charCodeAt(0);
    return a <= char && z >= char || A <= char && Z >= char;
}

function isNumber(character: string): boolean {
    const char = character.charCodeAt(0);
    return _0 <= char && _9 >= char;
}

function isWhitespace(character: string): boolean {
    return character === " " || character === "\t" || character === "\n" || character === "\r"
}

function isCustomElementChar(character: string): boolean {
    const char = character.charCodeAt(0);
    return isLetter(character) || char == symbols.dash || char == symbols.dot
}

const EOF = "\0";

export class Lexer {
    private position = 0;
    private readPosition = 0;
    private ch!: string;

    private tokens: any[] = [];

    private lookForOpenTagEnd = false;
    private openElements: any = [];
    private openDirectives: any[] = [];

    constructor(private input: string) {
        this.readChar();
    }

    get lastToken() {
        return this.tokens[this.tokens.length - 1]
    }

    get lastDirective() {
        return this.openDirectives[this.openDirectives.length - 1]
    }

    private canReadChar() {
        return this.ch !== EOF;
    }

    private readChar(): void {
        if (this.readPosition >= this.input.length) {
            this.ch = EOF;
        } else {
            this.ch = this.input[this.readPosition];
        }

        this.position = this.readPosition;
        this.readPosition += 1;
    }

    private skipTo(position: number): void {
        this.position = position
        this.readPosition = position + 1
        this.ch = this.input[position]
    }

    private skip(count: number = 1): void {
        this.position += (count + 1)
        this.readPosition = this.position + 1
        this.ch = this.input[this.readPosition]
    }

    private skipWhitespace(): void {
        while (isWhitespace(this.ch)) {
            this.readChar();
        }
    }

    private peek(chars = 1, skipWhitespace = false): string {
        let position = this.readPosition;
        let len = this.input.length;

        if (position >= len) {
            return EOF;
        }

        if (skipWhitespace) {
            while (isWhitespace(this.input[position])) {
                if (position >= len) {
                    return EOF;
                } else {
                    position++
                }
            }
        }

        if (chars === 1) {
            return this.input[position];
        } else {
            return this.input.slice(position, position + chars)
        }
    }

    private readElementIdent() {
        let pos = this.position;

        while (isCustomElementChar(this.ch)) {
            this.readChar()
        }

        return this.input.slice(pos, this.position);
    }

    private readDirectiveIdent() {
        this.readChar();
        
        let pos = this.position;
        while (isLetter(this.ch)) {
            this.readChar()
        }

        return this.input.slice(pos, this.position);
    }

    build() {
        while (this.readPosition < this.input.length) {
            this.skipWhitespace();

            let token: any;
            switch (this.ch) {
                // Custom Elements
                case "<": {
                    // Closing tag 
                    if (this.peek(3) === "/x-") {
                        let start = this.position;
                        this.skipTo(this.position + 4);
                        let ident = this.readElementIdent();
                        let end = this.position;

                        token = {
                            type: "ElementClose",
                            ident,
                            start,
                            end,
                        };

                        this.skipWhitespace(); // TODO: should spaces be considerred illegal? e.g. </div >
                        this.skip(1); // skip the last ">" character
                        this.openElements.pop();

                        break;
                    }

                    // Opening tag 
                    if (this.peek(2) === "x-") {
                        let start = this.position;
                        this.skip(2);
                        let ident = this.readElementIdent();
                        let end = this.position;

                        token = {
                            type: "ElementOpenStart",
                            selfClosing: false,
                            ident,
                            start,
                            end,
                        };
                        
                        this.openElements.push(token);
                        this.lookForOpenTagEnd = true;
                    }

                    break;
                }

                case ">": {
                    if (this.lookForOpenTagEnd && this.openElements.length > 0) {
                        this.lookForOpenTagEnd = false;
                        token = {
                            type: "ElementOpenEnd",
                            start: this.position,
                            end: this.readPosition,
                        }
                    }

                    break;
                }

                // case  "{": {
                //     if (this.peek() === "{") {
                //         let start = this.position;
                //         while(this.canReadChar()) {
                //             if (this.peek(2) === "}}") {
                //                 token = {
                //                     type: "variable",
                //                     start: start + 2, 
                //                     end: this.position,
                //                     value: this.input.slice(start+2,this.position),
                //                 }
                //                 this.skip(2);
                //                 break;
                //             }
                //             this.readChar();
                //           }
                //     }
                //     break;
                // }

                case "@": {
                    let start = this.position;
                    let ident = this.readDirectiveIdent();
                    let end = this.position;
                    token = {
                        type: "directive",
                        ident,
                        start,
                        end,
                        args: undefined,
                    };

                    // Arguments are provided to the directive
                    if (this.ch === "(") {
                      this.readChar();
                      let openParens = 0;
                      let start = this.position;
                      let end = this.position;

                      while(this.canReadChar()) {
                        if (this.ch === "(") openParens++;
                        if (openParens > 0 && this.ch === ")") openParens--;
                        
                        if (openParens === 0 && this.ch === ")") {
                            end = this.position;
                            break;
                        }

                        this.readChar();
                      }

                      token.args = this.input.slice(start, end);
                      token.end = end + 1;

                      this.skip();
                    }
                    break;
                }
            }

            if (!token && this.lastToken && this.openElements) {
                if (this.lastToken.type === "attribute") {
                    if (this.ch === '"' || this.ch === "'") {
                        let start = this.lastToken.end + 2; // skip the =" chars
                        let end = this.position;
                        let content = this.input.slice(start, end);
                        this.lastToken.value = content;
                        this.lastToken.end = end;

                        this.lookForOpenTagEnd = true;
                    }
                } else {
                    if (isWhitespace(this.ch) || this.ch === "=") {
                        let start = this.lastToken.end
                        let end = this.position;
                        let content = this.input.slice(start, end).trim();
        
                        if (content) {
                            // When the current attribute has a value assigned, don't attempt to
                            // close the currently openned element. i.e. Allow the ">" character
                            // within attribute values.
                            this.lookForOpenTagEnd = this.ch !== "=";

                            token = {
                                type: "attribute",
                                name: content,
                                value: this.ch === "=" ? undefined : true,
                                start: end - content.length,
                                end,
                            }

                            this.skip() // skip the quote marks
                        }
                    }
                }
            }

            if (token) {
                // Capture content between known tokens as raw text
                if (token.start > this.lastToken?.end + 1) {
                    this.tokens.push({
                        type: "text",
                        raw: this.input.slice(this.lastToken.end, token.start),
                        start: this.lastToken.end + 1,
                        end: token.start - 1,
                    })
                }

                this.tokens.push(token)
            }

            // Read the next char to keep the loop moving
            this.readChar()
        }

        if (!this.tokens.length) {
            this.tokens.push({
                type: "text",
                raw: this.input,
            })
        }

        return this.tokens
    }
}
