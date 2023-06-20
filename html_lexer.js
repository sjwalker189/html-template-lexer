const _0 = "0".charCodeAt(0);
const _9 = "9".charCodeAt(0);

const a = "a".charCodeAt(0);
const z = "z".charCodeAt(0);

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);

const _ = "_".charCodeAt(0);

const voidTags = new Set(['hr', 'input']);

function isLetter(character) {
  const char = character.charCodeAt(0);
  return a <= char && z >= char || A <= char && Z >= char || char === _;
}

function tokenize(html) {
  const tokens = [];
  let pos = 0;

  while (pos < html.length) {


    if (html[pos] === '<') {
      /**
       * Parse tag name section
       */
      const tagStart = pos

      let tagType;
      let tagNameStart;
      let tagNameEnd;
      if (html[pos + 1] === "/") {
        tagType = "close"
        tagNameStart = pos + 2
      } else {
        tagType = "open"
        tagNameStart = pos + 1
      }

      // Capture the tag section, e.g. <div class=""> or <div> or </div> or <hr/> or <hr />
      while (pos < html.length) {
        if (!tagNameStart && isLetter(html[pos])) {
          tagNameStart = pos
        }

        if (!tagNameEnd && (html[pos] === " " || html[pos] === "/" || html[pos] === ">")) {
          tagNameEnd = pos
        }

        if (html[pos] === ">") {
          pos++;
          break;
        }

        pos++;
      }

      let tagEnd = pos;

      const tag = html.slice(tagStart, tagEnd);
      const tagName = html.slice(tagNameStart, tagNameEnd);
      let tagEnding = tag.length - 1;
      if (tag[tag.length - 2] === "/") {
        tagEnding = tag.length - 2
      }

      if (voidTags.has(tagName) || tag[tag.length - 2] === "/") {
        tagType = "selfClosing"
      }


      console.log("tn: ", { tagNameEnd, tagEnding, l: html[tagNameEnd],  })

      /**
       * Parse attributes section
       */

      const attributes = {};

      // TODO: 
      // 1. get the boundaries between the the tag statement, e.g. "<div" and ">" or "/>"
      // 2. Loop the inner text
      // 2.a. Search for attribute names, skipping spaces. attributes will be terminated with '=', ' ',  '/', or '>'
      // 2.b. When terminated by '=' grab the value from the following '"..."' portion of the text

      // Only check for attributes when there is a space after the element name.
      // e.g. <hr/> should be skipped.
      if (html[tagNameEnd] === " ") {
        let attrStart = tagNameEnd;


        console.log("attributes section: ", { attrs: tag.slice(attrStart, tagEnding), s: tag[attrStart], e: tag[tagEnding] })


        while (attrStart < tagEnding) {
          let attrEnd = attrStart + 1;

          while (attrEnd < tagEnding) {
            if (tag[attrEnd] == '=' || tag[attrEnd] == '/' || tag[attrEnd] == " " || tag[attrEnd] === ">") {

              console.log(tag[attrStart], tag[attrEnd])
              break;
            }
            attrEnd++;
          }

          const attrName = tag.slice(attrStart, attrEnd);
          let attrValue = true;

          if (tag[attrEnd] === '=') {
            let quoteChar = '';

            if (tag[attrEnd + 1] === '"' || tag[attrEnd + 1] === "'") {
              quoteChar = tag[attrEnd + 1];
              attrValue = '';

              for (let i = attrEnd + 2; i < tag.length; i++) {
                if (tag[i] === quoteChar) {
                  attrStart = i + 2;
                  break;
                }

                attrValue += tag[i];
              }
            } else {
              for (let i = attrEnd + 1; i < tag.length; i++) {
                if (tag[i] === ' ' || tag[i] === '>' || tag[i] === "/") {
                  attrStart = i + 1;
                  break;
                }

                attrValue += tag[i];
              }
            }
          } else {
            attrStart = attrEnd + 1;
          }

          attributes[attrName] = attrValue
        }
      }

      tokens.push({ type: tagType + "Tag", tagName, attributes, tag });
      pos = tagEnd
    } else {
      const textStart = pos;
      while (pos < html.length && html[pos + 1] !== '<') {
        pos++;
      }
      const textEnd = pos;


      const textContent = html.slice(textStart, textEnd + 1).trim()
      if (textContent !== "") {
        tokens.push({ type: 'text', value: textContent });
      }

      console.log({ textStart, textEnd, textContent })
      pos = textEnd + 1
    }
  }

  return tokens
}

// console.log(JSON.stringify(tokenize(`
// <x-card>
//   <header>Product Name</header>
//     <x-button tone="primary">
//       Buy Now
//       <x-icon name="addToCart"/>
//     </x-button>
// </x-card>
// `.trim()), null, 2))

// console.log(JSON.stringify(tokenize(`<hr/>`), null, 2))
// console.log(JSON.stringify(tokenize(`<hr>`), null, 2))
// console.log(JSON.stringify(tokenize(`<div>Foo</div>`), null, 2))
// console.log(JSON.stringify(tokenize(`<div class="a" :id="1">Foo</div><input disabled />`), null, 2))
console.log(JSON.stringify(tokenize(`<input disabled><input disabled/><input disabled />`), null, 2))

// console.log(JSON.stringify(tokenize(`
// <hr/>
// <div>blather</div>
// `), null, 2))