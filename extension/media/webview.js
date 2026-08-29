"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // vscode-extension/node_modules/mdurl/build/index.cjs.js
  var require_index_cjs = __commonJS({
    "vscode-extension/node_modules/mdurl/build/index.cjs.js"(exports) {
      "use strict";
      var decodeCache = {};
      function getDecodeCache(exclude) {
        let cache = decodeCache[exclude];
        if (cache) {
          return cache;
        }
        cache = decodeCache[exclude] = [];
        for (let i = 0; i < 128; i++) {
          const ch = String.fromCharCode(i);
          cache.push(ch);
        }
        for (let i = 0; i < exclude.length; i++) {
          const ch = exclude.charCodeAt(i);
          cache[ch] = "%" + ("0" + ch.toString(16).toUpperCase()).slice(-2);
        }
        return cache;
      }
      function decode(string, exclude) {
        if (typeof exclude !== "string") {
          exclude = decode.defaultChars;
        }
        const cache = getDecodeCache(exclude);
        return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
          let result = "";
          for (let i = 0, l = seq.length; i < l; i += 3) {
            const b1 = parseInt(seq.slice(i + 1, i + 3), 16);
            if (b1 < 128) {
              result += cache[b1];
              continue;
            }
            if ((b1 & 224) === 192 && i + 3 < l) {
              const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
              if ((b2 & 192) === 128) {
                const chr = b1 << 6 & 1984 | b2 & 63;
                if (chr < 128) {
                  result += "\uFFFD\uFFFD";
                } else {
                  result += String.fromCharCode(chr);
                }
                i += 3;
                continue;
              }
            }
            if ((b1 & 240) === 224 && i + 6 < l) {
              const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
              const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
              if ((b2 & 192) === 128 && (b3 & 192) === 128) {
                const chr = b1 << 12 & 61440 | b2 << 6 & 4032 | b3 & 63;
                if (chr < 2048 || chr >= 55296 && chr <= 57343) {
                  result += "\uFFFD\uFFFD\uFFFD";
                } else {
                  result += String.fromCharCode(chr);
                }
                i += 6;
                continue;
              }
            }
            if ((b1 & 248) === 240 && i + 9 < l) {
              const b2 = parseInt(seq.slice(i + 4, i + 6), 16);
              const b3 = parseInt(seq.slice(i + 7, i + 9), 16);
              const b4 = parseInt(seq.slice(i + 10, i + 12), 16);
              if ((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128) {
                let chr = b1 << 18 & 1835008 | b2 << 12 & 258048 | b3 << 6 & 4032 | b4 & 63;
                if (chr < 65536 || chr > 1114111) {
                  result += "\uFFFD\uFFFD\uFFFD\uFFFD";
                } else {
                  chr -= 65536;
                  result += String.fromCharCode(55296 + (chr >> 10), 56320 + (chr & 1023));
                }
                i += 9;
                continue;
              }
            }
            result += "\uFFFD";
          }
          return result;
        });
      }
      decode.defaultChars = ";/?:@&=+$,#";
      decode.componentChars = "";
      var encodeCache = {};
      function getEncodeCache(exclude) {
        let cache = encodeCache[exclude];
        if (cache) {
          return cache;
        }
        cache = encodeCache[exclude] = [];
        for (let i = 0; i < 128; i++) {
          const ch = String.fromCharCode(i);
          if (/^[0-9a-z]$/i.test(ch)) {
            cache.push(ch);
          } else {
            cache.push("%" + ("0" + i.toString(16).toUpperCase()).slice(-2));
          }
        }
        for (let i = 0; i < exclude.length; i++) {
          cache[exclude.charCodeAt(i)] = exclude[i];
        }
        return cache;
      }
      function encode(string, exclude, keepEscaped) {
        if (typeof exclude !== "string") {
          keepEscaped = exclude;
          exclude = encode.defaultChars;
        }
        if (typeof keepEscaped === "undefined") {
          keepEscaped = true;
        }
        const cache = getEncodeCache(exclude);
        let result = "";
        for (let i = 0, l = string.length; i < l; i++) {
          const code = string.charCodeAt(i);
          if (keepEscaped && code === 37 && i + 2 < l) {
            if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
              result += string.slice(i, i + 3);
              i += 2;
              continue;
            }
          }
          if (code < 128) {
            result += cache[code];
            continue;
          }
          if (code >= 55296 && code <= 57343) {
            if (code >= 55296 && code <= 56319 && i + 1 < l) {
              const nextCode = string.charCodeAt(i + 1);
              if (nextCode >= 56320 && nextCode <= 57343) {
                result += encodeURIComponent(string[i] + string[i + 1]);
                i++;
                continue;
              }
            }
            result += "%EF%BF%BD";
            continue;
          }
          result += encodeURIComponent(string[i]);
        }
        return result;
      }
      encode.defaultChars = ";/?:@&=+$,-_.!~*'()#";
      encode.componentChars = "-_.!~*'()";
      function format(url) {
        let result = "";
        result += url.protocol || "";
        result += url.slashes ? "//" : "";
        result += url.auth ? url.auth + "@" : "";
        if (url.hostname && url.hostname.indexOf(":") !== -1) {
          result += "[" + url.hostname + "]";
        } else {
          result += url.hostname || "";
        }
        result += url.port ? ":" + url.port : "";
        result += url.pathname || "";
        result += url.search || "";
        result += url.hash || "";
        return result;
      }
      function Url() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.pathname = null;
      }
      var protocolPattern = /^([a-z0-9.+-]+:)/i;
      var portPattern = /:[0-9]*$/;
      var simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
      var delims = ["<", ">", '"', "`", " ", "\r", "\n", "	"];
      var unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims);
      var autoEscape = ["'"].concat(unwise);
      var nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape);
      var hostEndingChars = ["/", "?", "#"];
      var hostnameMaxLen = 255;
      var hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
      var hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
      var hostlessProtocol = {
        javascript: true,
        "javascript:": true
      };
      var slashedProtocol = {
        http: true,
        https: true,
        ftp: true,
        gopher: true,
        file: true,
        "http:": true,
        "https:": true,
        "ftp:": true,
        "gopher:": true,
        "file:": true
      };
      function urlParse(url, slashesDenoteHost) {
        if (url && url instanceof Url) return url;
        const u = new Url();
        u.parse(url, slashesDenoteHost);
        return u;
      }
      Url.prototype.parse = function(url, slashesDenoteHost) {
        let lowerProto, hec, slashes;
        let rest = url;
        rest = rest.trim();
        if (!slashesDenoteHost && url.split("#").length === 1) {
          const simplePath = simplePathPattern.exec(rest);
          if (simplePath) {
            this.pathname = simplePath[1];
            if (simplePath[2]) {
              this.search = simplePath[2];
            }
            return this;
          }
        }
        let proto = protocolPattern.exec(rest);
        if (proto) {
          proto = proto[0];
          lowerProto = proto.toLowerCase();
          this.protocol = proto;
          rest = rest.substr(proto.length);
        }
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
          slashes = rest.substr(0, 2) === "//";
          if (slashes && !(proto && hostlessProtocol[proto])) {
            rest = rest.substr(2);
            this.slashes = true;
          }
        }
        if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
          let hostEnd = -1;
          for (let i = 0; i < hostEndingChars.length; i++) {
            hec = rest.indexOf(hostEndingChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
              hostEnd = hec;
            }
          }
          let auth, atSign;
          if (hostEnd === -1) {
            atSign = rest.lastIndexOf("@");
          } else {
            atSign = rest.lastIndexOf("@", hostEnd);
          }
          if (atSign !== -1) {
            auth = rest.slice(0, atSign);
            rest = rest.slice(atSign + 1);
            this.auth = auth;
          }
          hostEnd = -1;
          for (let i = 0; i < nonHostChars.length; i++) {
            hec = rest.indexOf(nonHostChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
              hostEnd = hec;
            }
          }
          if (hostEnd === -1) {
            hostEnd = rest.length;
          }
          if (rest[hostEnd - 1] === ":") {
            hostEnd--;
          }
          const host = rest.slice(0, hostEnd);
          rest = rest.slice(hostEnd);
          this.parseHost(host);
          this.hostname = this.hostname || "";
          const ipv6Hostname = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
          if (!ipv6Hostname) {
            const hostparts = this.hostname.split(/\./);
            for (let i = 0, l = hostparts.length; i < l; i++) {
              const part = hostparts[i];
              if (!part) {
                continue;
              }
              if (!part.match(hostnamePartPattern)) {
                let newpart = "";
                for (let j = 0, k = part.length; j < k; j++) {
                  if (part.charCodeAt(j) > 127) {
                    newpart += "x";
                  } else {
                    newpart += part[j];
                  }
                }
                if (!newpart.match(hostnamePartPattern)) {
                  const validParts = hostparts.slice(0, i);
                  const notHost = hostparts.slice(i + 1);
                  const bit = part.match(hostnamePartStart);
                  if (bit) {
                    validParts.push(bit[1]);
                    notHost.unshift(bit[2]);
                  }
                  if (notHost.length) {
                    rest = notHost.join(".") + rest;
                  }
                  this.hostname = validParts.join(".");
                  break;
                }
              }
            }
          }
          if (this.hostname.length > hostnameMaxLen) {
            this.hostname = "";
          }
          if (ipv6Hostname) {
            this.hostname = this.hostname.substr(1, this.hostname.length - 2);
          }
        }
        const hash = rest.indexOf("#");
        if (hash !== -1) {
          this.hash = rest.substr(hash);
          rest = rest.slice(0, hash);
        }
        const qm = rest.indexOf("?");
        if (qm !== -1) {
          this.search = rest.substr(qm);
          rest = rest.slice(0, qm);
        }
        if (rest) {
          this.pathname = rest;
        }
        if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
          this.pathname = "";
        }
        return this;
      };
      Url.prototype.parseHost = function(host) {
        let port = portPattern.exec(host);
        if (port) {
          port = port[0];
          if (port !== ":") {
            this.port = port.substr(1);
          }
          host = host.substr(0, host.length - port.length);
        }
        if (host) {
          this.hostname = host;
        }
      };
      exports.decode = decode;
      exports.encode = encode;
      exports.format = format;
      exports.parse = urlParse;
    }
  });

  // vscode-extension/node_modules/uc.micro/build/index.cjs.js
  var require_index_cjs2 = __commonJS({
    "vscode-extension/node_modules/uc.micro/build/index.cjs.js"(exports) {
      "use strict";
      var regex$5 = /[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
      var regex$4 = /[\0-\x1F\x7F-\x9F]/;
      var regex$3 = /[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;
      var regex$2 = /[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;
      var regex$1 = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;
      var regex = /[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
      exports.Any = regex$5;
      exports.Cc = regex$4;
      exports.Cf = regex$3;
      exports.P = regex$2;
      exports.S = regex$1;
      exports.Z = regex;
    }
  });

  // vscode-extension/node_modules/entities/lib/generated/decode-data-html.js
  var require_decode_data_html = __commonJS({
    "vscode-extension/node_modules/entities/lib/generated/decode-data-html.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = new Uint16Array(
        // prettier-ignore
        '\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map(function(c) {
          return c.charCodeAt(0);
        })
      );
    }
  });

  // vscode-extension/node_modules/entities/lib/generated/decode-data-xml.js
  var require_decode_data_xml = __commonJS({
    "vscode-extension/node_modules/entities/lib/generated/decode-data-xml.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = new Uint16Array(
        // prettier-ignore
        "\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map(function(c) {
          return c.charCodeAt(0);
        })
      );
    }
  });

  // vscode-extension/node_modules/entities/lib/decode_codepoint.js
  var require_decode_codepoint = __commonJS({
    "vscode-extension/node_modules/entities/lib/decode_codepoint.js"(exports) {
      "use strict";
      var _a;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.replaceCodePoint = exports.fromCodePoint = void 0;
      var decodeMap = /* @__PURE__ */ new Map([
        [0, 65533],
        // C1 Unicode control character reference replacements
        [128, 8364],
        [130, 8218],
        [131, 402],
        [132, 8222],
        [133, 8230],
        [134, 8224],
        [135, 8225],
        [136, 710],
        [137, 8240],
        [138, 352],
        [139, 8249],
        [140, 338],
        [142, 381],
        [145, 8216],
        [146, 8217],
        [147, 8220],
        [148, 8221],
        [149, 8226],
        [150, 8211],
        [151, 8212],
        [152, 732],
        [153, 8482],
        [154, 353],
        [155, 8250],
        [156, 339],
        [158, 382],
        [159, 376]
      ]);
      exports.fromCodePoint = // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
      (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
        var output = "";
        if (codePoint > 65535) {
          codePoint -= 65536;
          output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        output += String.fromCharCode(codePoint);
        return output;
      };
      function replaceCodePoint(codePoint) {
        var _a2;
        if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
          return 65533;
        }
        return (_a2 = decodeMap.get(codePoint)) !== null && _a2 !== void 0 ? _a2 : codePoint;
      }
      exports.replaceCodePoint = replaceCodePoint;
      function decodeCodePoint(codePoint) {
        return (0, exports.fromCodePoint)(replaceCodePoint(codePoint));
      }
      exports.default = decodeCodePoint;
    }
  });

  // vscode-extension/node_modules/entities/lib/decode.js
  var require_decode = __commonJS({
    "vscode-extension/node_modules/entities/lib/decode.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        }
        __setModuleDefault(result, mod);
        return result;
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodeXML = exports.decodeHTMLStrict = exports.decodeHTMLAttribute = exports.decodeHTML = exports.determineBranch = exports.EntityDecoder = exports.DecodingMode = exports.BinTrieFlags = exports.fromCodePoint = exports.replaceCodePoint = exports.decodeCodePoint = exports.xmlDecodeTree = exports.htmlDecodeTree = void 0;
      var decode_data_html_js_1 = __importDefault(require_decode_data_html());
      exports.htmlDecodeTree = decode_data_html_js_1.default;
      var decode_data_xml_js_1 = __importDefault(require_decode_data_xml());
      exports.xmlDecodeTree = decode_data_xml_js_1.default;
      var decode_codepoint_js_1 = __importStar(require_decode_codepoint());
      exports.decodeCodePoint = decode_codepoint_js_1.default;
      var decode_codepoint_js_2 = require_decode_codepoint();
      Object.defineProperty(exports, "replaceCodePoint", { enumerable: true, get: function() {
        return decode_codepoint_js_2.replaceCodePoint;
      } });
      Object.defineProperty(exports, "fromCodePoint", { enumerable: true, get: function() {
        return decode_codepoint_js_2.fromCodePoint;
      } });
      var CharCodes;
      (function(CharCodes2) {
        CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
        CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
        CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
        CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
        CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
        CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
        CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
        CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
        CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
        CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
        CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
        CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
      })(CharCodes || (CharCodes = {}));
      var TO_LOWER_BIT = 32;
      var BinTrieFlags;
      (function(BinTrieFlags2) {
        BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
        BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
        BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
      })(BinTrieFlags = exports.BinTrieFlags || (exports.BinTrieFlags = {}));
      function isNumber(code) {
        return code >= CharCodes.ZERO && code <= CharCodes.NINE;
      }
      function isHexadecimalCharacter(code) {
        return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
      }
      function isAsciiAlphaNumeric(code) {
        return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
      }
      function isEntityInAttributeInvalidEnd(code) {
        return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
      }
      var EntityDecoderState;
      (function(EntityDecoderState2) {
        EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
        EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
        EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
        EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
        EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
      })(EntityDecoderState || (EntityDecoderState = {}));
      var DecodingMode;
      (function(DecodingMode2) {
        DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
        DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
        DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
      })(DecodingMode = exports.DecodingMode || (exports.DecodingMode = {}));
      var EntityDecoder = (
        /** @class */
        (function() {
          function EntityDecoder2(decodeTree, emitCodePoint, errors) {
            this.decodeTree = decodeTree;
            this.emitCodePoint = emitCodePoint;
            this.errors = errors;
            this.state = EntityDecoderState.EntityStart;
            this.consumed = 1;
            this.result = 0;
            this.treeIndex = 0;
            this.excess = 1;
            this.decodeMode = DecodingMode.Strict;
          }
          EntityDecoder2.prototype.startEntity = function(decodeMode) {
            this.decodeMode = decodeMode;
            this.state = EntityDecoderState.EntityStart;
            this.result = 0;
            this.treeIndex = 0;
            this.excess = 1;
            this.consumed = 1;
          };
          EntityDecoder2.prototype.write = function(str, offset) {
            switch (this.state) {
              case EntityDecoderState.EntityStart: {
                if (str.charCodeAt(offset) === CharCodes.NUM) {
                  this.state = EntityDecoderState.NumericStart;
                  this.consumed += 1;
                  return this.stateNumericStart(str, offset + 1);
                }
                this.state = EntityDecoderState.NamedEntity;
                return this.stateNamedEntity(str, offset);
              }
              case EntityDecoderState.NumericStart: {
                return this.stateNumericStart(str, offset);
              }
              case EntityDecoderState.NumericDecimal: {
                return this.stateNumericDecimal(str, offset);
              }
              case EntityDecoderState.NumericHex: {
                return this.stateNumericHex(str, offset);
              }
              case EntityDecoderState.NamedEntity: {
                return this.stateNamedEntity(str, offset);
              }
            }
          };
          EntityDecoder2.prototype.stateNumericStart = function(str, offset) {
            if (offset >= str.length) {
              return -1;
            }
            if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
              this.state = EntityDecoderState.NumericHex;
              this.consumed += 1;
              return this.stateNumericHex(str, offset + 1);
            }
            this.state = EntityDecoderState.NumericDecimal;
            return this.stateNumericDecimal(str, offset);
          };
          EntityDecoder2.prototype.addToNumericResult = function(str, start, end, base) {
            if (start !== end) {
              var digitCount = end - start;
              this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
              this.consumed += digitCount;
            }
          };
          EntityDecoder2.prototype.stateNumericHex = function(str, offset) {
            var startIdx = offset;
            while (offset < str.length) {
              var char = str.charCodeAt(offset);
              if (isNumber(char) || isHexadecimalCharacter(char)) {
                offset += 1;
              } else {
                this.addToNumericResult(str, startIdx, offset, 16);
                return this.emitNumericEntity(char, 3);
              }
            }
            this.addToNumericResult(str, startIdx, offset, 16);
            return -1;
          };
          EntityDecoder2.prototype.stateNumericDecimal = function(str, offset) {
            var startIdx = offset;
            while (offset < str.length) {
              var char = str.charCodeAt(offset);
              if (isNumber(char)) {
                offset += 1;
              } else {
                this.addToNumericResult(str, startIdx, offset, 10);
                return this.emitNumericEntity(char, 2);
              }
            }
            this.addToNumericResult(str, startIdx, offset, 10);
            return -1;
          };
          EntityDecoder2.prototype.emitNumericEntity = function(lastCp, expectedLength) {
            var _a;
            if (this.consumed <= expectedLength) {
              (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
              return 0;
            }
            if (lastCp === CharCodes.SEMI) {
              this.consumed += 1;
            } else if (this.decodeMode === DecodingMode.Strict) {
              return 0;
            }
            this.emitCodePoint((0, decode_codepoint_js_1.replaceCodePoint)(this.result), this.consumed);
            if (this.errors) {
              if (lastCp !== CharCodes.SEMI) {
                this.errors.missingSemicolonAfterCharacterReference();
              }
              this.errors.validateNumericCharacterReference(this.result);
            }
            return this.consumed;
          };
          EntityDecoder2.prototype.stateNamedEntity = function(str, offset) {
            var decodeTree = this.decodeTree;
            var current = decodeTree[this.treeIndex];
            var valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
            for (; offset < str.length; offset++, this.excess++) {
              var char = str.charCodeAt(offset);
              this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
              if (this.treeIndex < 0) {
                return this.result === 0 || // If we are parsing an attribute
                this.decodeMode === DecodingMode.Attribute && // We shouldn't have consumed any characters after the entity,
                (valueLength === 0 || // And there should be no invalid characters.
                isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
              }
              current = decodeTree[this.treeIndex];
              valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
              if (valueLength !== 0) {
                if (char === CharCodes.SEMI) {
                  return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
                }
                if (this.decodeMode !== DecodingMode.Strict) {
                  this.result = this.treeIndex;
                  this.consumed += this.excess;
                  this.excess = 0;
                }
              }
            }
            return -1;
          };
          EntityDecoder2.prototype.emitNotTerminatedNamedEntity = function() {
            var _a;
            var _b = this, result = _b.result, decodeTree = _b.decodeTree;
            var valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
            this.emitNamedEntityData(result, valueLength, this.consumed);
            (_a = this.errors) === null || _a === void 0 ? void 0 : _a.missingSemicolonAfterCharacterReference();
            return this.consumed;
          };
          EntityDecoder2.prototype.emitNamedEntityData = function(result, valueLength, consumed) {
            var decodeTree = this.decodeTree;
            this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
            if (valueLength === 3) {
              this.emitCodePoint(decodeTree[result + 2], consumed);
            }
            return consumed;
          };
          EntityDecoder2.prototype.end = function() {
            var _a;
            switch (this.state) {
              case EntityDecoderState.NamedEntity: {
                return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
              }
              // Otherwise, emit a numeric entity if we have one.
              case EntityDecoderState.NumericDecimal: {
                return this.emitNumericEntity(0, 2);
              }
              case EntityDecoderState.NumericHex: {
                return this.emitNumericEntity(0, 3);
              }
              case EntityDecoderState.NumericStart: {
                (_a = this.errors) === null || _a === void 0 ? void 0 : _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
                return 0;
              }
              case EntityDecoderState.EntityStart: {
                return 0;
              }
            }
          };
          return EntityDecoder2;
        })()
      );
      exports.EntityDecoder = EntityDecoder;
      function getDecoder(decodeTree) {
        var ret = "";
        var decoder = new EntityDecoder(decodeTree, function(str) {
          return ret += (0, decode_codepoint_js_1.fromCodePoint)(str);
        });
        return function decodeWithTrie(str, decodeMode) {
          var lastIndex = 0;
          var offset = 0;
          while ((offset = str.indexOf("&", offset)) >= 0) {
            ret += str.slice(lastIndex, offset);
            decoder.startEntity(decodeMode);
            var len = decoder.write(
              str,
              // Skip the "&"
              offset + 1
            );
            if (len < 0) {
              lastIndex = offset + decoder.end();
              break;
            }
            lastIndex = offset + len;
            offset = len === 0 ? lastIndex + 1 : lastIndex;
          }
          var result = ret + str.slice(lastIndex);
          ret = "";
          return result;
        };
      }
      function determineBranch(decodeTree, current, nodeIdx, char) {
        var branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        var jumpOffset = current & BinTrieFlags.JUMP_TABLE;
        if (branchCount === 0) {
          return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
        }
        if (jumpOffset) {
          var value = char - jumpOffset;
          return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
        }
        var lo = nodeIdx;
        var hi = lo + branchCount - 1;
        while (lo <= hi) {
          var mid = lo + hi >>> 1;
          var midVal = decodeTree[mid];
          if (midVal < char) {
            lo = mid + 1;
          } else if (midVal > char) {
            hi = mid - 1;
          } else {
            return decodeTree[mid + branchCount];
          }
        }
        return -1;
      }
      exports.determineBranch = determineBranch;
      var htmlDecoder = getDecoder(decode_data_html_js_1.default);
      var xmlDecoder = getDecoder(decode_data_xml_js_1.default);
      function decodeHTML(str, mode) {
        if (mode === void 0) {
          mode = DecodingMode.Legacy;
        }
        return htmlDecoder(str, mode);
      }
      exports.decodeHTML = decodeHTML;
      function decodeHTMLAttribute(str) {
        return htmlDecoder(str, DecodingMode.Attribute);
      }
      exports.decodeHTMLAttribute = decodeHTMLAttribute;
      function decodeHTMLStrict(str) {
        return htmlDecoder(str, DecodingMode.Strict);
      }
      exports.decodeHTMLStrict = decodeHTMLStrict;
      function decodeXML(str) {
        return xmlDecoder(str, DecodingMode.Strict);
      }
      exports.decodeXML = decodeXML;
    }
  });

  // vscode-extension/node_modules/entities/lib/generated/encode-html.js
  var require_encode_html = __commonJS({
    "vscode-extension/node_modules/entities/lib/generated/encode-html.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      function restoreDiff(arr) {
        for (var i = 1; i < arr.length; i++) {
          arr[i][0] += arr[i - 1][0] + 1;
        }
        return arr;
      }
      exports.default = new Map(/* @__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: new Map(/* @__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));
    }
  });

  // vscode-extension/node_modules/entities/lib/escape.js
  var require_escape = __commonJS({
    "vscode-extension/node_modules/entities/lib/escape.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.escapeText = exports.escapeAttribute = exports.escapeUTF8 = exports.escape = exports.encodeXML = exports.getCodePoint = exports.xmlReplacer = void 0;
      exports.xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
      var xmlCodeMap = /* @__PURE__ */ new Map([
        [34, "&quot;"],
        [38, "&amp;"],
        [39, "&apos;"],
        [60, "&lt;"],
        [62, "&gt;"]
      ]);
      exports.getCodePoint = // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      String.prototype.codePointAt != null ? function(str, index) {
        return str.codePointAt(index);
      } : (
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function(c, index) {
          return (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
        }
      );
      function encodeXML(str) {
        var ret = "";
        var lastIdx = 0;
        var match;
        while ((match = exports.xmlReplacer.exec(str)) !== null) {
          var i = match.index;
          var char = str.charCodeAt(i);
          var next = xmlCodeMap.get(char);
          if (next !== void 0) {
            ret += str.substring(lastIdx, i) + next;
            lastIdx = i + 1;
          } else {
            ret += "".concat(str.substring(lastIdx, i), "&#x").concat((0, exports.getCodePoint)(str, i).toString(16), ";");
            lastIdx = exports.xmlReplacer.lastIndex += Number((char & 64512) === 55296);
          }
        }
        return ret + str.substr(lastIdx);
      }
      exports.encodeXML = encodeXML;
      exports.escape = encodeXML;
      function getEscaper(regex, map) {
        return function escape(data) {
          var match;
          var lastIdx = 0;
          var result = "";
          while (match = regex.exec(data)) {
            if (lastIdx !== match.index) {
              result += data.substring(lastIdx, match.index);
            }
            result += map.get(match[0].charCodeAt(0));
            lastIdx = match.index + 1;
          }
          return result + data.substring(lastIdx);
        };
      }
      exports.escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
      exports.escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
        [34, "&quot;"],
        [38, "&amp;"],
        [160, "&nbsp;"]
      ]));
      exports.escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
        [38, "&amp;"],
        [60, "&lt;"],
        [62, "&gt;"],
        [160, "&nbsp;"]
      ]));
    }
  });

  // vscode-extension/node_modules/entities/lib/encode.js
  var require_encode = __commonJS({
    "vscode-extension/node_modules/entities/lib/encode.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.encodeNonAsciiHTML = exports.encodeHTML = void 0;
      var encode_html_js_1 = __importDefault(require_encode_html());
      var escape_js_1 = require_escape();
      var htmlReplacer = /[\t\n!-,./:-@[-`\f{-}$\x80-\uFFFF]/g;
      function encodeHTML(data) {
        return encodeHTMLTrieRe(htmlReplacer, data);
      }
      exports.encodeHTML = encodeHTML;
      function encodeNonAsciiHTML(data) {
        return encodeHTMLTrieRe(escape_js_1.xmlReplacer, data);
      }
      exports.encodeNonAsciiHTML = encodeNonAsciiHTML;
      function encodeHTMLTrieRe(regExp, str) {
        var ret = "";
        var lastIdx = 0;
        var match;
        while ((match = regExp.exec(str)) !== null) {
          var i = match.index;
          ret += str.substring(lastIdx, i);
          var char = str.charCodeAt(i);
          var next = encode_html_js_1.default.get(char);
          if (typeof next === "object") {
            if (i + 1 < str.length) {
              var nextChar = str.charCodeAt(i + 1);
              var value = typeof next.n === "number" ? next.n === nextChar ? next.o : void 0 : next.n.get(nextChar);
              if (value !== void 0) {
                ret += value;
                lastIdx = regExp.lastIndex += 1;
                continue;
              }
            }
            next = next.v;
          }
          if (next !== void 0) {
            ret += next;
            lastIdx = i + 1;
          } else {
            var cp = (0, escape_js_1.getCodePoint)(str, i);
            ret += "&#x".concat(cp.toString(16), ";");
            lastIdx = regExp.lastIndex += Number(cp !== char);
          }
        }
        return ret + str.substr(lastIdx);
      }
    }
  });

  // vscode-extension/node_modules/entities/lib/index.js
  var require_lib = __commonJS({
    "vscode-extension/node_modules/entities/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLAttribute = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.DecodingMode = exports.EntityDecoder = exports.encodeHTML5 = exports.encodeHTML4 = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.escapeText = exports.escapeAttribute = exports.escapeUTF8 = exports.escape = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = exports.EncodingMode = exports.EntityLevel = void 0;
      var decode_js_1 = require_decode();
      var encode_js_1 = require_encode();
      var escape_js_1 = require_escape();
      var EntityLevel;
      (function(EntityLevel2) {
        EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
        EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
      })(EntityLevel = exports.EntityLevel || (exports.EntityLevel = {}));
      var EncodingMode;
      (function(EncodingMode2) {
        EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
        EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
        EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
        EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
        EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
      })(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
      function decode(data, options) {
        if (options === void 0) {
          options = EntityLevel.XML;
        }
        var level = typeof options === "number" ? options : options.level;
        if (level === EntityLevel.HTML) {
          var mode = typeof options === "object" ? options.mode : void 0;
          return (0, decode_js_1.decodeHTML)(data, mode);
        }
        return (0, decode_js_1.decodeXML)(data);
      }
      exports.decode = decode;
      function decodeStrict(data, options) {
        var _a;
        if (options === void 0) {
          options = EntityLevel.XML;
        }
        var opts = typeof options === "number" ? { level: options } : options;
        (_a = opts.mode) !== null && _a !== void 0 ? _a : opts.mode = decode_js_1.DecodingMode.Strict;
        return decode(data, opts);
      }
      exports.decodeStrict = decodeStrict;
      function encode(data, options) {
        if (options === void 0) {
          options = EntityLevel.XML;
        }
        var opts = typeof options === "number" ? { level: options } : options;
        if (opts.mode === EncodingMode.UTF8)
          return (0, escape_js_1.escapeUTF8)(data);
        if (opts.mode === EncodingMode.Attribute)
          return (0, escape_js_1.escapeAttribute)(data);
        if (opts.mode === EncodingMode.Text)
          return (0, escape_js_1.escapeText)(data);
        if (opts.level === EntityLevel.HTML) {
          if (opts.mode === EncodingMode.ASCII) {
            return (0, encode_js_1.encodeNonAsciiHTML)(data);
          }
          return (0, encode_js_1.encodeHTML)(data);
        }
        return (0, escape_js_1.encodeXML)(data);
      }
      exports.encode = encode;
      var escape_js_2 = require_escape();
      Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function() {
        return escape_js_2.encodeXML;
      } });
      Object.defineProperty(exports, "escape", { enumerable: true, get: function() {
        return escape_js_2.escape;
      } });
      Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function() {
        return escape_js_2.escapeUTF8;
      } });
      Object.defineProperty(exports, "escapeAttribute", { enumerable: true, get: function() {
        return escape_js_2.escapeAttribute;
      } });
      Object.defineProperty(exports, "escapeText", { enumerable: true, get: function() {
        return escape_js_2.escapeText;
      } });
      var encode_js_2 = require_encode();
      Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function() {
        return encode_js_2.encodeHTML;
      } });
      Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function() {
        return encode_js_2.encodeNonAsciiHTML;
      } });
      Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function() {
        return encode_js_2.encodeHTML;
      } });
      Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function() {
        return encode_js_2.encodeHTML;
      } });
      var decode_js_2 = require_decode();
      Object.defineProperty(exports, "EntityDecoder", { enumerable: true, get: function() {
        return decode_js_2.EntityDecoder;
      } });
      Object.defineProperty(exports, "DecodingMode", { enumerable: true, get: function() {
        return decode_js_2.DecodingMode;
      } });
      Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function() {
        return decode_js_2.decodeXML;
      } });
      Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function() {
        return decode_js_2.decodeHTML;
      } });
      Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function() {
        return decode_js_2.decodeHTMLStrict;
      } });
      Object.defineProperty(exports, "decodeHTMLAttribute", { enumerable: true, get: function() {
        return decode_js_2.decodeHTMLAttribute;
      } });
      Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function() {
        return decode_js_2.decodeHTML;
      } });
      Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function() {
        return decode_js_2.decodeHTML;
      } });
      Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function() {
        return decode_js_2.decodeHTMLStrict;
      } });
      Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function() {
        return decode_js_2.decodeHTMLStrict;
      } });
      Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function() {
        return decode_js_2.decodeXML;
      } });
    }
  });

  // vscode-extension/node_modules/linkify-it/build/index.cjs.js
  var require_index_cjs3 = __commonJS({
    "vscode-extension/node_modules/linkify-it/build/index.cjs.js"(exports, module) {
      "use strict";
      var uc_micro = require_index_cjs2();
      function reFactory(opts) {
        const re = {};
        opts = opts || {};
        re.src_Any = uc_micro.Any.source;
        re.src_Cc = uc_micro.Cc.source;
        re.src_Z = uc_micro.Z.source;
        re.src_P = uc_micro.P.source;
        re.src_ZPCc = [re.src_Z, re.src_P, re.src_Cc].join("|");
        re.src_ZCc = [re.src_Z, re.src_Cc].join("|");
        const text_separators = "[><\uFF5C]";
        re.src_pseudo_letter = `(?:(?!${text_separators}|${re.src_ZPCc})${re.src_Any})`;
        re.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
        re.src_auth = `(?:(?:(?!${re.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`;
        re.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?";
        re.src_host_terminator = `(?=$|${text_separators}|${re.src_ZPCc})(?!${opts["---"] ? "-(?!--)|" : "-|"}_|:\\d|\\.-|\\.(?!$|${re.src_ZPCc}))`;
        re.src_path = `(?:[/?#](?:(?!${re.src_ZCc}|${text_separators}|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!${re.src_ZCc}|\\]).)*\\]|\\((?:(?!${re.src_ZCc}|[)]).)*\\)|\\{(?:(?!${re.src_ZCc}|[}]).)*\\}|\\"(?:(?!${re.src_ZCc}|["]).)+\\"|\\'(?:(?!${re.src_ZCc}|[']).)+\\'|\\'(?=${re.src_pseudo_letter}|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!${re.src_ZCc}|[.]|$)|` + (opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
        `,(?!${re.src_ZCc}|$)|;(?!${re.src_ZCc}|$)|\\!+(?!${re.src_ZCc}|[!]|$)|\\?(?!${re.src_ZCc}|[?]|$))+|\\/)?`;
        re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]{0,63}';
        re.src_xn = "xn--[a-z0-9\\-]{1,59}";
        re.src_domain_root = // Allow letters & digits (http://test1)
        "(?:" + re.src_xn + `|${re.src_pseudo_letter}{1,63})`;
        re.src_domain = "(?:" + re.src_xn + `|(?:${re.src_pseudo_letter})|(?:${re.src_pseudo_letter}(?:-|${re.src_pseudo_letter}){0,61}${re.src_pseudo_letter}))`;
        re.src_host = `(?:(?:(?:(?:${re.src_domain})\\.)*${re.src_domain}))`;
        re.tpl_host_fuzzy = "(?:" + re.src_ip4 + `|(?:(?:(?:${re.src_domain})\\.)+(?:%TLDS%)))`;
        re.tpl_host_no_ip_fuzzy = `(?:(?:(?:${re.src_domain})\\.)+(?:%TLDS%))`;
        re.src_host_strict = re.src_host + re.src_host_terminator;
        re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
        re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
        re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
        re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;
        re.tpl_host_fuzzy_test = `localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:${re.src_ZPCc}|>|$))`;
        re.tpl_email_fuzzy = `(^|${text_separators}|"|\\(|${re.src_ZCc})(${re.src_email_name}@${re.tpl_host_fuzzy_strict})`;
        re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        `(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${re.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${re.tpl_host_port_fuzzy_strict}${re.src_path})`;
        re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        `(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${re.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${re.tpl_host_port_no_ip_fuzzy_strict}${re.src_path})`;
        return re;
      }
      function assign(obj) {
        const sources = Array.prototype.slice.call(arguments, 1);
        sources.forEach(function(source) {
          if (!source) {
            return;
          }
          Object.keys(source).forEach(function(key) {
            obj[key] = source[key];
          });
        });
        return obj;
      }
      function _class(obj) {
        return Object.prototype.toString.call(obj);
      }
      function isString(obj) {
        return _class(obj) === "[object String]";
      }
      function isObject(obj) {
        return _class(obj) === "[object Object]";
      }
      function isRegExp(obj) {
        return _class(obj) === "[object RegExp]";
      }
      function isFunction(obj) {
        return _class(obj) === "[object Function]";
      }
      function escapeRE(str) {
        return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
      }
      var defaultOptions = {
        fuzzyLink: true,
        fuzzyEmail: true,
        fuzzyIP: false
      };
      function isOptionsObj(obj) {
        return Object.keys(obj || {}).reduce(function(acc, k) {
          return acc || defaultOptions.hasOwnProperty(k);
        }, false);
      }
      var defaultSchemas = {
        "http:": {
          validate: function(text, pos, self) {
            const tail = text.slice(pos);
            if (!self.re.http) {
              self.re.http = new RegExp(
                `^\\/\\/${self.re.src_auth}${self.re.src_host_port_strict}${self.re.src_path}`,
                "i"
              );
            }
            if (self.re.http.test(tail)) {
              return tail.match(self.re.http)[0].length;
            }
            return 0;
          }
        },
        "https:": "http:",
        "ftp:": "http:",
        "//": {
          validate: function(text, pos, self) {
            const tail = text.slice(pos);
            if (!self.re.no_http) {
              self.re.no_http = new RegExp(
                "^" + self.re.src_auth + // Don't allow single-level domains, because of false positives like '//test'
                // with code comments
                `(?:localhost|(?:(?:${self.re.src_domain})\\.)+${self.re.src_domain_root})` + self.re.src_port + self.re.src_host_terminator + self.re.src_path,
                "i"
              );
            }
            if (self.re.no_http.test(tail)) {
              if (pos >= 3 && text[pos - 3] === ":") {
                return 0;
              }
              if (pos >= 3 && text[pos - 3] === "/") {
                return 0;
              }
              return tail.match(self.re.no_http)[0].length;
            }
            return 0;
          }
        },
        "mailto:": {
          validate: function(text, pos, self) {
            const tail = text.slice(pos);
            if (!self.re.mailto) {
              self.re.mailto = new RegExp(
                `^${self.re.src_email_name}@${self.re.src_host_strict}`,
                "i"
              );
            }
            if (self.re.mailto.test(tail)) {
              return tail.match(self.re.mailto)[0].length;
            }
            return 0;
          }
        }
      };
      var tlds_2ch_src_re = "a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]";
      var tlds_default = "biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");
      function createValidator(re) {
        return function(text, pos) {
          const tail = text.slice(pos);
          if (re.test(tail)) {
            return tail.match(re)[0].length;
          }
          return 0;
        };
      }
      function createNormalizer() {
        return function(match, self) {
          self.normalize(match);
        };
      }
      function compile(self) {
        const re = self.re = reFactory(self.__opts__);
        const tlds = self.__tlds__.slice();
        self.onCompile();
        if (!self.__tlds_replaced__) {
          tlds.push(tlds_2ch_src_re);
        }
        tlds.push(re.src_xn);
        re.src_tlds = tlds.join("|");
        function untpl(tpl) {
          return tpl.replace("%TLDS%", re.src_tlds);
        }
        re.email_fuzzy = RegExp(untpl(re.tpl_email_fuzzy), "i");
        re.email_fuzzy_global = RegExp(untpl(re.tpl_email_fuzzy), "ig");
        re.link_fuzzy = RegExp(untpl(re.tpl_link_fuzzy), "i");
        re.link_fuzzy_global = RegExp(untpl(re.tpl_link_fuzzy), "ig");
        re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "i");
        re.link_no_ip_fuzzy_global = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "ig");
        re.host_fuzzy_test = RegExp(untpl(re.tpl_host_fuzzy_test), "i");
        const aliases = [];
        self.__compiled__ = {};
        function schemaError(name, val) {
          throw new Error(`(LinkifyIt) Invalid schema "${name}": ${val}`);
        }
        Object.keys(self.__schemas__).forEach(function(name) {
          const val = self.__schemas__[name];
          if (val === null) {
            return;
          }
          const compiled = { validate: null, link: null };
          self.__compiled__[name] = compiled;
          if (isObject(val)) {
            if (isRegExp(val.validate)) {
              compiled.validate = createValidator(val.validate);
            } else if (isFunction(val.validate)) {
              compiled.validate = val.validate;
            } else {
              schemaError(name, val);
            }
            if (isFunction(val.normalize)) {
              compiled.normalize = val.normalize;
            } else if (!val.normalize) {
              compiled.normalize = createNormalizer();
            } else {
              schemaError(name, val);
            }
            return;
          }
          if (isString(val)) {
            aliases.push(name);
            return;
          }
          schemaError(name, val);
        });
        aliases.forEach(function(alias) {
          if (!self.__compiled__[self.__schemas__[alias]]) {
            return;
          }
          self.__compiled__[alias].validate = self.__compiled__[self.__schemas__[alias]].validate;
          self.__compiled__[alias].normalize = self.__compiled__[self.__schemas__[alias]].normalize;
        });
        self.__compiled__[""] = { validate: null, normalize: createNormalizer() };
        const slist = Object.keys(self.__compiled__).filter(function(name) {
          return name.length > 0 && self.__compiled__[name];
        }).map(escapeRE).join("|");
        self.re.schema_test = RegExp(`(^|(?!_)(?:[><\uFF5C]|${re.src_ZPCc}))(${slist})`, "i");
        self.re.schema_search = RegExp(`(^|(?!_)(?:[><\uFF5C]|${re.src_ZPCc}))(${slist})`, "ig");
        self.re.schema_at_start = RegExp(`^${self.re.schema_search.source}`, "i");
        self.re.pretest = RegExp(
          `(${self.re.schema_test.source})|(${self.re.host_fuzzy_test.source})|@`,
          "i"
        );
      }
      function Match(text, schema, index, lastIndex) {
        const raw = text.slice(index, lastIndex);
        this.schema = schema.toLowerCase();
        this.index = index;
        this.lastIndex = lastIndex;
        this.raw = raw;
        this.text = raw;
        this.url = raw;
      }
      function LinkifyIt(schemas, options) {
        if (!(this instanceof LinkifyIt)) {
          return new LinkifyIt(schemas, options);
        }
        if (!options) {
          if (isOptionsObj(schemas)) {
            options = schemas;
            schemas = {};
          }
        }
        this.__opts__ = assign({}, defaultOptions, options);
        this.__schemas__ = assign({}, defaultSchemas, schemas);
        this.__compiled__ = {};
        this.__tlds__ = tlds_default;
        this.__tlds_replaced__ = false;
        this.re = {};
        compile(this);
      }
      LinkifyIt.prototype.add = function add(schema, definition) {
        this.__schemas__[schema] = definition;
        compile(this);
        return this;
      };
      LinkifyIt.prototype.set = function set(options) {
        this.__opts__ = assign(this.__opts__, options);
        return this;
      };
      LinkifyIt.prototype.test = function test(text) {
        if (!text.length) {
          return false;
        }
        let m, re;
        if (this.re.schema_test.test(text)) {
          re = this.re.schema_search;
          re.lastIndex = 0;
          while ((m = re.exec(text)) !== null) {
            if (this.testSchemaAt(text, m[2], re.lastIndex)) {
              return true;
            }
          }
        }
        if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
          if (text.search(this.re.host_fuzzy_test) >= 0) {
            if (text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy) !== null) {
              return true;
            }
          }
        }
        if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
          if (text.indexOf("@") >= 0) {
            if (text.match(this.re.email_fuzzy) !== null) {
              return true;
            }
          }
        }
        return false;
      };
      LinkifyIt.prototype.pretest = function pretest(text) {
        return this.re.pretest.test(text);
      };
      LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
        if (!this.__compiled__[schema.toLowerCase()]) {
          return 0;
        }
        return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
      };
      LinkifyIt.prototype.match = function match(text) {
        const result = [];
        const type_schemed = [];
        const type_fuzzy_link = [];
        const type_fuzzy_email = [];
        let m, len, re;
        function choose(a, b) {
          if (!a) {
            return b;
          }
          if (!b) {
            return a;
          }
          if (a.index !== b.index) {
            return a.index < b.index ? a : b;
          }
          return a.lastIndex >= b.lastIndex ? a : b;
        }
        if (!text.length) {
          return null;
        }
        if (this.re.schema_test.test(text)) {
          re = this.re.schema_search;
          re.lastIndex = 0;
          while ((m = re.exec(text)) !== null) {
            len = this.testSchemaAt(text, m[2], re.lastIndex);
            if (len) {
              type_schemed.push({
                schema: m[2],
                index: m.index + m[1].length,
                lastIndex: m.index + m[0].length + len
              });
            }
          }
        }
        if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
          re = this.__opts__.fuzzyIP ? this.re.link_fuzzy_global : this.re.link_no_ip_fuzzy_global;
          re.lastIndex = 0;
          while ((m = re.exec(text)) !== null) {
            type_fuzzy_link.push({
              schema: "",
              index: m.index + m[1].length,
              lastIndex: m.index + m[0].length
            });
          }
        }
        if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
          re = this.re.email_fuzzy_global;
          re.lastIndex = 0;
          while ((m = re.exec(text)) !== null) {
            type_fuzzy_email.push({
              schema: "mailto:",
              index: m.index + m[1].length,
              lastIndex: m.index + m[0].length
            });
          }
        }
        const indexes = [0, 0, 0];
        let lastIndex = 0;
        for (; ; ) {
          const candidates = [
            type_schemed[indexes[0]],
            type_fuzzy_email[indexes[1]],
            type_fuzzy_link[indexes[2]]
          ];
          const candidate = choose(choose(candidates[0], candidates[1]), candidates[2]);
          if (!candidate) {
            break;
          }
          if (candidate === candidates[0]) {
            indexes[0]++;
          } else if (candidate === candidates[1]) {
            indexes[1]++;
          } else {
            indexes[2]++;
          }
          if (candidate.index < lastIndex) {
            continue;
          }
          const match2 = new Match(text, candidate.schema, candidate.index, candidate.lastIndex);
          this.__compiled__[match2.schema].normalize(match2, this);
          result.push(match2);
          lastIndex = candidate.lastIndex;
        }
        if (result.length) {
          return result;
        }
        return null;
      };
      LinkifyIt.prototype.matchAtStart = function matchAtStart(text) {
        if (!text.length) return null;
        const m = this.re.schema_at_start.exec(text);
        if (!m) return null;
        const len = this.testSchemaAt(text, m[2], m[0].length);
        if (!len) return null;
        const match = new Match(text, m[2], m.index + m[1].length, m.index + m[0].length + len);
        this.__compiled__[match.schema].normalize(match, this);
        return match;
      };
      LinkifyIt.prototype.tlds = function tlds(list2, keepOld) {
        list2 = Array.isArray(list2) ? list2 : [list2];
        if (!keepOld) {
          this.__tlds__ = list2.slice();
          this.__tlds_replaced__ = true;
          compile(this);
          return this;
        }
        this.__tlds__ = this.__tlds__.concat(list2).sort().filter(function(el2, idx, arr) {
          return el2 !== arr[idx - 1];
        }).reverse();
        compile(this);
        return this;
      };
      LinkifyIt.prototype.normalize = function normalize(match) {
        if (!match.schema) {
          match.url = `http://${match.url}`;
        }
        if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) {
          match.url = `mailto:${match.url}`;
        }
      };
      LinkifyIt.prototype.onCompile = function onCompile() {
      };
      module.exports = LinkifyIt;
    }
  });

  // vscode-extension/node_modules/punycode.js/punycode.js
  var require_punycode = __commonJS({
    "vscode-extension/node_modules/punycode.js/punycode.js"(exports, module) {
      "use strict";
      var maxInt = 2147483647;
      var base = 36;
      var tMin = 1;
      var tMax = 26;
      var skew = 38;
      var damp = 700;
      var initialBias = 72;
      var initialN = 128;
      var delimiter = "-";
      var regexPunycode = /^xn--/;
      var regexNonASCII = /[^\0-\x7F]/;
      var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
      var errors = {
        "overflow": "Overflow: input needs wider integers to process",
        "not-basic": "Illegal input >= 0x80 (not a basic code point)",
        "invalid-input": "Invalid input"
      };
      var baseMinusTMin = base - tMin;
      var floor = Math.floor;
      var stringFromCharCode = String.fromCharCode;
      function error(type) {
        throw new RangeError(errors[type]);
      }
      function map(array, callback) {
        const result = [];
        let length = array.length;
        while (length--) {
          result[length] = callback(array[length]);
        }
        return result;
      }
      function mapDomain(domain, callback) {
        const parts = domain.split("@");
        let result = "";
        if (parts.length > 1) {
          result = parts[0] + "@";
          domain = parts[1];
        }
        domain = domain.replace(regexSeparators, ".");
        const labels = domain.split(".");
        const encoded = map(labels, callback).join(".");
        return result + encoded;
      }
      function ucs2decode(string) {
        const output = [];
        let counter = 0;
        const length = string.length;
        while (counter < length) {
          const value = string.charCodeAt(counter++);
          if (value >= 55296 && value <= 56319 && counter < length) {
            const extra = string.charCodeAt(counter++);
            if ((extra & 64512) == 56320) {
              output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
            } else {
              output.push(value);
              counter--;
            }
          } else {
            output.push(value);
          }
        }
        return output;
      }
      var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
      var basicToDigit = function(codePoint) {
        if (codePoint >= 48 && codePoint < 58) {
          return 26 + (codePoint - 48);
        }
        if (codePoint >= 65 && codePoint < 91) {
          return codePoint - 65;
        }
        if (codePoint >= 97 && codePoint < 123) {
          return codePoint - 97;
        }
        return base;
      };
      var digitToBasic = function(digit, flag) {
        return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
      };
      var adapt = function(delta, numPoints, firstTime) {
        let k = 0;
        delta = firstTime ? floor(delta / damp) : delta >> 1;
        delta += floor(delta / numPoints);
        for (; delta > baseMinusTMin * tMax >> 1; k += base) {
          delta = floor(delta / baseMinusTMin);
        }
        return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
      };
      var decode = function(input) {
        const output = [];
        const inputLength = input.length;
        let i = 0;
        let n = initialN;
        let bias = initialBias;
        let basic = input.lastIndexOf(delimiter);
        if (basic < 0) {
          basic = 0;
        }
        for (let j = 0; j < basic; ++j) {
          if (input.charCodeAt(j) >= 128) {
            error("not-basic");
          }
          output.push(input.charCodeAt(j));
        }
        for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
          const oldi = i;
          for (let w = 1, k = base; ; k += base) {
            if (index >= inputLength) {
              error("invalid-input");
            }
            const digit = basicToDigit(input.charCodeAt(index++));
            if (digit >= base) {
              error("invalid-input");
            }
            if (digit > floor((maxInt - i) / w)) {
              error("overflow");
            }
            i += digit * w;
            const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (digit < t) {
              break;
            }
            const baseMinusT = base - t;
            if (w > floor(maxInt / baseMinusT)) {
              error("overflow");
            }
            w *= baseMinusT;
          }
          const out = output.length + 1;
          bias = adapt(i - oldi, out, oldi == 0);
          if (floor(i / out) > maxInt - n) {
            error("overflow");
          }
          n += floor(i / out);
          i %= out;
          output.splice(i++, 0, n);
        }
        return String.fromCodePoint(...output);
      };
      var encode = function(input) {
        const output = [];
        input = ucs2decode(input);
        const inputLength = input.length;
        let n = initialN;
        let delta = 0;
        let bias = initialBias;
        for (const currentValue of input) {
          if (currentValue < 128) {
            output.push(stringFromCharCode(currentValue));
          }
        }
        const basicLength = output.length;
        let handledCPCount = basicLength;
        if (basicLength) {
          output.push(delimiter);
        }
        while (handledCPCount < inputLength) {
          let m = maxInt;
          for (const currentValue of input) {
            if (currentValue >= n && currentValue < m) {
              m = currentValue;
            }
          }
          const handledCPCountPlusOne = handledCPCount + 1;
          if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
            error("overflow");
          }
          delta += (m - n) * handledCPCountPlusOne;
          n = m;
          for (const currentValue of input) {
            if (currentValue < n && ++delta > maxInt) {
              error("overflow");
            }
            if (currentValue === n) {
              let q = delta;
              for (let k = base; ; k += base) {
                const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                if (q < t) {
                  break;
                }
                const qMinusT = q - t;
                const baseMinusT = base - t;
                output.push(
                  stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
                );
                q = floor(qMinusT / baseMinusT);
              }
              output.push(stringFromCharCode(digitToBasic(q, 0)));
              bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
              delta = 0;
              ++handledCPCount;
            }
          }
          ++delta;
          ++n;
        }
        return output.join("");
      };
      var toUnicode = function(input) {
        return mapDomain(input, function(string) {
          return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
        });
      };
      var toASCII = function(input) {
        return mapDomain(input, function(string) {
          return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
        });
      };
      var punycode = {
        /**
         * A string representing the current Punycode.js version number.
         * @memberOf punycode
         * @type String
         */
        "version": "2.3.1",
        /**
         * An object of methods to convert from JavaScript's internal character
         * representation (UCS-2) to Unicode code points, and back.
         * @see <https://mathiasbynens.be/notes/javascript-encoding>
         * @memberOf punycode
         * @type Object
         */
        "ucs2": {
          "decode": ucs2decode,
          "encode": ucs2encode
        },
        "decode": decode,
        "encode": encode,
        "toASCII": toASCII,
        "toUnicode": toUnicode
      };
      module.exports = punycode;
    }
  });

  // vscode-extension/node_modules/markdown-it/dist/index.cjs.js
  var require_index_cjs4 = __commonJS({
    "vscode-extension/node_modules/markdown-it/dist/index.cjs.js"(exports, module) {
      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __exportAll = (all, no_symbols) => {
        let target = {};
        for (var name in all) __defProp(target, name, {
          get: all[name],
          enumerable: true
        });
        if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
        return target;
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames2(from), i = 0, n = keys.length, key; i < n; i++) {
          key = keys[i];
          if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ((k) => from[k]).bind(null, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
        }
        return to;
      };
      var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
        value: mod,
        enumerable: true
      }) : target, mod));
      var mdurl = require_index_cjs();
      mdurl = __toESM(mdurl, 1);
      var uc_micro = require_index_cjs2();
      uc_micro = __toESM(uc_micro, 1);
      var entities = require_lib();
      var linkify_it = require_index_cjs3();
      linkify_it = __toESM(linkify_it, 1);
      var punycode_js = require_punycode();
      punycode_js = __toESM(punycode_js, 1);
      var utils_exports = /* @__PURE__ */ __exportAll({
        arrayReplaceAt: () => arrayReplaceAt,
        asciiTrim: () => asciiTrim,
        assign: () => assign,
        escapeHtml: () => escapeHtml,
        escapeRE: () => escapeRE,
        fromCodePoint: () => fromCodePoint,
        has: () => has,
        isMdAsciiPunct: () => isMdAsciiPunct,
        isPunctChar: () => isPunctChar,
        isPunctCharCode: () => isPunctCharCode,
        isSpace: () => isSpace,
        isString: () => isString,
        isValidEntityCode: () => isValidEntityCode,
        isWhiteSpace: () => isWhiteSpace,
        lib: () => lib,
        normalizeReference: () => normalizeReference,
        unescapeAll: () => unescapeAll,
        unescapeMd: () => unescapeMd
      });
      function _class(obj) {
        return Object.prototype.toString.call(obj);
      }
      function isString(obj) {
        return _class(obj) === "[object String]";
      }
      var _hasOwnProperty = Object.prototype.hasOwnProperty;
      function has(object, key) {
        return _hasOwnProperty.call(object, key);
      }
      function assign(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
          if (!source) return;
          if (typeof source !== "object") throw new TypeError(source + "must be object");
          Object.keys(source).forEach(function(key) {
            obj[key] = source[key];
          });
        });
        return obj;
      }
      function arrayReplaceAt(src, pos, newElements) {
        return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
      }
      function isValidEntityCode(c) {
        if (c >= 55296 && c <= 57343) return false;
        if (c >= 64976 && c <= 65007) return false;
        if ((c & 65535) === 65535 || (c & 65535) === 65534) return false;
        if (c >= 0 && c <= 8) return false;
        if (c === 11) return false;
        if (c >= 14 && c <= 31) return false;
        if (c >= 127 && c <= 159) return false;
        if (c > 1114111) return false;
        return true;
      }
      function fromCodePoint(c) {
        if (c > 65535) {
          c -= 65536;
          const surrogate1 = 55296 + (c >> 10);
          const surrogate2 = 56320 + (c & 1023);
          return String.fromCharCode(surrogate1, surrogate2);
        }
        return String.fromCharCode(c);
      }
      var UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g;
      var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + "|" + /&([a-z#][a-z0-9]{1,31});/gi.source, "gi");
      var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
      function replaceEntityPattern(match, name) {
        if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
          const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
          if (isValidEntityCode(code2)) return fromCodePoint(code2);
          return match;
        }
        const decoded = (0, entities.decodeHTML)(match);
        if (decoded !== match) return decoded;
        return match;
      }
      function unescapeMd(str) {
        if (str.indexOf("\\") < 0) return str;
        return str.replace(UNESCAPE_MD_RE, "$1");
      }
      function unescapeAll(str) {
        if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) return str;
        return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity2) {
          if (escaped) return escaped;
          return replaceEntityPattern(match, entity2);
        });
      }
      var HTML_ESCAPE_TEST_RE = /[&<>"]/;
      var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
      var HTML_REPLACEMENTS = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      };
      function replaceUnsafeChar(ch) {
        return HTML_REPLACEMENTS[ch];
      }
      function escapeHtml(str) {
        if (HTML_ESCAPE_TEST_RE.test(str)) return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
        return str;
      }
      var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;
      function escapeRE(str) {
        return str.replace(REGEXP_ESCAPE_RE, "\\$&");
      }
      function isSpace(code2) {
        switch (code2) {
          case 9:
          case 32:
            return true;
        }
        return false;
      }
      function isWhiteSpace(code2) {
        if (code2 >= 8192 && code2 <= 8202) return true;
        switch (code2) {
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 32:
          case 160:
          case 5760:
          case 8239:
          case 8287:
          case 12288:
            return true;
        }
        return false;
      }
      function isPunctChar(ch) {
        return uc_micro.P.test(ch) || uc_micro.S.test(ch);
      }
      function isPunctCharCode(code2) {
        return isPunctChar(fromCodePoint(code2));
      }
      function isMdAsciiPunct(ch) {
        switch (ch) {
          case 33:
          case 34:
          case 35:
          case 36:
          case 37:
          case 38:
          case 39:
          case 40:
          case 41:
          case 42:
          case 43:
          case 44:
          case 45:
          case 46:
          case 47:
          case 58:
          case 59:
          case 60:
          case 61:
          case 62:
          case 63:
          case 64:
          case 91:
          case 92:
          case 93:
          case 94:
          case 95:
          case 96:
          case 123:
          case 124:
          case 125:
          case 126:
            return true;
          default:
            return false;
        }
      }
      function normalizeReference(str) {
        str = str.trim().replace(/\s+/g, " ");
        if ("\u1E9E".toLowerCase() === "\u1E7E")
          str = str.replace(/ẞ/g, "\xDF");
        return str.toLowerCase().toUpperCase();
      }
      function isAsciiTrimmable(c) {
        return c === 32 || c === 9 || c === 10 || c === 13;
      }
      function asciiTrim(str) {
        let start = 0;
        for (; start < str.length; start++) if (!isAsciiTrimmable(str.charCodeAt(start))) break;
        let end = str.length - 1;
        for (; end >= start; end--) if (!isAsciiTrimmable(str.charCodeAt(end))) break;
        return str.slice(start, end + 1);
      }
      var lib = {
        mdurl,
        ucmicro: uc_micro
      };
      function parseLinkLabel(state2, start, disableNested) {
        let level, found, marker, prevPos;
        const max = state2.posMax;
        const oldPos = state2.pos;
        state2.pos = start + 1;
        level = 1;
        while (state2.pos < max) {
          marker = state2.src.charCodeAt(state2.pos);
          if (marker === 93) {
            level--;
            if (level === 0) {
              found = true;
              break;
            }
          }
          prevPos = state2.pos;
          state2.md.inline.skipToken(state2);
          if (marker === 91) {
            if (prevPos === state2.pos - 1) level++;
            else if (disableNested) {
              state2.pos = oldPos;
              return -1;
            }
          }
        }
        let labelEnd = -1;
        if (found) labelEnd = state2.pos;
        state2.pos = oldPos;
        return labelEnd;
      }
      function parseLinkDestination(str, start, max) {
        let code2;
        let pos = start;
        const result = {
          ok: false,
          pos: 0,
          str: ""
        };
        if (str.charCodeAt(pos) === 60) {
          pos++;
          while (pos < max) {
            code2 = str.charCodeAt(pos);
            if (code2 === 10) return result;
            if (code2 === 60) return result;
            if (code2 === 62) {
              result.pos = pos + 1;
              result.str = unescapeAll(str.slice(start + 1, pos));
              result.ok = true;
              return result;
            }
            if (code2 === 92 && pos + 1 < max) {
              pos += 2;
              continue;
            }
            pos++;
          }
          return result;
        }
        let level = 0;
        while (pos < max) {
          code2 = str.charCodeAt(pos);
          if (code2 === 32) break;
          if (code2 < 32 || code2 === 127) break;
          if (code2 === 92 && pos + 1 < max) {
            if (str.charCodeAt(pos + 1) === 32) break;
            pos += 2;
            continue;
          }
          if (code2 === 40) {
            level++;
            if (level > 32) return result;
          }
          if (code2 === 41) {
            if (level === 0) break;
            level--;
          }
          pos++;
        }
        if (start === pos) return result;
        if (level !== 0) return result;
        result.str = unescapeAll(str.slice(start, pos));
        result.pos = pos;
        result.ok = true;
        return result;
      }
      function parseLinkTitle(str, start, max, prev_state) {
        let code2;
        let pos = start;
        const state2 = {
          ok: false,
          can_continue: false,
          pos: 0,
          str: "",
          marker: 0
        };
        if (prev_state) {
          state2.str = prev_state.str;
          state2.marker = prev_state.marker;
        } else {
          if (pos >= max) return state2;
          let marker = str.charCodeAt(pos);
          if (marker !== 34 && marker !== 39 && marker !== 40) return state2;
          start++;
          pos++;
          if (marker === 40) marker = 41;
          state2.marker = marker;
        }
        while (pos < max) {
          code2 = str.charCodeAt(pos);
          if (code2 === state2.marker) {
            state2.pos = pos + 1;
            state2.str += unescapeAll(str.slice(start, pos));
            state2.ok = true;
            return state2;
          } else if (code2 === 40 && state2.marker === 41) return state2;
          else if (code2 === 92 && pos + 1 < max) pos++;
          pos++;
        }
        state2.can_continue = true;
        state2.str += unescapeAll(str.slice(start, pos));
        return state2;
      }
      var helpers_exports = /* @__PURE__ */ __exportAll({
        parseLinkDestination: () => parseLinkDestination,
        parseLinkLabel: () => parseLinkLabel,
        parseLinkTitle: () => parseLinkTitle
      });
      var default_rules = {};
      default_rules.code_inline = function(tokens, idx, options, env, slf) {
        const token = tokens[idx];
        return "<code" + slf.renderAttrs(token) + ">" + escapeHtml(token.content) + "</code>";
      };
      default_rules.code_block = function(tokens, idx, options, env, slf) {
        const token = tokens[idx];
        return "<pre" + slf.renderAttrs(token) + "><code>" + escapeHtml(tokens[idx].content) + "</code></pre>\n";
      };
      default_rules.fence = function(tokens, idx, options, env, slf) {
        const token = tokens[idx];
        const info = token.info ? unescapeAll(token.info).trim() : "";
        let langName = "";
        let langAttrs = "";
        if (info) {
          const arr = info.split(/(\s+)/g);
          langName = arr[0];
          langAttrs = arr.slice(2).join("");
        }
        let highlighted;
        if (options.highlight) highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
        else highlighted = escapeHtml(token.content);
        if (highlighted.indexOf("<pre") === 0) return highlighted + "\n";
        if (info) {
          const i = token.attrIndex("class");
          const tmpAttrs = token.attrs ? token.attrs.slice() : [];
          if (i < 0) tmpAttrs.push(["class", options.langPrefix + langName]);
          else {
            tmpAttrs[i] = tmpAttrs[i].slice();
            tmpAttrs[i][1] += " " + options.langPrefix + langName;
          }
          const tmpToken = { attrs: tmpAttrs };
          return `<pre><code${slf.renderAttrs(tmpToken)}>${highlighted}</code></pre>
`;
        }
        return `<pre><code${slf.renderAttrs(token)}>${highlighted}</code></pre>
`;
      };
      default_rules.image = function(tokens, idx, options, env, slf) {
        const token = tokens[idx];
        token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(token.children, options, env);
        return slf.renderToken(tokens, idx, options);
      };
      default_rules.hardbreak = function(tokens, idx, options) {
        return options.xhtmlOut ? "<br />\n" : "<br>\n";
      };
      default_rules.softbreak = function(tokens, idx, options) {
        return options.breaks ? options.xhtmlOut ? "<br />\n" : "<br>\n" : "\n";
      };
      default_rules.text = function(tokens, idx) {
        return escapeHtml(tokens[idx].content);
      };
      default_rules.html_block = function(tokens, idx) {
        return tokens[idx].content;
      };
      default_rules.html_inline = function(tokens, idx) {
        return tokens[idx].content;
      };
      function Renderer() {
        this.rules = assign({}, default_rules);
      }
      Renderer.prototype.renderAttrs = function renderAttrs(token) {
        let i, l, result;
        if (!token.attrs) return "";
        result = "";
        for (i = 0, l = token.attrs.length; i < l; i++) result += " " + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
        return result;
      };
      Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
        const token = tokens[idx];
        let result = "";
        if (token.hidden) return "";
        if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) result += "\n";
        result += (token.nesting === -1 ? "</" : "<") + token.tag;
        result += this.renderAttrs(token);
        if (token.nesting === 0 && options.xhtmlOut) result += " /";
        let needLf = false;
        if (token.block) {
          needLf = true;
          if (token.nesting === 1) {
            if (idx + 1 < tokens.length) {
              const nextToken = tokens[idx + 1];
              if (nextToken.type === "inline" || nextToken.hidden) needLf = false;
              else if (nextToken.nesting === -1 && nextToken.tag === token.tag) needLf = false;
            }
          }
        }
        result += needLf ? ">\n" : ">";
        return result;
      };
      Renderer.prototype.renderInline = function(tokens, options, env) {
        let result = "";
        const rules = this.rules;
        for (let i = 0, len = tokens.length; i < len; i++) {
          const type = tokens[i].type;
          if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
          else result += this.renderToken(tokens, i, options);
        }
        return result;
      };
      Renderer.prototype.renderInlineAsText = function(tokens, options, env) {
        let result = "";
        for (let i = 0, len = tokens.length; i < len; i++) switch (tokens[i].type) {
          case "text":
            result += tokens[i].content;
            break;
          case "image":
            result += this.renderInlineAsText(tokens[i].children, options, env);
            break;
          case "html_inline":
          case "html_block":
            result += tokens[i].content;
            break;
          case "softbreak":
          case "hardbreak":
            result += "\n";
            break;
          default:
        }
        return result;
      };
      Renderer.prototype.render = function(tokens, options, env) {
        let result = "";
        const rules = this.rules;
        for (let i = 0, len = tokens.length; i < len; i++) {
          const type = tokens[i].type;
          if (type === "inline") result += this.renderInline(tokens[i].children, options, env);
          else if (typeof rules[type] !== "undefined") result += rules[type](tokens, i, options, env, this);
          else result += this.renderToken(tokens, i, options, env);
        }
        return result;
      };
      function Ruler() {
        this.__rules__ = [];
        this.__cache__ = null;
      }
      Ruler.prototype.__find__ = function(name) {
        for (let i = 0; i < this.__rules__.length; i++) if (this.__rules__[i].name === name) return i;
        return -1;
      };
      Ruler.prototype.__compile__ = function() {
        const self = this;
        const chains = [""];
        self.__rules__.forEach(function(rule) {
          if (!rule.enabled) return;
          rule.alt.forEach(function(altName) {
            if (chains.indexOf(altName) < 0) chains.push(altName);
          });
        });
        self.__cache__ = {};
        chains.forEach(function(chain) {
          self.__cache__[chain] = [];
          self.__rules__.forEach(function(rule) {
            if (!rule.enabled) return;
            if (chain && rule.alt.indexOf(chain) < 0) return;
            self.__cache__[chain].push(rule.fn);
          });
        });
      };
      Ruler.prototype.at = function(name, fn, options) {
        const index = this.__find__(name);
        const opt = options || {};
        if (index === -1) throw new Error("Parser rule not found: " + name);
        this.__rules__[index].fn = fn;
        this.__rules__[index].alt = opt.alt || [];
        this.__cache__ = null;
      };
      Ruler.prototype.before = function(beforeName, ruleName, fn, options) {
        const index = this.__find__(beforeName);
        const opt = options || {};
        if (index === -1) throw new Error("Parser rule not found: " + beforeName);
        this.__rules__.splice(index, 0, {
          name: ruleName,
          enabled: true,
          fn,
          alt: opt.alt || []
        });
        this.__cache__ = null;
      };
      Ruler.prototype.after = function(afterName, ruleName, fn, options) {
        const index = this.__find__(afterName);
        const opt = options || {};
        if (index === -1) throw new Error("Parser rule not found: " + afterName);
        this.__rules__.splice(index + 1, 0, {
          name: ruleName,
          enabled: true,
          fn,
          alt: opt.alt || []
        });
        this.__cache__ = null;
      };
      Ruler.prototype.push = function(ruleName, fn, options) {
        const opt = options || {};
        this.__rules__.push({
          name: ruleName,
          enabled: true,
          fn,
          alt: opt.alt || []
        });
        this.__cache__ = null;
      };
      Ruler.prototype.enable = function(list3, ignoreInvalid) {
        if (!Array.isArray(list3)) list3 = [list3];
        const result = [];
        list3.forEach(function(name) {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) return;
            throw new Error("Rules manager: invalid rule name " + name);
          }
          this.__rules__[idx].enabled = true;
          result.push(name);
        }, this);
        this.__cache__ = null;
        return result;
      };
      Ruler.prototype.enableOnly = function(list3, ignoreInvalid) {
        if (!Array.isArray(list3)) list3 = [list3];
        this.__rules__.forEach(function(rule) {
          rule.enabled = false;
        });
        this.enable(list3, ignoreInvalid);
      };
      Ruler.prototype.disable = function(list3, ignoreInvalid) {
        if (!Array.isArray(list3)) list3 = [list3];
        const result = [];
        list3.forEach(function(name) {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) return;
            throw new Error("Rules manager: invalid rule name " + name);
          }
          this.__rules__[idx].enabled = false;
          result.push(name);
        }, this);
        this.__cache__ = null;
        return result;
      };
      Ruler.prototype.getRules = function(chainName) {
        if (this.__cache__ === null) this.__compile__();
        return this.__cache__[chainName] || [];
      };
      function Token(type, tag, nesting) {
        this.type = type;
        this.tag = tag;
        this.attrs = null;
        this.map = null;
        this.nesting = nesting;
        this.level = 0;
        this.children = null;
        this.content = "";
        this.markup = "";
        this.info = "";
        this.meta = null;
        this.block = false;
        this.hidden = false;
      }
      Token.prototype.attrIndex = function attrIndex(name) {
        if (!this.attrs) return -1;
        const attrs = this.attrs;
        for (let i = 0, len = attrs.length; i < len; i++) if (attrs[i][0] === name) return i;
        return -1;
      };
      Token.prototype.attrPush = function attrPush(attrData) {
        if (this.attrs) this.attrs.push(attrData);
        else this.attrs = [attrData];
      };
      Token.prototype.attrSet = function attrSet(name, value) {
        const idx = this.attrIndex(name);
        const attrData = [name, value];
        if (idx < 0) this.attrPush(attrData);
        else this.attrs[idx] = attrData;
      };
      Token.prototype.attrGet = function attrGet(name) {
        const idx = this.attrIndex(name);
        let value = null;
        if (idx >= 0) value = this.attrs[idx][1];
        return value;
      };
      Token.prototype.attrJoin = function attrJoin(name, value) {
        const idx = this.attrIndex(name);
        if (idx < 0) this.attrPush([name, value]);
        else this.attrs[idx][1] = this.attrs[idx][1] + " " + value;
      };
      function StateCore(src, md2, env) {
        this.src = src;
        this.env = env;
        this.tokens = [];
        this.inlineMode = false;
        this.md = md2;
      }
      StateCore.prototype.Token = Token;
      var NEWLINES_RE = /\r\n?|\n/g;
      var NULL_RE = /\0/g;
      function normalize(state2) {
        let str;
        str = state2.src.replace(NEWLINES_RE, "\n");
        str = str.replace(NULL_RE, "\uFFFD");
        state2.src = str;
      }
      function block(state2) {
        let token;
        if (state2.inlineMode) {
          token = new state2.Token("inline", "", 0);
          token.content = state2.src;
          token.map = [0, 1];
          token.children = [];
          state2.tokens.push(token);
        } else state2.md.block.parse(state2.src, state2.md, state2.env, state2.tokens);
      }
      function inline(state2) {
        const tokens = state2.tokens;
        for (let i = 0, l = tokens.length; i < l; i++) {
          const tok = tokens[i];
          if (tok.type === "inline") state2.md.inline.parse(tok.content, state2.md, state2.env, tok.children);
        }
      }
      function isLinkOpen$1(str) {
        return /^<a[>\s]/i.test(str);
      }
      function isLinkClose$1(str) {
        return /^<\/a\s*>/i.test(str);
      }
      function linkify$1(state2) {
        const blockTokens = state2.tokens;
        if (!state2.md.options.linkify) return;
        for (let j = 0, l = blockTokens.length; j < l; j++) {
          if (blockTokens[j].type !== "inline" || !state2.md.linkify.pretest(blockTokens[j].content)) continue;
          let tokens = blockTokens[j].children;
          let htmlLinkLevel = 0;
          for (let i = tokens.length - 1; i >= 0; i--) {
            const currentToken = tokens[i];
            if (currentToken.type === "link_close") {
              i--;
              while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") i--;
              continue;
            }
            if (currentToken.type === "html_inline") {
              if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) htmlLinkLevel--;
              if (isLinkClose$1(currentToken.content)) htmlLinkLevel++;
            }
            if (htmlLinkLevel > 0) continue;
            if (currentToken.type === "text" && state2.md.linkify.test(currentToken.content)) {
              const text2 = currentToken.content;
              let links = state2.md.linkify.match(text2);
              const nodes = [];
              let level = currentToken.level;
              let lastPos = 0;
              if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") links = links.slice(1);
              for (let ln = 0; ln < links.length; ln++) {
                const url = links[ln].url;
                const fullUrl = state2.md.normalizeLink(url);
                if (!state2.md.validateLink(fullUrl)) continue;
                let urlText = links[ln].text;
                if (!links[ln].schema) urlText = state2.md.normalizeLinkText("http://" + urlText).replace(/^http:\/\//, "");
                else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) urlText = state2.md.normalizeLinkText("mailto:" + urlText).replace(/^mailto:/, "");
                else urlText = state2.md.normalizeLinkText(urlText);
                const pos = links[ln].index;
                if (pos > lastPos) {
                  const token = new state2.Token("text", "", 0);
                  token.content = text2.slice(lastPos, pos);
                  token.level = level;
                  nodes.push(token);
                }
                const token_o = new state2.Token("link_open", "a", 1);
                token_o.attrs = [["href", fullUrl]];
                token_o.level = level++;
                token_o.markup = "linkify";
                token_o.info = "auto";
                nodes.push(token_o);
                const token_t = new state2.Token("text", "", 0);
                token_t.content = urlText;
                token_t.level = level;
                nodes.push(token_t);
                const token_c = new state2.Token("link_close", "a", -1);
                token_c.level = --level;
                token_c.markup = "linkify";
                token_c.info = "auto";
                nodes.push(token_c);
                lastPos = links[ln].lastIndex;
              }
              if (lastPos < text2.length) {
                const token = new state2.Token("text", "", 0);
                token.content = text2.slice(lastPos);
                token.level = level;
                nodes.push(token);
              }
              blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
            }
          }
        }
      }
      var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;
      var SCOPED_ABBR_TEST_RE = /\((c|tm|r)\)/i;
      var SCOPED_ABBR_RE = /\((c|tm|r)\)/gi;
      var SCOPED_ABBR = {
        c: "\xA9",
        r: "\xAE",
        tm: "\u2122"
      };
      function replaceFn(match, name) {
        return SCOPED_ABBR[name.toLowerCase()];
      }
      function replace_scoped(inlineTokens) {
        let inside_autolink = 0;
        for (let i = inlineTokens.length - 1; i >= 0; i--) {
          const token = inlineTokens[i];
          if (token.type === "text" && !inside_autolink) token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
          if (token.type === "link_open" && token.info === "auto") inside_autolink--;
          if (token.type === "link_close" && token.info === "auto") inside_autolink++;
        }
      }
      function replace_rare(inlineTokens) {
        let inside_autolink = 0;
        for (let i = inlineTokens.length - 1; i >= 0; i--) {
          const token = inlineTokens[i];
          if (token.type === "text" && !inside_autolink) {
            if (RARE_RE.test(token.content)) token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/gm, "$1\u2014").replace(/(^|\s)--(?=\s|$)/gm, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/gm, "$1\u2013");
          }
          if (token.type === "link_open" && token.info === "auto") inside_autolink--;
          if (token.type === "link_close" && token.info === "auto") inside_autolink++;
        }
      }
      function replace(state2) {
        let blkIdx;
        if (!state2.md.options.typographer) return;
        for (blkIdx = state2.tokens.length - 1; blkIdx >= 0; blkIdx--) {
          if (state2.tokens[blkIdx].type !== "inline") continue;
          if (SCOPED_ABBR_TEST_RE.test(state2.tokens[blkIdx].content)) replace_scoped(state2.tokens[blkIdx].children);
          if (RARE_RE.test(state2.tokens[blkIdx].content)) replace_rare(state2.tokens[blkIdx].children);
        }
      }
      var QUOTE_TEST_RE = /['"]/;
      var QUOTE_RE = /['"]/g;
      var APOSTROPHE = "\u2019";
      function addReplacement(replacements, tokenIdx, pos, ch) {
        if (!replacements[tokenIdx]) replacements[tokenIdx] = [];
        replacements[tokenIdx].push({
          pos,
          ch
        });
      }
      function applyReplacements(str, replacements) {
        let result = "";
        let lastPos = 0;
        replacements.sort((a, b) => a.pos - b.pos);
        for (let i = 0; i < replacements.length; i++) {
          const replacement = replacements[i];
          result += str.slice(lastPos, replacement.pos) + replacement.ch;
          lastPos = replacement.pos + 1;
        }
        return result + str.slice(lastPos);
      }
      function process_inlines(tokens, state2) {
        let j;
        const stack = [];
        const replacements = {};
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const thisLevel = tokens[i].level;
          for (j = stack.length - 1; j >= 0; j--) if (stack[j].level <= thisLevel) break;
          stack.length = j + 1;
          if (token.type !== "text") continue;
          const text2 = token.content;
          let pos = 0;
          const max = text2.length;
          OUTER: while (pos < max) {
            QUOTE_RE.lastIndex = pos;
            const t = QUOTE_RE.exec(text2);
            if (!t) break;
            let canOpen = true;
            let canClose = true;
            pos = t.index + 1;
            const isSingle = t[0] === "'";
            let lastChar = 32;
            if (t.index - 1 >= 0) lastChar = text2.charCodeAt(t.index - 1);
            else for (j = i - 1; j >= 0; j--) {
              if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
              if (!tokens[j].content) continue;
              lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
              break;
            }
            let nextChar = 32;
            if (pos < max) nextChar = text2.charCodeAt(pos);
            else for (j = i + 1; j < tokens.length; j++) {
              if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
              if (!tokens[j].content) continue;
              nextChar = tokens[j].content.charCodeAt(0);
              break;
            }
            const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
            const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
            const isLastWhiteSpace = isWhiteSpace(lastChar);
            const isNextWhiteSpace = isWhiteSpace(nextChar);
            if (isNextWhiteSpace) canOpen = false;
            else if (isNextPunctChar) {
              if (!(isLastWhiteSpace || isLastPunctChar)) canOpen = false;
            }
            if (isLastWhiteSpace) canClose = false;
            else if (isLastPunctChar) {
              if (!(isNextWhiteSpace || isNextPunctChar)) canClose = false;
            }
            if (nextChar === 34 && t[0] === '"') {
              if (lastChar >= 48 && lastChar <= 57) canClose = canOpen = false;
            }
            if (canOpen && canClose) {
              canOpen = isLastPunctChar;
              canClose = isNextPunctChar;
            }
            if (!canOpen && !canClose) {
              if (isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
              continue;
            }
            if (canClose) for (j = stack.length - 1; j >= 0; j--) {
              let item = stack[j];
              if (stack[j].level < thisLevel) break;
              if (item.single === isSingle && stack[j].level === thisLevel) {
                item = stack[j];
                let openQuote;
                let closeQuote;
                if (isSingle) {
                  openQuote = state2.md.options.quotes[2];
                  closeQuote = state2.md.options.quotes[3];
                } else {
                  openQuote = state2.md.options.quotes[0];
                  closeQuote = state2.md.options.quotes[1];
                }
                addReplacement(replacements, i, t.index, closeQuote);
                addReplacement(replacements, item.token, item.pos, openQuote);
                stack.length = j;
                continue OUTER;
              }
            }
            if (canOpen) stack.push({
              token: i,
              pos: t.index,
              single: isSingle,
              level: thisLevel
            });
            else if (canClose && isSingle) addReplacement(replacements, i, t.index, APOSTROPHE);
          }
        }
        Object.keys(replacements).forEach(function(tokenIdx) {
          tokens[tokenIdx].content = applyReplacements(tokens[tokenIdx].content, replacements[tokenIdx]);
        });
      }
      function smartquotes(state2) {
        if (!state2.md.options.typographer) return;
        for (let blkIdx = state2.tokens.length - 1; blkIdx >= 0; blkIdx--) {
          if (state2.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state2.tokens[blkIdx].content)) continue;
          process_inlines(state2.tokens[blkIdx].children, state2);
        }
      }
      function text_join(state2) {
        let curr, last;
        const blockTokens = state2.tokens;
        const l = blockTokens.length;
        for (let j = 0; j < l; j++) {
          if (blockTokens[j].type !== "inline") continue;
          const tokens = blockTokens[j].children;
          const max = tokens.length;
          for (curr = 0; curr < max; curr++) if (tokens[curr].type === "text_special") tokens[curr].type = "text";
          for (curr = last = 0; curr < max; curr++) if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
          else {
            if (curr !== last) tokens[last] = tokens[curr];
            last++;
          }
          if (curr !== last) tokens.length = last;
        }
      }
      var _rules$2 = [
        ["normalize", normalize],
        ["block", block],
        ["inline", inline],
        ["linkify", linkify$1],
        ["replacements", replace],
        ["smartquotes", smartquotes],
        ["text_join", text_join]
      ];
      function Core() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules$2.length; i++) this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
      }
      Core.prototype.process = function(state2) {
        const rules = this.ruler.getRules("");
        for (let i = 0, l = rules.length; i < l; i++) rules[i](state2);
      };
      Core.prototype.State = StateCore;
      function StateBlock(src, md2, env, tokens) {
        this.src = src;
        this.md = md2;
        this.env = env;
        this.tokens = tokens;
        this.bMarks = [];
        this.eMarks = [];
        this.tShift = [];
        this.sCount = [];
        this.bsCount = [];
        this.blkIndent = 0;
        this.line = 0;
        this.lineMax = 0;
        this.tight = false;
        this.ddIndent = -1;
        this.listIndent = -1;
        this.parentType = "root";
        this.level = 0;
        const s = this.src;
        for (let start = 0, pos = 0, indent = 0, offset = 0, len = s.length, indent_found = false; pos < len; pos++) {
          const ch = s.charCodeAt(pos);
          if (!indent_found) if (isSpace(ch)) {
            indent++;
            if (ch === 9) offset += 4 - offset % 4;
            else offset++;
            continue;
          } else indent_found = true;
          if (ch === 10 || pos === len - 1) {
            if (ch !== 10) pos++;
            this.bMarks.push(start);
            this.eMarks.push(pos);
            this.tShift.push(indent);
            this.sCount.push(offset);
            this.bsCount.push(0);
            indent_found = false;
            indent = 0;
            offset = 0;
            start = pos + 1;
          }
        }
        this.bMarks.push(s.length);
        this.eMarks.push(s.length);
        this.tShift.push(0);
        this.sCount.push(0);
        this.bsCount.push(0);
        this.lineMax = this.bMarks.length - 1;
      }
      StateBlock.prototype.push = function(type, tag, nesting) {
        const token = new Token(type, tag, nesting);
        token.block = true;
        if (nesting < 0) this.level--;
        token.level = this.level;
        if (nesting > 0) this.level++;
        this.tokens.push(token);
        return token;
      };
      StateBlock.prototype.isEmpty = function isEmpty(line) {
        return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
      };
      StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
        for (let max = this.lineMax; from < max; from++) if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) break;
        return from;
      };
      StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
        for (let max = this.src.length; pos < max; pos++) if (!isSpace(this.src.charCodeAt(pos))) break;
        return pos;
      };
      StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
        if (pos <= min) return pos;
        while (pos > min) if (!isSpace(this.src.charCodeAt(--pos))) return pos + 1;
        return pos;
      };
      StateBlock.prototype.skipChars = function skipChars(pos, code2) {
        for (let max = this.src.length; pos < max; pos++) if (this.src.charCodeAt(pos) !== code2) break;
        return pos;
      };
      StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code2, min) {
        if (pos <= min) return pos;
        while (pos > min) if (code2 !== this.src.charCodeAt(--pos)) return pos + 1;
        return pos;
      };
      StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
        if (begin >= end) return "";
        const queue = new Array(end - begin);
        for (let i = 0, line = begin; line < end; line++, i++) {
          let lineIndent = 0;
          const lineStart = this.bMarks[line];
          let first = lineStart;
          let last;
          if (line + 1 < end || keepLastLF) last = this.eMarks[line] + 1;
          else last = this.eMarks[line];
          while (first < last && lineIndent < indent) {
            const ch = this.src.charCodeAt(first);
            if (isSpace(ch)) if (ch === 9) lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
            else lineIndent++;
            else if (first - lineStart < this.tShift[line]) lineIndent++;
            else break;
            first++;
          }
          if (lineIndent > indent) queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
          else queue[i] = this.src.slice(first, last);
        }
        return queue.join("");
      };
      StateBlock.prototype.Token = Token;
      var MAX_AUTOCOMPLETED_CELLS = 65536;
      function getLine(state2, line) {
        const pos = state2.bMarks[line] + state2.tShift[line];
        const max = state2.eMarks[line];
        return state2.src.slice(pos, max);
      }
      function escapedSplit(str) {
        const result = [];
        const max = str.length;
        let pos = 0;
        let ch = str.charCodeAt(pos);
        let isEscaped = false;
        let lastPos = 0;
        let current = "";
        while (pos < max) {
          if (ch === 124) if (!isEscaped) {
            result.push(current + str.substring(lastPos, pos));
            current = "";
            lastPos = pos + 1;
          } else {
            current += str.substring(lastPos, pos - 1);
            lastPos = pos;
          }
          isEscaped = ch === 92;
          pos++;
          ch = str.charCodeAt(pos);
        }
        result.push(current + str.substring(lastPos));
        return result;
      }
      function table(state2, startLine, endLine, silent) {
        if (startLine + 2 > endLine) return false;
        let nextLine = startLine + 1;
        if (state2.sCount[nextLine] < state2.blkIndent) return false;
        if (state2.sCount[nextLine] - state2.blkIndent >= 4) return false;
        let pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
        if (pos >= state2.eMarks[nextLine]) return false;
        const firstCh = state2.src.charCodeAt(pos++);
        if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) return false;
        if (pos >= state2.eMarks[nextLine]) return false;
        const secondCh = state2.src.charCodeAt(pos++);
        if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) return false;
        if (firstCh === 45 && isSpace(secondCh)) return false;
        while (pos < state2.eMarks[nextLine]) {
          const ch = state2.src.charCodeAt(pos);
          if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) return false;
          pos++;
        }
        let lineText = getLine(state2, startLine + 1);
        let columns = lineText.split("|");
        const aligns = [];
        for (let i = 0; i < columns.length; i++) {
          const t = columns[i].trim();
          if (!t) if (i === 0 || i === columns.length - 1) continue;
          else return false;
          if (!/^:?-+:?$/.test(t)) return false;
          if (t.charCodeAt(t.length - 1) === 58) aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
          else if (t.charCodeAt(0) === 58) aligns.push("left");
          else aligns.push("");
        }
        lineText = getLine(state2, startLine).trim();
        if (lineText.indexOf("|") === -1) return false;
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        columns = escapedSplit(lineText);
        if (columns.length && columns[0] === "") columns.shift();
        if (columns.length && columns[columns.length - 1] === "") columns.pop();
        const columnCount = columns.length;
        if (columnCount === 0 || columnCount !== aligns.length) return false;
        if (silent) return true;
        const oldParentType = state2.parentType;
        state2.parentType = "table";
        const terminatorRules = state2.md.block.ruler.getRules("blockquote");
        const token_to = state2.push("table_open", "table", 1);
        const tableLines = [startLine, 0];
        token_to.map = tableLines;
        const token_tho = state2.push("thead_open", "thead", 1);
        token_tho.map = [startLine, startLine + 1];
        const token_htro = state2.push("tr_open", "tr", 1);
        token_htro.map = [startLine, startLine + 1];
        for (let i = 0; i < columns.length; i++) {
          const token_ho = state2.push("th_open", "th", 1);
          if (aligns[i]) token_ho.attrs = [["style", "text-align:" + aligns[i]]];
          const token_il = state2.push("inline", "", 0);
          token_il.content = columns[i].trim();
          token_il.children = [];
          state2.push("th_close", "th", -1);
        }
        state2.push("tr_close", "tr", -1);
        state2.push("thead_close", "thead", -1);
        let tbodyLines;
        let autocompletedCells = 0;
        for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
          if (state2.sCount[nextLine] < state2.blkIndent) break;
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine, endLine, true)) {
            terminate = true;
            break;
          }
          if (terminate) break;
          lineText = getLine(state2, nextLine).trim();
          if (!lineText) break;
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) break;
          columns = escapedSplit(lineText);
          if (columns.length && columns[0] === "") columns.shift();
          if (columns.length && columns[columns.length - 1] === "") columns.pop();
          autocompletedCells += columnCount - columns.length;
          if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) break;
          if (nextLine === startLine + 2) {
            const token_tbo = state2.push("tbody_open", "tbody", 1);
            token_tbo.map = tbodyLines = [startLine + 2, 0];
          }
          const token_tro = state2.push("tr_open", "tr", 1);
          token_tro.map = [nextLine, nextLine + 1];
          for (let i = 0; i < columnCount; i++) {
            const token_tdo = state2.push("td_open", "td", 1);
            if (aligns[i]) token_tdo.attrs = [["style", "text-align:" + aligns[i]]];
            const token_il = state2.push("inline", "", 0);
            token_il.content = columns[i] ? columns[i].trim() : "";
            token_il.children = [];
            state2.push("td_close", "td", -1);
          }
          state2.push("tr_close", "tr", -1);
        }
        if (tbodyLines) {
          state2.push("tbody_close", "tbody", -1);
          tbodyLines[1] = nextLine;
        }
        state2.push("table_close", "table", -1);
        tableLines[1] = nextLine;
        state2.parentType = oldParentType;
        state2.line = nextLine;
        return true;
      }
      function code(state2, startLine, endLine) {
        if (state2.sCount[startLine] - state2.blkIndent < 4) return false;
        let nextLine = startLine + 1;
        let last = nextLine;
        while (nextLine < endLine) {
          if (state2.isEmpty(nextLine)) {
            nextLine++;
            continue;
          }
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
            nextLine++;
            last = nextLine;
            continue;
          }
          break;
        }
        state2.line = last;
        const token = state2.push("code_block", "code", 0);
        token.content = state2.getLines(startLine, last, 4 + state2.blkIndent, false) + "\n";
        token.map = [startLine, state2.line];
        return true;
      }
      function fence(state2, startLine, endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        if (pos + 3 > max) return false;
        const marker = state2.src.charCodeAt(pos);
        if (marker !== 126 && marker !== 96) return false;
        let mem = pos;
        pos = state2.skipChars(pos, marker);
        let len = pos - mem;
        if (len < 3) return false;
        const markup = state2.src.slice(mem, pos);
        const params = state2.src.slice(pos, max);
        if (marker === 96) {
          if (params.indexOf(String.fromCharCode(marker)) >= 0) return false;
        }
        if (silent) return true;
        let nextLine = startLine;
        let haveEndMarker = false;
        for (; ; ) {
          nextLine++;
          if (nextLine >= endLine) break;
          pos = mem = state2.bMarks[nextLine] + state2.tShift[nextLine];
          max = state2.eMarks[nextLine];
          if (pos < max && state2.sCount[nextLine] < state2.blkIndent) break;
          if (state2.src.charCodeAt(pos) !== marker) continue;
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) continue;
          pos = state2.skipChars(pos, marker);
          if (pos - mem < len) continue;
          pos = state2.skipSpaces(pos);
          if (pos < max) continue;
          haveEndMarker = true;
          break;
        }
        len = state2.sCount[startLine];
        state2.line = nextLine + (haveEndMarker ? 1 : 0);
        const token = state2.push("fence", "code", 0);
        token.info = params;
        token.content = state2.getLines(startLine + 1, nextLine, len, true);
        token.markup = markup;
        token.map = [startLine, state2.line];
        return true;
      }
      function blockquote(state2, startLine, endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        const oldLineMax = state2.lineMax;
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        if (state2.src.charCodeAt(pos) !== 62) return false;
        if (silent) return true;
        const oldBMarks = [];
        const oldBSCount = [];
        const oldSCount = [];
        const oldTShift = [];
        const terminatorRules = state2.md.block.ruler.getRules("blockquote");
        const oldParentType = state2.parentType;
        state2.parentType = "blockquote";
        let lastLineEmpty = false;
        let nextLine;
        for (nextLine = startLine; nextLine < endLine; nextLine++) {
          const isOutdented = state2.sCount[nextLine] < state2.blkIndent;
          pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
          max = state2.eMarks[nextLine];
          if (pos >= max) break;
          if (state2.src.charCodeAt(pos++) === 62 && !isOutdented) {
            let initial = state2.sCount[nextLine] + 1;
            let spaceAfterMarker;
            let adjustTab;
            if (state2.src.charCodeAt(pos) === 32) {
              pos++;
              initial++;
              adjustTab = false;
              spaceAfterMarker = true;
            } else if (state2.src.charCodeAt(pos) === 9) {
              spaceAfterMarker = true;
              if ((state2.bsCount[nextLine] + initial) % 4 === 3) {
                pos++;
                initial++;
                adjustTab = false;
              } else adjustTab = true;
            } else spaceAfterMarker = false;
            let offset = initial;
            oldBMarks.push(state2.bMarks[nextLine]);
            state2.bMarks[nextLine] = pos;
            while (pos < max) {
              const ch = state2.src.charCodeAt(pos);
              if (isSpace(ch)) if (ch === 9) offset += 4 - (offset + state2.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
              else offset++;
              else break;
              pos++;
            }
            lastLineEmpty = pos >= max;
            oldBSCount.push(state2.bsCount[nextLine]);
            state2.bsCount[nextLine] = state2.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);
            oldSCount.push(state2.sCount[nextLine]);
            state2.sCount[nextLine] = offset - initial;
            oldTShift.push(state2.tShift[nextLine]);
            state2.tShift[nextLine] = pos - state2.bMarks[nextLine];
            continue;
          }
          if (lastLineEmpty) break;
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine, endLine, true)) {
            terminate = true;
            break;
          }
          if (terminate) {
            state2.lineMax = nextLine;
            if (state2.blkIndent !== 0) {
              oldBMarks.push(state2.bMarks[nextLine]);
              oldBSCount.push(state2.bsCount[nextLine]);
              oldTShift.push(state2.tShift[nextLine]);
              oldSCount.push(state2.sCount[nextLine]);
              state2.sCount[nextLine] -= state2.blkIndent;
            }
            break;
          }
          oldBMarks.push(state2.bMarks[nextLine]);
          oldBSCount.push(state2.bsCount[nextLine]);
          oldTShift.push(state2.tShift[nextLine]);
          oldSCount.push(state2.sCount[nextLine]);
          state2.sCount[nextLine] = -1;
        }
        const oldIndent = state2.blkIndent;
        state2.blkIndent = 0;
        const token_o = state2.push("blockquote_open", "blockquote", 1);
        token_o.markup = ">";
        const lines = [startLine, 0];
        token_o.map = lines;
        state2.md.block.tokenize(state2, startLine, nextLine);
        const token_c = state2.push("blockquote_close", "blockquote", -1);
        token_c.markup = ">";
        state2.lineMax = oldLineMax;
        state2.parentType = oldParentType;
        lines[1] = state2.line;
        for (let i = 0; i < oldTShift.length; i++) {
          state2.bMarks[i + startLine] = oldBMarks[i];
          state2.tShift[i + startLine] = oldTShift[i];
          state2.sCount[i + startLine] = oldSCount[i];
          state2.bsCount[i + startLine] = oldBSCount[i];
        }
        state2.blkIndent = oldIndent;
        return true;
      }
      function hr(state2, startLine, endLine, silent) {
        const max = state2.eMarks[startLine];
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        const marker = state2.src.charCodeAt(pos++);
        if (marker !== 42 && marker !== 45 && marker !== 95) return false;
        let cnt = 1;
        while (pos < max) {
          const ch = state2.src.charCodeAt(pos++);
          if (ch !== marker && !isSpace(ch)) return false;
          if (ch === marker) cnt++;
        }
        if (cnt < 3) return false;
        if (silent) return true;
        state2.line = startLine + 1;
        const token = state2.push("hr", "hr", 0);
        token.map = [startLine, state2.line];
        token.markup = Array(cnt + 1).join(String.fromCharCode(marker));
        return true;
      }
      function skipBulletListMarker(state2, startLine) {
        const max = state2.eMarks[startLine];
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        const marker = state2.src.charCodeAt(pos++);
        if (marker !== 42 && marker !== 45 && marker !== 43) return -1;
        if (pos < max) {
          if (!isSpace(state2.src.charCodeAt(pos))) return -1;
        }
        return pos;
      }
      function skipOrderedListMarker(state2, startLine) {
        const start = state2.bMarks[startLine] + state2.tShift[startLine];
        const max = state2.eMarks[startLine];
        let pos = start;
        if (pos + 1 >= max) return -1;
        let ch = state2.src.charCodeAt(pos++);
        if (ch < 48 || ch > 57) return -1;
        for (; ; ) {
          if (pos >= max) return -1;
          ch = state2.src.charCodeAt(pos++);
          if (ch >= 48 && ch <= 57) {
            if (pos - start >= 10) return -1;
            continue;
          }
          if (ch === 41 || ch === 46) break;
          return -1;
        }
        if (pos < max) {
          ch = state2.src.charCodeAt(pos);
          if (!isSpace(ch)) return -1;
        }
        return pos;
      }
      function markTightParagraphs(state2, idx) {
        const level = state2.level + 2;
        for (let i = idx + 2, l = state2.tokens.length - 2; i < l; i++) if (state2.tokens[i].level === level && state2.tokens[i].type === "paragraph_open") {
          state2.tokens[i + 2].hidden = true;
          state2.tokens[i].hidden = true;
          i += 2;
        }
      }
      function list2(state2, startLine, endLine, silent) {
        let max, pos, start, token;
        let nextLine = startLine;
        let tight = true;
        if (state2.sCount[nextLine] - state2.blkIndent >= 4) return false;
        if (state2.listIndent >= 0 && state2.sCount[nextLine] - state2.listIndent >= 4 && state2.sCount[nextLine] < state2.blkIndent) return false;
        let isTerminatingParagraph = false;
        if (silent && state2.parentType === "paragraph") {
          if (state2.sCount[nextLine] >= state2.blkIndent) isTerminatingParagraph = true;
        }
        let isOrdered;
        let markerValue;
        let posAfterMarker;
        if ((posAfterMarker = skipOrderedListMarker(state2, nextLine)) >= 0) {
          isOrdered = true;
          start = state2.bMarks[nextLine] + state2.tShift[nextLine];
          markerValue = Number(state2.src.slice(start, posAfterMarker - 1));
          if (isTerminatingParagraph && markerValue !== 1) return false;
        } else if ((posAfterMarker = skipBulletListMarker(state2, nextLine)) >= 0) isOrdered = false;
        else return false;
        if (isTerminatingParagraph) {
          if (state2.skipSpaces(posAfterMarker) >= state2.eMarks[nextLine]) return false;
        }
        if (silent) return true;
        const markerCharCode = state2.src.charCodeAt(posAfterMarker - 1);
        const listTokIdx = state2.tokens.length;
        if (isOrdered) {
          token = state2.push("ordered_list_open", "ol", 1);
          if (markerValue !== 1) token.attrs = [["start", markerValue]];
        } else token = state2.push("bullet_list_open", "ul", 1);
        const listLines = [nextLine, 0];
        token.map = listLines;
        token.markup = String.fromCharCode(markerCharCode);
        let prevEmptyEnd = false;
        const terminatorRules = state2.md.block.ruler.getRules("list");
        const oldParentType = state2.parentType;
        state2.parentType = "list";
        while (nextLine < endLine) {
          pos = posAfterMarker;
          max = state2.eMarks[nextLine];
          const initial = state2.sCount[nextLine] + posAfterMarker - (state2.bMarks[nextLine] + state2.tShift[nextLine]);
          let offset = initial;
          while (pos < max) {
            const ch = state2.src.charCodeAt(pos);
            if (ch === 9) offset += 4 - (offset + state2.bsCount[nextLine]) % 4;
            else if (ch === 32) offset++;
            else break;
            pos++;
          }
          const contentStart = pos;
          let indentAfterMarker;
          if (contentStart >= max) indentAfterMarker = 1;
          else indentAfterMarker = offset - initial;
          if (indentAfterMarker > 4) indentAfterMarker = 1;
          const indent = initial + indentAfterMarker;
          token = state2.push("list_item_open", "li", 1);
          token.markup = String.fromCharCode(markerCharCode);
          const itemLines = [nextLine, 0];
          token.map = itemLines;
          if (isOrdered) token.info = state2.src.slice(start, posAfterMarker - 1);
          const oldTight = state2.tight;
          const oldTShift = state2.tShift[nextLine];
          const oldSCount = state2.sCount[nextLine];
          const oldListIndent = state2.listIndent;
          state2.listIndent = state2.blkIndent;
          state2.blkIndent = indent;
          state2.tight = true;
          state2.tShift[nextLine] = contentStart - state2.bMarks[nextLine];
          state2.sCount[nextLine] = offset;
          if (contentStart >= max && state2.isEmpty(nextLine + 1)) state2.line = Math.min(state2.line + 2, endLine);
          else state2.md.block.tokenize(state2, nextLine, endLine, true);
          if (!state2.tight || prevEmptyEnd) tight = false;
          prevEmptyEnd = state2.line - nextLine > 1 && state2.isEmpty(state2.line - 1);
          state2.blkIndent = state2.listIndent;
          state2.listIndent = oldListIndent;
          state2.tShift[nextLine] = oldTShift;
          state2.sCount[nextLine] = oldSCount;
          state2.tight = oldTight;
          token = state2.push("list_item_close", "li", -1);
          token.markup = String.fromCharCode(markerCharCode);
          nextLine = state2.line;
          itemLines[1] = nextLine;
          if (nextLine >= endLine) break;
          if (state2.sCount[nextLine] < state2.blkIndent) break;
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) break;
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine, endLine, true)) {
            terminate = true;
            break;
          }
          if (terminate) break;
          if (isOrdered) {
            posAfterMarker = skipOrderedListMarker(state2, nextLine);
            if (posAfterMarker < 0) break;
            start = state2.bMarks[nextLine] + state2.tShift[nextLine];
          } else {
            posAfterMarker = skipBulletListMarker(state2, nextLine);
            if (posAfterMarker < 0) break;
          }
          if (markerCharCode !== state2.src.charCodeAt(posAfterMarker - 1)) break;
        }
        if (isOrdered) token = state2.push("ordered_list_close", "ol", -1);
        else token = state2.push("bullet_list_close", "ul", -1);
        token.markup = String.fromCharCode(markerCharCode);
        listLines[1] = nextLine;
        state2.line = nextLine;
        state2.parentType = oldParentType;
        if (tight) markTightParagraphs(state2, listTokIdx);
        return true;
      }
      function reference(state2, startLine, _endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        let nextLine = startLine + 1;
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        if (state2.src.charCodeAt(pos) !== 91) return false;
        function getNextLine(nextLine2) {
          const endLine = state2.lineMax;
          if (nextLine2 >= endLine || state2.isEmpty(nextLine2)) return null;
          let isContinuation = false;
          if (state2.sCount[nextLine2] - state2.blkIndent > 3) isContinuation = true;
          if (state2.sCount[nextLine2] < 0) isContinuation = true;
          if (!isContinuation) {
            const terminatorRules = state2.md.block.ruler.getRules("reference");
            const oldParentType = state2.parentType;
            state2.parentType = "reference";
            let terminate = false;
            for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine2, endLine, true)) {
              terminate = true;
              break;
            }
            state2.parentType = oldParentType;
            if (terminate) return null;
          }
          const pos2 = state2.bMarks[nextLine2] + state2.tShift[nextLine2];
          const max2 = state2.eMarks[nextLine2];
          return state2.src.slice(pos2, max2 + 1);
        }
        let str = state2.src.slice(pos, max + 1);
        max = str.length;
        let labelEnd = -1;
        for (pos = 1; pos < max; pos++) {
          const ch = str.charCodeAt(pos);
          if (ch === 91) return false;
          else if (ch === 93) {
            labelEnd = pos;
            break;
          } else if (ch === 10) {
            const lineContent = getNextLine(nextLine);
            if (lineContent !== null) {
              str += lineContent;
              max = str.length;
              nextLine++;
            }
          } else if (ch === 92) {
            pos++;
            if (pos < max && str.charCodeAt(pos) === 10) {
              const lineContent = getNextLine(nextLine);
              if (lineContent !== null) {
                str += lineContent;
                max = str.length;
                nextLine++;
              }
            }
          }
        }
        if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 58) return false;
        for (pos = labelEnd + 2; pos < max; pos++) {
          const ch = str.charCodeAt(pos);
          if (ch === 10) {
            const lineContent = getNextLine(nextLine);
            if (lineContent !== null) {
              str += lineContent;
              max = str.length;
              nextLine++;
            }
          } else if (isSpace(ch)) {
          } else break;
        }
        const destRes = state2.md.helpers.parseLinkDestination(str, pos, max);
        if (!destRes.ok) return false;
        const href = state2.md.normalizeLink(destRes.str);
        if (!state2.md.validateLink(href)) return false;
        pos = destRes.pos;
        const destEndPos = pos;
        const destEndLineNo = nextLine;
        const start = pos;
        for (; pos < max; pos++) {
          const ch = str.charCodeAt(pos);
          if (ch === 10) {
            const lineContent = getNextLine(nextLine);
            if (lineContent !== null) {
              str += lineContent;
              max = str.length;
              nextLine++;
            }
          } else if (isSpace(ch)) {
          } else break;
        }
        let titleRes = state2.md.helpers.parseLinkTitle(str, pos, max);
        while (titleRes.can_continue) {
          const lineContent = getNextLine(nextLine);
          if (lineContent === null) break;
          str += lineContent;
          pos = max;
          max = str.length;
          nextLine++;
          titleRes = state2.md.helpers.parseLinkTitle(str, pos, max, titleRes);
        }
        let title;
        if (pos < max && start !== pos && titleRes.ok) {
          title = titleRes.str;
          pos = titleRes.pos;
        } else {
          title = "";
          pos = destEndPos;
          nextLine = destEndLineNo;
        }
        while (pos < max) {
          if (!isSpace(str.charCodeAt(pos))) break;
          pos++;
        }
        if (pos < max && str.charCodeAt(pos) !== 10) {
          if (title) {
            title = "";
            pos = destEndPos;
            nextLine = destEndLineNo;
            while (pos < max) {
              if (!isSpace(str.charCodeAt(pos))) break;
              pos++;
            }
          }
        }
        if (pos < max && str.charCodeAt(pos) !== 10) return false;
        const label = normalizeReference(str.slice(1, labelEnd));
        if (!label) return false;
        if (silent) return true;
        if (typeof state2.env.references === "undefined") state2.env.references = {};
        if (typeof state2.env.references[label] === "undefined") state2.env.references[label] = {
          title,
          href
        };
        state2.line = nextLine;
        return true;
      }
      var html_blocks_default = [
        "address",
        "article",
        "aside",
        "base",
        "basefont",
        "blockquote",
        "body",
        "caption",
        "center",
        "col",
        "colgroup",
        "dd",
        "details",
        "dialog",
        "dir",
        "div",
        "dl",
        "dt",
        "fieldset",
        "figcaption",
        "figure",
        "footer",
        "form",
        "frame",
        "frameset",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "head",
        "header",
        "hr",
        "html",
        "iframe",
        "legend",
        "li",
        "link",
        "main",
        "menu",
        "menuitem",
        "nav",
        "noframes",
        "ol",
        "optgroup",
        "option",
        "p",
        "param",
        "search",
        "section",
        "summary",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "title",
        "tr",
        "track",
        "ul"
      ];
      var HTML_TAG_RE = /* @__PURE__ */ new RegExp(`^(?:<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>|<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`);
      var HTML_OPEN_CLOSE_TAG_RE = /* @__PURE__ */ new RegExp(`^(?:<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>|<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>)`);
      var HTML_SEQUENCES = [
        [
          /^<(script|pre|style|textarea)(?=(\s|>|$))/i,
          /<\/(script|pre|style|textarea)>/i,
          true
        ],
        [
          /^<!--/,
          /-->/,
          true
        ],
        [
          /^<\?/,
          /\?>/,
          true
        ],
        [
          /^<![A-Z]/,
          />/,
          true
        ],
        [
          /^<!\[CDATA\[/,
          /\]\]>/,
          true
        ],
        [
          new RegExp("^</?(" + html_blocks_default.join("|") + ")(?=(\\s|/?>|$))", "i"),
          /^$/,
          true
        ],
        [
          new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + "\\s*$"),
          /^$/,
          false
        ]
      ];
      function html_block(state2, startLine, endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        if (!state2.md.options.html) return false;
        if (state2.src.charCodeAt(pos) !== 60) return false;
        let lineText = state2.src.slice(pos, max);
        let i = 0;
        for (; i < HTML_SEQUENCES.length; i++) if (HTML_SEQUENCES[i][0].test(lineText)) break;
        if (i === HTML_SEQUENCES.length) return false;
        if (silent) return HTML_SEQUENCES[i][2];
        let nextLine = startLine + 1;
        const endsOnBlankLine = HTML_SEQUENCES[i][1].test("");
        if (!HTML_SEQUENCES[i][1].test(lineText)) for (; nextLine < endLine; nextLine++) {
          if (state2.sCount[nextLine] < state2.blkIndent) {
            if (endsOnBlankLine || !state2.isEmpty(nextLine)) break;
          }
          pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
          max = state2.eMarks[nextLine];
          lineText = state2.src.slice(pos, max);
          if (HTML_SEQUENCES[i][1].test(lineText)) {
            if (lineText.length !== 0) nextLine++;
            break;
          }
        }
        state2.line = nextLine;
        const token = state2.push("html_block", "", 0);
        token.map = [startLine, nextLine];
        token.content = state2.getLines(startLine, nextLine, state2.blkIndent, true);
        return true;
      }
      function heading(state2, startLine, endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        let ch = state2.src.charCodeAt(pos);
        if (ch !== 35 || pos >= max) return false;
        let level = 1;
        ch = state2.src.charCodeAt(++pos);
        while (ch === 35 && pos < max && level <= 6) {
          level++;
          ch = state2.src.charCodeAt(++pos);
        }
        if (level > 6 || pos < max && !isSpace(ch)) return false;
        if (silent) return true;
        max = state2.skipSpacesBack(max, pos);
        const tmp = state2.skipCharsBack(max, 35, pos);
        if (tmp > pos && isSpace(state2.src.charCodeAt(tmp - 1))) max = tmp;
        state2.line = startLine + 1;
        const token_o = state2.push("heading_open", "h" + String(level), 1);
        token_o.markup = "########".slice(0, level);
        token_o.map = [startLine, state2.line];
        const token_i = state2.push("inline", "", 0);
        token_i.content = asciiTrim(state2.src.slice(pos, max));
        token_i.map = [startLine, state2.line];
        token_i.children = [];
        const token_c = state2.push("heading_close", "h" + String(level), -1);
        token_c.markup = "########".slice(0, level);
        return true;
      }
      function lheading(state2, startLine, endLine) {
        const terminatorRules = state2.md.block.ruler.getRules("paragraph");
        if (state2.sCount[startLine] - state2.blkIndent >= 4) return false;
        const oldParentType = state2.parentType;
        state2.parentType = "paragraph";
        let level = 0;
        let marker;
        let nextLine = startLine + 1;
        for (; nextLine < endLine && !state2.isEmpty(nextLine); nextLine++) {
          if (state2.sCount[nextLine] - state2.blkIndent > 3) continue;
          if (state2.sCount[nextLine] >= state2.blkIndent) {
            let pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
            const max = state2.eMarks[nextLine];
            if (pos < max) {
              marker = state2.src.charCodeAt(pos);
              if (marker === 45 || marker === 61) {
                pos = state2.skipChars(pos, marker);
                pos = state2.skipSpaces(pos);
                if (pos >= max) {
                  level = marker === 61 ? 1 : 2;
                  break;
                }
              }
            }
          }
          if (state2.sCount[nextLine] < 0) continue;
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine, endLine, true)) {
            terminate = true;
            break;
          }
          if (terminate) break;
        }
        if (!level) {
          state2.parentType = oldParentType;
          return false;
        }
        const content = asciiTrim(state2.getLines(startLine, nextLine, state2.blkIndent, false));
        state2.line = nextLine + 1;
        const token_o = state2.push("heading_open", "h" + String(level), 1);
        token_o.markup = String.fromCharCode(marker);
        token_o.map = [startLine, state2.line];
        const token_i = state2.push("inline", "", 0);
        token_i.content = content;
        token_i.map = [startLine, state2.line - 1];
        token_i.children = [];
        const token_c = state2.push("heading_close", "h" + String(level), -1);
        token_c.markup = String.fromCharCode(marker);
        state2.parentType = oldParentType;
        return true;
      }
      function paragraph(state2, startLine, endLine) {
        const terminatorRules = state2.md.block.ruler.getRules("paragraph");
        const oldParentType = state2.parentType;
        let nextLine = startLine + 1;
        state2.parentType = "paragraph";
        for (; nextLine < endLine && !state2.isEmpty(nextLine); nextLine++) {
          if (state2.sCount[nextLine] - state2.blkIndent > 3) continue;
          if (state2.sCount[nextLine] < 0) continue;
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) if (terminatorRules[i](state2, nextLine, endLine, true)) {
            terminate = true;
            break;
          }
          if (terminate) break;
        }
        const content = asciiTrim(state2.getLines(startLine, nextLine, state2.blkIndent, false));
        state2.line = nextLine;
        const token_o = state2.push("paragraph_open", "p", 1);
        token_o.map = [startLine, state2.line];
        const token_i = state2.push("inline", "", 0);
        token_i.content = content;
        token_i.map = [startLine, state2.line];
        token_i.children = [];
        state2.push("paragraph_close", "p", -1);
        state2.parentType = oldParentType;
        return true;
      }
      var _rules$1 = [
        [
          "table",
          table,
          ["paragraph", "reference"]
        ],
        ["code", code],
        [
          "fence",
          fence,
          [
            "paragraph",
            "reference",
            "blockquote",
            "list"
          ]
        ],
        [
          "blockquote",
          blockquote,
          [
            "paragraph",
            "reference",
            "blockquote",
            "list"
          ]
        ],
        [
          "hr",
          hr,
          [
            "paragraph",
            "reference",
            "blockquote",
            "list"
          ]
        ],
        [
          "list",
          list2,
          [
            "paragraph",
            "reference",
            "blockquote"
          ]
        ],
        ["reference", reference],
        [
          "html_block",
          html_block,
          [
            "paragraph",
            "reference",
            "blockquote"
          ]
        ],
        [
          "heading",
          heading,
          [
            "paragraph",
            "reference",
            "blockquote"
          ]
        ],
        ["lheading", lheading],
        ["paragraph", paragraph]
      ];
      function ParserBlock() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules$1.length; i++) this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
      }
      ParserBlock.prototype.tokenize = function(state2, startLine, endLine) {
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const maxNesting = state2.md.options.maxNesting;
        let line = startLine;
        let hasEmptyLines = false;
        while (line < endLine) {
          state2.line = line = state2.skipEmptyLines(line);
          if (line >= endLine) break;
          if (state2.sCount[line] < state2.blkIndent) break;
          if (state2.level >= maxNesting) {
            state2.line = endLine;
            break;
          }
          const prevLine = state2.line;
          let ok = false;
          for (let i = 0; i < len; i++) {
            ok = rules[i](state2, line, endLine, false);
            if (ok) {
              if (prevLine >= state2.line) throw new Error("block rule didn't increment state.line");
              break;
            }
          }
          if (!ok) throw new Error("none of the block rules matched");
          state2.tight = !hasEmptyLines;
          if (state2.isEmpty(state2.line - 1)) hasEmptyLines = true;
          line = state2.line;
          if (line < endLine && state2.isEmpty(line)) {
            hasEmptyLines = true;
            line++;
            state2.line = line;
          }
        }
      };
      ParserBlock.prototype.parse = function(src, md2, env, outTokens) {
        if (!src) return;
        const state2 = new this.State(src, md2, env, outTokens);
        this.tokenize(state2, state2.line, state2.lineMax);
      };
      ParserBlock.prototype.State = StateBlock;
      function StateInline(src, md2, env, outTokens) {
        this.src = src;
        this.env = env;
        this.md = md2;
        this.tokens = outTokens;
        this.tokens_meta = Array(outTokens.length);
        this.pos = 0;
        this.posMax = this.src.length;
        this.level = 0;
        this.pending = "";
        this.pendingLevel = 0;
        this.cache = {};
        this.delimiters = [];
        this._prev_delimiters = [];
        this.backticks = {};
        this.backticksScanned = false;
        this.linkLevel = 0;
      }
      StateInline.prototype.pushPending = function() {
        const token = new Token("text", "", 0);
        token.content = this.pending;
        token.level = this.pendingLevel;
        this.tokens.push(token);
        this.pending = "";
        return token;
      };
      StateInline.prototype.push = function(type, tag, nesting) {
        if (this.pending) this.pushPending();
        const token = new Token(type, tag, nesting);
        let token_meta = null;
        if (nesting < 0) {
          this.level--;
          this.delimiters = this._prev_delimiters.pop();
        }
        token.level = this.level;
        if (nesting > 0) {
          this.level++;
          this._prev_delimiters.push(this.delimiters);
          this.delimiters = [];
          token_meta = { delimiters: this.delimiters };
        }
        this.pendingLevel = this.level;
        this.tokens.push(token);
        this.tokens_meta.push(token_meta);
        return token;
      };
      StateInline.prototype.scanDelims = function(start, canSplitWord) {
        const max = this.posMax;
        const marker = this.src.charCodeAt(start);
        let lastChar;
        if (start === 0) lastChar = 32;
        else if (start === 1) {
          lastChar = this.src.charCodeAt(0);
          if ((lastChar & 63488) === 55296) lastChar = 65533;
        } else {
          lastChar = this.src.charCodeAt(start - 1);
          if ((lastChar & 64512) === 56320) {
            const highSurr = this.src.charCodeAt(start - 2);
            lastChar = (highSurr & 64512) === 55296 ? 65536 + (highSurr - 55296 << 10) + (lastChar - 56320) : 65533;
          } else if ((lastChar & 64512) === 55296) lastChar = 65533;
        }
        let pos = start;
        while (pos < max && this.src.charCodeAt(pos) === marker) pos++;
        const count = pos - start;
        let nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
        if ((nextChar & 64512) === 55296) {
          const lowSurr = this.src.charCodeAt(pos + 1);
          nextChar = (lowSurr & 64512) === 56320 ? 65536 + (nextChar - 55296 << 10) + (lowSurr - 56320) : 65533;
        } else if ((nextChar & 64512) === 56320) nextChar = 65533;
        const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctCharCode(lastChar);
        const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctCharCode(nextChar);
        const isLastWhiteSpace = isWhiteSpace(lastChar);
        const isNextWhiteSpace = isWhiteSpace(nextChar);
        const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
        const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
        return {
          can_open: left_flanking && (canSplitWord || !right_flanking || isLastPunctChar),
          can_close: right_flanking && (canSplitWord || !left_flanking || isNextPunctChar),
          length: count
        };
      };
      StateInline.prototype.Token = Token;
      function isTerminatorChar(ch) {
        switch (ch) {
          case 10:
          case 33:
          case 35:
          case 36:
          case 37:
          case 38:
          case 42:
          case 43:
          case 45:
          case 58:
          case 60:
          case 61:
          case 62:
          case 64:
          case 91:
          case 92:
          case 93:
          case 94:
          case 95:
          case 96:
          case 123:
          case 125:
          case 126:
            return true;
          default:
            return false;
        }
      }
      function text(state2, silent) {
        let pos = state2.pos;
        while (pos < state2.posMax && !isTerminatorChar(state2.src.charCodeAt(pos))) pos++;
        if (pos === state2.pos) return false;
        if (!silent) state2.pending += state2.src.slice(state2.pos, pos);
        state2.pos = pos;
        return true;
      }
      var SCHEME_RE = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;
      function linkify(state2, silent) {
        if (!state2.md.options.linkify) return false;
        if (state2.linkLevel > 0) return false;
        const pos = state2.pos;
        const max = state2.posMax;
        if (pos + 3 > max) return false;
        if (state2.src.charCodeAt(pos) !== 58) return false;
        if (state2.src.charCodeAt(pos + 1) !== 47) return false;
        if (state2.src.charCodeAt(pos + 2) !== 47) return false;
        const match = state2.pending.match(SCHEME_RE);
        if (!match) return false;
        const proto = match[1];
        const link2 = state2.md.linkify.matchAtStart(state2.src.slice(pos - proto.length));
        if (!link2) return false;
        let url = link2.url;
        if (url.length <= proto.length) return false;
        let urlEnd = url.length;
        while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) urlEnd--;
        if (urlEnd !== url.length) url = url.slice(0, urlEnd);
        const fullUrl = state2.md.normalizeLink(url);
        if (!state2.md.validateLink(fullUrl)) return false;
        if (!silent) {
          state2.pending = state2.pending.slice(0, -proto.length);
          const token_o = state2.push("link_open", "a", 1);
          token_o.attrs = [["href", fullUrl]];
          token_o.markup = "linkify";
          token_o.info = "auto";
          const token_t = state2.push("text", "", 0);
          token_t.content = state2.md.normalizeLinkText(url);
          const token_c = state2.push("link_close", "a", -1);
          token_c.markup = "linkify";
          token_c.info = "auto";
        }
        state2.pos += url.length - proto.length;
        return true;
      }
      function newline(state2, silent) {
        let pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 10) return false;
        const pmax = state2.pending.length - 1;
        const max = state2.posMax;
        if (!silent) if (pmax >= 0 && state2.pending.charCodeAt(pmax) === 32) if (pmax >= 1 && state2.pending.charCodeAt(pmax - 1) === 32) {
          let ws = pmax - 1;
          while (ws >= 1 && state2.pending.charCodeAt(ws - 1) === 32) ws--;
          state2.pending = state2.pending.slice(0, ws);
          state2.push("hardbreak", "br", 0);
        } else {
          state2.pending = state2.pending.slice(0, -1);
          state2.push("softbreak", "br", 0);
        }
        else state2.push("softbreak", "br", 0);
        pos++;
        while (pos < max && isSpace(state2.src.charCodeAt(pos))) pos++;
        state2.pos = pos;
        return true;
      }
      var ESCAPED = [];
      for (let i = 0; i < 256; i++) ESCAPED.push(0);
      "\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(ch) {
        ESCAPED[ch.charCodeAt(0)] = 1;
      });
      function escape(state2, silent) {
        let pos = state2.pos;
        const max = state2.posMax;
        if (state2.src.charCodeAt(pos) !== 92) return false;
        pos++;
        if (pos >= max) return false;
        let ch1 = state2.src.charCodeAt(pos);
        if (ch1 === 10) {
          if (!silent) state2.push("hardbreak", "br", 0);
          pos++;
          while (pos < max) {
            ch1 = state2.src.charCodeAt(pos);
            if (!isSpace(ch1)) break;
            pos++;
          }
          state2.pos = pos;
          return true;
        }
        if (ch1 === 32) {
          if (!silent) {
            const token = state2.push("text_special", "", 0);
            token.content = "\\";
            token.markup = "\\";
            token.info = "escape";
          }
          state2.pos = pos;
          return true;
        }
        let escapedStr = state2.src[pos];
        if (ch1 >= 55296 && ch1 <= 56319 && pos + 1 < max) {
          const ch2 = state2.src.charCodeAt(pos + 1);
          if (ch2 >= 56320 && ch2 <= 57343) {
            escapedStr += state2.src[pos + 1];
            pos++;
          }
        }
        const origStr = "\\" + escapedStr;
        if (!silent) {
          const token = state2.push("text_special", "", 0);
          if (ch1 < 256 && ESCAPED[ch1] !== 0) token.content = escapedStr;
          else token.content = origStr;
          token.markup = origStr;
          token.info = "escape";
        }
        state2.pos = pos + 1;
        return true;
      }
      function backtick(state2, silent) {
        let pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 96) return false;
        const start = pos;
        pos++;
        const max = state2.posMax;
        while (pos < max && state2.src.charCodeAt(pos) === 96) pos++;
        const marker = state2.src.slice(start, pos);
        const openerLength = marker.length;
        if (state2.backticksScanned && (state2.backticks[openerLength] || 0) <= start) {
          if (!silent) state2.pending += marker;
          state2.pos += openerLength;
          return true;
        }
        let matchEnd = pos;
        let matchStart;
        while ((matchStart = state2.src.indexOf("`", matchEnd)) !== -1) {
          matchEnd = matchStart + 1;
          while (matchEnd < max && state2.src.charCodeAt(matchEnd) === 96) matchEnd++;
          const closerLength = matchEnd - matchStart;
          if (closerLength === openerLength) {
            if (!silent) {
              const token = state2.push("code_inline", "code", 0);
              token.markup = marker;
              token.content = state2.src.slice(pos, matchStart).replace(/\n/g, " ").replace(/^ (.+) $/, "$1");
            }
            state2.pos = matchEnd;
            return true;
          }
          state2.backticks[closerLength] = matchStart;
        }
        state2.backticksScanned = true;
        if (!silent) state2.pending += marker;
        state2.pos += openerLength;
        return true;
      }
      function strikethrough_tokenize(state2, silent) {
        const start = state2.pos;
        const marker = state2.src.charCodeAt(start);
        if (silent) return false;
        if (marker !== 126) return false;
        const scanned = state2.scanDelims(state2.pos, true);
        let len = scanned.length;
        const ch = String.fromCharCode(marker);
        if (len < 2) return false;
        let token;
        if (len % 2) {
          token = state2.push("text", "", 0);
          token.content = ch;
          len--;
        }
        for (let i = 0; i < len; i += 2) {
          token = state2.push("text", "", 0);
          token.content = ch + ch;
          state2.delimiters.push({
            marker,
            length: 0,
            token: state2.tokens.length - 1,
            end: -1,
            open: scanned.can_open,
            close: scanned.can_close
          });
        }
        state2.pos += scanned.length;
        return true;
      }
      function postProcess$1(state2, delimiters) {
        let token;
        const loneMarkers = [];
        const max = delimiters.length;
        for (let i = 0; i < max; i++) {
          const startDelim = delimiters[i];
          if (startDelim.marker !== 126) continue;
          if (startDelim.end === -1) continue;
          const endDelim = delimiters[startDelim.end];
          token = state2.tokens[startDelim.token];
          token.type = "s_open";
          token.tag = "s";
          token.nesting = 1;
          token.markup = "~~";
          token.content = "";
          token = state2.tokens[endDelim.token];
          token.type = "s_close";
          token.tag = "s";
          token.nesting = -1;
          token.markup = "~~";
          token.content = "";
          if (state2.tokens[endDelim.token - 1].type === "text" && state2.tokens[endDelim.token - 1].content === "~") loneMarkers.push(endDelim.token - 1);
        }
        while (loneMarkers.length) {
          const i = loneMarkers.pop();
          let j = i + 1;
          while (j < state2.tokens.length && state2.tokens[j].type === "s_close") j++;
          j--;
          if (i !== j) {
            token = state2.tokens[j];
            state2.tokens[j] = state2.tokens[i];
            state2.tokens[i] = token;
          }
        }
      }
      function strikethrough_postProcess(state2) {
        const tokens_meta = state2.tokens_meta;
        const max = state2.tokens_meta.length;
        postProcess$1(state2, state2.delimiters);
        for (let curr = 0; curr < max; curr++) if (tokens_meta[curr] && tokens_meta[curr].delimiters) postProcess$1(state2, tokens_meta[curr].delimiters);
      }
      var strikethrough_default = {
        tokenize: strikethrough_tokenize,
        postProcess: strikethrough_postProcess
      };
      function emphasis_tokenize(state2, silent) {
        const start = state2.pos;
        const marker = state2.src.charCodeAt(start);
        if (silent) return false;
        if (marker !== 95 && marker !== 42) return false;
        const scanned = state2.scanDelims(state2.pos, marker === 42);
        for (let i = 0; i < scanned.length; i++) {
          const token = state2.push("text", "", 0);
          token.content = String.fromCharCode(marker);
          state2.delimiters.push({
            marker,
            length: scanned.length,
            token: state2.tokens.length - 1,
            end: -1,
            open: scanned.can_open,
            close: scanned.can_close
          });
        }
        state2.pos += scanned.length;
        return true;
      }
      function postProcess(state2, delimiters) {
        const max = delimiters.length;
        for (let i = max - 1; i >= 0; i--) {
          const startDelim = delimiters[i];
          if (startDelim.marker !== 95 && startDelim.marker !== 42) continue;
          if (startDelim.end === -1) continue;
          const endDelim = delimiters[startDelim.end];
          const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && delimiters[startDelim.end + 1].token === endDelim.token + 1;
          const ch = String.fromCharCode(startDelim.marker);
          const token_o = state2.tokens[startDelim.token];
          token_o.type = isStrong ? "strong_open" : "em_open";
          token_o.tag = isStrong ? "strong" : "em";
          token_o.nesting = 1;
          token_o.markup = isStrong ? ch + ch : ch;
          token_o.content = "";
          const token_c = state2.tokens[endDelim.token];
          token_c.type = isStrong ? "strong_close" : "em_close";
          token_c.tag = isStrong ? "strong" : "em";
          token_c.nesting = -1;
          token_c.markup = isStrong ? ch + ch : ch;
          token_c.content = "";
          if (isStrong) {
            state2.tokens[delimiters[i - 1].token].content = "";
            state2.tokens[delimiters[startDelim.end + 1].token].content = "";
            i--;
          }
        }
      }
      function emphasis_post_process(state2) {
        const tokens_meta = state2.tokens_meta;
        const max = state2.tokens_meta.length;
        postProcess(state2, state2.delimiters);
        for (let curr = 0; curr < max; curr++) if (tokens_meta[curr] && tokens_meta[curr].delimiters) postProcess(state2, tokens_meta[curr].delimiters);
      }
      var emphasis_default = {
        tokenize: emphasis_tokenize,
        postProcess: emphasis_post_process
      };
      function link(state2, silent) {
        let code2, label, res, ref;
        let href = "";
        let title = "";
        let start = state2.pos;
        let parseReference = true;
        if (state2.src.charCodeAt(state2.pos) !== 91) return false;
        const oldPos = state2.pos;
        const max = state2.posMax;
        const labelStart = state2.pos + 1;
        const labelEnd = state2.md.helpers.parseLinkLabel(state2, state2.pos, true);
        if (labelEnd < 0) return false;
        let pos = labelEnd + 1;
        if (pos < max && state2.src.charCodeAt(pos) === 40) {
          parseReference = false;
          pos++;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) break;
          }
          if (pos >= max) return false;
          start = pos;
          res = state2.md.helpers.parseLinkDestination(state2.src, pos, state2.posMax);
          if (res.ok) {
            href = state2.md.normalizeLink(res.str);
            if (state2.md.validateLink(href)) pos = res.pos;
            else href = "";
            start = pos;
            for (; pos < max; pos++) {
              code2 = state2.src.charCodeAt(pos);
              if (!isSpace(code2) && code2 !== 10) break;
            }
            res = state2.md.helpers.parseLinkTitle(state2.src, pos, state2.posMax);
            if (pos < max && start !== pos && res.ok) {
              title = res.str;
              pos = res.pos;
              for (; pos < max; pos++) {
                code2 = state2.src.charCodeAt(pos);
                if (!isSpace(code2) && code2 !== 10) break;
              }
            }
          }
          if (pos >= max || state2.src.charCodeAt(pos) !== 41) parseReference = true;
          pos++;
        }
        if (parseReference) {
          if (typeof state2.env.references === "undefined") return false;
          if (pos < max && state2.src.charCodeAt(pos) === 91) {
            start = pos + 1;
            pos = state2.md.helpers.parseLinkLabel(state2, pos);
            if (pos >= 0) label = state2.src.slice(start, pos++);
            else pos = labelEnd + 1;
          } else pos = labelEnd + 1;
          if (!label) label = state2.src.slice(labelStart, labelEnd);
          ref = state2.env.references[normalizeReference(label)];
          if (!ref) {
            state2.pos = oldPos;
            return false;
          }
          href = ref.href;
          title = ref.title;
        }
        if (!silent) {
          state2.pos = labelStart;
          state2.posMax = labelEnd;
          const token_o = state2.push("link_open", "a", 1);
          const attrs = [["href", href]];
          token_o.attrs = attrs;
          if (title) attrs.push(["title", title]);
          state2.linkLevel++;
          state2.md.inline.tokenize(state2);
          state2.linkLevel--;
          state2.push("link_close", "a", -1);
        }
        state2.pos = pos;
        state2.posMax = max;
        return true;
      }
      function image(state2, silent) {
        let code2, content, label, pos, ref, res, title, start;
        let href = "";
        const oldPos = state2.pos;
        const max = state2.posMax;
        if (state2.src.charCodeAt(state2.pos) !== 33) return false;
        if (state2.src.charCodeAt(state2.pos + 1) !== 91) return false;
        const labelStart = state2.pos + 2;
        const labelEnd = state2.md.helpers.parseLinkLabel(state2, state2.pos + 1, false);
        if (labelEnd < 0) return false;
        pos = labelEnd + 1;
        if (pos < max && state2.src.charCodeAt(pos) === 40) {
          pos++;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) break;
          }
          if (pos >= max) return false;
          start = pos;
          res = state2.md.helpers.parseLinkDestination(state2.src, pos, state2.posMax);
          if (res.ok) {
            href = state2.md.normalizeLink(res.str);
            if (state2.md.validateLink(href)) pos = res.pos;
            else href = "";
          }
          start = pos;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) break;
          }
          res = state2.md.helpers.parseLinkTitle(state2.src, pos, state2.posMax);
          if (pos < max && start !== pos && res.ok) {
            title = res.str;
            pos = res.pos;
            for (; pos < max; pos++) {
              code2 = state2.src.charCodeAt(pos);
              if (!isSpace(code2) && code2 !== 10) break;
            }
          } else title = "";
          if (pos >= max || state2.src.charCodeAt(pos) !== 41) {
            state2.pos = oldPos;
            return false;
          }
          pos++;
        } else {
          if (typeof state2.env.references === "undefined") return false;
          if (pos < max && state2.src.charCodeAt(pos) === 91) {
            start = pos + 1;
            pos = state2.md.helpers.parseLinkLabel(state2, pos);
            if (pos >= 0) label = state2.src.slice(start, pos++);
            else pos = labelEnd + 1;
          } else pos = labelEnd + 1;
          if (!label) label = state2.src.slice(labelStart, labelEnd);
          ref = state2.env.references[normalizeReference(label)];
          if (!ref) {
            state2.pos = oldPos;
            return false;
          }
          href = ref.href;
          title = ref.title;
        }
        if (!silent) {
          content = state2.src.slice(labelStart, labelEnd);
          const tokens = [];
          state2.md.inline.parse(content, state2.md, state2.env, tokens);
          const token = state2.push("image", "img", 0);
          const attrs = [["src", href], ["alt", ""]];
          token.attrs = attrs;
          token.children = tokens;
          token.content = content;
          if (title) attrs.push(["title", title]);
        }
        state2.pos = pos;
        state2.posMax = max;
        return true;
      }
      var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
      var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
      function autolink(state2, silent) {
        let pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 60) return false;
        const start = state2.pos;
        const max = state2.posMax;
        for (; ; ) {
          if (++pos >= max) return false;
          const ch = state2.src.charCodeAt(pos);
          if (ch === 60) return false;
          if (ch === 62) break;
        }
        const url = state2.src.slice(start + 1, pos);
        if (AUTOLINK_RE.test(url)) {
          const fullUrl = state2.md.normalizeLink(url);
          if (!state2.md.validateLink(fullUrl)) return false;
          if (!silent) {
            const token_o = state2.push("link_open", "a", 1);
            token_o.attrs = [["href", fullUrl]];
            token_o.markup = "autolink";
            token_o.info = "auto";
            const token_t = state2.push("text", "", 0);
            token_t.content = state2.md.normalizeLinkText(url);
            const token_c = state2.push("link_close", "a", -1);
            token_c.markup = "autolink";
            token_c.info = "auto";
          }
          state2.pos += url.length + 2;
          return true;
        }
        if (EMAIL_RE.test(url)) {
          const fullUrl = state2.md.normalizeLink("mailto:" + url);
          if (!state2.md.validateLink(fullUrl)) return false;
          if (!silent) {
            const token_o = state2.push("link_open", "a", 1);
            token_o.attrs = [["href", fullUrl]];
            token_o.markup = "autolink";
            token_o.info = "auto";
            const token_t = state2.push("text", "", 0);
            token_t.content = state2.md.normalizeLinkText(url);
            const token_c = state2.push("link_close", "a", -1);
            token_c.markup = "autolink";
            token_c.info = "auto";
          }
          state2.pos += url.length + 2;
          return true;
        }
        return false;
      }
      function isLinkOpen(str) {
        return /^<a[>\s]/i.test(str);
      }
      function isLinkClose(str) {
        return /^<\/a\s*>/i.test(str);
      }
      function isLetter(ch) {
        const lc = ch | 32;
        return lc >= 97 && lc <= 122;
      }
      function html_inline(state2, silent) {
        if (!state2.md.options.html) return false;
        const max = state2.posMax;
        const pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 60 || pos + 2 >= max) return false;
        const ch = state2.src.charCodeAt(pos + 1);
        if (ch !== 33 && ch !== 63 && ch !== 47 && !isLetter(ch)) return false;
        const match = state2.src.slice(pos).match(HTML_TAG_RE);
        if (!match) return false;
        if (!silent) {
          const token = state2.push("html_inline", "", 0);
          token.content = match[0];
          if (isLinkOpen(token.content)) state2.linkLevel++;
          if (isLinkClose(token.content)) state2.linkLevel--;
        }
        state2.pos += match[0].length;
        return true;
      }
      var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
      var NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;
      function entity(state2, silent) {
        const pos = state2.pos;
        const max = state2.posMax;
        if (state2.src.charCodeAt(pos) !== 38) return false;
        if (pos + 1 >= max) return false;
        if (state2.src.charCodeAt(pos + 1) === 35) {
          const match = state2.src.slice(pos).match(DIGITAL_RE);
          if (match) {
            if (!silent) {
              const code2 = match[1][0].toLowerCase() === "x" ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
              const token = state2.push("text_special", "", 0);
              token.content = isValidEntityCode(code2) ? fromCodePoint(code2) : fromCodePoint(65533);
              token.markup = match[0];
              token.info = "entity";
            }
            state2.pos += match[0].length;
            return true;
          }
        } else {
          const match = state2.src.slice(pos).match(NAMED_RE);
          if (match) {
            const decoded = (0, entities.decodeHTMLStrict)(match[0]);
            if (decoded !== match[0]) {
              if (!silent) {
                const token = state2.push("text_special", "", 0);
                token.content = decoded;
                token.markup = match[0];
                token.info = "entity";
              }
              state2.pos += match[0].length;
              return true;
            }
          }
        }
        return false;
      }
      function processDelimiters(delimiters) {
        const openersBottom = {};
        const max = delimiters.length;
        if (!max) return;
        let headerIdx = 0;
        let lastTokenIdx = -2;
        const jumps = [];
        for (let closerIdx = 0; closerIdx < max; closerIdx++) {
          const closer = delimiters[closerIdx];
          jumps.push(0);
          if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) headerIdx = closerIdx;
          lastTokenIdx = closer.token;
          closer.length = closer.length || 0;
          if (!closer.close) continue;
          if (!openersBottom.hasOwnProperty(closer.marker)) openersBottom[closer.marker] = [
            -1,
            -1,
            -1,
            -1,
            -1,
            -1
          ];
          const minOpenerIdx = openersBottom[closer.marker][(closer.open ? 3 : 0) + closer.length % 3];
          let openerIdx = headerIdx - jumps[headerIdx] - 1;
          let newMinOpenerIdx = openerIdx;
          for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx] + 1) {
            const opener = delimiters[openerIdx];
            if (opener.marker !== closer.marker) continue;
            if (opener.open && opener.end < 0) {
              let isOddMatch = false;
              if (opener.close || closer.open) {
                if ((opener.length + closer.length) % 3 === 0) {
                  if (opener.length % 3 !== 0 || closer.length % 3 !== 0) isOddMatch = true;
                }
              }
              if (!isOddMatch) {
                const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ? jumps[openerIdx - 1] + 1 : 0;
                jumps[closerIdx] = closerIdx - openerIdx + lastJump;
                jumps[openerIdx] = lastJump;
                closer.open = false;
                opener.end = closerIdx;
                opener.close = false;
                newMinOpenerIdx = -1;
                lastTokenIdx = -2;
                break;
              }
            }
          }
          if (newMinOpenerIdx !== -1) openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
        }
      }
      function link_pairs(state2) {
        const tokens_meta = state2.tokens_meta;
        const max = state2.tokens_meta.length;
        processDelimiters(state2.delimiters);
        for (let curr = 0; curr < max; curr++) if (tokens_meta[curr] && tokens_meta[curr].delimiters) processDelimiters(tokens_meta[curr].delimiters);
      }
      function fragments_join(state2) {
        let curr, last;
        let level = 0;
        const tokens = state2.tokens;
        const max = state2.tokens.length;
        for (curr = last = 0; curr < max; curr++) {
          if (tokens[curr].nesting < 0) level--;
          tokens[curr].level = level;
          if (tokens[curr].nesting > 0) level++;
          if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
          else {
            if (curr !== last) tokens[last] = tokens[curr];
            last++;
          }
        }
        if (curr !== last) tokens.length = last;
      }
      var _rules = [
        ["text", text],
        ["linkify", linkify],
        ["newline", newline],
        ["escape", escape],
        ["backticks", backtick],
        ["strikethrough", strikethrough_default.tokenize],
        ["emphasis", emphasis_default.tokenize],
        ["link", link],
        ["image", image],
        ["autolink", autolink],
        ["html_inline", html_inline],
        ["entity", entity]
      ];
      var _rules2 = [
        ["balance_pairs", link_pairs],
        ["strikethrough", strikethrough_default.postProcess],
        ["emphasis", emphasis_default.postProcess],
        ["fragments_join", fragments_join]
      ];
      function ParserInline() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules.length; i++) this.ruler.push(_rules[i][0], _rules[i][1]);
        this.ruler2 = new Ruler();
        for (let i = 0; i < _rules2.length; i++) this.ruler2.push(_rules2[i][0], _rules2[i][1]);
      }
      ParserInline.prototype.skipToken = function(state2) {
        const pos = state2.pos;
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const maxNesting = state2.md.options.maxNesting;
        const cache = state2.cache;
        if (typeof cache[pos] !== "undefined") {
          state2.pos = cache[pos];
          return;
        }
        let ok = false;
        if (state2.level < maxNesting) for (let i = 0; i < len; i++) {
          state2.level++;
          ok = rules[i](state2, true);
          state2.level--;
          if (ok) {
            if (pos >= state2.pos) throw new Error("inline rule didn't increment state.pos");
            break;
          }
        }
        else state2.pos = state2.posMax;
        if (!ok) state2.pos++;
        cache[pos] = state2.pos;
      };
      ParserInline.prototype.tokenize = function(state2) {
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const end = state2.posMax;
        const maxNesting = state2.md.options.maxNesting;
        while (state2.pos < end) {
          const prevPos = state2.pos;
          let ok = false;
          if (state2.level < maxNesting) for (let i = 0; i < len; i++) {
            ok = rules[i](state2, false);
            if (ok) {
              if (prevPos >= state2.pos) throw new Error("inline rule didn't increment state.pos");
              break;
            }
          }
          if (ok) {
            if (state2.pos >= end) break;
            continue;
          }
          state2.pending += state2.src[state2.pos++];
        }
        if (state2.pending) state2.pushPending();
      };
      ParserInline.prototype.parse = function(str, md2, env, outTokens) {
        const state2 = new this.State(str, md2, env, outTokens);
        this.tokenize(state2);
        const rules = this.ruler2.getRules("");
        const len = rules.length;
        for (let i = 0; i < len; i++) rules[i](state2);
      };
      ParserInline.prototype.State = StateInline;
      var config = {
        default: {
          options: {
            html: false,
            xhtmlOut: false,
            breaks: false,
            langPrefix: "language-",
            linkify: false,
            typographer: false,
            quotes: "\u201C\u201D\u2018\u2019",
            highlight: null,
            maxNesting: 100
          },
          components: {
            core: {},
            block: {},
            inline: {}
          }
        },
        zero: {
          options: {
            html: false,
            xhtmlOut: false,
            breaks: false,
            langPrefix: "language-",
            linkify: false,
            typographer: false,
            quotes: "\u201C\u201D\u2018\u2019",
            highlight: null,
            maxNesting: 20
          },
          components: {
            core: { rules: [
              "normalize",
              "block",
              "inline",
              "text_join"
            ] },
            block: { rules: ["paragraph"] },
            inline: {
              rules: ["text"],
              rules2: ["balance_pairs", "fragments_join"]
            }
          }
        },
        commonmark: {
          options: {
            html: true,
            xhtmlOut: true,
            breaks: false,
            langPrefix: "language-",
            linkify: false,
            typographer: false,
            quotes: "\u201C\u201D\u2018\u2019",
            highlight: null,
            maxNesting: 20
          },
          components: {
            core: { rules: [
              "normalize",
              "block",
              "inline",
              "text_join"
            ] },
            block: { rules: [
              "blockquote",
              "code",
              "fence",
              "heading",
              "hr",
              "html_block",
              "lheading",
              "list",
              "reference",
              "paragraph"
            ] },
            inline: {
              rules: [
                "autolink",
                "backticks",
                "emphasis",
                "entity",
                "escape",
                "html_inline",
                "image",
                "link",
                "newline",
                "text"
              ],
              rules2: [
                "balance_pairs",
                "emphasis",
                "fragments_join"
              ]
            }
          }
        }
      };
      var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
      var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
      function validateLink(url) {
        const str = url.trim().toLowerCase();
        return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
      }
      var RECODE_HOSTNAME_FOR = [
        "http:",
        "https:",
        "mailto:"
      ];
      function normalizeLink(url) {
        const parsed = mdurl.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
            parsed.hostname = punycode_js.default.toASCII(parsed.hostname);
          } catch (er) {
          }
        }
        return mdurl.encode(mdurl.format(parsed));
      }
      function normalizeLinkText(url) {
        const parsed = mdurl.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) try {
            parsed.hostname = punycode_js.default.toUnicode(parsed.hostname);
          } catch (er) {
          }
        }
        return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + "%");
      }
      function MarkdownIt2(presetName, options) {
        if (!(this instanceof MarkdownIt2)) return new MarkdownIt2(presetName, options);
        if (!options) {
          if (!isString(presetName)) {
            options = presetName || {};
            presetName = "default";
          }
        }
        this.inline = new ParserInline();
        this.block = new ParserBlock();
        this.core = new Core();
        this.renderer = new Renderer();
        this.linkify = new linkify_it.default();
        this.validateLink = validateLink;
        this.normalizeLink = normalizeLink;
        this.normalizeLinkText = normalizeLinkText;
        this.utils = utils_exports;
        this.helpers = assign({}, helpers_exports);
        this.options = {};
        this.configure(presetName);
        if (options) this.set(options);
      }
      MarkdownIt2.prototype.set = function(options) {
        assign(this.options, options);
        return this;
      };
      MarkdownIt2.prototype.configure = function(presets) {
        const self = this;
        if (isString(presets)) {
          const presetName = presets;
          presets = config[presetName];
          if (!presets) throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
        }
        if (!presets) throw new Error("Wrong `markdown-it` preset, can't be empty");
        if (presets.options) self.set(presets.options);
        if (presets.components) Object.keys(presets.components).forEach(function(name) {
          if (presets.components[name].rules) self[name].ruler.enableOnly(presets.components[name].rules);
          if (presets.components[name].rules2) self[name].ruler2.enableOnly(presets.components[name].rules2);
        });
        return this;
      };
      MarkdownIt2.prototype.enable = function(list3, ignoreInvalid) {
        let result = [];
        if (!Array.isArray(list3)) list3 = [list3];
        [
          "core",
          "block",
          "inline"
        ].forEach(function(chain) {
          result = result.concat(this[chain].ruler.enable(list3, true));
        }, this);
        result = result.concat(this.inline.ruler2.enable(list3, true));
        const missed = list3.filter(function(name) {
          return result.indexOf(name) < 0;
        });
        if (missed.length && !ignoreInvalid) throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + missed);
        return this;
      };
      MarkdownIt2.prototype.disable = function(list3, ignoreInvalid) {
        let result = [];
        if (!Array.isArray(list3)) list3 = [list3];
        [
          "core",
          "block",
          "inline"
        ].forEach(function(chain) {
          result = result.concat(this[chain].ruler.disable(list3, true));
        }, this);
        result = result.concat(this.inline.ruler2.disable(list3, true));
        const missed = list3.filter(function(name) {
          return result.indexOf(name) < 0;
        });
        if (missed.length && !ignoreInvalid) throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + missed);
        return this;
      };
      MarkdownIt2.prototype.use = function(plugin) {
        const args = [this].concat(Array.prototype.slice.call(arguments, 1));
        plugin.apply(plugin, args);
        return this;
      };
      MarkdownIt2.prototype.parse = function(src, env) {
        if (typeof src !== "string") throw new Error("Input data should be a String");
        const state2 = new this.core.State(src, this, env);
        this.core.process(state2);
        return state2.tokens;
      };
      MarkdownIt2.prototype.render = function(src, env) {
        env = env || {};
        return this.renderer.render(this.parse(src, env), this.options, env);
      };
      MarkdownIt2.prototype.parseInline = function(src, env) {
        const state2 = new this.core.State(src, this, env);
        state2.inlineMode = true;
        this.core.process(state2);
        return state2.tokens;
      };
      MarkdownIt2.prototype.renderInline = function(src, env) {
        env = env || {};
        return this.renderer.render(this.parseInline(src, env), this.options, env);
      };
      module.exports = MarkdownIt2;
    }
  });

  // extension/webview/main.js
  var MarkdownIt = require_index_cjs4();
  var vscode = acquireVsCodeApi();
  var md = new MarkdownIt({ html: false, linkify: true, breaks: false });
  var state = {
    agents: [],
    projects: [],
    conversations: [],
    selectedConversationId: null,
    selectedProjectId: null,
    tasks: [],
    health: null,
    options: { modelId: null, effort: "", approvalMode: "default" },
    busy: false,
    connectionError: null,
    // Composer `/` and `@` assist popup.
    assistItems: [],
    assistIndex: 0,
    assistRange: null,
    mentionRequestId: null,
    mentionFiles: []
  };
  var ACTIVE_STATUSES = /* @__PURE__ */ new Set([
    "queued",
    "interpreting",
    "awaiting_confirmation",
    "resolving_session",
    "running_agent",
    "testing"
  ]);
  var STATUS_MESSAGES = {
    queued: "\uB300\uAE30 \uC911\uC785\uB2C8\uB2E4.",
    interpreting: "\uC694\uCCAD\uC744 \uD574\uC11D\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
    awaiting_confirmation: "\uD655\uC778\uC744 \uAE30\uB2E4\uB9AC\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
    resolving_session: "\uD504\uB85C\uC81D\uD2B8 \uC138\uC158\uC744 \uCC3E\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
    running_agent: "\uC694\uCCAD\uC744 \uCC98\uB9AC\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
    testing: "\uD14C\uC2A4\uD2B8\uB97C \uC2E4\uD589\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4."
  };
  var AGENT_NAMES = { "claude-code": "Claude Code", "codex-cli": "Codex", "gemini-cli": "Gemini" };
  var SLASH_COMMANDS = [
    { value: "/clear", description: "\uC785\uB825 \uBE44\uC6B0\uAE30", action: "clear" },
    { value: "/explain", description: "\uC120\uD0DD\uD55C \uCF54\uB4DC\uB098 \uD504\uB85C\uC81D\uD2B8 \uC124\uBA85", prompt: "\uB2E4\uC74C\uC744 \uC774\uD574\uD558\uAE30 \uC27D\uAC8C \uC124\uBA85\uD574\uC918: " },
    { value: "/fix", description: "\uBB38\uC81C\uB97C \uC870\uC0AC\uD558\uACE0 \uC218\uC815", prompt: "\uB2E4\uC74C \uBB38\uC81C\uC758 \uC6D0\uC778\uC744 \uC870\uC0AC\uD558\uACE0 \uC218\uC815\uD574\uC918: " },
    { value: "/test", description: "\uAD00\uB828 \uD14C\uC2A4\uD2B8 \uC791\uC131 \uB610\uB294 \uC2E4\uD589", prompt: "\uB2E4\uC74C \uB300\uC0C1\uC758 \uAD00\uB828 \uD14C\uC2A4\uD2B8\uB97C \uC791\uC131\uD558\uAC70\uB098 \uC2E4\uD589\uD574\uC918: " },
    { value: "/review", description: "\uD604\uC7AC \uBCC0\uACBD\uC0AC\uD56D \uAC80\uD1A0", prompt: "\uD604\uC7AC \uD504\uB85C\uC81D\uD2B8\uC758 \uBCC0\uACBD\uC0AC\uD56D\uC744 \uAC80\uD1A0\uD574\uC918. " }
  ];
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function codicon(name) {
    return el("span", `codicon codicon-${name}`);
  }
  function vibexMark() {
    const image = document.createElement("img");
    image.className = "vibex-welcome-logo";
    image.src = document.body.dataset.vibexIcon || "";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    return image;
  }
  function renderMarkdown(text) {
    const host = el("div", "rendered-markdown");
    host.innerHTML = md.render(String(text || ""));
    for (const anchor of host.querySelectorAll("a[href]")) {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        post({ type: "openLink", href: anchor.getAttribute("href") });
      });
    }
    return host;
  }
  function post(message) {
    vscode.postMessage(message);
  }
  function syncWorkbenchClasses() {
    const body = document.body;
    const themeMap = [
      ["vscode-high-contrast-light", "hc-light"],
      ["vscode-high-contrast", "hc-black"],
      ["vscode-light", "vs"],
      ["vscode-dark", "vs-dark"]
    ];
    let desired = "vs-dark";
    for (const [webviewClass, workbenchClass] of themeMap) {
      if (body.classList.contains(webviewClass)) {
        desired = workbenchClass;
        break;
      }
    }
    if (body.classList.contains("monaco-workbench") && body.classList.contains(desired)) {
      return;
    }
    body.classList.add("monaco-workbench");
    for (const [, workbenchClass] of themeMap) {
      if (workbenchClass !== desired) body.classList.remove(workbenchClass);
    }
    body.classList.add(desired);
  }
  syncWorkbenchClasses();
  new MutationObserver(syncWorkbenchClasses).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });
  var root = el("div", "interactive-session");
  document.body.appendChild(root);
  var conversationHeader = el("div", "vibex-conversation-header");
  var conversationTitle = el("div", "vibex-conversation-title", "\uC0C8 \uB300\uD654");
  conversationHeader.append(conversationTitle);
  var list = el("div", "vibex-list");
  root.append(conversationHeader, list);
  function toolbar(extraClasses) {
    const host = el("div", `monaco-toolbar ${extraClasses}`);
    const bar = el("div", "monaco-action-bar");
    const items = el("ul", "actions-container");
    bar.append(items);
    host.append(bar);
    return { host, items };
  }
  var inputPart = el("div", "interactive-input-part");
  var inputAndToolbar = el("div", "interactive-input-and-side-toolbar");
  var inputContainer = el("div", "chat-input-container");
  var attachmentsContainer = el("div", "chat-attachments-container");
  attachmentsContainer.style.display = "none";
  var attachedContext = el("div", "chat-attached-context");
  attachmentsContainer.append(attachedContext);
  var editorContainer = el("div", "chat-editor-container");
  var editorHost = el("div", "interactive-input-editor");
  var inputMirror = el("div", "vibex-input-mirror");
  var textarea = document.createElement("textarea");
  textarea.className = "vibex-input";
  textarea.rows = 1;
  editorHost.append(inputMirror, textarea);
  editorContainer.append(editorHost);
  textarea.addEventListener("scroll", () => {
    inputMirror.scrollTop = textarea.scrollTop;
  });
  var toolbars = el("div", "chat-input-toolbars");
  var inputToolbar = toolbar("responsive responsive-last chat-input-toolbar");
  var executeToolbar = toolbar("chat-execute-toolbar");
  var executeItems = executeToolbar.items;
  toolbars.append(inputToolbar.host, executeToolbar.host);
  inputContainer.append(attachmentsContainer, editorContainer, toolbars);
  inputAndToolbar.append(inputContainer);
  inputPart.append(inputAndToolbar);
  var secondaryToolbar = el("div", "chat-secondary-toolbar");
  var contextUsage = el("div", "chat-context-usage-container");
  var statusContainer = el("div", "chat-input-status-container has-no-actions");
  statusContainer.style.display = "none";
  var secondaryInputToolbar = toolbar("responsive responsive-all chat-secondary-input-toolbar");
  secondaryToolbar.append(contextUsage, statusContainer, secondaryInputToolbar.host);
  inputPart.append(secondaryToolbar);
  root.append(inputPart);
  textarea.addEventListener("focus", () => inputContainer.classList.add("focused"));
  textarea.addEventListener("blur", () => inputContainer.classList.remove("focused"));
  textarea.addEventListener("input", renderInputDecorations);
  textarea.addEventListener("input", autoGrow);
  textarea.addEventListener("keydown", (event) => {
    if (handleAssistKey(event)) return;
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit();
    }
  });
  var knownFiles = /* @__PURE__ */ new Map();
  function rememberFile(file) {
    if (file?.relativePath) knownFiles.set(file.relativePath, file);
  }
  function mentionTokensInText() {
    const found = [];
    for (const match of textarea.value.matchAll(/(^|\s)@([^\s]+)/g)) {
      const path = match[2].replace(/[.,!?:;]+$/, "");
      if (knownFiles.has(path)) found.push(path);
    }
    return [...new Set(found)];
  }
  function renderInputDecorations() {
    const value = textarea.value;
    inputMirror.replaceChildren();
    let rest = value;
    const slash = value.match(/^\/[\w-]+/);
    if (slash && SLASH_COMMANDS.some((command) => command.value === slash[0])) {
      inputMirror.append(el("span", "vibex-token", slash[0]));
      rest = value.slice(slash[0].length);
    }
    let cursor = 0;
    for (const match of rest.matchAll(/(^|\s)@([^\s]+)/g)) {
      const clean = match[2].replace(/[.,!?:;]+$/, "");
      if (!knownFiles.has(clean)) continue;
      const tokenStart = match.index + match[1].length;
      const tokenEnd = tokenStart + 1 + clean.length;
      inputMirror.append(document.createTextNode(rest.slice(cursor, tokenStart)));
      inputMirror.append(el("span", "vibex-token", `@${clean}`));
      cursor = tokenEnd;
    }
    inputMirror.append(document.createTextNode(rest.slice(cursor)));
    inputMirror.scrollTop = textarea.scrollTop;
    renderAttachmentPills();
  }
  function renderAttachmentPills() {
    const tokens = mentionTokensInText();
    attachedContext.replaceChildren();
    attachmentsContainer.style.display = tokens.length ? "" : "none";
    for (const path of tokens) {
      const file = knownFiles.get(path);
      const pill = el("div", "chat-attached-context-attachment");
      const label = el("span", "monaco-icon-label");
      label.append(codicon("file"), el("span", "vibex-pill-name", file.name || path));
      const remove = el("a", "vibex-pill-remove");
      remove.title = "\uCCA8\uBD80 \uD574\uC81C";
      remove.append(codicon("close"));
      remove.addEventListener("click", () => {
        const escaped = path.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(^|\\s)@${escaped}(?=\\s|$)\\s?`, "g");
        textarea.value = textarea.value.replace(pattern, "$1").replace(/  +/g, " ").trimStart();
        refreshComposer();
        textarea.focus();
      });
      pill.append(label, remove);
      attachedContext.append(pill);
    }
  }
  function refreshComposer() {
    autoGrow();
    syncSendEnabled();
    renderInputDecorations();
  }
  function autoGrow() {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
    if (assistPopup.style.display !== "none") positionAssist();
  }
  var assistPopup = el("div", "vibex-menu vibex-assist");
  assistPopup.style.display = "none";
  document.body.append(assistPopup);
  function positionAssist() {
    const anchor = inputContainer.getBoundingClientRect();
    assistPopup.style.left = `${anchor.left}px`;
    assistPopup.style.width = `${anchor.width}px`;
    const height = assistPopup.offsetHeight;
    const above = anchor.top - height - 4;
    assistPopup.style.top = `${above >= 4 ? above : anchor.bottom + 4}px`;
  }
  function assistTokenAtCaret() {
    const caret = textarea.selectionStart ?? textarea.value.length;
    const match = textarea.value.slice(0, caret).match(/(^|\s)([/@][^\s]*)$/u);
    if (!match) return null;
    const token = match[2];
    return { token, start: caret - token.length, end: caret };
  }
  function closeAssist() {
    state.assistItems = [];
    state.assistRange = null;
    assistPopup.style.display = "none";
    assistPopup.replaceChildren();
  }
  function updateAssist() {
    const range = assistTokenAtCaret();
    if (!range) {
      closeAssist();
      return;
    }
    state.assistRange = range;
    state.assistIndex = 0;
    if (range.token.startsWith("/")) {
      const query = range.token.toLocaleLowerCase();
      state.assistItems = SLASH_COMMANDS.filter((command) => command.value.startsWith(query)).map((command) => ({ kind: "command", label: command.value, ...command }));
      renderAssist();
      return;
    }
    state.assistItems = mentionItems(range.token.slice(1));
    renderAssist();
    state.mentionRequestId = `mention-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    post({ type: "searchMentions", requestId: state.mentionRequestId, query: range.token.slice(1) });
  }
  function mentionItems(query) {
    const needle = String(query || "").toLocaleLowerCase();
    return state.mentionFiles.filter((file) => !needle || file.relativePath.toLocaleLowerCase().includes(needle)).map((file) => ({ kind: "file", label: file.name, description: file.relativePath, file }));
  }
  function renderAssist() {
    if (!state.assistRange || !state.assistItems.length) {
      assistPopup.style.display = "none";
      assistPopup.replaceChildren();
      return;
    }
    if (state.assistIndex >= state.assistItems.length) state.assistIndex = 0;
    assistPopup.replaceChildren(
      ...state.assistItems.map((item, index) => {
        const row = el("div", `vibex-menu-item${index === state.assistIndex ? " checked" : ""}`);
        row.append(
          codicon(item.kind === "file" ? "file" : "terminal"),
          el("span", "vibex-assist-label", item.label),
          el("span", "vibex-assist-description", item.description || "")
        );
        row.addEventListener("mousedown", (event) => event.preventDefault());
        row.addEventListener("click", () => applyAssist(index));
        return row;
      })
    );
    assistPopup.style.display = "";
    positionAssist();
  }
  function replaceAssistToken(replacement) {
    const range = state.assistRange || assistTokenAtCaret();
    if (!range) return;
    const value = textarea.value;
    textarea.value = value.slice(0, range.start) + replacement + value.slice(range.end);
    const caret = range.start + replacement.length;
    textarea.setSelectionRange(caret, caret);
    autoGrow();
    syncSendEnabled();
    renderInputDecorations();
  }
  function applyAssist(index) {
    const item = state.assistItems[index];
    if (!item) return;
    if (item.kind === "command" && item.action === "clear") {
      textarea.value = "";
      refreshComposer();
    } else if (item.kind === "command") {
      replaceAssistToken(item.prompt || `${item.value} `);
    } else {
      rememberFile(item.file);
      replaceAssistToken(`@${item.file.relativePath} `);
    }
    closeAssist();
    textarea.focus();
  }
  function handleAssistKey(event) {
    if (assistPopup.style.display === "none" || !state.assistItems.length) return false;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const count = state.assistItems.length;
      state.assistIndex = (state.assistIndex + delta + count) % count;
      renderAssist();
      return true;
    }
    if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      applyAssist(state.assistIndex);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeAssist();
      return true;
    }
    return false;
  }
  textarea.addEventListener("input", updateAssist);
  textarea.addEventListener("click", updateAssist);
  textarea.addEventListener("blur", () => setTimeout(closeAssist, 120));
  window.addEventListener("resize", () => {
    if (assistPopup.style.display !== "none") positionAssist();
  });
  var openMenu = null;
  function closeMenu() {
    if (openMenu) {
      openMenu.remove();
      openMenu = null;
    }
  }
  document.addEventListener("click", (event) => {
    if (openMenu && !openMenu.contains(event.target)) closeMenu();
  }, true);
  function attachMenu(host, items, onPick) {
    return (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (openMenu && openMenu.dataset.owner === host.dataset.pickerId) {
        closeMenu();
        return;
      }
      closeMenu();
      const menu = el("div", "vibex-menu");
      for (const item of items()) {
        if (item.group) {
          menu.append(el("div", "vibex-menu-group", item.group));
          continue;
        }
        const row = el("div", `vibex-menu-item${item.checked ? " checked" : ""}`);
        row.append(item.checked ? codicon("check") : el("span", "codicon"));
        row.append(el("span", void 0, item.label));
        row.addEventListener("click", () => {
          closeMenu();
          onPick(item.id);
        });
        menu.append(row);
      }
      host.dataset.pickerId ||= `picker-${++pickerIdSeq}`;
      menu.dataset.owner = host.dataset.pickerId;
      document.body.append(menu);
      const anchor = host.getBoundingClientRect();
      const height = menu.offsetHeight;
      const top = anchor.top - height - 4;
      menu.style.left = `${Math.max(4, Math.min(anchor.left, window.innerWidth - menu.offsetWidth - 4))}px`;
      menu.style.top = `${top >= 4 ? top : anchor.bottom + 4}px`;
      openMenu = menu;
    };
  }
  var pickerIdSeq = 0;
  function modelPickerPill({ items, onPick }) {
    const host = el("li", "action-item chat-input-picker-item vibex-picker-host");
    const split = el("div", "action-label model-picker-split");
    const section = el("a", "model-picker-section model-picker-name");
    section.append(codicon("chat-model-provider-generic"));
    const labelSpan = el("span", "chat-input-picker-label", "\uAE30\uBCF8 \uBAA8\uB378");
    section.append(labelSpan);
    split.append(section);
    host.append(split);
    section.addEventListener("click", attachMenu(host, items, onPick));
    return { host, labelSpan };
  }
  function optionPickerPill({ label, items, onPick }) {
    const item = el("div", "action-item chat-sessionPicker-item vibex-picker-host");
    const dropdown = el("div", "monaco-dropdown");
    const dropdownLabel = el("div", "dropdown-label");
    const anchor = el("a", "action-label chat-session-option-picker");
    const labelSpan = el("span", "chat-session-option-label", label);
    anchor.append(labelSpan);
    dropdownLabel.append(anchor);
    dropdown.append(dropdownLabel);
    item.append(dropdown);
    anchor.addEventListener("click", attachMenu(item, items, onPick));
    return { host: item, labelSpan };
  }
  var modelPicker = modelPickerPill({
    items: modelItems,
    onPick: (id) => {
      state.options.modelId = id;
      post({ type: "setOption", id: "model", value: id });
      renderPickers();
    }
  });
  var effortPicker = optionPickerPill({
    label: "\uAE30\uBCF8 \uCD94\uB860",
    items: effortItems,
    onPick: (id) => {
      state.options.effort = id === "__default__" ? "" : id;
      post({ type: "setOption", id: "effort", value: state.options.effort });
      renderPickers();
    }
  });
  var approvalPicker = optionPickerPill({
    label: "\uAE30\uBCF8 \uC2B9\uC778",
    items: approvalItems,
    onPick: (id) => {
      state.options.approvalMode = id;
      post({ type: "setOption", id: "approvalMode", value: id });
      renderPickers();
    }
  });
  var attachItem = el("li", "action-item menu-entry");
  var attachButton = el("a", "action-label codicon codicon-add-compact");
  attachButton.title = "\uD504\uB85C\uC81D\uD2B8 \uD30C\uC77C \uCCA8\uBD80";
  attachItem.append(attachButton);
  attachButton.addEventListener("click", () => post({ type: "pickAttachment" }));
  inputToolbar.items.append(attachItem, modelPicker.host);
  var optionContainer = el("li", "action-item chat-sessionPicker-container");
  optionContainer.append(effortPicker.host, approvalPicker.host);
  secondaryInputToolbar.items.append(optionContainer);
  var sendItem = el("li", "action-item menu-entry chat-submit-button");
  var sendButton = el("a", "action-label codicon codicon-arrow-up-compact");
  sendButton.title = "\uBCF4\uB0B4\uAE30 (Enter)";
  sendItem.append(sendButton);
  executeItems.append(sendItem);
  sendButton.addEventListener("click", submit);
  var stopItem = el("li", "action-item menu-entry chat-stop-button");
  var stopButton = el("a", "action-label codicon codicon-stop-circle");
  stopButton.title = "\uC0DD\uC131 \uC911\uC9C0";
  stopItem.append(stopButton);
  executeItems.append(stopItem);
  stopButton.addEventListener("click", () => {
    if (!state.busy) return;
    stopItem.classList.add("disabled");
    stopButton.classList.add("disabled");
    post({ type: "cancel" });
  });
  function syncSendEnabled() {
    inputContainer.classList.toggle("working", state.busy);
    sendItem.style.display = state.busy ? "none" : "";
    stopItem.style.display = state.busy ? "" : "none";
    if (!state.busy) {
      stopItem.classList.remove("disabled");
      stopButton.classList.remove("disabled");
    }
    const disabled = !textarea.value.trim() || state.busy;
    sendItem.classList.toggle("disabled", disabled);
    sendButton.classList.toggle("disabled", disabled);
  }
  textarea.addEventListener("input", syncSendEnabled);
  syncSendEnabled();
  function selectedAgent() {
    const [agentId] = String(state.options.modelId || "").split("::");
    return state.agents.find((agent) => agent.agentId === agentId);
  }
  function modelItems() {
    const items = [];
    for (const agent of state.agents) {
      if (!agent.usable) continue;
      items.push({ group: agent.displayName });
      const models = agent.models?.length ? agent.models : [{ value: "", label: agent.displayName }];
      for (const model of models) {
        const id = `${agent.agentId}::${model.value || ""}`;
        items.push({ id, label: model.label, checked: state.options.modelId === id });
      }
    }
    return items;
  }
  function effortItems() {
    const agent = selectedAgent();
    const items = [{ id: "__default__", label: "\uAE30\uBCF8 \uCD94\uB860", checked: !state.options.effort }];
    for (const effort of agent?.efforts || []) {
      if (!effort.value) continue;
      items.push({ id: effort.value, label: effort.label, checked: state.options.effort === effort.value });
    }
    return items;
  }
  function approvalItems() {
    return [
      { id: "default", label: "\uAE30\uBCF8 \uC2B9\uC778" },
      { id: "bypass", label: "\uC2B9\uC778 \uC5C6\uC774 \uC9C4\uD589" },
      { id: "autopilot", label: "\uC624\uD1A0\uD30C\uC77C\uB7FF" }
    ].map((item) => ({ ...item, checked: state.options.approvalMode === item.id }));
  }
  function renderPickers() {
    const [agentId, model] = String(state.options.modelId || "").split("::");
    const agent = state.agents.find((candidate) => candidate.agentId === agentId);
    const modelLabel = agent ? agent.models.find((candidate) => candidate.value === (model || ""))?.label || agent.displayName : "\uAE30\uBCF8 \uBAA8\uB378";
    modelPicker.labelSpan.textContent = modelLabel;
    const effortLabel = state.options.effort ? selectedAgent()?.efforts.find((candidate) => candidate.value === state.options.effort)?.label || state.options.effort : "\uAE30\uBCF8 \uCD94\uB860";
    effortPicker.labelSpan.textContent = effortLabel;
    approvalPicker.labelSpan.textContent = { default: "\uAE30\uBCF8 \uC2B9\uC778", bypass: "\uC2B9\uC778 \uC5C6\uC774 \uC9C4\uD589", autopilot: "\uC624\uD1A0\uD30C\uC77C\uB7FF" }[state.options.approvalMode] || "\uAE30\uBCF8 \uC2B9\uC778";
  }
  function renderConversationTitle() {
    const selected = state.conversations.find(
      (conversation) => conversation.conversationId === state.selectedConversationId
    );
    const title = String(selected?.title || "\uC0C8 \uB300\uD654").trim() || "\uC0C8 \uB300\uD654";
    conversationTitle.textContent = title;
    conversationTitle.title = title;
  }
  function formatTokens(count) {
    const value = Number(count) || 0;
    if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}k`;
    return String(value);
  }
  function metaLine(task) {
    const parts = [];
    const agent = AGENT_NAMES[task.agentId] || task.agentId;
    if (agent) parts.push(task.agentModel ? `${agent} \xB7 ${task.agentModel}` : agent);
    const usage = task.usage;
    if (usage && (usage.inputTokens || usage.outputTokens || usage.totalTokens)) {
      const total = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
      parts.push(`${formatTokens(usage.inputTokens)}\u2191 ${formatTokens(usage.outputTokens)}\u2193 (\uCD1D ${formatTokens(total)} \uD1A0\uD070)`);
    }
    if (usage?.costUsd != null) parts.push(`$${Number(usage.costUsd).toFixed(4)}`);
    const time = task.completedAt || task.updatedAt;
    if (time) {
      const at = new Date(time);
      if (!Number.isNaN(at.getTime())) {
        parts.push(at.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }));
      }
    }
    return parts.join(" \xB7 ");
  }
  function attachmentSource(attachment) {
    return String(attachment?.dataUrl || "");
  }
  function requestRow(task) {
    const row = el("div", "interactive-item-container interactive-request");
    const value = el("div", "value");
    const prompt = String(task.agentPrompt || task.userMessage || "").trim();
    if (prompt) value.append(renderMarkdown(prompt));
    const images = (task.attachments || []).filter((attachment) => attachmentSource(attachment));
    if (images.length) {
      const gallery = el("div", "vibex-request-images");
      for (const attachment of images) {
        const link = el("button", "vibex-request-image");
        link.type = "button";
        link.title = attachment.name || "\uCCA8\uBD80 \uC774\uBBF8\uC9C0";
        const image = document.createElement("img");
        image.src = attachmentSource(attachment);
        image.alt = attachment.name || "\uCCA8\uBD80 \uC774\uBBF8\uC9C0";
        link.append(image);
        link.addEventListener("click", () => window.open(image.src, "_blank"));
        gallery.append(link);
      }
      value.append(gallery);
    }
    row.append(value);
    return row;
  }
  function hiddenWarning(text) {
    const value = String(text || "");
    return /실행 전 미커밋 변경사항이 \d+건 있었습니다/.test(value) || /기존 미커밋 (?:파일과 )?변경사항은 그대로 보존했습니다/.test(value);
  }
  function hiddenSkippedTest(test) {
    return String(test?.status || "") === "skipped" && /사용자가 테스트(?: 실행)?을 허용하지 않아/.test(String(test?.summary || ""));
  }
  function responseRow(task, { isLast }) {
    const row = el("div", "interactive-item-container interactive-response");
    if (isLast) row.classList.add("chat-most-recent-response");
    const value = el("div", "value");
    row.append(value);
    const active = ACTIVE_STATUSES.has(task.status);
    if (active) row.classList.add("chat-response-loading");
    const reasoning = (task.activityItems || []).filter((item) => item.type === "reasoning" && (item.text || "").trim());
    if (reasoning.length) {
      const box = el("div", "chat-thinking-box");
      const listHost = el("div", "chat-used-context-list chat-thinking-items");
      for (const item of reasoning) {
        const entry = el("div", "chat-thinking-item markdown-content");
        entry.append(renderMarkdown(item.text));
        listHost.append(entry);
      }
      box.append(listHost);
      value.append(box);
    }
    for (const item of task.activityItems || []) {
      if (item.type === "reasoning") continue;
      const label = el("div", "chat-used-context-label");
      const kind = item.type;
      let text = "";
      if (kind === "commandExecution" || kind === "command") {
        const command = Array.isArray(item.data?.command) ? item.data.command.join(" ") : item.data?.command;
        text = command ? String(command) : "\uBA85\uB839\uC744 \uC2E4\uD589\uD588\uC2B5\uB2C8\uB2E4";
        label.append(codicon("terminal"));
      } else if (kind === "fileChange") {
        const paths = (item.data?.changes || []).map((change) => change?.path).filter(Boolean);
        text = paths.length === 1 ? paths[0] : `${paths.length}\uAC1C \uD30C\uC77C\uC744 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4`;
        label.append(codicon("edit"));
      } else if (kind === "webSearch") {
        text = item.text || "\uC6F9\uC744 \uAC80\uC0C9\uD588\uC2B5\uB2C8\uB2E4";
        label.append(codicon("search"));
      } else {
        text = item.text || item.data?.tool || "\uC791\uC5C5\uC744 \uC9C4\uD589\uD588\uC2B5\uB2C8\uB2E4";
        label.append(codicon("tools"));
      }
      const code = el("code", void 0, text);
      label.append(code);
      value.append(label);
    }
    for (const clarification of task.clarificationTurns || []) {
      const reply2 = (clarification.assistantReply || clarification.question?.text || "").trim();
      if (reply2) value.append(renderMarkdown(reply2));
      const answer = (clarification.answer || "").trim();
      if (answer) {
        const answerRow = el("div", "interactive-item-container interactive-request");
        const answerValue = el("div", "value");
        answerValue.append(renderMarkdown(answer));
        answerRow.append(answerValue);
        value.append(answerRow);
      }
    }
    const reply = (task.agentReply || "").trim();
    if (reply) value.append(renderMarkdown(reply));
    if (active) {
      const progress = el("div", "chat-used-context-label");
      const spinner = el("span", "vibex-response-spinner");
      spinner.setAttribute("aria-hidden", "true");
      progress.append(spinner);
      progress.append(el("span", void 0, ` ${STATUS_MESSAGES[task.status] || "\uC9C4\uD589 \uC911\uC785\uB2C8\uB2E4."}`));
      value.append(progress);
    }
    for (const warning of task.warnings || []) {
      if (hiddenWarning(warning)) continue;
      const widget = el("div", "chat-notification-widget");
      widget.append(codicon("warning"), el("span", void 0, String(warning)));
      value.append(widget);
    }
    for (const test of task.testResults || []) {
      if (hiddenSkippedTest(test)) continue;
      const label = el("div", "chat-used-context-label");
      label.append(codicon(test.status === "passed" ? "check" : test.status === "failed" ? "error" : "circle-slash"));
      label.append(el("code", void 0, ` ${test.command}${test.summary ? ` \u2014 ${test.summary}` : ""}`));
      value.append(label);
    }
    if (task.error) {
      const widget = el("div", "chat-notification-widget");
      widget.append(codicon("error"), el("span", void 0, String(task.error)));
      value.append(widget);
    }
    if (!active) {
      const footer = el("div", "chat-used-context-label vibex-meta");
      const actions = [];
      if (task.reviewAvailable) {
        const review = el("a", void 0, "\uBCC0\uACBD \uC0AC\uD56D \uAC80\uD1A0");
        review.href = "#";
        review.addEventListener("click", (event) => {
          event.preventDefault();
          post({ type: "openReview", taskId: task.taskId });
        });
        actions.push(review);
      }
      const meta = metaLine(task);
      if (meta) footer.append(el("span", void 0, meta));
      if (actions.length && meta) footer.append(el("span", void 0, " \xB7 "));
      for (const action of actions) footer.append(action);
      if (footer.childNodes.length) value.append(footer);
    }
    return row;
  }
  function welcomeView() {
    const container = el("div", "chat-welcome-view-container");
    const host = el("div", "chat-welcome-view");
    const iconHost = el("div", "chat-welcome-view-icon large-icon");
    iconHost.append(vibexMark());
    const titleHost = el("div", "chat-welcome-view-title", "Vibex");
    const message = el("div", "chat-welcome-view-message");
    message.append(renderMarkdown("\uC5B8\uC81C \uC5B4\uB514\uC11C\uB4E0 \uC544\uC774\uB514\uC5B4\uB97C \uAD6C\uC0C1\uD558\uACE0 \uC2E4\uD604\uD574\uBCF4\uC138\uC694."));
    host.append(iconHost, titleHost, message);
    container.append(host);
    return container;
  }
  function renderTranscript() {
    const stickToBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    list.replaceChildren();
    if (state.connectionError) {
      const widget = el("div", "chat-notification-widget");
      widget.append(codicon("debug-disconnect"), el("span", void 0, state.connectionError));
      list.append(widget);
    }
    if (!state.tasks.length) {
      list.append(welcomeView());
      return;
    }
    state.tasks.forEach((task, index) => {
      if (task.userMessage || task.agentPrompt || task.attachments?.length) list.append(requestRow(task));
      list.append(responseRow(task, { isLast: index === state.tasks.length - 1 }));
    });
    if (stickToBottom) list.scrollTop = list.scrollHeight;
  }
  function submit() {
    const text = textarea.value.trim();
    if (!text || state.busy) return;
    closeAssist();
    textarea.value = "";
    refreshComposer();
    post({
      type: "send",
      text,
      modelId: state.options.modelId,
      effort: state.options.effort,
      approvalMode: state.options.approvalMode
    });
  }
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "state": {
        Object.assign(state, {
          agents: message.agents ?? state.agents,
          projects: message.projects ?? state.projects,
          conversations: message.conversations ?? state.conversations,
          selectedConversationId: message.selectedConversationId ?? state.selectedConversationId,
          selectedProjectId: message.selectedProjectId ?? state.selectedProjectId,
          tasks: message.tasks ?? state.tasks,
          health: message.health ?? state.health,
          busy: Boolean(message.busy),
          connectionError: message.connectionError ?? null
        });
        if (message.options) Object.assign(state.options, message.options);
        if (!state.options.modelId) {
          const first = state.agents.find((agent) => agent.usable);
          if (first) state.options.modelId = `${first.agentId}::${first.models?.[0]?.value || ""}`;
        }
        renderPickers();
        renderConversationTitle();
        renderTranscript();
        syncSendEnabled();
        break;
      }
      case "mentionResults": {
        if (message.requestId !== state.mentionRequestId) break;
        state.mentionFiles = Array.isArray(message.files) ? message.files : [];
        for (const file of state.mentionFiles) rememberFile(file);
        const range = assistTokenAtCaret();
        if (!range || !range.token.startsWith("@")) break;
        state.assistRange = range;
        state.assistItems = mentionItems(range.token.slice(1));
        renderAssist();
        break;
      }
      case "insertMention": {
        rememberFile({
          relativePath: message.relativePath,
          name: message.relativePath.split("/").pop()
        });
        const mention = `@${message.relativePath} `;
        const at = textarea.selectionStart ?? textarea.value.length;
        textarea.value = textarea.value.slice(0, at) + mention + textarea.value.slice(at);
        textarea.focus();
        refreshComposer();
        break;
      }
      case "taskUpdate": {
        const index = state.tasks.findIndex((task) => task.taskId === message.task.taskId);
        if (index >= 0) state.tasks[index] = message.task;
        else state.tasks.push(message.task);
        state.busy = ACTIVE_STATUSES.has(message.task.status);
        renderTranscript();
        syncSendEnabled();
        break;
      }
    }
  });
  post({ type: "ready" });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWR1cmwvYnVpbGQvaW5kZXguY2pzLmpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL3VjLm1pY3JvL2J1aWxkL2luZGV4LmNqcy5qcyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9nZW5lcmF0ZWQvZGVjb2RlLWRhdGEtaHRtbC50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9nZW5lcmF0ZWQvZGVjb2RlLWRhdGEteG1sLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2RlY29kZV9jb2RlcG9pbnQudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZGVjb2RlLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2dlbmVyYXRlZC9lbmNvZGUtaHRtbC50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9lc2NhcGUudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZW5jb2RlLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2luZGV4LnRzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL2xpbmtpZnktaXQvYnVpbGQvaW5kZXguY2pzLmpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL3B1bnljb2RlLmpzL3B1bnljb2RlLmpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vdXRpbHMubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfbGFiZWwubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfZGVzdGluYXRpb24ubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfdGl0bGUubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL2luZGV4Lm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcmVuZGVyZXIubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlci5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3Rva2VuLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9zdGF0ZV9jb3JlLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9ub3JtYWxpemUubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL2Jsb2NrLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9pbmxpbmUubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL2xpbmtpZnkubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvc21hcnRxdW90ZXMubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3RleHRfam9pbi5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9jb3JlLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svc3RhdGVfYmxvY2subWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay90YWJsZS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2NvZGUubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9mZW5jZS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2Jsb2NrcXVvdGUubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oci5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2xpc3QubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9yZWZlcmVuY2UubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vaHRtbF9ibG9ja3MubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vaHRtbF9yZS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2h0bWxfYmxvY2subWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oZWFkaW5nLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svbGhlYWRpbmcubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9wYXJhZ3JhcGgubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wYXJzZXJfYmxvY2subWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvc3RhdGVfaW5saW5lLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3RleHQubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvbGlua2lmeS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9uZXdsaW5lLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2VzY2FwZS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9iYWNrdGlja3MubWpzIiwgIi4uLy4uLy4uLy4uL3ZzY29kZS1leHRlbnNpb24vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvc3RyaWtldGhyb3VnaC5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9lbXBoYXNpcy5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9saW5rLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2ltYWdlLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2F1dG9saW5rLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2h0bWxfaW5saW5lLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2VudGl0eS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9iYWxhbmNlX3BhaXJzLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2ZyYWdtZW50c19qb2luLm1qcyIsICIuLi8uLi8uLi8uLi92c2NvZGUtZXh0ZW5zaW9uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcGFyc2VyX2lubGluZS5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvZGVmYXVsdC5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvemVyby5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvY29tbW9ubWFyay5tanMiLCAiLi4vLi4vLi4vLi4vdnNjb2RlLWV4dGVuc2lvbi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2luZGV4Lm1qcyIsICIuLi93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50LWRpc2FibGUgbm8tYml0d2lzZSAqL1xuXG5jb25zdCBkZWNvZGVDYWNoZSA9IHt9O1xuXG5mdW5jdGlvbiBnZXREZWNvZGVDYWNoZSAoZXhjbHVkZSkge1xuICBsZXQgY2FjaGUgPSBkZWNvZGVDYWNoZVtleGNsdWRlXTtcbiAgaWYgKGNhY2hlKSB7IHJldHVybiBjYWNoZSB9XG5cbiAgY2FjaGUgPSBkZWNvZGVDYWNoZVtleGNsdWRlXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTI4OyBpKyspIHtcbiAgICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSk7XG4gICAgY2FjaGUucHVzaChjaCk7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4Y2x1ZGUubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaCA9IGV4Y2x1ZGUuY2hhckNvZGVBdChpKTtcbiAgICBjYWNoZVtjaF0gPSAnJScgKyAoJzAnICsgY2gudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkpLnNsaWNlKC0yKTtcbiAgfVxuXG4gIHJldHVybiBjYWNoZVxufVxuXG4vLyBEZWNvZGUgcGVyY2VudC1lbmNvZGVkIHN0cmluZy5cbi8vXG5mdW5jdGlvbiBkZWNvZGUgKHN0cmluZywgZXhjbHVkZSkge1xuICBpZiAodHlwZW9mIGV4Y2x1ZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgZXhjbHVkZSA9IGRlY29kZS5kZWZhdWx0Q2hhcnM7XG4gIH1cblxuICBjb25zdCBjYWNoZSA9IGdldERlY29kZUNhY2hlKGV4Y2x1ZGUpO1xuXG4gIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKCVbYS1mMC05XXsyfSkrL2dpLCBmdW5jdGlvbiAoc2VxKSB7XG4gICAgbGV0IHJlc3VsdCA9ICcnO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzZXEubGVuZ3RoOyBpIDwgbDsgaSArPSAzKSB7XG4gICAgICBjb25zdCBiMSA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgMSwgaSArIDMpLCAxNik7XG5cbiAgICAgIGlmIChiMSA8IDB4ODApIHtcbiAgICAgICAgcmVzdWx0ICs9IGNhY2hlW2IxXTtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RTApID09PSAweEMwICYmIChpICsgMyA8IGwpKSB7XG4gICAgICAgIC8vIDExMHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGNvbnN0IGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBjb25zdCBjaHIgPSAoKGIxIDw8IDYpICYgMHg3QzApIHwgKGIyICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHg4MCkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNocik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaSArPSAzO1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RjApID09PSAweEUwICYmIChpICsgNiA8IGwpKSB7XG4gICAgICAgIC8vIDExMTB4eHh4IDEweHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGNvbnN0IGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcbiAgICAgICAgY29uc3QgYjMgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDcsIGkgKyA5KSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjMgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGNvbnN0IGNociA9ICgoYjEgPDwgMTIpICYgMHhGMDAwKSB8ICgoYjIgPDwgNikgJiAweEZDMCkgfCAoYjMgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDgwMCB8fCAoY2hyID49IDB4RDgwMCAmJiBjaHIgPD0gMHhERkZGKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZFxcdWZmZmQnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaHIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGkgKz0gNjtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoYjEgJiAweEY4KSA9PT0gMHhGMCAmJiAoaSArIDkgPCBsKSkge1xuICAgICAgICAvLyAxMTExMTB4eCAxMHh4eHh4eCAxMHh4eHh4eCAxMHh4eHh4eFxuICAgICAgICBjb25zdCBiMiA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNCwgaSArIDYpLCAxNik7XG4gICAgICAgIGNvbnN0IGIzID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA3LCBpICsgOSksIDE2KTtcbiAgICAgICAgY29uc3QgYjQgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDEwLCBpICsgMTIpLCAxNik7XG5cbiAgICAgICAgaWYgKChiMiAmIDB4QzApID09PSAweDgwICYmIChiMyAmIDB4QzApID09PSAweDgwICYmIChiNCAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgbGV0IGNociA9ICgoYjEgPDwgMTgpICYgMHgxQzAwMDApIHwgKChiMiA8PCAxMikgJiAweDNGMDAwKSB8ICgoYjMgPDwgNikgJiAweEZDMCkgfCAoYjQgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDEwMDAwIHx8IGNociA+IDB4MTBGRkZGKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcdWZmZmRcXHVmZmZkXFx1ZmZmZFxcdWZmZmQnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaHIgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RDgwMCArIChjaHIgPj4gMTApLCAweERDMDAgKyAoY2hyICYgMHgzRkYpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDk7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXN1bHQgKz0gJ1xcdWZmZmQnO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRcbiAgfSlcbn1cblxuZGVjb2RlLmRlZmF1bHRDaGFycyA9ICc7Lz86QCY9KyQsIyc7XG5kZWNvZGUuY29tcG9uZW50Q2hhcnMgPSAnJztcblxuY29uc3QgZW5jb2RlQ2FjaGUgPSB7fTtcblxuLy8gQ3JlYXRlIGEgbG9va3VwIGFycmF5IHdoZXJlIGFueXRoaW5nIGJ1dCBjaGFyYWN0ZXJzIGluIGBjaGFyc2Agc3RyaW5nXG4vLyBhbmQgYWxwaGFudW1lcmljIGNoYXJzIGlzIHBlcmNlbnQtZW5jb2RlZC5cbi8vXG5mdW5jdGlvbiBnZXRFbmNvZGVDYWNoZSAoZXhjbHVkZSkge1xuICBsZXQgY2FjaGUgPSBlbmNvZGVDYWNoZVtleGNsdWRlXTtcbiAgaWYgKGNhY2hlKSB7IHJldHVybiBjYWNoZSB9XG5cbiAgY2FjaGUgPSBlbmNvZGVDYWNoZVtleGNsdWRlXSA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTI4OyBpKyspIHtcbiAgICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSk7XG5cbiAgICBpZiAoL15bMC05YS16XSQvaS50ZXN0KGNoKSkge1xuICAgICAgLy8gYWx3YXlzIGFsbG93IHVuZW5jb2RlZCBhbHBoYW51bWVyaWMgY2hhcmFjdGVyc1xuICAgICAgY2FjaGUucHVzaChjaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhY2hlLnB1c2goJyUnICsgKCcwJyArIGkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkpLnNsaWNlKC0yKSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBleGNsdWRlLmxlbmd0aDsgaSsrKSB7XG4gICAgY2FjaGVbZXhjbHVkZS5jaGFyQ29kZUF0KGkpXSA9IGV4Y2x1ZGVbaV07XG4gIH1cblxuICByZXR1cm4gY2FjaGVcbn1cblxuLy8gRW5jb2RlIHVuc2FmZSBjaGFyYWN0ZXJzIHdpdGggcGVyY2VudC1lbmNvZGluZywgc2tpcHBpbmcgYWxyZWFkeVxuLy8gZW5jb2RlZCBzZXF1ZW5jZXMuXG4vL1xuLy8gIC0gc3RyaW5nICAgICAgIC0gc3RyaW5nIHRvIGVuY29kZVxuLy8gIC0gZXhjbHVkZSAgICAgIC0gbGlzdCBvZiBjaGFyYWN0ZXJzIHRvIGlnbm9yZSAoaW4gYWRkaXRpb24gdG8gYS16QS1aMC05KVxuLy8gIC0ga2VlcEVzY2FwZWQgIC0gZG9uJ3QgZW5jb2RlICclJyBpbiBhIGNvcnJlY3QgZXNjYXBlIHNlcXVlbmNlIChkZWZhdWx0OiB0cnVlKVxuLy9cbmZ1bmN0aW9uIGVuY29kZSAoc3RyaW5nLCBleGNsdWRlLCBrZWVwRXNjYXBlZCkge1xuICBpZiAodHlwZW9mIGV4Y2x1ZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gZW5jb2RlKHN0cmluZywga2VlcEVzY2FwZWQpXG4gICAga2VlcEVzY2FwZWQgPSBleGNsdWRlO1xuICAgIGV4Y2x1ZGUgPSBlbmNvZGUuZGVmYXVsdENoYXJzO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBrZWVwRXNjYXBlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBrZWVwRXNjYXBlZCA9IHRydWU7XG4gIH1cblxuICBjb25zdCBjYWNoZSA9IGdldEVuY29kZUNhY2hlKGV4Y2x1ZGUpO1xuICBsZXQgcmVzdWx0ID0gJyc7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdHJpbmcubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3QgY29kZSA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgaWYgKGtlZXBFc2NhcGVkICYmIGNvZGUgPT09IDB4MjUgLyogJSAqLyAmJiBpICsgMiA8IGwpIHtcbiAgICAgIGlmICgvXlswLTlhLWZdezJ9JC9pLnRlc3Qoc3RyaW5nLnNsaWNlKGkgKyAxLCBpICsgMykpKSB7XG4gICAgICAgIHJlc3VsdCArPSBzdHJpbmcuc2xpY2UoaSwgaSArIDMpO1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPCAxMjgpIHtcbiAgICAgIHJlc3VsdCArPSBjYWNoZVtjb2RlXTtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPj0gMHhEODAwICYmIGNvZGUgPD0gMHhERkZGKSB7XG4gICAgICBpZiAoY29kZSA+PSAweEQ4MDAgJiYgY29kZSA8PSAweERCRkYgJiYgaSArIDEgPCBsKSB7XG4gICAgICAgIGNvbnN0IG5leHRDb2RlID0gc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpO1xuICAgICAgICBpZiAobmV4dENvZGUgPj0gMHhEQzAwICYmIG5leHRDb2RlIDw9IDB4REZGRikge1xuICAgICAgICAgIHJlc3VsdCArPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5nW2ldICsgc3RyaW5nW2kgKyAxXSk7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdCArPSAnJUVGJUJGJUJEJztcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdbaV0pO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5lbmNvZGUuZGVmYXVsdENoYXJzID0gXCI7Lz86QCY9KyQsLV8uIX4qJygpI1wiO1xuZW5jb2RlLmNvbXBvbmVudENoYXJzID0gXCItXy4hfionKClcIjtcblxuZnVuY3Rpb24gZm9ybWF0ICh1cmwpIHtcbiAgbGV0IHJlc3VsdCA9ICcnO1xuXG4gIHJlc3VsdCArPSB1cmwucHJvdG9jb2wgfHwgJyc7XG4gIHJlc3VsdCArPSB1cmwuc2xhc2hlcyA/ICcvLycgOiAnJztcbiAgcmVzdWx0ICs9IHVybC5hdXRoID8gdXJsLmF1dGggKyAnQCcgOiAnJztcblxuICBpZiAodXJsLmhvc3RuYW1lICYmIHVybC5ob3N0bmFtZS5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgLy8gaXB2NiBhZGRyZXNzXG4gICAgcmVzdWx0ICs9ICdbJyArIHVybC5ob3N0bmFtZSArICddJztcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgKz0gdXJsLmhvc3RuYW1lIHx8ICcnO1xuICB9XG5cbiAgcmVzdWx0ICs9IHVybC5wb3J0ID8gJzonICsgdXJsLnBvcnQgOiAnJztcbiAgcmVzdWx0ICs9IHVybC5wYXRobmFtZSB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5zZWFyY2ggfHwgJyc7XG4gIHJlc3VsdCArPSB1cmwuaGFzaCB8fCAnJztcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vL1xuLy8gQ2hhbmdlcyBmcm9tIGpveWVudC9ub2RlOlxuLy9cbi8vIDEuIE5vIGxlYWRpbmcgc2xhc2ggaW4gcGF0aHMsXG4vLyAgICBlLmcuIGluIGB1cmwucGFyc2UoJ2h0dHA6Ly9mb28/YmFyJylgIHBhdGhuYW1lIGlzIGBgLCBub3QgYC9gXG4vL1xuLy8gMi4gQmFja3NsYXNoZXMgYXJlIG5vdCByZXBsYWNlZCB3aXRoIHNsYXNoZXMsXG4vLyAgICBzbyBgaHR0cDpcXFxcZXhhbXBsZS5vcmdcXGAgaXMgdHJlYXRlZCBsaWtlIGEgcmVsYXRpdmUgcGF0aFxuLy9cbi8vIDMuIFRyYWlsaW5nIGNvbG9uIGlzIHRyZWF0ZWQgbGlrZSBhIHBhcnQgb2YgdGhlIHBhdGgsXG4vLyAgICBpLmUuIGluIGBodHRwOi8vZXhhbXBsZS5vcmc6Zm9vYCBwYXRobmFtZSBpcyBgOmZvb2Bcbi8vXG4vLyA0LiBOb3RoaW5nIGlzIFVSTC1lbmNvZGVkIGluIHRoZSByZXN1bHRpbmcgb2JqZWN0LFxuLy8gICAgKGluIGpveWVudC9ub2RlIHNvbWUgY2hhcnMgaW4gYXV0aCBhbmQgcGF0aHMgYXJlIGVuY29kZWQpXG4vL1xuLy8gNS4gYHVybC5wYXJzZSgpYCBkb2VzIG5vdCBoYXZlIGBwYXJzZVF1ZXJ5U3RyaW5nYCBhcmd1bWVudFxuLy9cbi8vIDYuIFJlbW92ZWQgZXh0cmFuZW91cyByZXN1bHQgcHJvcGVydGllczogYGhvc3RgLCBgcGF0aGAsIGBxdWVyeWAsIGV0Yy4sXG4vLyAgICB3aGljaCBjYW4gYmUgY29uc3RydWN0ZWQgdXNpbmcgb3RoZXIgcGFydHMgb2YgdGhlIHVybC5cbi8vXG5cbmZ1bmN0aW9uIFVybCAoKSB7XG4gIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICB0aGlzLnNsYXNoZXMgPSBudWxsO1xuICB0aGlzLmF1dGggPSBudWxsO1xuICB0aGlzLnBvcnQgPSBudWxsO1xuICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgdGhpcy5oYXNoID0gbnVsbDtcbiAgdGhpcy5zZWFyY2ggPSBudWxsO1xuICB0aGlzLnBhdGhuYW1lID0gbnVsbDtcbn1cblxuLy8gUmVmZXJlbmNlOiBSRkMgMzk4NiwgUkZDIDE4MDgsIFJGQyAyMzk2XG5cbi8vIGRlZmluZSB0aGVzZSBoZXJlIHNvIGF0IGxlYXN0IHRoZXkgb25seSBoYXZlIHRvIGJlXG4vLyBjb21waWxlZCBvbmNlIG9uIHRoZSBmaXJzdCBtb2R1bGUgbG9hZC5cbmNvbnN0IHByb3RvY29sUGF0dGVybiA9IC9eKFthLXowLTkuKy1dKzopL2k7XG5jb25zdCBwb3J0UGF0dGVybiA9IC86WzAtOV0qJC87XG5cbi8vIFNwZWNpYWwgY2FzZSBmb3IgYSBzaW1wbGUgcGF0aCBVUkxcbi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2VsZXNzLWVzY2FwZSAqL1xuY29uc3Qgc2ltcGxlUGF0aFBhdHRlcm4gPSAvXihcXC9cXC8/KD8hXFwvKVteXFw/XFxzXSopKFxcP1teXFxzXSopPyQvO1xuXG4vLyBSRkMgMjM5NjogY2hhcmFjdGVycyByZXNlcnZlZCBmb3IgZGVsaW1pdGluZyBVUkxzLlxuLy8gV2UgYWN0dWFsbHkganVzdCBhdXRvLWVzY2FwZSB0aGVzZS5cbmNvbnN0IGRlbGltcyA9IFsnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCddO1xuXG4vLyBSRkMgMjM5NjogY2hhcmFjdGVycyBub3QgYWxsb3dlZCBmb3IgdmFyaW91cyByZWFzb25zLlxuY29uc3QgdW53aXNlID0gWyd7JywgJ30nLCAnfCcsICdcXFxcJywgJ14nLCAnYCddLmNvbmNhdChkZWxpbXMpO1xuXG4vLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG5jb25zdCBhdXRvRXNjYXBlID0gWydcXCcnXS5jb25jYXQodW53aXNlKTtcbi8vIENoYXJhY3RlcnMgdGhhdCBhcmUgbmV2ZXIgZXZlciBhbGxvd2VkIGluIGEgaG9zdG5hbWUuXG4vLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4vLyBhcmUgdGhlIG9uZXMgdGhhdCBhcmUgKmV4cGVjdGVkKiB0byBiZSBzZWVuLCBzbyB3ZSBmYXN0LXBhdGhcbi8vIHRoZW0uXG5jb25zdCBub25Ib3N0Q2hhcnMgPSBbJyUnLCAnLycsICc/JywgJzsnLCAnIyddLmNvbmNhdChhdXRvRXNjYXBlKTtcbmNvbnN0IGhvc3RFbmRpbmdDaGFycyA9IFsnLycsICc/JywgJyMnXTtcbmNvbnN0IGhvc3RuYW1lTWF4TGVuID0gMjU1O1xuY29uc3QgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eWythLXowLTlBLVpfLV17MCw2M30kLztcbmNvbnN0IGhvc3RuYW1lUGFydFN0YXJ0ID0gL14oWythLXowLTlBLVpfLV17MCw2M30pKC4qKSQvO1xuLy8gcHJvdG9jb2xzIHRoYXQgY2FuIGFsbG93IFwidW5zYWZlXCIgYW5kIFwidW53aXNlXCIgY2hhcnMuXG4vLyBwcm90b2NvbHMgdGhhdCBuZXZlciBoYXZlIGEgaG9zdG5hbWUuXG5jb25zdCBob3N0bGVzc1Byb3RvY29sID0ge1xuICBqYXZhc2NyaXB0OiB0cnVlLFxuICAnamF2YXNjcmlwdDonOiB0cnVlXG59O1xuLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG5jb25zdCBzbGFzaGVkUHJvdG9jb2wgPSB7XG4gIGh0dHA6IHRydWUsXG4gIGh0dHBzOiB0cnVlLFxuICBmdHA6IHRydWUsXG4gIGdvcGhlcjogdHJ1ZSxcbiAgZmlsZTogdHJ1ZSxcbiAgJ2h0dHA6JzogdHJ1ZSxcbiAgJ2h0dHBzOic6IHRydWUsXG4gICdmdHA6JzogdHJ1ZSxcbiAgJ2dvcGhlcjonOiB0cnVlLFxuICAnZmlsZTonOiB0cnVlXG59O1xuXG5mdW5jdGlvbiB1cmxQYXJzZSAodXJsLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAodXJsICYmIHVybCBpbnN0YW5jZW9mIFVybCkgcmV0dXJuIHVybFxuXG4gIGNvbnN0IHUgPSBuZXcgVXJsKCk7XG4gIHUucGFyc2UodXJsLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1XG59XG5cblVybC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodXJsLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBsZXQgbG93ZXJQcm90bywgaGVjLCBzbGFzaGVzO1xuICBsZXQgcmVzdCA9IHVybDtcblxuICAvLyB0cmltIGJlZm9yZSBwcm9jZWVkaW5nLlxuICAvLyBUaGlzIGlzIHRvIHN1cHBvcnQgcGFyc2Ugc3R1ZmYgbGlrZSBcIiAgaHR0cDovL2Zvby5jb20gIFxcblwiXG4gIHJlc3QgPSByZXN0LnRyaW0oKTtcblxuICBpZiAoIXNsYXNoZXNEZW5vdGVIb3N0ICYmIHVybC5zcGxpdCgnIycpLmxlbmd0aCA9PT0gMSkge1xuICAgIC8vIFRyeSBmYXN0IHBhdGggcmVnZXhwXG4gICAgY29uc3Qgc2ltcGxlUGF0aCA9IHNpbXBsZVBhdGhQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gICAgaWYgKHNpbXBsZVBhdGgpIHtcbiAgICAgIHRoaXMucGF0aG5hbWUgPSBzaW1wbGVQYXRoWzFdO1xuICAgICAgaWYgKHNpbXBsZVBhdGhbMl0pIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSBzaW1wbGVQYXRoWzJdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gIH1cblxuICBsZXQgcHJvdG8gPSBwcm90b2NvbFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgaWYgKHByb3RvKSB7XG4gICAgcHJvdG8gPSBwcm90b1swXTtcbiAgICBsb3dlclByb3RvID0gcHJvdG8udG9Mb3dlckNhc2UoKTtcbiAgICB0aGlzLnByb3RvY29sID0gcHJvdG87XG4gICAgcmVzdCA9IHJlc3Quc3Vic3RyKHByb3RvLmxlbmd0aCk7XG4gIH1cblxuICAvLyBmaWd1cmUgb3V0IGlmIGl0J3MgZ290IGEgaG9zdFxuICAvLyB1c2VyQHNlcnZlciBpcyAqYWx3YXlzKiBpbnRlcnByZXRlZCBhcyBhIGhvc3RuYW1lLCBhbmQgdXJsXG4gIC8vIHJlc29sdXRpb24gd2lsbCB0cmVhdCAvL2Zvby9iYXIgYXMgaG9zdD1mb28scGF0aD1iYXIgYmVjYXVzZSB0aGF0J3NcbiAgLy8gaG93IHRoZSBicm93c2VyIHJlc29sdmVzIHJlbGF0aXZlIFVSTHMuXG4gIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2VsZXNzLWVzY2FwZSAqL1xuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICBzbGFzaGVzID0gcmVzdC5zdWJzdHIoMCwgMikgPT09ICcvLyc7XG4gICAgaWYgKHNsYXNoZXMgJiYgIShwcm90byAmJiBob3N0bGVzc1Byb3RvY29sW3Byb3RvXSkpIHtcbiAgICAgIHJlc3QgPSByZXN0LnN1YnN0cigyKTtcbiAgICAgIHRoaXMuc2xhc2hlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFob3N0bGVzc1Byb3RvY29sW3Byb3RvXSAmJlxuICAgICAgKHNsYXNoZXMgfHwgKHByb3RvICYmICFzbGFzaGVkUHJvdG9jb2xbcHJvdG9dKSkpIHtcbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICBsZXQgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoZWMgPSByZXN0LmluZGV4T2YoaG9zdEVuZGluZ0NoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSkge1xuICAgICAgICBob3N0RW5kID0gaGVjO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGF0IHRoaXMgcG9pbnQsIGVpdGhlciB3ZSBoYXZlIGFuIGV4cGxpY2l0IHBvaW50IHdoZXJlIHRoZVxuICAgIC8vIGF1dGggcG9ydGlvbiBjYW5ub3QgZ28gcGFzdCwgb3IgdGhlIGxhc3QgQCBjaGFyIGlzIHRoZSBkZWNpZGVyLlxuICAgIGxldCBhdXRoLCBhdFNpZ247XG4gICAgaWYgKGhvc3RFbmQgPT09IC0xKSB7XG4gICAgICAvLyBhdFNpZ24gY2FuIGJlIGFueXdoZXJlLlxuICAgICAgYXRTaWduID0gcmVzdC5sYXN0SW5kZXhPZignQCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhdFNpZ24gbXVzdCBiZSBpbiBhdXRoIHBvcnRpb24uXG4gICAgICAvLyBodHRwOi8vYUBiL2NAZCA9PiBob3N0OmIgYXV0aDphIHBhdGg6L2NAZFxuICAgICAgYXRTaWduID0gcmVzdC5sYXN0SW5kZXhPZignQCcsIGhvc3RFbmQpO1xuICAgIH1cblxuICAgIC8vIE5vdyB3ZSBoYXZlIGEgcG9ydGlvbiB3aGljaCBpcyBkZWZpbml0ZWx5IHRoZSBhdXRoLlxuICAgIC8vIFB1bGwgdGhhdCBvZmYuXG4gICAgaWYgKGF0U2lnbiAhPT0gLTEpIHtcbiAgICAgIGF1dGggPSByZXN0LnNsaWNlKDAsIGF0U2lnbik7XG4gICAgICByZXN0ID0gcmVzdC5zbGljZShhdFNpZ24gKyAxKTtcbiAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgfVxuXG4gICAgLy8gdGhlIGhvc3QgaXMgdGhlIHJlbWFpbmluZyB0byB0aGUgbGVmdCBvZiB0aGUgZmlyc3Qgbm9uLWhvc3QgY2hhclxuICAgIGhvc3RFbmQgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vbkhvc3RDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgaGVjID0gcmVzdC5pbmRleE9mKG5vbkhvc3RDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpIHtcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSkge1xuICAgICAgaG9zdEVuZCA9IHJlc3QubGVuZ3RoO1xuICAgIH1cblxuICAgIGlmIChyZXN0W2hvc3RFbmQgLSAxXSA9PT0gJzonKSB7IGhvc3RFbmQtLTsgfVxuICAgIGNvbnN0IGhvc3QgPSByZXN0LnNsaWNlKDAsIGhvc3RFbmQpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKGhvc3RFbmQpO1xuXG4gICAgLy8gcHVsbCBvdXQgcG9ydC5cbiAgICB0aGlzLnBhcnNlSG9zdChob3N0KTtcblxuICAgIC8vIHdlJ3ZlIGluZGljYXRlZCB0aGF0IHRoZXJlIGlzIGEgaG9zdG5hbWUsXG4gICAgLy8gc28gZXZlbiBpZiBpdCdzIGVtcHR5LCBpdCBoYXMgdG8gYmUgcHJlc2VudC5cbiAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZSB8fCAnJztcblxuICAgIC8vIGlmIGhvc3RuYW1lIGJlZ2lucyB3aXRoIFsgYW5kIGVuZHMgd2l0aCBdXG4gICAgLy8gYXNzdW1lIHRoYXQgaXQncyBhbiBJUHY2IGFkZHJlc3MuXG4gICAgY29uc3QgaXB2Nkhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZVswXSA9PT0gJ1snICYmXG4gICAgICAgIHRoaXMuaG9zdG5hbWVbdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nO1xuXG4gICAgLy8gdmFsaWRhdGUgYSBsaXR0bGUuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIGNvbnN0IGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhcnQgPSBob3N0cGFydHNbaV07XG4gICAgICAgIGlmICghcGFydCkgeyBjb250aW51ZSB9XG4gICAgICAgIGlmICghcGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgIGxldCBuZXdwYXJ0ID0gJyc7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDAsIGsgPSBwYXJ0Lmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgaWYgKHBhcnQuY2hhckNvZGVBdChqKSA+IDEyNykge1xuICAgICAgICAgICAgICAvLyB3ZSByZXBsYWNlIG5vbi1BU0NJSSBjaGFyIHdpdGggYSB0ZW1wb3JhcnkgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0aGlzIHRvIG1ha2Ugc3VyZSBzaXplIG9mIGhvc3RuYW1lIGlzIG5vdFxuICAgICAgICAgICAgICAvLyBicm9rZW4gYnkgcmVwbGFjaW5nIG5vbi1BU0NJSSBieSBub3RoaW5nXG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gJ3gnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV3cGFydCArPSBwYXJ0W2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB3ZSB0ZXN0IGFnYWluIHdpdGggQVNDSUkgY2hhciBvbmx5XG4gICAgICAgICAgaWYgKCFuZXdwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgICBjb25zdCB2YWxpZFBhcnRzID0gaG9zdHBhcnRzLnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgY29uc3Qgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICBjb25zdCBiaXQgPSBwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChiaXQpIHtcbiAgICAgICAgICAgICAgdmFsaWRQYXJ0cy5wdXNoKGJpdFsxXSk7XG4gICAgICAgICAgICAgIG5vdEhvc3QudW5zaGlmdChiaXRbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdEhvc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJlc3QgPSBub3RIb3N0LmpvaW4oJy4nKSArIHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmhvc3RuYW1lID0gdmFsaWRQYXJ0cy5qb2luKCcuJyk7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmhvc3RuYW1lLmxlbmd0aCA+IGhvc3RuYW1lTWF4TGVuKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gJyc7XG4gICAgfVxuXG4gICAgLy8gc3RyaXAgWyBhbmQgXSBmcm9tIHRoZSBob3N0bmFtZVxuICAgIC8vIHRoZSBob3N0IGZpZWxkIHN0aWxsIHJldGFpbnMgdGhlbSwgdGhvdWdoXG4gICAgaWYgKGlwdjZIb3N0bmFtZSkge1xuICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUuc3Vic3RyKDEsIHRoaXMuaG9zdG5hbWUubGVuZ3RoIC0gMik7XG4gICAgfVxuICB9XG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgY29uc3QgaGFzaCA9IHJlc3QuaW5kZXhPZignIycpO1xuICBpZiAoaGFzaCAhPT0gLTEpIHtcbiAgICAvLyBnb3QgYSBmcmFnbWVudCBzdHJpbmcuXG4gICAgdGhpcy5oYXNoID0gcmVzdC5zdWJzdHIoaGFzaCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgaGFzaCk7XG4gIH1cbiAgY29uc3QgcW0gPSByZXN0LmluZGV4T2YoJz8nKTtcbiAgaWYgKHFtICE9PSAtMSkge1xuICAgIHRoaXMuc2VhcmNoID0gcmVzdC5zdWJzdHIocW0pO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIHFtKTtcbiAgfVxuICBpZiAocmVzdCkgeyB0aGlzLnBhdGhuYW1lID0gcmVzdDsgfVxuICBpZiAoc2xhc2hlZFByb3RvY29sW2xvd2VyUHJvdG9dICYmXG4gICAgICB0aGlzLmhvc3RuYW1lICYmICF0aGlzLnBhdGhuYW1lKSB7XG4gICAgdGhpcy5wYXRobmFtZSA9ICcnO1xuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24gKGhvc3QpIHtcbiAgbGV0IHBvcnQgPSBwb3J0UGF0dGVybi5leGVjKGhvc3QpO1xuICBpZiAocG9ydCkge1xuICAgIHBvcnQgPSBwb3J0WzBdO1xuICAgIGlmIChwb3J0ICE9PSAnOicpIHtcbiAgICAgIHRoaXMucG9ydCA9IHBvcnQuc3Vic3RyKDEpO1xuICAgIH1cbiAgICBob3N0ID0gaG9zdC5zdWJzdHIoMCwgaG9zdC5sZW5ndGggLSBwb3J0Lmxlbmd0aCk7XG4gIH1cbiAgaWYgKGhvc3QpIHsgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7IH1cbn07XG5cbmV4cG9ydHMuZGVjb2RlID0gZGVjb2RlO1xuZXhwb3J0cy5lbmNvZGUgPSBlbmNvZGU7XG5leHBvcnRzLmZvcm1hdCA9IGZvcm1hdDtcbmV4cG9ydHMucGFyc2UgPSB1cmxQYXJzZTtcbiIsICIndXNlIHN0cmljdCc7XG5cbnZhciByZWdleCQ1ID0gL1tcXDAtXFx1RDdGRlxcdUUwMDAtXFx1RkZGRl18W1xcdUQ4MDAtXFx1REJGRl1bXFx1REMwMC1cXHVERkZGXXxbXFx1RDgwMC1cXHVEQkZGXSg/IVtcXHVEQzAwLVxcdURGRkZdKXwoPzpbXlxcdUQ4MDAtXFx1REJGRl18XilbXFx1REMwMC1cXHVERkZGXS87XG5cbnZhciByZWdleCQ0ID0gL1tcXDAtXFx4MUZcXHg3Ri1cXHg5Rl0vO1xuXG52YXIgcmVnZXgkMyA9IC9bXFx4QURcXHUwNjAwLVxcdTA2MDVcXHUwNjFDXFx1MDZERFxcdTA3MEZcXHUwODkwXFx1MDg5MVxcdTA4RTJcXHUxODBFXFx1MjAwQi1cXHUyMDBGXFx1MjAyQS1cXHUyMDJFXFx1MjA2MC1cXHUyMDY0XFx1MjA2Ni1cXHUyMDZGXFx1RkVGRlxcdUZGRjktXFx1RkZGQl18XFx1RDgwNFtcXHVEQ0JEXFx1RENDRF18XFx1RDgwRFtcXHVEQzMwLVxcdURDM0ZdfFxcdUQ4MkZbXFx1RENBMC1cXHVEQ0EzXXxcXHVEODM0W1xcdURENzMtXFx1REQ3QV18XFx1REI0MFtcXHVEQzAxXFx1REMyMC1cXHVEQzdGXS87XG5cbnZhciByZWdleCQyID0gL1shLSMlLVxcKiwtXFwvOjtcXD9AXFxbLVxcXV9cXHtcXH1cXHhBMVxceEE3XFx4QUJcXHhCNlxceEI3XFx4QkJcXHhCRlxcdTAzN0VcXHUwMzg3XFx1MDU1QS1cXHUwNTVGXFx1MDU4OVxcdTA1OEFcXHUwNUJFXFx1MDVDMFxcdTA1QzNcXHUwNUM2XFx1MDVGM1xcdTA1RjRcXHUwNjA5XFx1MDYwQVxcdTA2MENcXHUwNjBEXFx1MDYxQlxcdTA2MUQtXFx1MDYxRlxcdTA2NkEtXFx1MDY2RFxcdTA2RDRcXHUwNzAwLVxcdTA3MERcXHUwN0Y3LVxcdTA3RjlcXHUwODMwLVxcdTA4M0VcXHUwODVFXFx1MDk2NFxcdTA5NjVcXHUwOTcwXFx1MDlGRFxcdTBBNzZcXHUwQUYwXFx1MEM3N1xcdTBDODRcXHUwREY0XFx1MEU0RlxcdTBFNUFcXHUwRTVCXFx1MEYwNC1cXHUwRjEyXFx1MEYxNFxcdTBGM0EtXFx1MEYzRFxcdTBGODVcXHUwRkQwLVxcdTBGRDRcXHUwRkQ5XFx1MEZEQVxcdTEwNEEtXFx1MTA0RlxcdTEwRkJcXHUxMzYwLVxcdTEzNjhcXHUxNDAwXFx1MTY2RVxcdTE2OUJcXHUxNjlDXFx1MTZFQi1cXHUxNkVEXFx1MTczNVxcdTE3MzZcXHUxN0Q0LVxcdTE3RDZcXHUxN0Q4LVxcdTE3REFcXHUxODAwLVxcdTE4MEFcXHUxOTQ0XFx1MTk0NVxcdTFBMUVcXHUxQTFGXFx1MUFBMC1cXHUxQUE2XFx1MUFBOC1cXHUxQUFEXFx1MUI1QS1cXHUxQjYwXFx1MUI3RFxcdTFCN0VcXHUxQkZDLVxcdTFCRkZcXHUxQzNCLVxcdTFDM0ZcXHUxQzdFXFx1MUM3RlxcdTFDQzAtXFx1MUNDN1xcdTFDRDNcXHUyMDEwLVxcdTIwMjdcXHUyMDMwLVxcdTIwNDNcXHUyMDQ1LVxcdTIwNTFcXHUyMDUzLVxcdTIwNUVcXHUyMDdEXFx1MjA3RVxcdTIwOERcXHUyMDhFXFx1MjMwOC1cXHUyMzBCXFx1MjMyOVxcdTIzMkFcXHUyNzY4LVxcdTI3NzVcXHUyN0M1XFx1MjdDNlxcdTI3RTYtXFx1MjdFRlxcdTI5ODMtXFx1Mjk5OFxcdTI5RDgtXFx1MjlEQlxcdTI5RkNcXHUyOUZEXFx1MkNGOS1cXHUyQ0ZDXFx1MkNGRVxcdTJDRkZcXHUyRDcwXFx1MkUwMC1cXHUyRTJFXFx1MkUzMC1cXHUyRTRGXFx1MkU1Mi1cXHUyRTVEXFx1MzAwMS1cXHUzMDAzXFx1MzAwOC1cXHUzMDExXFx1MzAxNC1cXHUzMDFGXFx1MzAzMFxcdTMwM0RcXHUzMEEwXFx1MzBGQlxcdUE0RkVcXHVBNEZGXFx1QTYwRC1cXHVBNjBGXFx1QTY3M1xcdUE2N0VcXHVBNkYyLVxcdUE2RjdcXHVBODc0LVxcdUE4NzdcXHVBOENFXFx1QThDRlxcdUE4RjgtXFx1QThGQVxcdUE4RkNcXHVBOTJFXFx1QTkyRlxcdUE5NUZcXHVBOUMxLVxcdUE5Q0RcXHVBOURFXFx1QTlERlxcdUFBNUMtXFx1QUE1RlxcdUFBREVcXHVBQURGXFx1QUFGMFxcdUFBRjFcXHVBQkVCXFx1RkQzRVxcdUZEM0ZcXHVGRTEwLVxcdUZFMTlcXHVGRTMwLVxcdUZFNTJcXHVGRTU0LVxcdUZFNjFcXHVGRTYzXFx1RkU2OFxcdUZFNkFcXHVGRTZCXFx1RkYwMS1cXHVGRjAzXFx1RkYwNS1cXHVGRjBBXFx1RkYwQy1cXHVGRjBGXFx1RkYxQVxcdUZGMUJcXHVGRjFGXFx1RkYyMFxcdUZGM0ItXFx1RkYzRFxcdUZGM0ZcXHVGRjVCXFx1RkY1RFxcdUZGNUYtXFx1RkY2NV18XFx1RDgwMFtcXHVERDAwLVxcdUREMDJcXHVERjlGXFx1REZEMF18XFx1RDgwMVxcdURENkZ8XFx1RDgwMltcXHVEQzU3XFx1REQxRlxcdUREM0ZcXHVERTUwLVxcdURFNThcXHVERTdGXFx1REVGMC1cXHVERUY2XFx1REYzOS1cXHVERjNGXFx1REY5OS1cXHVERjlDXXxcXHVEODAzW1xcdURFQURcXHVERjU1LVxcdURGNTlcXHVERjg2LVxcdURGODldfFxcdUQ4MDRbXFx1REM0Ny1cXHVEQzREXFx1RENCQlxcdURDQkNcXHVEQ0JFLVxcdURDQzFcXHVERDQwLVxcdURENDNcXHVERDc0XFx1REQ3NVxcdUREQzUtXFx1RERDOFxcdUREQ0RcXHVERERCXFx1RERERC1cXHVERERGXFx1REUzOC1cXHVERTNEXFx1REVBOV18XFx1RDgwNVtcXHVEQzRCLVxcdURDNEZcXHVEQzVBXFx1REM1QlxcdURDNURcXHVEQ0M2XFx1RERDMS1cXHVEREQ3XFx1REU0MS1cXHVERTQzXFx1REU2MC1cXHVERTZDXFx1REVCOVxcdURGM0MtXFx1REYzRV18XFx1RDgwNltcXHVEQzNCXFx1REQ0NC1cXHVERDQ2XFx1RERFMlxcdURFM0YtXFx1REU0NlxcdURFOUEtXFx1REU5Q1xcdURFOUUtXFx1REVBMlxcdURGMDAtXFx1REYwOV18XFx1RDgwN1tcXHVEQzQxLVxcdURDNDVcXHVEQzcwXFx1REM3MVxcdURFRjdcXHVERUY4XFx1REY0My1cXHVERjRGXFx1REZGRl18XFx1RDgwOVtcXHVEQzcwLVxcdURDNzRdfFxcdUQ4MEJbXFx1REZGMVxcdURGRjJdfFxcdUQ4MUFbXFx1REU2RVxcdURFNkZcXHVERUY1XFx1REYzNy1cXHVERjNCXFx1REY0NF18XFx1RDgxQltcXHVERTk3LVxcdURFOUFcXHVERkUyXXxcXHVEODJGXFx1REM5RnxcXHVEODM2W1xcdURFODctXFx1REU4Ql18XFx1RDgzQVtcXHVERDVFXFx1REQ1Rl0vO1xuXG52YXIgcmVnZXgkMSA9IC9bXFwkXFwrPC0+XFxeYFxcfH5cXHhBMi1cXHhBNlxceEE4XFx4QTlcXHhBQ1xceEFFLVxceEIxXFx4QjRcXHhCOFxceEQ3XFx4RjdcXHUwMkMyLVxcdTAyQzVcXHUwMkQyLVxcdTAyREZcXHUwMkU1LVxcdTAyRUJcXHUwMkVEXFx1MDJFRi1cXHUwMkZGXFx1MDM3NVxcdTAzODRcXHUwMzg1XFx1MDNGNlxcdTA0ODJcXHUwNThELVxcdTA1OEZcXHUwNjA2LVxcdTA2MDhcXHUwNjBCXFx1MDYwRVxcdTA2MEZcXHUwNkRFXFx1MDZFOVxcdTA2RkRcXHUwNkZFXFx1MDdGNlxcdTA3RkVcXHUwN0ZGXFx1MDg4OFxcdTA5RjJcXHUwOUYzXFx1MDlGQVxcdTA5RkJcXHUwQUYxXFx1MEI3MFxcdTBCRjMtXFx1MEJGQVxcdTBDN0ZcXHUwRDRGXFx1MEQ3OVxcdTBFM0ZcXHUwRjAxLVxcdTBGMDNcXHUwRjEzXFx1MEYxNS1cXHUwRjE3XFx1MEYxQS1cXHUwRjFGXFx1MEYzNFxcdTBGMzZcXHUwRjM4XFx1MEZCRS1cXHUwRkM1XFx1MEZDNy1cXHUwRkNDXFx1MEZDRVxcdTBGQ0ZcXHUwRkQ1LVxcdTBGRDhcXHUxMDlFXFx1MTA5RlxcdTEzOTAtXFx1MTM5OVxcdTE2NkRcXHUxN0RCXFx1MTk0MFxcdTE5REUtXFx1MTlGRlxcdTFCNjEtXFx1MUI2QVxcdTFCNzQtXFx1MUI3Q1xcdTFGQkRcXHUxRkJGLVxcdTFGQzFcXHUxRkNELVxcdTFGQ0ZcXHUxRkRELVxcdTFGREZcXHUxRkVELVxcdTFGRUZcXHUxRkZEXFx1MUZGRVxcdTIwNDRcXHUyMDUyXFx1MjA3QS1cXHUyMDdDXFx1MjA4QS1cXHUyMDhDXFx1MjBBMC1cXHUyMEMwXFx1MjEwMFxcdTIxMDFcXHUyMTAzLVxcdTIxMDZcXHUyMTA4XFx1MjEwOVxcdTIxMTRcXHUyMTE2LVxcdTIxMThcXHUyMTFFLVxcdTIxMjNcXHUyMTI1XFx1MjEyN1xcdTIxMjlcXHUyMTJFXFx1MjEzQVxcdTIxM0JcXHUyMTQwLVxcdTIxNDRcXHUyMTRBLVxcdTIxNERcXHUyMTRGXFx1MjE4QVxcdTIxOEJcXHUyMTkwLVxcdTIzMDdcXHUyMzBDLVxcdTIzMjhcXHUyMzJCLVxcdTI0MjZcXHUyNDQwLVxcdTI0NEFcXHUyNDlDLVxcdTI0RTlcXHUyNTAwLVxcdTI3NjdcXHUyNzk0LVxcdTI3QzRcXHUyN0M3LVxcdTI3RTVcXHUyN0YwLVxcdTI5ODJcXHUyOTk5LVxcdTI5RDdcXHUyOURDLVxcdTI5RkJcXHUyOUZFLVxcdTJCNzNcXHUyQjc2LVxcdTJCOTVcXHUyQjk3LVxcdTJCRkZcXHUyQ0U1LVxcdTJDRUFcXHUyRTUwXFx1MkU1MVxcdTJFODAtXFx1MkU5OVxcdTJFOUItXFx1MkVGM1xcdTJGMDAtXFx1MkZENVxcdTJGRjAtXFx1MkZGRlxcdTMwMDRcXHUzMDEyXFx1MzAxM1xcdTMwMjBcXHUzMDM2XFx1MzAzN1xcdTMwM0VcXHUzMDNGXFx1MzA5QlxcdTMwOUNcXHUzMTkwXFx1MzE5MVxcdTMxOTYtXFx1MzE5RlxcdTMxQzAtXFx1MzFFM1xcdTMxRUZcXHUzMjAwLVxcdTMyMUVcXHUzMjJBLVxcdTMyNDdcXHUzMjUwXFx1MzI2MC1cXHUzMjdGXFx1MzI4QS1cXHUzMkIwXFx1MzJDMC1cXHUzM0ZGXFx1NERDMC1cXHU0REZGXFx1QTQ5MC1cXHVBNEM2XFx1QTcwMC1cXHVBNzE2XFx1QTcyMFxcdUE3MjFcXHVBNzg5XFx1QTc4QVxcdUE4MjgtXFx1QTgyQlxcdUE4MzYtXFx1QTgzOVxcdUFBNzctXFx1QUE3OVxcdUFCNUJcXHVBQjZBXFx1QUI2QlxcdUZCMjlcXHVGQkIyLVxcdUZCQzJcXHVGRDQwLVxcdUZENEZcXHVGRENGXFx1RkRGQy1cXHVGREZGXFx1RkU2MlxcdUZFNjQtXFx1RkU2NlxcdUZFNjlcXHVGRjA0XFx1RkYwQlxcdUZGMUMtXFx1RkYxRVxcdUZGM0VcXHVGRjQwXFx1RkY1Q1xcdUZGNUVcXHVGRkUwLVxcdUZGRTZcXHVGRkU4LVxcdUZGRUVcXHVGRkZDXFx1RkZGRF18XFx1RDgwMFtcXHVERDM3LVxcdUREM0ZcXHVERDc5LVxcdUREODlcXHVERDhDLVxcdUREOEVcXHVERDkwLVxcdUREOUNcXHVEREEwXFx1REREMC1cXHVEREZDXXxcXHVEODAyW1xcdURDNzdcXHVEQzc4XFx1REVDOF18XFx1RDgwNVxcdURGM0Z8XFx1RDgwN1tcXHVERkQ1LVxcdURGRjFdfFxcdUQ4MUFbXFx1REYzQy1cXHVERjNGXFx1REY0NV18XFx1RDgyRlxcdURDOUN8XFx1RDgzM1tcXHVERjUwLVxcdURGQzNdfFxcdUQ4MzRbXFx1REMwMC1cXHVEQ0Y1XFx1REQwMC1cXHVERDI2XFx1REQyOS1cXHVERDY0XFx1REQ2QS1cXHVERDZDXFx1REQ4M1xcdUREODRcXHVERDhDLVxcdUREQTlcXHVEREFFLVxcdURERUFcXHVERTAwLVxcdURFNDFcXHVERTQ1XFx1REYwMC1cXHVERjU2XXxcXHVEODM1W1xcdURFQzFcXHVERURCXFx1REVGQlxcdURGMTVcXHVERjM1XFx1REY0RlxcdURGNkZcXHVERjg5XFx1REZBOVxcdURGQzNdfFxcdUQ4MzZbXFx1REMwMC1cXHVEREZGXFx1REUzNy1cXHVERTNBXFx1REU2RC1cXHVERTc0XFx1REU3Ni1cXHVERTgzXFx1REU4NVxcdURFODZdfFxcdUQ4MzhbXFx1REQ0RlxcdURFRkZdfFxcdUQ4M0JbXFx1RENBQ1xcdURDQjBcXHVERDJFXFx1REVGMFxcdURFRjFdfFxcdUQ4M0NbXFx1REMwMC1cXHVEQzJCXFx1REMzMC1cXHVEQzkzXFx1RENBMC1cXHVEQ0FFXFx1RENCMS1cXHVEQ0JGXFx1RENDMS1cXHVEQ0NGXFx1RENEMS1cXHVEQ0Y1XFx1REQwRC1cXHVEREFEXFx1RERFNi1cXHVERTAyXFx1REUxMC1cXHVERTNCXFx1REU0MC1cXHVERTQ4XFx1REU1MFxcdURFNTFcXHVERTYwLVxcdURFNjVcXHVERjAwLVxcdURGRkZdfFxcdUQ4M0RbXFx1REMwMC1cXHVERUQ3XFx1REVEQy1cXHVERUVDXFx1REVGMC1cXHVERUZDXFx1REYwMC1cXHVERjc2XFx1REY3Qi1cXHVERkQ5XFx1REZFMC1cXHVERkVCXFx1REZGMF18XFx1RDgzRVtcXHVEQzAwLVxcdURDMEJcXHVEQzEwLVxcdURDNDdcXHVEQzUwLVxcdURDNTlcXHVEQzYwLVxcdURDODdcXHVEQzkwLVxcdURDQURcXHVEQ0IwXFx1RENCMVxcdUREMDAtXFx1REU1M1xcdURFNjAtXFx1REU2RFxcdURFNzAtXFx1REU3Q1xcdURFODAtXFx1REU4OFxcdURFOTAtXFx1REVCRFxcdURFQkYtXFx1REVDNVxcdURFQ0UtXFx1REVEQlxcdURFRTAtXFx1REVFOFxcdURFRjAtXFx1REVGOFxcdURGMDAtXFx1REY5MlxcdURGOTQtXFx1REZDQV0vO1xuXG52YXIgcmVnZXggPSAvWyBcXHhBMFxcdTE2ODBcXHUyMDAwLVxcdTIwMEFcXHUyMDI4XFx1MjAyOVxcdTIwMkZcXHUyMDVGXFx1MzAwMF0vO1xuXG5leHBvcnRzLkFueSA9IHJlZ2V4JDU7XG5leHBvcnRzLkNjID0gcmVnZXgkNDtcbmV4cG9ydHMuQ2YgPSByZWdleCQzO1xuZXhwb3J0cy5QID0gcmVnZXgkMjtcbmV4cG9ydHMuUyA9IHJlZ2V4JDE7XG5leHBvcnRzLlogPSByZWdleDtcbiIsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsICIndXNlIHN0cmljdCc7XG5cbnZhciB1Y19taWNybyA9IHJlcXVpcmUoJ3VjLm1pY3JvJyk7XG5cbmZ1bmN0aW9uIHJlRmFjdG9yeSAob3B0cykge1xuICBjb25zdCByZSA9IHt9O1xuICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICByZS5zcmNfQW55ID0gdWNfbWljcm8uQW55LnNvdXJjZTtcbiAgcmUuc3JjX0NjID0gdWNfbWljcm8uQ2Muc291cmNlO1xuICByZS5zcmNfWiA9IHVjX21pY3JvLlouc291cmNlO1xuICByZS5zcmNfUCA9IHVjX21pY3JvLlAuc291cmNlO1xuXG4gIC8vIFxccHtcXFpcXFBcXENjXFxDRn0gKHdoaXRlIHNwYWNlcyArIGNvbnRyb2wgKyBmb3JtYXQgKyBwdW5jdHVhdGlvbilcbiAgcmUuc3JjX1pQQ2MgPSBbcmUuc3JjX1osIHJlLnNyY19QLCByZS5zcmNfQ2NdLmpvaW4oJ3wnKTtcblxuICAvLyBcXHB7XFxaXFxDY30gKHdoaXRlIHNwYWNlcyArIGNvbnRyb2wpXG4gIHJlLnNyY19aQ2MgPSBbcmUuc3JjX1osIHJlLnNyY19DY10uam9pbignfCcpO1xuXG4gIC8vIEV4cGVyaW1lbnRhbC4gTGlzdCBvZiBjaGFycywgY29tcGxldGVseSBwcm9oaWJpdGVkIGluIGxpbmtzXG4gIC8vIGJlY2F1c2UgY2FuIHNlcGFyYXRlIGl0IGZyb20gb3RoZXIgcGFydCBvZiB0ZXh0XG4gIGNvbnN0IHRleHRfc2VwYXJhdG9ycyA9ICdbPjxcXHVmZjVjXSc7XG5cbiAgLy8gQWxsIHBvc3NpYmxlIHdvcmQgY2hhcmFjdGVycyAoZXZlcnl0aGluZyB3aXRob3V0IHB1bmN0dWF0aW9uLCBzcGFjZXMgJiBjb250cm9scylcbiAgLy8gRGVmaW5lZCB2aWEgcHVuY3R1YXRpb24gJiBzcGFjZXMgdG8gc2F2ZSBzcGFjZVxuICAvLyBTaG91bGQgYmUgc29tZXRoaW5nIGxpa2UgXFxwe1xcTFxcTlxcU1xcTX0gKFxcdyBidXQgd2l0aG91dCBgX2ApXG4gIHJlLnNyY19wc2V1ZG9fbGV0dGVyID0gYCg/Oig/ISR7dGV4dF9zZXBhcmF0b3JzfXwke3JlLnNyY19aUENjfSkke3JlLnNyY19Bbnl9KWA7XG4gIC8vIFRoZSBzYW1lIGFzIGFib3RoZSBidXQgd2l0aG91dCBbMC05XVxuICAvLyB2YXIgc3JjX3BzZXVkb19sZXR0ZXJfbm9uX2QgPSAnKD86KD8hWzAtOV18JyArIHNyY19aUENjICsgJyknICsgc3JjX0FueSArICcpJztcblxuICByZS5zcmNfaXA0ID1cblxuICAgICcoPzooMjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KVxcXFwuKXszfSgyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pJztcblxuICAvLyBQcm9oaWJpdCBhbnkgb2YgXCJAL1tdKClcIiBpbiB1c2VyL3Bhc3MgdG8gYXZvaWQgd3JvbmcgZG9tYWluIGZldGNoLlxuICAvLyBMZW5ndGggaXMgY2FwcGVkIHRvIGV4Y2x1ZGUgcG9zc2libGUgcmVzY2FucyB0aWxsIHRoZSBlbmQgYW5kIGF2b2lkIE8obl4yKVxuICAvLyBEb1MuIE5vIHN0YW5kYXJkIGxpbWl0LCBqdXN0IHRha2Ugc29tZXRoaW5nIHJlYXNvbmFibGUuXG4gIHJlLnNyY19hdXRoID0gYCg/Oig/Oig/ISR7cmUuc3JjX1pDY318W0AvXFxcXFtcXFxcXSgpXSkuKXsxLDUwfUApP2A7XG5cbiAgcmUuc3JjX3BvcnQgPVxuXG4gICAgJyg/OjooPzo2KD86WzAtNF1cXFxcZHszfXw1KD86WzAtNF1cXFxcZHsyfXw1KD86WzAtMl1cXFxcZHwzWzAtNV0pKSl8WzEtNV0/XFxcXGR7MSw0fSkpPyc7XG5cbiAgcmUuc3JjX2hvc3RfdGVybWluYXRvciA9XG5cbiAgICBgKD89JHwke3RleHRfc2VwYXJhdG9yc318JHtyZS5zcmNfWlBDY30pYCArXG4gICAgYCg/ISR7b3B0c1snLS0tJ10gPyAnLSg/IS0tKXwnIDogJy18J31ffDpcXFxcZHxcXFxcLi18XFxcXC4oPyEkfCR7cmUuc3JjX1pQQ2N9KSlgO1xuXG4gIHJlLnNyY19wYXRoID1cblxuICAgICcoPzonICtcbiAgICAgICdbLz8jXScgK1xuICAgICAgICAnKD86JyArXG4gICAgICAgICAgYCg/ISR7cmUuc3JjX1pDY318JHt0ZXh0X3NlcGFyYXRvcnN9fFsoKVtcXFxcXXt9LixcIic/IVxcXFwtO10pLnxgICtcbiAgICAgICAgICBgXFxcXFsoPzooPyEke3JlLnNyY19aQ2N9fFxcXFxdKS4pKlxcXFxdfGAgK1xuICAgICAgICAgIGBcXFxcKCg/Oig/ISR7cmUuc3JjX1pDY318WyldKS4pKlxcXFwpfGAgK1xuICAgICAgICAgIGBcXFxceyg/Oig/ISR7cmUuc3JjX1pDY318W31dKS4pKlxcXFx9fGAgK1xuICAgICAgICAgIGBcXFxcXCIoPzooPyEke3JlLnNyY19aQ2N9fFtcIl0pLikrXFxcXFwifGAgK1xuICAgICAgICAgIGBcXFxcJyg/Oig/ISR7cmUuc3JjX1pDY318WyddKS4pK1xcXFwnfGAgK1xuXG4gICAgICAgICAgLy8gYWxsb3cgYEknbV9raW5nYCBpZiBubyBwYWlyIGZvdW5kXG4gICAgICAgICAgYFxcXFwnKD89JHtyZS5zcmNfcHNldWRvX2xldHRlcn18Wy1dKXxgICtcblxuICAgICAgICAgIC8vIGdvb2dsZSBoYXMgbWFueSBkb3RzIGluIFwiZ29vZ2xlIHNlYXJjaFwiIGxpbmtzICgjNjYsICM4MSkuXG4gICAgICAgICAgLy8gZ2l0aHViIGhhcyAuLi4gaW4gY29tbWl0IHJhbmdlIGxpbmtzLFxuICAgICAgICAgIC8vIFJlc3RyaWN0IHRvXG4gICAgICAgICAgLy8gLSBlbmdsaXNoXG4gICAgICAgICAgLy8gLSBwZXJjZW50LWVuY29kZWRcbiAgICAgICAgICAvLyAtIHBhcnRzIG9mIGZpbGUgcGF0aFxuICAgICAgICAgIC8vIC0gcGFyYW1zIHNlcGFyYXRvclxuICAgICAgICAgIC8vIHVudGlsIG1vcmUgZXhhbXBsZXMgZm91bmQuXG4gICAgICAgICAgJ1xcXFwuezIsfVthLXpBLVowLTklLyZdfCcgK1xuXG4gICAgICAgICAgYFxcXFwuKD8hJHtyZS5zcmNfWkNjfXxbLl18JCl8YCArXG4gICAgICAgICAgKG9wdHNbJy0tLSddXG4gICAgICAgICAgICA/ICdcXFxcLSg/IS0tKD86W14tXXwkKSkoPzotKil8JyAvLyBgLS0tYCA9PiBsb25nIGRhc2gsIHRlcm1pbmF0ZVxuICAgICAgICAgICAgOiAnXFxcXC0rfCdcbiAgICAgICAgICApICtcbiAgICAgICAgICAvLyBhbGxvdyBgLCwsYCBpbiBwYXRoc1xuICAgICAgICAgIGAsKD8hJHtyZS5zcmNfWkNjfXwkKXxgICtcblxuICAgICAgICAgIC8vIGFsbG93IGA7YCBpZiBub3QgZm9sbG93ZWQgYnkgc3BhY2UtbGlrZSBjaGFyXG4gICAgICAgICAgYDsoPyEke3JlLnNyY19aQ2N9fCQpfGAgK1xuXG4gICAgICAgICAgLy8gYWxsb3cgYCEhIWAgaW4gcGF0aHMsIGJ1dCBub3QgYXQgdGhlIGVuZFxuICAgICAgICAgIGBcXFxcISsoPyEke3JlLnNyY19aQ2N9fFshXXwkKXxgICtcblxuICAgICAgICAgIGBcXFxcPyg/ISR7cmUuc3JjX1pDY318Wz9dfCQpYCArXG4gICAgICAgICcpKycgK1xuICAgICAgJ3xcXFxcLycgK1xuICAgICcpPyc7XG5cbiAgLy8gQWxsb3cgYW55dGhpbmcgaW4gbWFya2Rvd24gc3BlYywgZm9yYmlkIHF1b3RlIChcIikgYXQgdGhlIGZpcnN0IHBvc2l0aW9uXG4gIC8vIGJlY2F1c2UgZW1haWxzIGVuY2xvc2VkIGluIHF1b3RlcyBhcmUgZmFyIG1vcmUgY29tbW9uXG4gIC8vIE1heCBuYW1lIGxlbmd0aCBjYXBwZWQgdG8gNjQgY2hhcnMgKFJGQyA1MzIxKS4gVGhpcyBhbHNvIHByZXZlbnRzIE8obl4yKVxuICAvLyByZXNjYW5zIHRvIHRoZSBlbmQgb24gaW5wdXRzIGxpa2UgYG1haWx0bzptYWlsdG86Li4uYFxuICByZS5zcmNfZW1haWxfbmFtZSA9XG5cbiAgICAnW1xcXFwtOzomPVxcXFwrXFxcXCQsXFxcXC5hLXpBLVowLTlfXVtcXFxcLTs6Jj1cXFxcK1xcXFwkLFxcXFxcIlxcXFwuYS16QS1aMC05X117MCw2M30nO1xuXG4gIHJlLnNyY194biA9XG5cbiAgICAneG4tLVthLXowLTlcXFxcLV17MSw1OX0nO1xuXG4gIC8vIE1vcmUgdG8gcmVhZCBhYm91dCBkb21haW4gbmFtZXNcbiAgLy8gaHR0cDovL3NlcnZlcmZhdWx0LmNvbS9xdWVzdGlvbnMvNjM4MjYwL1xuXG4gIHJlLnNyY19kb21haW5fcm9vdCA9XG5cbiAgICAvLyBBbGxvdyBsZXR0ZXJzICYgZGlnaXRzIChodHRwOi8vdGVzdDEpXG4gICAgJyg/OicgK1xuICAgICAgcmUuc3JjX3huICtcbiAgICAgICd8JyArXG4gICAgICBgJHtyZS5zcmNfcHNldWRvX2xldHRlcn17MSw2M31gICtcbiAgICAnKSc7XG5cbiAgcmUuc3JjX2RvbWFpbiA9XG5cbiAgICAnKD86JyArXG4gICAgICByZS5zcmNfeG4gK1xuICAgICAgJ3wnICtcbiAgICAgIGAoPzoke3JlLnNyY19wc2V1ZG9fbGV0dGVyfSlgICtcbiAgICAgICd8JyArXG4gICAgICBgKD86JHtyZS5zcmNfcHNldWRvX2xldHRlcn0oPzotfCR7cmUuc3JjX3BzZXVkb19sZXR0ZXJ9KXswLDYxfSR7cmUuc3JjX3BzZXVkb19sZXR0ZXJ9KWAgK1xuICAgICcpJztcblxuICByZS5zcmNfaG9zdCA9XG5cbiAgICAnKD86JyArXG4gICAgLy8gRG9uJ3QgbmVlZCBJUCBjaGVjaywgYmVjYXVzZSBkaWdpdHMgYXJlIGFscmVhZHkgYWxsb3dlZCBpbiBub3JtYWwgZG9tYWluIG5hbWVzXG4gICAgLy8gICBzcmNfaXA0ICtcbiAgICAvLyAnfCcgK1xuICAgICAgYCg/Oig/Oig/OiR7cmUuc3JjX2RvbWFpbn0pXFxcXC4pKiR7cmUuc3JjX2RvbWFpbn0pYC8qIF9yb290ICovICtcbiAgICAnKSc7XG5cbiAgcmUudHBsX2hvc3RfZnV6enkgPVxuXG4gICAgJyg/OicgK1xuICAgICAgcmUuc3JjX2lwNCArXG4gICAgJ3wnICtcbiAgICAgIGAoPzooPzooPzoke3JlLnNyY19kb21haW59KVxcXFwuKSsoPzolVExEUyUpKWAgK1xuICAgICcpJztcblxuICByZS50cGxfaG9zdF9ub19pcF9mdXp6eSA9XG5cbiAgICBgKD86KD86KD86JHtyZS5zcmNfZG9tYWlufSlcXFxcLikrKD86JVRMRFMlKSlgO1xuXG4gIHJlLnNyY19ob3N0X3N0cmljdCA9XG5cbiAgICByZS5zcmNfaG9zdCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUudHBsX2hvc3RfZnV6enlfc3RyaWN0ID1cblxuICAgIHJlLnRwbF9ob3N0X2Z1enp5ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICByZS5zcmNfaG9zdF9wb3J0X3N0cmljdCA9XG5cbiAgICByZS5zcmNfaG9zdCArIHJlLnNyY19wb3J0ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICByZS50cGxfaG9zdF9wb3J0X2Z1enp5X3N0cmljdCA9XG5cbiAgICByZS50cGxfaG9zdF9mdXp6eSArIHJlLnNyY19wb3J0ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICByZS50cGxfaG9zdF9wb3J0X25vX2lwX2Z1enp5X3N0cmljdCA9XG5cbiAgICByZS50cGxfaG9zdF9ub19pcF9mdXp6eSArIHJlLnNyY19wb3J0ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICAvL1xuICAvLyBNYWluIHJ1bGVzXG4gIC8vXG5cbiAgLy8gUnVkZSB0ZXN0IGZ1enp5IGxpbmtzIGJ5IGhvc3QsIGZvciBxdWljayBkZW55XG4gIHJlLnRwbF9ob3N0X2Z1enp5X3Rlc3QgPVxuXG4gICAgYGxvY2FsaG9zdHx3d3dcXFxcLnxcXFxcLlxcXFxkezEsM31cXFxcLnwoPzpcXFxcLig/OiVUTERTJSkoPzoke3JlLnNyY19aUENjfXw+fCQpKWA7XG5cbiAgcmUudHBsX2VtYWlsX2Z1enp5ID1cblxuICAgICAgYChefCR7dGV4dF9zZXBhcmF0b3JzfXxcInxcXFxcKHwke3JlLnNyY19aQ2N9KWAgK1xuICAgICAgYCgke3JlLnNyY19lbWFpbF9uYW1lfUAke3JlLnRwbF9ob3N0X2Z1enp5X3N0cmljdH0pYDtcblxuICByZS50cGxfbGlua19mdXp6eSA9XG4gICAgICAvLyBGdXp6eSBsaW5rIGNhbid0IGJlIHByZXBlbmRlZCB3aXRoIC46L1xcLSBhbmQgbm9uIHB1bmN0dWF0aW9uLlxuICAgICAgLy8gYnV0IGNhbiBzdGFydCB3aXRoID4gKG1hcmtkb3duIGJsb2NrcXVvdGUpXG4gICAgICBgKF58KD8hWy46L1xcXFwtX0BdKSg/OlskKzw9Pl5cXGB8XFx1ZmY1Y118JHtyZS5zcmNfWlBDY30pKWAgK1xuICAgICAgYCgoPyFbJCs8PT5eXFxgfFxcdWZmNWNdKSR7cmUudHBsX2hvc3RfcG9ydF9mdXp6eV9zdHJpY3R9JHtyZS5zcmNfcGF0aH0pYDtcblxuICByZS50cGxfbGlua19ub19pcF9mdXp6eSA9XG4gICAgICAvLyBGdXp6eSBsaW5rIGNhbid0IGJlIHByZXBlbmRlZCB3aXRoIC46L1xcLSBhbmQgbm9uIHB1bmN0dWF0aW9uLlxuICAgICAgLy8gYnV0IGNhbiBzdGFydCB3aXRoID4gKG1hcmtkb3duIGJsb2NrcXVvdGUpXG4gICAgICBgKF58KD8hWy46L1xcXFwtX0BdKSg/OlskKzw9Pl5cXGB8XFx1ZmY1Y118JHtyZS5zcmNfWlBDY30pKWAgK1xuICAgICAgYCgoPyFbJCs8PT5eXFxgfFxcdWZmNWNdKSR7cmUudHBsX2hvc3RfcG9ydF9ub19pcF9mdXp6eV9zdHJpY3R9JHtyZS5zcmNfcGF0aH0pYDtcblxuICByZXR1cm4gcmVcbn1cblxuLy9cbi8vIEhlbHBlcnNcbi8vXG5cbi8vIE1lcmdlIG9iamVjdHNcbi8vXG5mdW5jdGlvbiBhc3NpZ24gKG9iaiAvKiBmcm9tMSwgZnJvbTIsIGZyb20zLCAuLi4gKi8pIHtcbiAgY29uc3Qgc291cmNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoIXNvdXJjZSkgeyByZXR1cm4gfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmpcbn1cblxuZnVuY3Rpb24gX2NsYXNzIChvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopIH1cbmZ1bmN0aW9uIGlzU3RyaW5nIChvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJyB9XG5mdW5jdGlvbiBpc09iamVjdCAob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgfVxuZnVuY3Rpb24gaXNSZWdFeHAgKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nIH1cbmZ1bmN0aW9uIGlzRnVuY3Rpb24gKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScgfVxuXG5mdW5jdGlvbiBlc2NhcGVSRSAoc3RyKSB7IHJldHVybiBzdHIucmVwbGFjZSgvWy4/KiteJFtcXF1cXFxcKCl7fXwtXS9nLCAnXFxcXCQmJykgfVxuXG4vL1xuXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgZnV6enlMaW5rOiB0cnVlLFxuICBmdXp6eUVtYWlsOiB0cnVlLFxuICBmdXp6eUlQOiBmYWxzZVxufTtcblxuZnVuY3Rpb24gaXNPcHRpb25zT2JqIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaiB8fCB7fSkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGspIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zICovXG4gICAgcmV0dXJuIGFjYyB8fCBkZWZhdWx0T3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKVxuICB9LCBmYWxzZSlcbn1cblxuY29uc3QgZGVmYXVsdFNjaGVtYXMgPSB7XG4gICdodHRwOic6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLmh0dHApIHtcbiAgICAgICAgLy8gY29tcGlsZSBsYXppbHksIGJlY2F1c2UgXCJob3N0XCItY29udGFpbmluZyB2YXJpYWJsZXMgY2FuIGNoYW5nZSBvbiB0bGRzIHVwZGF0ZS5cbiAgICAgICAgc2VsZi5yZS5odHRwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICBgXlxcXFwvXFxcXC8ke3NlbGYucmUuc3JjX2F1dGh9JHtzZWxmLnJlLnNyY19ob3N0X3BvcnRfc3RyaWN0fSR7c2VsZi5yZS5zcmNfcGF0aH1gLCAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLnJlLmh0dHAudGVzdCh0YWlsKSkge1xuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLmh0dHApWzBdLmxlbmd0aFxuICAgICAgfVxuICAgICAgcmV0dXJuIDBcbiAgICB9XG4gIH0sXG4gICdodHRwczonOiAnaHR0cDonLFxuICAnZnRwOic6ICdodHRwOicsXG4gICcvLyc6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLm5vX2h0dHApIHtcbiAgICAgIC8vIGNvbXBpbGUgbGF6aWx5LCBiZWNhdXNlIFwiaG9zdFwiLWNvbnRhaW5pbmcgdmFyaWFibGVzIGNhbiBjaGFuZ2Ugb24gdGxkcyB1cGRhdGUuXG4gICAgICAgIHNlbGYucmUubm9faHR0cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14nICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19hdXRoICtcbiAgICAgICAgICAvLyBEb24ndCBhbGxvdyBzaW5nbGUtbGV2ZWwgZG9tYWlucywgYmVjYXVzZSBvZiBmYWxzZSBwb3NpdGl2ZXMgbGlrZSAnLy90ZXN0J1xuICAgICAgICAgIC8vIHdpdGggY29kZSBjb21tZW50c1xuICAgICAgICAgIGAoPzpsb2NhbGhvc3R8KD86KD86JHtzZWxmLnJlLnNyY19kb21haW59KVxcXFwuKSske3NlbGYucmUuc3JjX2RvbWFpbl9yb290fSlgICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19wb3J0ICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19ob3N0X3Rlcm1pbmF0b3IgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX3BhdGgsXG5cbiAgICAgICAgICAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGYucmUubm9faHR0cC50ZXN0KHRhaWwpKSB7XG4gICAgICAgIC8vIHNob3VsZCBub3QgYmUgYDovL2AgJiBgLy8vYCwgdGhhdCBwcm90ZWN0cyBmcm9tIGVycm9ycyBpbiBwcm90b2NvbCBuYW1lXG4gICAgICAgIGlmIChwb3MgPj0gMyAmJiB0ZXh0W3BvcyAtIDNdID09PSAnOicpIHsgcmV0dXJuIDAgfVxuICAgICAgICBpZiAocG9zID49IDMgJiYgdGV4dFtwb3MgLSAzXSA9PT0gJy8nKSB7IHJldHVybiAwIH1cbiAgICAgICAgcmV0dXJuIHRhaWwubWF0Y2goc2VsZi5yZS5ub19odHRwKVswXS5sZW5ndGhcbiAgICAgIH1cbiAgICAgIHJldHVybiAwXG4gICAgfVxuICB9LFxuICAnbWFpbHRvOic6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLm1haWx0bykge1xuICAgICAgICBzZWxmLnJlLm1haWx0byA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgYF4ke3NlbGYucmUuc3JjX2VtYWlsX25hbWV9QCR7c2VsZi5yZS5zcmNfaG9zdF9zdHJpY3R9YCwgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5yZS5tYWlsdG8udGVzdCh0YWlsKSkge1xuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLm1haWx0bylbMF0ubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgfVxufTtcblxuLy8gUkUgcGF0dGVybiBmb3IgMi1jaGFyYWN0ZXIgdGxkcyAoYXV0b2dlbmVyYXRlZCBieSAuL3N1cHBvcnQvdGxkc18yY2hhcl9nZW4uanMpXG5jb25zdCB0bGRzXzJjaF9zcmNfcmUgPSAnYVtjZGVmZ2lsbW5vcXJzdHV3eHpdfGJbYWJkZWZnaGlqbW5vcnN0dnd5el18Y1thY2RmZ2hpa2xtbm9ydXZ3eHl6XXxkW2Vqa21vel18ZVtjZWdyc3R1XXxmW2lqa21vcl18Z1thYmRlZmdoaWxtbnBxcnN0dXd5XXxoW2ttbnJ0dV18aVtkZWxtbm9xcnN0XXxqW2Vtb3BdfGtbZWdoaW1ucHJ3eXpdfGxbYWJjaWtyc3R1dnldfG1bYWNkZWdoa2xtbm9wcXJzdHV2d3h5el18blthY2VmZ2lsb3BydXpdfG9tfHBbYWVmZ2hrbG1ucnN0d3ldfHFhfHJbZW9zdXddfHNbYWJjZGVnaGlqa2xtbm9ydHV2eHl6XXx0W2NkZmdoamtsbW5vcnR2d3pdfHVbYWdrc3l6XXx2W2FjZWdpbnVdfHdbZnNdfHlbZXRdfHpbYW13XSc7XG5cbi8vIERPTidUIHRyeSB0byBtYWtlIFBScyB3aXRoIGNoYW5nZXMuIEV4dGVuZCBUTERzIHdpdGggTGlua2lmeUl0LnRsZHMoKSBpbnN0ZWFkXG5jb25zdCB0bGRzX2RlZmF1bHQgPSAnYml6fGNvbXxlZHV8Z292fG5ldHxvcmd8cHJvfHdlYnx4eHh8YWVyb3xhc2lhfGNvb3B8aW5mb3xtdXNldW18bmFtZXxzaG9wfFx1MDQ0MFx1MDQ0NCcuc3BsaXQoJ3wnKTtcblxuZnVuY3Rpb24gY3JlYXRlVmFsaWRhdG9yIChyZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHRleHQsIHBvcykge1xuICAgIGNvbnN0IHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICBpZiAocmUudGVzdCh0YWlsKSkge1xuICAgICAgcmV0dXJuIHRhaWwubWF0Y2gocmUpWzBdLmxlbmd0aFxuICAgIH1cbiAgICByZXR1cm4gMFxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vcm1hbGl6ZXIgKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKG1hdGNoLCBzZWxmKSB7XG4gICAgc2VsZi5ub3JtYWxpemUobWF0Y2gpO1xuICB9XG59XG5cbi8vIFNjaGVtYXMgY29tcGlsZXIuIEJ1aWxkIHJlZ2V4cHMuXG4vL1xuZnVuY3Rpb24gY29tcGlsZSAoc2VsZikge1xuICAvLyBMb2FkICYgY2xvbmUgUkUgcGF0dGVybnMuXG4gIGNvbnN0IHJlID0gc2VsZi5yZSA9IHJlRmFjdG9yeShzZWxmLl9fb3B0c19fKTtcblxuICAvLyBEZWZpbmUgZHluYW1pYyBwYXR0ZXJuc1xuICBjb25zdCB0bGRzID0gc2VsZi5fX3RsZHNfXy5zbGljZSgpO1xuXG4gIHNlbGYub25Db21waWxlKCk7XG5cbiAgaWYgKCFzZWxmLl9fdGxkc19yZXBsYWNlZF9fKSB7XG4gICAgdGxkcy5wdXNoKHRsZHNfMmNoX3NyY19yZSk7XG4gIH1cbiAgdGxkcy5wdXNoKHJlLnNyY194bik7XG5cbiAgcmUuc3JjX3RsZHMgPSB0bGRzLmpvaW4oJ3wnKTtcblxuICBmdW5jdGlvbiB1bnRwbCAodHBsKSB7IHJldHVybiB0cGwucmVwbGFjZSgnJVRMRFMlJywgcmUuc3JjX3RsZHMpIH1cblxuICByZS5lbWFpbF9mdXp6eSA9IFJlZ0V4cCh1bnRwbChyZS50cGxfZW1haWxfZnV6enkpLCAnaScpO1xuICByZS5lbWFpbF9mdXp6eV9nbG9iYWwgPSBSZWdFeHAodW50cGwocmUudHBsX2VtYWlsX2Z1enp5KSwgJ2lnJyk7XG4gIHJlLmxpbmtfZnV6enkgPSBSZWdFeHAodW50cGwocmUudHBsX2xpbmtfZnV6enkpLCAnaScpO1xuICByZS5saW5rX2Z1enp5X2dsb2JhbCA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19mdXp6eSksICdpZycpO1xuICByZS5saW5rX25vX2lwX2Z1enp5ID0gUmVnRXhwKHVudHBsKHJlLnRwbF9saW5rX25vX2lwX2Z1enp5KSwgJ2knKTtcbiAgcmUubGlua19ub19pcF9mdXp6eV9nbG9iYWwgPSBSZWdFeHAodW50cGwocmUudHBsX2xpbmtfbm9faXBfZnV6enkpLCAnaWcnKTtcbiAgcmUuaG9zdF9mdXp6eV90ZXN0ID0gUmVnRXhwKHVudHBsKHJlLnRwbF9ob3N0X2Z1enp5X3Rlc3QpLCAnaScpO1xuXG4gIC8vXG4gIC8vIENvbXBpbGUgZWFjaCBzY2hlbWFcbiAgLy9cblxuICBjb25zdCBhbGlhc2VzID0gW107XG5cbiAgc2VsZi5fX2NvbXBpbGVkX18gPSB7fTsgLy8gUmVzZXQgY29tcGlsZWQgZGF0YVxuXG4gIGZ1bmN0aW9uIHNjaGVtYUVycm9yIChuYW1lLCB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYChMaW5raWZ5SXQpIEludmFsaWQgc2NoZW1hIFwiJHtuYW1lfVwiOiAke3ZhbH1gKVxuICB9XG5cbiAgT2JqZWN0LmtleXMoc2VsZi5fX3NjaGVtYXNfXykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGNvbnN0IHZhbCA9IHNlbGYuX19zY2hlbWFzX19bbmFtZV07XG5cbiAgICAvLyBza2lwIGRpc2FibGVkIG1ldGhvZHNcbiAgICBpZiAodmFsID09PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBjb21waWxlZCA9IHsgdmFsaWRhdGU6IG51bGwsIGxpbms6IG51bGwgfTtcblxuICAgIHNlbGYuX19jb21waWxlZF9fW25hbWVdID0gY29tcGlsZWQ7XG5cbiAgICBpZiAoaXNPYmplY3QodmFsKSkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbC52YWxpZGF0ZSkpIHtcbiAgICAgICAgY29tcGlsZWQudmFsaWRhdGUgPSBjcmVhdGVWYWxpZGF0b3IodmFsLnZhbGlkYXRlKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWwudmFsaWRhdGUpKSB7XG4gICAgICAgIGNvbXBpbGVkLnZhbGlkYXRlID0gdmFsLnZhbGlkYXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRnVuY3Rpb24odmFsLm5vcm1hbGl6ZSkpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gdmFsLm5vcm1hbGl6ZTtcbiAgICAgIH0gZWxzZSBpZiAoIXZhbC5ub3JtYWxpemUpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gY3JlYXRlTm9ybWFsaXplcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGlzU3RyaW5nKHZhbCkpIHtcbiAgICAgIGFsaWFzZXMucHVzaChuYW1lKTtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHNjaGVtYUVycm9yKG5hbWUsIHZhbCk7XG4gIH0pO1xuXG4gIC8vXG4gIC8vIENvbXBpbGUgcG9zdHBvbmVkIGFsaWFzZXNcbiAgLy9cblxuICBhbGlhc2VzLmZvckVhY2goZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgaWYgKCFzZWxmLl9fY29tcGlsZWRfX1tzZWxmLl9fc2NoZW1hc19fW2FsaWFzXV0pIHtcbiAgICAgIC8vIFNpbGVudGx5IGZhaWwgb24gbWlzc2VkIHNjaGVtYXMgdG8gYXZvaWQgZXJyb25zIG9uIGRpc2FibGUuXG4gICAgICAvLyBzY2hlbWFFcnJvcihhbGlhcywgc2VsZi5fX3NjaGVtYXNfX1thbGlhc10pO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc2VsZi5fX2NvbXBpbGVkX19bYWxpYXNdLnZhbGlkYXRlID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS52YWxpZGF0ZTtcbiAgICBzZWxmLl9fY29tcGlsZWRfX1thbGlhc10ubm9ybWFsaXplID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS5ub3JtYWxpemU7XG4gIH0pO1xuXG4gIC8vXG4gIC8vIEZha2UgcmVjb3JkIGZvciBndWVzc2VkIGxpbmtzXG4gIC8vXG4gIHNlbGYuX19jb21waWxlZF9fWycnXSA9IHsgdmFsaWRhdGU6IG51bGwsIG5vcm1hbGl6ZTogY3JlYXRlTm9ybWFsaXplcigpIH07XG5cbiAgLy9cbiAgLy8gQnVpbGQgc2NoZW1hIGNvbmRpdGlvblxuICAvL1xuICBjb25zdCBzbGlzdCA9IE9iamVjdC5rZXlzKHNlbGYuX19jb21waWxlZF9fKVxuICAgIC5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIC8vIEZpbHRlciBkaXNhYmxlZCAmIGZha2Ugc2NoZW1hc1xuICAgICAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiBzZWxmLl9fY29tcGlsZWRfX1tuYW1lXVxuICAgIH0pXG4gICAgLm1hcChlc2NhcGVSRSlcbiAgICAuam9pbignfCcpO1xuICAvLyAoPyFfKSBjYXVzZSAxLjV4IHNsb3dkb3duXG4gIHNlbGYucmUuc2NoZW1hX3Rlc3QgPSBSZWdFeHAoYChefCg/IV8pKD86Wz48XFx1ZmY1Y118JHtyZS5zcmNfWlBDY30pKSgke3NsaXN0fSlgLCAnaScpO1xuICBzZWxmLnJlLnNjaGVtYV9zZWFyY2ggPSBSZWdFeHAoYChefCg/IV8pKD86Wz48XFx1ZmY1Y118JHtyZS5zcmNfWlBDY30pKSgke3NsaXN0fSlgLCAnaWcnKTtcbiAgc2VsZi5yZS5zY2hlbWFfYXRfc3RhcnQgPSBSZWdFeHAoYF4ke3NlbGYucmUuc2NoZW1hX3NlYXJjaC5zb3VyY2V9YCwgJ2knKTtcblxuICBzZWxmLnJlLnByZXRlc3QgPSBSZWdFeHAoXG4gICAgYCgke3NlbGYucmUuc2NoZW1hX3Rlc3Quc291cmNlfSl8KCR7c2VsZi5yZS5ob3N0X2Z1enp5X3Rlc3Quc291cmNlfSl8QGAsXG4gICAgJ2knXG4gICk7XG59XG5cbi8qKlxuICogY2xhc3MgTWF0Y2hcbiAqXG4gKiBNYXRjaCByZXN1bHQuIFNpbmdsZSBlbGVtZW50IG9mIGFycmF5LCByZXR1cm5lZCBieSBbW0xpbmtpZnlJdCNtYXRjaF1dXG4gKiovXG5mdW5jdGlvbiBNYXRjaCAodGV4dCwgc2NoZW1hLCBpbmRleCwgbGFzdEluZGV4KSB7XG4gIGNvbnN0IHJhdyA9IHRleHQuc2xpY2UoaW5kZXgsIGxhc3RJbmRleCk7XG5cbiAgLyoqXG4gICAqIE1hdGNoI3NjaGVtYSAtPiBTdHJpbmdcbiAgICpcbiAgICogUHJlZml4IChwcm90b2NvbCkgZm9yIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMuc2NoZW1hID0gc2NoZW1hLnRvTG93ZXJDYXNlKCk7XG4gIC8qKlxuICAgKiBNYXRjaCNpbmRleCAtPiBOdW1iZXJcbiAgICpcbiAgICogRmlyc3QgcG9zaXRpb24gb2YgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAvKipcbiAgICogTWF0Y2gjbGFzdEluZGV4IC0+IE51bWJlclxuICAgKlxuICAgKiBOZXh0IHBvc2l0aW9uIGFmdGVyIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMubGFzdEluZGV4ID0gbGFzdEluZGV4O1xuICAvKipcbiAgICogTWF0Y2gjcmF3IC0+IFN0cmluZ1xuICAgKlxuICAgKiBNYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnJhdyA9IHJhdztcbiAgLyoqXG4gICAqIE1hdGNoI3RleHQgLT4gU3RyaW5nXG4gICAqXG4gICAqIE5vdG1hbGl6ZWQgdGV4dCBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnRleHQgPSByYXc7XG4gIC8qKlxuICAgKiBNYXRjaCN1cmwgLT4gU3RyaW5nXG4gICAqXG4gICAqIE5vcm1hbGl6ZWQgdXJsIG9mIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMudXJsID0gcmF3O1xufVxuXG4vKipcbiAqIGNsYXNzIExpbmtpZnlJdFxuICoqL1xuXG4vKipcbiAqIG5ldyBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucylcbiAqIC0gc2NoZW1hcyAoT2JqZWN0KTogT3B0aW9uYWwuIEFkZGl0aW9uYWwgc2NoZW1hcyB0byB2YWxpZGF0ZSAocHJlZml4L3ZhbGlkYXRvcilcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogeyBmdXp6eUxpbmt8ZnV6enlFbWFpbHxmdXp6eUlQOiB0cnVlfGZhbHNlIH1cbiAqXG4gKiBDcmVhdGVzIG5ldyBsaW5raWZpZXIgaW5zdGFuY2Ugd2l0aCBvcHRpb25hbCBhZGRpdGlvbmFsIHNjaGVtYXMuXG4gKiBDYW4gYmUgY2FsbGVkIHdpdGhvdXQgYG5ld2Aga2V5d29yZCBmb3IgY29udmVuaWVuY2UuXG4gKlxuICogQnkgZGVmYXVsdCB1bmRlcnN0YW5kczpcbiAqXG4gKiAtIGBodHRwKHMpOi8vLi4uYCAsIGBmdHA6Ly8uLi5gLCBgbWFpbHRvOi4uLmAgJiBgLy8uLi5gIGxpbmtzXG4gKiAtIFwiZnV6enlcIiBsaW5rcyBhbmQgZW1haWxzIChleGFtcGxlLmNvbSwgZm9vQGJhci5jb20pLlxuICpcbiAqIGBzY2hlbWFzYCBpcyBhbiBvYmplY3QsIHdoZXJlIGVhY2gga2V5L3ZhbHVlIGRlc2NyaWJlcyBwcm90b2NvbC9ydWxlOlxuICpcbiAqIC0gX19rZXlfXyAtIGxpbmsgcHJlZml4ICh1c3VhbGx5LCBwcm90b2NvbCBuYW1lIHdpdGggYDpgIGF0IHRoZSBlbmQsIGBza3lwZTpgXG4gKiAgIGZvciBleGFtcGxlKS4gYGxpbmtpZnktaXRgIG1ha2VzIHNodXJlIHRoYXQgcHJlZml4IGlzIG5vdCBwcmVjZWVkZWQgd2l0aFxuICogICBhbHBoYW51bWVyaWMgY2hhciBhbmQgc3ltYm9scy4gT25seSB3aGl0ZXNwYWNlcyBhbmQgcHVuY3R1YXRpb24gYWxsb3dlZC5cbiAqIC0gX192YWx1ZV9fIC0gcnVsZSB0byBjaGVjayB0YWlsIGFmdGVyIGxpbmsgcHJlZml4XG4gKiAgIC0gX1N0cmluZ18gLSBqdXN0IGFsaWFzIHRvIGV4aXN0aW5nIHJ1bGVcbiAqICAgLSBfT2JqZWN0X1xuICogICAgIC0gX3ZhbGlkYXRlXyAtIHZhbGlkYXRvciBmdW5jdGlvbiAoc2hvdWxkIHJldHVybiBtYXRjaGVkIGxlbmd0aCBvbiBzdWNjZXNzKSxcbiAqICAgICAgIG9yIGBSZWdFeHBgLlxuICogICAgIC0gX25vcm1hbGl6ZV8gLSBvcHRpb25hbCBmdW5jdGlvbiB0byBub3JtYWxpemUgdGV4dCAmIHVybCBvZiBtYXRjaGVkIHJlc3VsdFxuICogICAgICAgKGZvciBleGFtcGxlLCBmb3IgQHR3aXR0ZXIgbWVudGlvbnMpLlxuICpcbiAqIGBvcHRpb25zYDpcbiAqXG4gKiAtIF9fZnV6enlMaW5rX18gLSByZWNvZ25pZ2UgVVJMLXMgd2l0aG91dCBgaHR0cChzKTpgIHByZWZpeC4gRGVmYXVsdCBgdHJ1ZWAuXG4gKiAtIF9fZnV6enlJUF9fIC0gYWxsb3cgSVBzIGluIGZ1enp5IGxpbmtzIGFib3ZlLiBDYW4gY29uZmxpY3Qgd2l0aCBzb21lIHRleHRzXG4gKiAgIGxpa2UgdmVyc2lvbiBudW1iZXJzLiBEZWZhdWx0IGBmYWxzZWAuXG4gKiAtIF9fZnV6enlFbWFpbF9fIC0gcmVjb2duaXplIGVtYWlscyB3aXRob3V0IGBtYWlsdG86YCBwcmVmaXguXG4gKlxuICoqL1xuZnVuY3Rpb24gTGlua2lmeUl0IChzY2hlbWFzLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMaW5raWZ5SXQpKSB7XG4gICAgcmV0dXJuIG5ldyBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucylcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIGlmIChpc09wdGlvbnNPYmooc2NoZW1hcykpIHtcbiAgICAgIG9wdGlvbnMgPSBzY2hlbWFzO1xuICAgICAgc2NoZW1hcyA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuX19vcHRzX18gPSBhc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICB0aGlzLl9fc2NoZW1hc19fID0gYXNzaWduKHt9LCBkZWZhdWx0U2NoZW1hcywgc2NoZW1hcyk7XG4gIHRoaXMuX19jb21waWxlZF9fID0ge307XG5cbiAgdGhpcy5fX3RsZHNfXyA9IHRsZHNfZGVmYXVsdDtcbiAgdGhpcy5fX3RsZHNfcmVwbGFjZWRfXyA9IGZhbHNlO1xuXG4gIHRoaXMucmUgPSB7fTtcblxuICBjb21waWxlKHRoaXMpO1xufVxuXG4vKiogY2hhaW5hYmxlXG4gKiBMaW5raWZ5SXQjYWRkKHNjaGVtYSwgZGVmaW5pdGlvbilcbiAqIC0gc2NoZW1hIChTdHJpbmcpOiBydWxlIG5hbWUgKGZpeGVkIHBhdHRlcm4gcHJlZml4KVxuICogLSBkZWZpbml0aW9uIChTdHJpbmd8UmVnRXhwfE9iamVjdCk6IHNjaGVtYSBkZWZpbml0aW9uXG4gKlxuICogQWRkIG5ldyBydWxlIGRlZmluaXRpb24uIFNlZSBjb25zdHJ1Y3RvciBkZXNjcmlwdGlvbiBmb3IgZGV0YWlscy5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkIChzY2hlbWEsIGRlZmluaXRpb24pIHtcbiAgdGhpcy5fX3NjaGVtYXNfX1tzY2hlbWFdID0gZGVmaW5pdGlvbjtcbiAgY29tcGlsZSh0aGlzKTtcbiAgcmV0dXJuIHRoaXNcbn07XG5cbi8qKiBjaGFpbmFibGVcbiAqIExpbmtpZnlJdCNzZXQob3B0aW9ucylcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogeyBmdXp6eUxpbmt8ZnV6enlFbWFpbHxmdXp6eUlQOiB0cnVlfGZhbHNlIH1cbiAqXG4gKiBTZXQgcmVjb2duaXRpb24gb3B0aW9ucyBmb3IgbGlua3Mgd2l0aG91dCBzY2hlbWEuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAob3B0aW9ucykge1xuICB0aGlzLl9fb3B0c19fID0gYXNzaWduKHRoaXMuX19vcHRzX18sIG9wdGlvbnMpO1xuICByZXR1cm4gdGhpc1xufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjdGVzdCh0ZXh0KSAtPiBCb29sZWFuXG4gKlxuICogU2VhcmNoZXMgbGlua2lmaWFibGUgcGF0dGVybiBhbmQgcmV0dXJucyBgdHJ1ZWAgb24gc3VjY2VzcyBvciBgZmFsc2VgIG9uIGZhaWwuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbiB0ZXN0ICh0ZXh0KSB7XG4gIGlmICghdGV4dC5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBsZXQgbSwgcmU7XG5cbiAgLy8gdHJ5IHRvIHNjYW4gZm9yIGxpbmsgd2l0aCBzY2hlbWEgLSB0aGF0J3MgdGhlIG1vc3Qgc2ltcGxlIHJ1bGVcbiAgaWYgKHRoaXMucmUuc2NoZW1hX3Rlc3QudGVzdCh0ZXh0KSkge1xuICAgIHJlID0gdGhpcy5yZS5zY2hlbWFfc2VhcmNoO1xuICAgIHJlLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnRlc3RTY2hlbWFBdCh0ZXh0LCBtWzJdLCByZS5sYXN0SW5kZXgpKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUxpbmsgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ2h0dHA6J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGxpbmtzXG4gICAgaWYgKHRleHQuc2VhcmNoKHRoaXMucmUuaG9zdF9mdXp6eV90ZXN0KSA+PSAwKSB7XG4gICAgICBpZiAodGV4dC5tYXRjaCh0aGlzLl9fb3B0c19fLmZ1enp5SVAgPyB0aGlzLnJlLmxpbmtfZnV6enkgOiB0aGlzLnJlLmxpbmtfbm9faXBfZnV6enkpICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuX19vcHRzX18uZnV6enlFbWFpbCAmJiB0aGlzLl9fY29tcGlsZWRfX1snbWFpbHRvOiddKSB7XG4gICAgLy8gZ3Vlc3Mgc2NoZW1hbGVzcyBlbWFpbHNcbiAgICBpZiAodGV4dC5pbmRleE9mKCdAJykgPj0gMCkge1xuICAgICAgLy8gV2UgY2FuJ3Qgc2tpcCB0aGlzIGNoZWNrLCBiZWNhdXNlIHRoaXMgY2FzZXMgYXJlIHBvc3NpYmxlOlxuICAgICAgLy8gMTkyLjE2OC4xLjFAZ21haWwuY29tLCBteS5pbkBleGFtcGxlLmNvbVxuICAgICAgaWYgKHRleHQubWF0Y2godGhpcy5yZS5lbWFpbF9mdXp6eSkgIT09IG51bGwpIHsgcmV0dXJuIHRydWUgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjcHJldGVzdCh0ZXh0KSAtPiBCb29sZWFuXG4gKlxuICogVmVyeSBxdWljayBjaGVjaywgdGhhdCBjYW4gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMuIFJldHVybnMgdHJ1ZSBpZiBsaW5rIE1BWSBCRVxuICogY2FuIGV4aXN0cy4gQ2FuIGJlIHVzZWQgZm9yIHNwZWVkIG9wdGltaXphdGlvbiwgd2hlbiB5b3UgbmVlZCB0byBjaGVjayB0aGF0XG4gKiBsaW5rIE5PVCBleGlzdHMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnByZXRlc3QgPSBmdW5jdGlvbiBwcmV0ZXN0ICh0ZXh0KSB7XG4gIHJldHVybiB0aGlzLnJlLnByZXRlc3QudGVzdCh0ZXh0KVxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjdGVzdFNjaGVtYUF0KHRleHQsIG5hbWUsIHBvc2l0aW9uKSAtPiBOdW1iZXJcbiAqIC0gdGV4dCAoU3RyaW5nKTogdGV4dCB0byBzY2FuXG4gKiAtIG5hbWUgKFN0cmluZyk6IHJ1bGUgKHNjaGVtYSkgbmFtZVxuICogLSBwb3NpdGlvbiAoTnVtYmVyKTogdGV4dCBvZmZzZXQgdG8gY2hlY2sgZnJvbVxuICpcbiAqIFNpbWlsYXIgdG8gW1tMaW5raWZ5SXQjdGVzdF1dIGJ1dCBjaGVja3Mgb25seSBzcGVjaWZpYyBwcm90b2NvbCB0YWlsIGV4YWN0bHlcbiAqIGF0IGdpdmVuIHBvc2l0aW9uLiBSZXR1cm5zIGxlbmd0aCBvZiBmb3VuZCBwYXR0ZXJuICgwIG9uIGZhaWwpLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50ZXN0U2NoZW1hQXQgPSBmdW5jdGlvbiB0ZXN0U2NoZW1hQXQgKHRleHQsIHNjaGVtYSwgcG9zKSB7XG4gIC8vIElmIG5vdCBzdXBwb3J0ZWQgc2NoZW1hIGNoZWNrIHJlcXVlc3RlZCAtIHRlcm1pbmF0ZVxuICBpZiAoIXRoaXMuX19jb21waWxlZF9fW3NjaGVtYS50b0xvd2VyQ2FzZSgpXSkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgcmV0dXJuIHRoaXMuX19jb21waWxlZF9fW3NjaGVtYS50b0xvd2VyQ2FzZSgpXS52YWxpZGF0ZSh0ZXh0LCBwb3MsIHRoaXMpXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNtYXRjaCh0ZXh0KSAtPiBBcnJheXxudWxsXG4gKlxuICogUmV0dXJucyBhcnJheSBvZiBmb3VuZCBsaW5rIGRlc2NyaXB0aW9ucyBvciBgbnVsbGAgb24gZmFpbC4gV2Ugc3Ryb25nbHlcbiAqIHJlY29tbWVuZCB0byB1c2UgW1tMaW5raWZ5SXQjdGVzdF1dIGZpcnN0LCBmb3IgYmVzdCBzcGVlZC5cbiAqXG4gKiAjIyMjIyBSZXN1bHQgbWF0Y2ggZGVzY3JpcHRpb25cbiAqXG4gKiAtIF9fc2NoZW1hX18gLSBsaW5rIHNjaGVtYSwgY2FuIGJlIGVtcHR5IGZvciBmdXp6eSBsaW5rcywgb3IgYC8vYCBmb3JcbiAqICAgcHJvdG9jb2wtbmV1dHJhbCAgbGlua3MuXG4gKiAtIF9faW5kZXhfXyAtIG9mZnNldCBvZiBtYXRjaGVkIHRleHRcbiAqIC0gX19sYXN0SW5kZXhfXyAtIGluZGV4IG9mIG5leHQgY2hhciBhZnRlciBtYXRoY2ggZW5kXG4gKiAtIF9fcmF3X18gLSBtYXRjaGVkIHRleHRcbiAqIC0gX190ZXh0X18gLSBub3JtYWxpemVkIHRleHRcbiAqIC0gX191cmxfXyAtIGxpbmssIGdlbmVyYXRlZCBmcm9tIG1hdGNoZWQgdGV4dFxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uIG1hdGNoICh0ZXh0KSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBjb25zdCB0eXBlX3NjaGVtZWQgPSBbXTtcbiAgY29uc3QgdHlwZV9mdXp6eV9saW5rID0gW107XG4gIGNvbnN0IHR5cGVfZnV6enlfZW1haWwgPSBbXTtcbiAgbGV0IG0sIGxlbiwgcmU7XG5cbiAgZnVuY3Rpb24gY2hvb3NlIChhLCBiKSB7XG4gICAgaWYgKCFhKSB7IHJldHVybiBiIH1cbiAgICBpZiAoIWIpIHsgcmV0dXJuIGEgfVxuICAgIGlmIChhLmluZGV4ICE9PSBiLmluZGV4KSB7IHJldHVybiBhLmluZGV4IDwgYi5pbmRleCA/IGEgOiBiIH1cbiAgICByZXR1cm4gYS5sYXN0SW5kZXggPj0gYi5sYXN0SW5kZXggPyBhIDogYlxuICB9XG5cbiAgaWYgKCF0ZXh0Lmxlbmd0aCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgLy8gc2NhbiBmb3IgbGlua3Mgd2l0aCBzY2hlbWFcbiAgaWYgKHRoaXMucmUuc2NoZW1hX3Rlc3QudGVzdCh0ZXh0KSkge1xuICAgIHJlID0gdGhpcy5yZS5zY2hlbWFfc2VhcmNoO1xuICAgIHJlLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcbiAgICAgIGxlbiA9IHRoaXMudGVzdFNjaGVtYUF0KHRleHQsIG1bMl0sIHJlLmxhc3RJbmRleCk7XG4gICAgICBpZiAobGVuKSB7XG4gICAgICAgIHR5cGVfc2NoZW1lZC5wdXNoKHtcbiAgICAgICAgICBzY2hlbWE6IG1bMl0sXG4gICAgICAgICAgaW5kZXg6IG0uaW5kZXggKyBtWzFdLmxlbmd0aCxcbiAgICAgICAgICBsYXN0SW5kZXg6IG0uaW5kZXggKyBtWzBdLmxlbmd0aCArIGxlblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUxpbmsgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ2h0dHA6J10pIHtcbiAgICByZSA9IHRoaXMuX19vcHRzX18uZnV6enlJUCA/IHRoaXMucmUubGlua19mdXp6eV9nbG9iYWwgOiB0aGlzLnJlLmxpbmtfbm9faXBfZnV6enlfZ2xvYmFsO1xuICAgIHJlLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcbiAgICAgIHR5cGVfZnV6enlfbGluay5wdXNoKHtcbiAgICAgICAgc2NoZW1hOiAnJyxcbiAgICAgICAgaW5kZXg6IG0uaW5kZXggKyBtWzFdLmxlbmd0aCxcbiAgICAgICAgbGFzdEluZGV4OiBtLmluZGV4ICsgbVswXS5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9fb3B0c19fLmZ1enp5RW1haWwgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ21haWx0bzonXSkge1xuICAgIHJlID0gdGhpcy5yZS5lbWFpbF9mdXp6eV9nbG9iYWw7XG4gICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgdHlwZV9mdXp6eV9lbWFpbC5wdXNoKHtcbiAgICAgICAgc2NoZW1hOiAnbWFpbHRvOicsXG4gICAgICAgIGluZGV4OiBtLmluZGV4ICsgbVsxXS5sZW5ndGgsXG4gICAgICAgIGxhc3RJbmRleDogbS5pbmRleCArIG1bMF0ubGVuZ3RoXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbmRleGVzID0gWzAsIDAsIDBdO1xuICBsZXQgbGFzdEluZGV4ID0gMDtcblxuICBmb3IgKDs7KSB7XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IFtcbiAgICAgIHR5cGVfc2NoZW1lZFtpbmRleGVzWzBdXSxcbiAgICAgIHR5cGVfZnV6enlfZW1haWxbaW5kZXhlc1sxXV0sXG4gICAgICB0eXBlX2Z1enp5X2xpbmtbaW5kZXhlc1syXV1cbiAgICBdO1xuXG4gICAgY29uc3QgY2FuZGlkYXRlID0gY2hvb3NlKGNob29zZShjYW5kaWRhdGVzWzBdLCBjYW5kaWRhdGVzWzFdKSwgY2FuZGlkYXRlc1syXSk7XG5cbiAgICBpZiAoIWNhbmRpZGF0ZSkgeyBicmVhayB9XG5cbiAgICBpZiAoY2FuZGlkYXRlID09PSBjYW5kaWRhdGVzWzBdKSB7XG4gICAgICBpbmRleGVzWzBdKys7XG4gICAgfSBlbHNlIGlmIChjYW5kaWRhdGUgPT09IGNhbmRpZGF0ZXNbMV0pIHtcbiAgICAgIGluZGV4ZXNbMV0rKztcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZXhlc1syXSsrO1xuICAgIH1cblxuICAgIGlmIChjYW5kaWRhdGUuaW5kZXggPCBsYXN0SW5kZXgpIHsgY29udGludWUgfVxuXG4gICAgY29uc3QgbWF0Y2ggPSBuZXcgTWF0Y2godGV4dCwgY2FuZGlkYXRlLnNjaGVtYSwgY2FuZGlkYXRlLmluZGV4LCBjYW5kaWRhdGUubGFzdEluZGV4KTtcbiAgICB0aGlzLl9fY29tcGlsZWRfX1ttYXRjaC5zY2hlbWFdLm5vcm1hbGl6ZShtYXRjaCwgdGhpcyk7XG4gICAgcmVzdWx0LnB1c2gobWF0Y2gpO1xuICAgIGxhc3RJbmRleCA9IGNhbmRpZGF0ZS5sYXN0SW5kZXg7XG4gIH1cblxuICBpZiAocmVzdWx0Lmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIHJldHVybiBudWxsXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNtYXRjaEF0U3RhcnQodGV4dCkgLT4gTWF0Y2h8bnVsbFxuICpcbiAqIFJldHVybnMgZnVsbHktZm9ybWVkIChub3QgZnV6enkpIGxpbmsgaWYgaXQgc3RhcnRzIGF0IHRoZSBiZWdpbm5pbmdcbiAqIG9mIHRoZSBzdHJpbmcsIGFuZCBudWxsIG90aGVyd2lzZS5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUubWF0Y2hBdFN0YXJ0ID0gZnVuY3Rpb24gbWF0Y2hBdFN0YXJ0ICh0ZXh0KSB7XG4gIGlmICghdGV4dC5sZW5ndGgpIHJldHVybiBudWxsXG5cbiAgY29uc3QgbSA9IHRoaXMucmUuc2NoZW1hX2F0X3N0YXJ0LmV4ZWModGV4dCk7XG4gIGlmICghbSkgcmV0dXJuIG51bGxcblxuICBjb25zdCBsZW4gPSB0aGlzLnRlc3RTY2hlbWFBdCh0ZXh0LCBtWzJdLCBtWzBdLmxlbmd0aCk7XG4gIGlmICghbGVuKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IG1hdGNoID0gbmV3IE1hdGNoKHRleHQsIG1bMl0sIG0uaW5kZXggKyBtWzFdLmxlbmd0aCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoICsgbGVuKTtcblxuICB0aGlzLl9fY29tcGlsZWRfX1ttYXRjaC5zY2hlbWFdLm5vcm1hbGl6ZShtYXRjaCwgdGhpcyk7XG4gIHJldHVybiBtYXRjaFxufTtcblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I3RsZHMobGlzdCBbLCBrZWVwT2xkXSkgLT4gdGhpc1xuICogLSBsaXN0IChBcnJheSk6IGxpc3Qgb2YgdGxkc1xuICogLSBrZWVwT2xkIChCb29sZWFuKTogbWVyZ2Ugd2l0aCBjdXJyZW50IGxpc3QgaWYgYHRydWVgIChgZmFsc2VgIGJ5IGRlZmF1bHQpXG4gKlxuICogTG9hZCAob3IgbWVyZ2UpIG5ldyB0bGRzIGxpc3QuIFRob3NlIGFyZSB1c2VyIGZvciBmdXp6eSBsaW5rcyAod2l0aG91dCBwcmVmaXgpXG4gKiB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZXMuIEJ5IGRlZmF1bHQgdGhpcyBhbGdvcnl0aG0gdXNlZDpcbiAqXG4gKiAtIGhvc3RuYW1lIHdpdGggYW55IDItbGV0dGVyIHJvb3Qgem9uZXMgYXJlIG9rLlxuICogLSBiaXp8Y29tfGVkdXxnb3Z8bmV0fG9yZ3xwcm98d2VifHh4eHxhZXJvfGFzaWF8Y29vcHxpbmZvfG11c2V1bXxuYW1lfHNob3B8XHUwNDQwXHUwNDQ0XG4gKiAgIGFyZSBvay5cbiAqIC0gZW5jb2RlZCAoYHhuLS0uLi5gKSByb290IHpvbmVzIGFyZSBvay5cbiAqXG4gKiBJZiBsaXN0IGlzIHJlcGxhY2VkLCB0aGVuIGV4YWN0IG1hdGNoIGZvciAyLWNoYXJzIHJvb3Qgem9uZXMgd2lsbCBiZSBjaGVja2VkLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50bGRzID0gZnVuY3Rpb24gdGxkcyAobGlzdCwga2VlcE9sZCkge1xuICBsaXN0ID0gQXJyYXkuaXNBcnJheShsaXN0KSA/IGxpc3QgOiBbbGlzdF07XG5cbiAgaWYgKCFrZWVwT2xkKSB7XG4gICAgdGhpcy5fX3RsZHNfXyA9IGxpc3Quc2xpY2UoKTtcbiAgICB0aGlzLl9fdGxkc19yZXBsYWNlZF9fID0gdHJ1ZTtcbiAgICBjb21waWxlKHRoaXMpO1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICB0aGlzLl9fdGxkc19fID0gdGhpcy5fX3RsZHNfXy5jb25jYXQobGlzdClcbiAgICAuc29ydCgpXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoZWwsIGlkeCwgYXJyKSB7XG4gICAgICByZXR1cm4gZWwgIT09IGFycltpZHggLSAxXVxuICAgIH0pXG4gICAgLnJldmVyc2UoKTtcblxuICBjb21waWxlKHRoaXMpO1xuICByZXR1cm4gdGhpc1xufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjbm9ybWFsaXplKG1hdGNoKVxuICpcbiAqIERlZmF1bHQgbm9ybWFsaXplciAoaWYgc2NoZW1hIGRvZXMgbm90IGRlZmluZSBpdCdzIG93bikuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSAobWF0Y2gpIHtcbiAgLy8gRG8gbWluaW1hbCBwb3NzaWJsZSBjaGFuZ2VzIGJ5IGRlZmF1bHQuIE5lZWQgdG8gY29sbGVjdCBmZWVkYmFjayBwcmlvclxuICAvLyB0byBtb3ZlIGZvcndhcmQgaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L2xpbmtpZnktaXQvaXNzdWVzLzFcblxuICBpZiAoIW1hdGNoLnNjaGVtYSkgeyBtYXRjaC51cmwgPSBgaHR0cDovLyR7bWF0Y2gudXJsfWA7IH1cblxuICBpZiAobWF0Y2guc2NoZW1hID09PSAnbWFpbHRvOicgJiYgIS9ebWFpbHRvOi9pLnRlc3QobWF0Y2gudXJsKSkge1xuICAgIG1hdGNoLnVybCA9IGBtYWlsdG86JHttYXRjaC51cmx9YDtcbiAgfVxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjb25Db21waWxlKClcbiAqXG4gKiBPdmVycmlkZSB0byBtb2RpZnkgYmFzaWMgUmVnRXhwLXMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm9uQ29tcGlsZSA9IGZ1bmN0aW9uIG9uQ29tcGlsZSAoKSB7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmtpZnlJdDtcbiIsICIndXNlIHN0cmljdCc7XG5cbi8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cbmNvbnN0IG1heEludCA9IDIxNDc0ODM2NDc7IC8vIGFrYS4gMHg3RkZGRkZGRiBvciAyXjMxLTFcblxuLyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuY29uc3QgYmFzZSA9IDM2O1xuY29uc3QgdE1pbiA9IDE7XG5jb25zdCB0TWF4ID0gMjY7XG5jb25zdCBza2V3ID0gMzg7XG5jb25zdCBkYW1wID0gNzAwO1xuY29uc3QgaW5pdGlhbEJpYXMgPSA3MjtcbmNvbnN0IGluaXRpYWxOID0gMTI4OyAvLyAweDgwXG5jb25zdCBkZWxpbWl0ZXIgPSAnLSc7IC8vICdcXHgyRCdcblxuLyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cbmNvbnN0IHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vO1xuY29uc3QgcmVnZXhOb25BU0NJSSA9IC9bXlxcMC1cXHg3Rl0vOyAvLyBOb3RlOiBVKzAwN0YgREVMIGlzIGV4Y2x1ZGVkIHRvby5cbmNvbnN0IHJlZ2V4U2VwYXJhdG9ycyA9IC9bXFx4MkVcXHUzMDAyXFx1RkYwRVxcdUZGNjFdL2c7IC8vIFJGQyAzNDkwIHNlcGFyYXRvcnNcblxuLyoqIEVycm9yIG1lc3NhZ2VzICovXG5jb25zdCBlcnJvcnMgPSB7XG5cdCdvdmVyZmxvdyc6ICdPdmVyZmxvdzogaW5wdXQgbmVlZHMgd2lkZXIgaW50ZWdlcnMgdG8gcHJvY2VzcycsXG5cdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG59O1xuXG4vKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5jb25zdCBiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW47XG5jb25zdCBmbG9vciA9IE1hdGguZmxvb3I7XG5jb25zdCBzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuLyoqXG4gKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXJyb3IgdHlwZS5cbiAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gZXJyb3IodHlwZSkge1xuXHR0aHJvdyBuZXcgUmFuZ2VFcnJvcihlcnJvcnNbdHlwZV0pO1xufVxuXG4vKipcbiAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCB1dGlsaXR5IGZ1bmN0aW9uLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnkgYXJyYXlcbiAqIGl0ZW0uXG4gKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG1hcChhcnJheSwgY2FsbGJhY2spIHtcblx0Y29uc3QgcmVzdWx0ID0gW107XG5cdGxldCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdHJlc3VsdFtsZW5ndGhdID0gY2FsbGJhY2soYXJyYXlbbGVuZ3RoXSk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBIHNpbXBsZSBgQXJyYXkjbWFwYC1saWtlIHdyYXBwZXIgdG8gd29yayB3aXRoIGRvbWFpbiBuYW1lIHN0cmluZ3Mgb3IgZW1haWxcbiAqIGFkZHJlc3Nlcy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG4gKiBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcbiAqIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtYXBEb21haW4oZG9tYWluLCBjYWxsYmFjaykge1xuXHRjb25zdCBwYXJ0cyA9IGRvbWFpbi5zcGxpdCgnQCcpO1xuXHRsZXQgcmVzdWx0ID0gJyc7XG5cdGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0Ly8gSW4gZW1haWwgYWRkcmVzc2VzLCBvbmx5IHRoZSBkb21haW4gbmFtZSBzaG91bGQgYmUgcHVueWNvZGVkLiBMZWF2ZVxuXHRcdC8vIHRoZSBsb2NhbCBwYXJ0IChpLmUuIGV2ZXJ5dGhpbmcgdXAgdG8gYEBgKSBpbnRhY3QuXG5cdFx0cmVzdWx0ID0gcGFydHNbMF0gKyAnQCc7XG5cdFx0ZG9tYWluID0gcGFydHNbMV07XG5cdH1cblx0Ly8gQXZvaWQgYHNwbGl0KHJlZ2V4KWAgZm9yIElFOCBjb21wYXRpYmlsaXR5LiBTZWUgIzE3LlxuXHRkb21haW4gPSBkb21haW4ucmVwbGFjZShyZWdleFNlcGFyYXRvcnMsICdcXHgyRScpO1xuXHRjb25zdCBsYWJlbHMgPSBkb21haW4uc3BsaXQoJy4nKTtcblx0Y29uc3QgZW5jb2RlZCA9IG1hcChsYWJlbHMsIGNhbGxiYWNrKS5qb2luKCcuJyk7XG5cdHJldHVybiByZXN1bHQgKyBlbmNvZGVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcbiAqIGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBXaGlsZSBKYXZhU2NyaXB0IHVzZXMgVUNTLTIgaW50ZXJuYWxseSxcbiAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG4gKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcbiAqIG1hdGNoaW5nIFVURi0xNi5cbiAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG4gKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuICogQG5hbWUgZGVjb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuICogQHJldHVybnMge0FycmF5fSBUaGUgbmV3IGFycmF5IG9mIGNvZGUgcG9pbnRzLlxuICovXG5mdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRjb25zdCBvdXRwdXQgPSBbXTtcblx0bGV0IGNvdW50ZXIgPSAwO1xuXHRjb25zdCBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdGNvbnN0IHZhbHVlID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHQvLyBJdCdzIGEgaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyLlxuXHRcdFx0Y29uc3QgZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKChleHRyYSAmIDB4RkMwMCkgPT0gMHhEQzAwKSB7IC8vIExvdyBzdXJyb2dhdGUuXG5cdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBJdCdzIGFuIHVubWF0Y2hlZCBzdXJyb2dhdGU7IG9ubHkgYXBwZW5kIHRoaXMgY29kZSB1bml0LCBpbiBjYXNlIHRoZVxuXHRcdFx0XHQvLyBuZXh0IGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpci5cblx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG4gKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcbiAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG4gKiBAbmFtZSBlbmNvZGVcbiAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmV3IFVuaWNvZGUgc3RyaW5nIChVQ1MtMikuXG4gKi9cbmNvbnN0IHVjczJlbmNvZGUgPSBjb2RlUG9pbnRzID0+IFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLmNvZGVQb2ludHMpO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgYmFzaWMgY29kZSBwb2ludCBpbnRvIGEgZGlnaXQvaW50ZWdlci5cbiAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlUG9pbnQgVGhlIGJhc2ljIG51bWVyaWMgY29kZSBwb2ludCB2YWx1ZS5cbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuICogdGhlIGNvZGUgcG9pbnQgZG9lcyBub3QgcmVwcmVzZW50IGEgdmFsdWUuXG4gKi9cbmNvbnN0IGJhc2ljVG9EaWdpdCA9IGZ1bmN0aW9uKGNvZGVQb2ludCkge1xuXHRpZiAoY29kZVBvaW50ID49IDB4MzAgJiYgY29kZVBvaW50IDwgMHgzQSkge1xuXHRcdHJldHVybiAyNiArIChjb2RlUG9pbnQgLSAweDMwKTtcblx0fVxuXHRpZiAoY29kZVBvaW50ID49IDB4NDEgJiYgY29kZVBvaW50IDwgMHg1Qikge1xuXHRcdHJldHVybiBjb2RlUG9pbnQgLSAweDQxO1xuXHR9XG5cdGlmIChjb2RlUG9pbnQgPj0gMHg2MSAmJiBjb2RlUG9pbnQgPCAweDdCKSB7XG5cdFx0cmV0dXJuIGNvZGVQb2ludCAtIDB4NjE7XG5cdH1cblx0cmV0dXJuIGJhc2U7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cbiAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpcyBgZGlnaXRgLCB3aGljaCBuZWVkcyB0byBiZSBpbiB0aGUgcmFuZ2VcbiAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcbiAqIGlmIGBmbGFnYCBpcyBub24temVybyBhbmQgYGRpZ2l0YCBoYXMgbm8gdXBwZXJjYXNlIGZvcm0uXG4gKi9cbmNvbnN0IGRpZ2l0VG9CYXNpYyA9IGZ1bmN0aW9uKGRpZ2l0LCBmbGFnKSB7XG5cdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdC8vIDI2Li4zNSBtYXAgdG8gQVNDSUkgMC4uOVxuXHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xufTtcblxuLyoqXG4gKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuICogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM0OTIjc2VjdGlvbi0zLjRcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IGFkYXB0ID0gZnVuY3Rpb24oZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdGxldCBrID0gMDtcblx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRmb3IgKC8qIG5vIGluaXRpYWxpemF0aW9uICovOyBkZWx0YSA+IGJhc2VNaW51c1RNaW4gKiB0TWF4ID4+IDE7IGsgKz0gYmFzZSkge1xuXHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0fVxuXHRyZXR1cm4gZmxvb3IoayArIChiYXNlTWludXNUTWluICsgMSkgKiBkZWx0YSAvIChkZWx0YSArIHNrZXcpKTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcbiAqIHN5bWJvbHMuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cbiAqL1xuY29uc3QgZGVjb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0Ly8gRG9uJ3QgdXNlIFVDUy0yLlxuXHRjb25zdCBvdXRwdXQgPSBbXTtcblx0Y29uc3QgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGg7XG5cdGxldCBpID0gMDtcblx0bGV0IG4gPSBpbml0aWFsTjtcblx0bGV0IGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzOiBsZXQgYGJhc2ljYCBiZSB0aGUgbnVtYmVyIG9mIGlucHV0IGNvZGVcblx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0bGV0IGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdGJhc2ljID0gMDtcblx0fVxuXG5cdGZvciAobGV0IGogPSAwOyBqIDwgYmFzaWM7ICsraikge1xuXHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdGVycm9yKCdub3QtYmFzaWMnKTtcblx0XHR9XG5cdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdH1cblxuXHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0Zm9yIChsZXQgaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0Ly8gRGVjb2RlIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXIgaW50byBgZGVsdGFgLFxuXHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHQvLyB2YWx1ZSBhdCB0aGUgZW5kIHRvIG9idGFpbiBgZGVsdGFgLlxuXHRcdGNvbnN0IG9sZGkgPSBpO1xuXHRcdGZvciAobGV0IHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdGVycm9yKCdpbnZhbGlkLWlucHV0Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRpZiAoZGlnaXQgPj0gYmFzZSkge1xuXHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0Y29uc3QgdCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cblx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdH1cblxuXHRcdGNvbnN0IG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0Ly8gYGlgIHdhcyBzdXBwb3NlZCB0byB3cmFwIGFyb3VuZCBmcm9tIGBvdXRgIHRvIGAwYCxcblx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdH1cblxuXHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0aSAlPSBvdXQ7XG5cblx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0LlxuXHRcdG91dHB1dC5zcGxpY2UoaSsrLCAwLCBuKTtcblxuXHR9XG5cblx0cmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLm91dHB1dCk7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG4gKiBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuICogQG1lbWJlck9mIHB1bnljb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG4gKi9cbmNvbnN0IGVuY29kZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXG5cdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIGFuIGFycmF5IG9mIFVuaWNvZGUgY29kZSBwb2ludHMuXG5cdGlucHV0ID0gdWNzMmRlY29kZShpbnB1dCk7XG5cblx0Ly8gQ2FjaGUgdGhlIGxlbmd0aC5cblx0Y29uc3QgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGg7XG5cblx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGUuXG5cdGxldCBuID0gaW5pdGlhbE47XG5cdGxldCBkZWx0YSA9IDA7XG5cdGxldCBiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50cy5cblx0Zm9yIChjb25zdCBjdXJyZW50VmFsdWUgb2YgaW5wdXQpIHtcblx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGJhc2ljTGVuZ3RoID0gb3V0cHV0Lmxlbmd0aDtcblx0bGV0IGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGg7XG5cblx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdC8vIGBiYXNpY0xlbmd0aGAgaXMgdGhlIG51bWJlciBvZiBiYXNpYyBjb2RlIHBvaW50cy5cblxuXHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyB3aXRoIGEgZGVsaW1pdGVyIHVubGVzcyBpdCdzIGVtcHR5LlxuXHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHR9XG5cblx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0Ly8gQWxsIG5vbi1iYXNpYyBjb2RlIHBvaW50cyA8IG4gaGF2ZSBiZWVuIGhhbmRsZWQgYWxyZWFkeS4gRmluZCB0aGUgbmV4dFxuXHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0bGV0IG0gPSBtYXhJbnQ7XG5cdFx0Zm9yIChjb25zdCBjdXJyZW50VmFsdWUgb2YgaW5wdXQpIHtcblx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdG0gPSBjdXJyZW50VmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSW5jcmVhc2UgYGRlbHRhYCBlbm91Z2ggdG8gYWR2YW5jZSB0aGUgZGVjb2RlcidzIDxuLGk+IHN0YXRlIHRvIDxtLDA+LFxuXHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93LlxuXHRcdGNvbnN0IGhhbmRsZWRDUENvdW50UGx1c09uZSA9IGhhbmRsZWRDUENvdW50ICsgMTtcblx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0fVxuXG5cdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRuID0gbTtcblxuXHRcdGZvciAoY29uc3QgY3VycmVudFZhbHVlIG9mIGlucHV0KSB7XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PT0gbikge1xuXHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlci5cblx0XHRcdFx0bGV0IHEgPSBkZWx0YTtcblx0XHRcdFx0Zm9yIChsZXQgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0Y29uc3QgdCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29uc3QgcU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdGNvbnN0IGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRvdXRwdXQucHVzaChcblx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHEgPSBmbG9vcihxTWludXNUIC8gYmFzZU1pbnVzVCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdGJpYXMgPSBhZGFwdChkZWx0YSwgaGFuZGxlZENQQ291bnRQbHVzT25lLCBoYW5kbGVkQ1BDb3VudCA9PT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdCsraGFuZGxlZENQQ291bnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0KytkZWx0YTtcblx0XHQrK247XG5cblx0fVxuXHRyZXR1cm4gb3V0cHV0LmpvaW4oJycpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG4gKiB0byBVbmljb2RlLiBPbmx5IHRoZSBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGlucHV0IHdpbGwgYmUgY29udmVydGVkLCBpLmUuXG4gKiBpdCBkb2Vzbid0IG1hdHRlciBpZiB5b3UgY2FsbCBpdCBvbiBhIHN0cmluZyB0aGF0IGhhcyBhbHJlYWR5IGJlZW5cbiAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuICogQG1lbWJlck9mIHB1bnljb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlZCBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzIHRvXG4gKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgVW5pY29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gUHVueWNvZGVcbiAqIHN0cmluZy5cbiAqL1xuY29uc3QgdG9Vbmljb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0cmV0dXJuIG1hcERvbWFpbihpbnB1dCwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHJlZ2V4UHVueWNvZGUudGVzdChzdHJpbmcpXG5cdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdDogc3RyaW5nO1xuXHR9KTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG4gKiBQdW55Y29kZS4gT25seSB0aGUgbm9uLUFTQ0lJIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCxcbiAqIGkuZS4gaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0J3MgYWxyZWFkeSBpblxuICogQVNDSUkuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0byBjb252ZXJ0LCBhcyBhXG4gKiBVbmljb2RlIHN0cmluZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUgb3JcbiAqIGVtYWlsIGFkZHJlc3MuXG4gKi9cbmNvbnN0IHRvQVNDSUkgPSBmdW5jdGlvbihpbnB1dCkge1xuXHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRyZXR1cm4gcmVnZXhOb25BU0NJSS50ZXN0KHN0cmluZylcblx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdDogc3RyaW5nO1xuXHR9KTtcbn07XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4vKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5jb25zdCBwdW55Y29kZSA9IHtcblx0LyoqXG5cdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEB0eXBlIFN0cmluZ1xuXHQgKi9cblx0J3ZlcnNpb24nOiAnMi4zLjEnLFxuXHQvKipcblx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0ICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAdHlwZSBPYmplY3Rcblx0ICovXG5cdCd1Y3MyJzoge1xuXHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdCdlbmNvZGUnOiB1Y3MyZW5jb2RlXG5cdH0sXG5cdCdkZWNvZGUnOiBkZWNvZGUsXG5cdCdlbmNvZGUnOiBlbmNvZGUsXG5cdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcbiIsICIvLyBVdGlsaXRpZXNcbi8vXG5cbmltcG9ydCAqIGFzIG1kdXJsIGZyb20gJ21kdXJsJ1xuaW1wb3J0ICogYXMgdWNtaWNybyBmcm9tICd1Yy5taWNybydcbmltcG9ydCB7IGRlY29kZUhUTUwgfSBmcm9tICdlbnRpdGllcydcblxuZnVuY3Rpb24gX2NsYXNzIChvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopIH1cblxuZnVuY3Rpb24gaXNTdHJpbmcgKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nIH1cblxuY29uc3QgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBoYXMgKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSlcbn1cblxuLy8gTWVyZ2Ugb2JqZWN0c1xuLy9cbmZ1bmN0aW9uIGFzc2lnbiAob2JqIC8qIGZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiAqLykge1xuICBjb25zdCBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuXG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKCFzb3VyY2UpIHsgcmV0dXJuIH1cblxuICAgIGlmICh0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzb3VyY2UgKyAnbXVzdCBiZSBvYmplY3QnKVxuICAgIH1cblxuICAgIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBvYmpba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gb2JqXG59XG5cbi8vIFJlbW92ZSBlbGVtZW50IGZyb20gYXJyYXkgYW5kIHB1dCBhbm90aGVyIGFycmF5IGF0IHRob3NlIHBvc2l0aW9uLlxuLy8gVXNlZnVsIGZvciBzb21lIG9wZXJhdGlvbnMgd2l0aCB0b2tlbnNcbmZ1bmN0aW9uIGFycmF5UmVwbGFjZUF0IChzcmMsIHBvcywgbmV3RWxlbWVudHMpIHtcbiAgcmV0dXJuIFtdLmNvbmNhdChzcmMuc2xpY2UoMCwgcG9zKSwgbmV3RWxlbWVudHMsIHNyYy5zbGljZShwb3MgKyAxKSlcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEVudGl0eUNvZGUgKGMpIHtcbiAgLy8gYnJva2VuIHNlcXVlbmNlXG4gIGlmIChjID49IDB4RDgwMCAmJiBjIDw9IDB4REZGRikgeyByZXR1cm4gZmFsc2UgfVxuICAvLyBuZXZlciB1c2VkXG4gIGlmIChjID49IDB4RkREMCAmJiBjIDw9IDB4RkRFRikgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoKGMgJiAweEZGRkYpID09PSAweEZGRkYgfHwgKGMgJiAweEZGRkYpID09PSAweEZGRkUpIHsgcmV0dXJuIGZhbHNlIH1cbiAgLy8gY29udHJvbCBjb2Rlc1xuICBpZiAoYyA+PSAweDAwICYmIGMgPD0gMHgwOCkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoYyA9PT0gMHgwQikgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoYyA+PSAweDBFICYmIGMgPD0gMHgxRikgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoYyA+PSAweDdGICYmIGMgPD0gMHg5RikgeyByZXR1cm4gZmFsc2UgfVxuICAvLyBvdXQgb2YgcmFuZ2VcbiAgaWYgKGMgPiAweDEwRkZGRikgeyByZXR1cm4gZmFsc2UgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBmcm9tQ29kZVBvaW50IChjKSB7XG4gIC8qIGVzbGludCBuby1iaXR3aXNlOjAgKi9cbiAgaWYgKGMgPiAweGZmZmYpIHtcbiAgICBjIC09IDB4MTAwMDBcbiAgICBjb25zdCBzdXJyb2dhdGUxID0gMHhkODAwICsgKGMgPj4gMTApXG4gICAgY29uc3Qgc3Vycm9nYXRlMiA9IDB4ZGMwMCArIChjICYgMHgzZmYpXG5cbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShzdXJyb2dhdGUxLCBzdXJyb2dhdGUyKVxuICB9XG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpXG59XG5cbmNvbnN0IFVORVNDQVBFX01EX1JFID0gL1xcXFwoWyFcIiMkJSYnKCkqKyxcXC0uLzo7PD0+P0BbXFxcXFxcXV5fYHt8fX5dKS9nXG5jb25zdCBFTlRJVFlfUkUgPSAvJihbYS16I11bYS16MC05XXsxLDMxfSk7L2dpXG5jb25zdCBVTkVTQ0FQRV9BTExfUkUgPSBuZXcgUmVnRXhwKFVORVNDQVBFX01EX1JFLnNvdXJjZSArICd8JyArIEVOVElUWV9SRS5zb3VyY2UsICdnaScpXG5cbmNvbnN0IERJR0lUQUxfRU5USVRZX1RFU1RfUkUgPSAvXiMoKD86eFthLWYwLTldezEsOH18WzAtOV17MSw4fSkpJC9pXG5cbmZ1bmN0aW9uIHJlcGxhY2VFbnRpdHlQYXR0ZXJuIChtYXRjaCwgbmFtZSkge1xuICBpZiAobmFtZS5jaGFyQ29kZUF0KDApID09PSAweDIzLyogIyAqLyAmJiBESUdJVEFMX0VOVElUWV9URVNUX1JFLnRlc3QobmFtZSkpIHtcbiAgICBjb25zdCBjb2RlID0gbmFtZVsxXS50b0xvd2VyQ2FzZSgpID09PSAneCdcbiAgICAgID8gcGFyc2VJbnQobmFtZS5zbGljZSgyKSwgMTYpXG4gICAgICA6IHBhcnNlSW50KG5hbWUuc2xpY2UoMSksIDEwKVxuXG4gICAgaWYgKGlzVmFsaWRFbnRpdHlDb2RlKGNvZGUpKSB7XG4gICAgICByZXR1cm4gZnJvbUNvZGVQb2ludChjb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBtYXRjaFxuICB9XG5cbiAgY29uc3QgZGVjb2RlZCA9IGRlY29kZUhUTUwobWF0Y2gpXG4gIGlmIChkZWNvZGVkICE9PSBtYXRjaCkge1xuICAgIHJldHVybiBkZWNvZGVkXG4gIH1cblxuICByZXR1cm4gbWF0Y2hcbn1cblxuZnVuY3Rpb24gdW5lc2NhcGVNZCAoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignXFxcXCcpIDwgMCkgeyByZXR1cm4gc3RyIH1cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFVORVNDQVBFX01EX1JFLCAnJDEnKVxufVxuXG5mdW5jdGlvbiB1bmVzY2FwZUFsbCAoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignXFxcXCcpIDwgMCAmJiBzdHIuaW5kZXhPZignJicpIDwgMCkgeyByZXR1cm4gc3RyIH1cblxuICByZXR1cm4gc3RyLnJlcGxhY2UoVU5FU0NBUEVfQUxMX1JFLCBmdW5jdGlvbiAobWF0Y2gsIGVzY2FwZWQsIGVudGl0eSkge1xuICAgIGlmIChlc2NhcGVkKSB7IHJldHVybiBlc2NhcGVkIH1cbiAgICByZXR1cm4gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIGVudGl0eSlcbiAgfSlcbn1cblxuY29uc3QgSFRNTF9FU0NBUEVfVEVTVF9SRSA9IC9bJjw+XCJdL1xuY29uc3QgSFRNTF9FU0NBUEVfUkVQTEFDRV9SRSA9IC9bJjw+XCJdL2dcbmNvbnN0IEhUTUxfUkVQTEFDRU1FTlRTID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90Oydcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVVuc2FmZUNoYXIgKGNoKSB7XG4gIHJldHVybiBIVE1MX1JFUExBQ0VNRU5UU1tjaF1cbn1cblxuZnVuY3Rpb24gZXNjYXBlSHRtbCAoc3RyKSB7XG4gIGlmIChIVE1MX0VTQ0FQRV9URVNUX1JFLnRlc3Qoc3RyKSkge1xuICAgIHJldHVybiBzdHIucmVwbGFjZShIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFLCByZXBsYWNlVW5zYWZlQ2hhcilcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmNvbnN0IFJFR0VYUF9FU0NBUEVfUkUgPSAvWy4/KiteJFtcXF1cXFxcKCl7fXwtXS9nXG5cbmZ1bmN0aW9uIGVzY2FwZVJFIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFJFR0VYUF9FU0NBUEVfUkUsICdcXFxcJCYnKVxufVxuXG5mdW5jdGlvbiBpc1NwYWNlIChjb2RlKSB7XG4gIHN3aXRjaCAoY29kZSkge1xuICAgIGNhc2UgMHgwOTpcbiAgICBjYXNlIDB4MjA6XG4gICAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vLyBacyAodW5pY29kZSBjbGFzcykgfHwgW1xcdFxcZlxcdlxcclxcbl1cbmZ1bmN0aW9uIGlzV2hpdGVTcGFjZSAoY29kZSkge1xuICBpZiAoY29kZSA+PSAweDIwMDAgJiYgY29kZSA8PSAweDIwMEEpIHsgcmV0dXJuIHRydWUgfVxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6IC8vIFxcdFxuICAgIGNhc2UgMHgwQTogLy8gXFxuXG4gICAgY2FzZSAweDBCOiAvLyBcXHZcbiAgICBjYXNlIDB4MEM6IC8vIFxcZlxuICAgIGNhc2UgMHgwRDogLy8gXFxyXG4gICAgY2FzZSAweDIwOlxuICAgIGNhc2UgMHhBMDpcbiAgICBjYXNlIDB4MTY4MDpcbiAgICBjYXNlIDB4MjAyRjpcbiAgICBjYXNlIDB4MjA1RjpcbiAgICBjYXNlIDB4MzAwMDpcbiAgICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIEN1cnJlbnRseSB3aXRob3V0IGFzdHJhbCBjaGFyYWN0ZXJzIHN1cHBvcnQuXG5mdW5jdGlvbiBpc1B1bmN0Q2hhciAoY2gpIHtcbiAgcmV0dXJuIHVjbWljcm8uUC50ZXN0KGNoKSB8fCB1Y21pY3JvLlMudGVzdChjaClcbn1cblxuZnVuY3Rpb24gaXNQdW5jdENoYXJDb2RlIChjb2RlKSB7XG4gIHJldHVybiBpc1B1bmN0Q2hhcihmcm9tQ29kZVBvaW50KGNvZGUpKVxufVxuXG4vLyBNYXJrZG93biBBU0NJSSBwdW5jdHVhdGlvbiBjaGFyYWN0ZXJzLlxuLy9cbi8vICEsIFwiLCAjLCAkLCAlLCAmLCAnLCAoLCApLCAqLCArLCAsLCAtLCAuLCAvLCA6LCA7LCA8LCA9LCA+LCA/LCBALCBbLCBcXCwgXSwgXiwgXywgYCwgeywgfCwgfSwgb3IgflxuLy8gaHR0cDovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4xNS8jYXNjaWktcHVuY3R1YXRpb24tY2hhcmFjdGVyXG4vL1xuLy8gRG9uJ3QgY29uZnVzZSB3aXRoIHVuaWNvZGUgcHVuY3R1YXRpb24gISEhIEl0IGxhY2tzIHNvbWUgY2hhcnMgaW4gYXNjaWkgcmFuZ2UuXG4vL1xuZnVuY3Rpb24gaXNNZEFzY2lpUHVuY3QgKGNoKSB7XG4gIHN3aXRjaCAoY2gpIHtcbiAgICBjYXNlIDB4MjEvKiAhICovOlxuICAgIGNhc2UgMHgyMi8qIFwiICovOlxuICAgIGNhc2UgMHgyMy8qICMgKi86XG4gICAgY2FzZSAweDI0LyogJCAqLzpcbiAgICBjYXNlIDB4MjUvKiAlICovOlxuICAgIGNhc2UgMHgyNi8qICYgKi86XG4gICAgY2FzZSAweDI3LyogJyAqLzpcbiAgICBjYXNlIDB4MjgvKiAoICovOlxuICAgIGNhc2UgMHgyOS8qICkgKi86XG4gICAgY2FzZSAweDJBLyogKiAqLzpcbiAgICBjYXNlIDB4MkIvKiArICovOlxuICAgIGNhc2UgMHgyQy8qICwgKi86XG4gICAgY2FzZSAweDJELyogLSAqLzpcbiAgICBjYXNlIDB4MkUvKiAuICovOlxuICAgIGNhc2UgMHgyRi8qIC8gKi86XG4gICAgY2FzZSAweDNBLyogOiAqLzpcbiAgICBjYXNlIDB4M0IvKiA7ICovOlxuICAgIGNhc2UgMHgzQy8qIDwgKi86XG4gICAgY2FzZSAweDNELyogPSAqLzpcbiAgICBjYXNlIDB4M0UvKiA+ICovOlxuICAgIGNhc2UgMHgzRi8qID8gKi86XG4gICAgY2FzZSAweDQwLyogQCAqLzpcbiAgICBjYXNlIDB4NUIvKiBbICovOlxuICAgIGNhc2UgMHg1Qy8qIFxcICovOlxuICAgIGNhc2UgMHg1RC8qIF0gKi86XG4gICAgY2FzZSAweDVFLyogXiAqLzpcbiAgICBjYXNlIDB4NUYvKiBfICovOlxuICAgIGNhc2UgMHg2MC8qIGAgKi86XG4gICAgY2FzZSAweDdCLyogeyAqLzpcbiAgICBjYXNlIDB4N0MvKiB8ICovOlxuICAgIGNhc2UgMHg3RC8qIH0gKi86XG4gICAgY2FzZSAweDdFLyogfiAqLzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbi8vIEhlcGxlciB0byB1bmlmeSBbcmVmZXJlbmNlIGxhYmVsc10uXG4vL1xuZnVuY3Rpb24gbm9ybWFsaXplUmVmZXJlbmNlIChzdHIpIHtcbiAgLy8gVHJpbSBhbmQgY29sbGFwc2Ugd2hpdGVzcGFjZVxuICAvL1xuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKVxuXG4gIC8vIEluIG5vZGUgdjEwICfhup4nLnRvTG93ZXJDYXNlKCkgPT09ICfhub4nLCB3aGljaCBpcyBwcmVzdW1lZCB0byBiZSBhIGJ1Z1xuICAvLyBmaXhlZCBpbiB2MTIgKGNvdWxkbid0IGZpbmQgYW55IGRldGFpbHMpLlxuICAvL1xuICAvLyBTbyB0cmVhdCB0aGlzIG9uZSBhcyBhIHNwZWNpYWwgY2FzZVxuICAvLyAocmVtb3ZlIHRoaXMgd2hlbiBub2RlIHYxMCBpcyBubyBsb25nZXIgc3VwcG9ydGVkKS5cbiAgLy9cbiAgaWYgKCfhup4nLnRvTG93ZXJDYXNlKCkgPT09ICfhub4nKSB7XG4gICAgLyogYzggaWdub3JlIG5leHQgMiAqL1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKC/hup4vZywgJ8OfJylcbiAgfVxuXG4gIC8vIC50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKCkgc2hvdWxkIGdldCByaWQgb2YgYWxsIGRpZmZlcmVuY2VzXG4gIC8vIGJldHdlZW4gbGV0dGVyIHZhcmlhbnRzLlxuICAvL1xuICAvLyBTaW1wbGUgLnRvTG93ZXJDYXNlKCkgZG9lc24ndCBub3JtYWxpemUgMTI1IGNvZGUgcG9pbnRzIGNvcnJlY3RseSxcbiAgLy8gYW5kIC50b1VwcGVyQ2FzZSBkb2Vzbid0IG5vcm1hbGl6ZSA2IG9mIHRoZW0gKGxpc3Qgb2YgZXhjZXB0aW9uczpcbiAgLy8gxLAsIM+0LCDhup4sIOKEpiwg4oSqLCDihKsgLSB0aG9zZSBhcmUgYWxyZWFkeSB1cHBlcmNhc2VkLCBidXQgaGF2ZSBkaWZmZXJlbnRseVxuICAvLyB1cHBlcmNhc2VkIHZlcnNpb25zKS5cbiAgLy9cbiAgLy8gSGVyZSdzIGFuIGV4YW1wbGUgc2hvd2luZyBob3cgaXQgaGFwcGVucy4gTGV0cyB0YWtlIGdyZWVrIGxldHRlciBvbWVnYTpcbiAgLy8gdXBwZXJjYXNlIFUrMDM5OCAozpgpLCBVKzAzZjQgKM+0KSBhbmQgbG93ZXJjYXNlIFUrMDNiOCAozrgpLCBVKzAzZDEgKM+RKVxuICAvL1xuICAvLyBVbmljb2RlIGVudHJpZXM6XG4gIC8vIDAzOTg7R1JFRUsgQ0FQSVRBTCBMRVRURVIgVEhFVEE7THU7MDtMOzs7OztOOzs7OzAzQjg7XG4gIC8vIDAzQjg7R1JFRUsgU01BTEwgTEVUVEVSIFRIRVRBO0xsOzA7TDs7Ozs7Tjs7OzAzOTg7OzAzOThcbiAgLy8gMDNEMTtHUkVFSyBUSEVUQSBTWU1CT0w7TGw7MDtMOzxjb21wYXQ+IDAzQjg7Ozs7TjtHUkVFSyBTTUFMTCBMRVRURVIgU0NSSVBUIFRIRVRBOzswMzk4OzswMzk4XG4gIC8vIDAzRjQ7R1JFRUsgQ0FQSVRBTCBUSEVUQSBTWU1CT0w7THU7MDtMOzxjb21wYXQ+IDAzOTg7Ozs7Tjs7OzswM0I4O1xuICAvL1xuICAvLyBDYXNlLWluc2Vuc2l0aXZlIGNvbXBhcmlzb24gc2hvdWxkIHRyZWF0IGFsbCBvZiB0aGVtIGFzIGVxdWl2YWxlbnQuXG4gIC8vXG4gIC8vIEJ1dCAudG9Mb3dlckNhc2UoKSBkb2Vzbid0IGNoYW5nZSDPkSAoaXQncyBhbHJlYWR5IGxvd2VyY2FzZSksXG4gIC8vIGFuZCAudG9VcHBlckNhc2UoKSBkb2Vzbid0IGNoYW5nZSDPtCAoYWxyZWFkeSB1cHBlcmNhc2UpLlxuICAvL1xuICAvLyBBcHBseWluZyBmaXJzdCBsb3dlciB0aGVuIHVwcGVyIGNhc2Ugbm9ybWFsaXplcyBhbnkgY2hhcmFjdGVyOlxuICAvLyAnXFx1MDM5OFxcdTAzZjRcXHUwM2I4XFx1MDNkMScudG9Mb3dlckNhc2UoKS50b1VwcGVyQ2FzZSgpID09PSAnXFx1MDM5OFxcdTAzOThcXHUwMzk4XFx1MDM5OCdcbiAgLy9cbiAgLy8gTm90ZTogdGhpcyBpcyBlcXVpdmFsZW50IHRvIHVuaWNvZGUgY2FzZSBmb2xkaW5nOyB1bmljb2RlIG5vcm1hbGl6YXRpb25cbiAgLy8gaXMgYSBkaWZmZXJlbnQgc3RlcCB0aGF0IGlzIG5vdCByZXF1aXJlZCBoZXJlLlxuICAvL1xuICAvLyBGaW5hbCByZXN1bHQgc2hvdWxkIGJlIHVwcGVyY2FzZWQsIGJlY2F1c2UgaXQncyBsYXRlciBzdG9yZWQgaW4gYW4gb2JqZWN0XG4gIC8vICh0aGlzIGF2b2lkIGEgY29uZmxpY3Qgd2l0aCBPYmplY3QucHJvdG90eXBlIG1lbWJlcnMsXG4gIC8vIG1vc3Qgbm90YWJseSwgYF9fcHJvdG9fX2ApXG4gIC8vXG4gIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKS50b1VwcGVyQ2FzZSgpXG59XG5cbmZ1bmN0aW9uIGlzQXNjaWlUcmltbWFibGUgKGMpIHtcbiAgcmV0dXJuIGMgPT09IDB4MjAgfHwgYyA9PT0gMHgwOSB8fCBjID09PSAweDBhIHx8IGMgPT09IDB4MGRcbn1cblxuLy8gXCJMaWdodFwiIC50cmltKCkgZm9yIGJsb2NrcyAoaGVhZGVycywgcGFyYWdyYXBocyksIHdoZXJlIHVuaWNvZGUgc3BhY2VzXG4vLyBzaG91bGQgYmUgcHJlc2VydmVkLlxuZnVuY3Rpb24gYXNjaWlUcmltIChzdHIpIHtcbiAgbGV0IHN0YXJ0ID0gMFxuICBmb3IgKDsgc3RhcnQgPCBzdHIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgaWYgKCFpc0FzY2lpVHJpbW1hYmxlKHN0ci5jaGFyQ29kZUF0KHN0YXJ0KSkpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIGxldCBlbmQgPSBzdHIubGVuZ3RoIC0gMVxuICBmb3IgKDsgZW5kID49IHN0YXJ0OyBlbmQtLSkge1xuICAgIGlmICghaXNBc2NpaVRyaW1tYWJsZShzdHIuY2hhckNvZGVBdChlbmQpKSkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0ci5zbGljZShzdGFydCwgZW5kICsgMSlcbn1cblxuLy8gUmUtZXhwb3J0IGxpYnJhcmllcyBjb21tb25seSB1c2VkIGluIGJvdGggbWFya2Rvd24taXQgYW5kIGl0cyBwbHVnaW5zLFxuLy8gc28gcGx1Z2lucyB3b24ndCBoYXZlIHRvIGRlcGVuZCBvbiB0aGVtIGV4cGxpY2l0bHksIHdoaWNoIHJlZHVjZXMgdGhlaXJcbi8vIGJ1bmRsZWQgc2l6ZSAoZS5nLiBhIGJyb3dzZXIgYnVpbGQpLlxuLy9cbmNvbnN0IGxpYiA9IHsgbWR1cmwsIHVjbWljcm8gfVxuXG5leHBvcnQge1xuICBsaWIsXG4gIGFzc2lnbixcbiAgaXNTdHJpbmcsXG4gIGhhcyxcbiAgdW5lc2NhcGVNZCxcbiAgdW5lc2NhcGVBbGwsXG4gIGlzVmFsaWRFbnRpdHlDb2RlLFxuICBmcm9tQ29kZVBvaW50LFxuICBlc2NhcGVIdG1sLFxuICBhcnJheVJlcGxhY2VBdCxcbiAgaXNTcGFjZSxcbiAgaXNXaGl0ZVNwYWNlLFxuICBpc01kQXNjaWlQdW5jdCxcbiAgaXNQdW5jdENoYXIsXG4gIGlzUHVuY3RDaGFyQ29kZSxcbiAgZXNjYXBlUkUsXG4gIG5vcm1hbGl6ZVJlZmVyZW5jZSxcbiAgYXNjaWlUcmltXG59XG4iLCAiLy8gUGFyc2UgbGluayBsYWJlbFxuLy9cbi8vIHRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IGZpcnN0IGNoYXJhY3RlciAoXCJbXCIpIGFscmVhZHkgbWF0Y2hlcztcbi8vIHJldHVybnMgdGhlIGVuZCBvZiB0aGUgbGFiZWxcbi8vXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlTGlua0xhYmVsIChzdGF0ZSwgc3RhcnQsIGRpc2FibGVOZXN0ZWQpIHtcbiAgbGV0IGxldmVsLCBmb3VuZCwgbWFya2VyLCBwcmV2UG9zXG5cbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG4gIGNvbnN0IG9sZFBvcyA9IHN0YXRlLnBvc1xuXG4gIHN0YXRlLnBvcyA9IHN0YXJ0ICsgMVxuICBsZXZlbCA9IDFcblxuICB3aGlsZSAoc3RhdGUucG9zIDwgbWF4KSB7XG4gICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKVxuICAgIGlmIChtYXJrZXIgPT09IDB4NUQgLyogXSAqLykge1xuICAgICAgbGV2ZWwtLVxuICAgICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIHByZXZQb3MgPSBzdGF0ZS5wb3NcbiAgICBzdGF0ZS5tZC5pbmxpbmUuc2tpcFRva2VuKHN0YXRlKVxuICAgIGlmIChtYXJrZXIgPT09IDB4NUIgLyogWyAqLykge1xuICAgICAgaWYgKHByZXZQb3MgPT09IHN0YXRlLnBvcyAtIDEpIHtcbiAgICAgICAgLy8gaW5jcmVhc2UgbGV2ZWwgaWYgd2UgZmluZCB0ZXh0IGBbYCwgd2hpY2ggaXMgbm90IGEgcGFydCBvZiBhbnkgdG9rZW5cbiAgICAgICAgbGV2ZWwrK1xuICAgICAgfSBlbHNlIGlmIChkaXNhYmxlTmVzdGVkKSB7XG4gICAgICAgIHN0YXRlLnBvcyA9IG9sZFBvc1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbGFiZWxFbmQgPSAtMVxuXG4gIGlmIChmb3VuZCkge1xuICAgIGxhYmVsRW5kID0gc3RhdGUucG9zXG4gIH1cblxuICAvLyByZXN0b3JlIG9sZCBzdGF0ZVxuICBzdGF0ZS5wb3MgPSBvbGRQb3NcblxuICByZXR1cm4gbGFiZWxFbmRcbn1cbiIsICIvLyBQYXJzZSBsaW5rIGRlc3RpbmF0aW9uXG4vL1xuXG5pbXBvcnQgeyB1bmVzY2FwZUFsbCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlTGlua0Rlc3RpbmF0aW9uIChzdHIsIHN0YXJ0LCBtYXgpIHtcbiAgbGV0IGNvZGVcbiAgbGV0IHBvcyA9IHN0YXJ0XG5cbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIG9rOiBmYWxzZSxcbiAgICBwb3M6IDAsXG4gICAgc3RyOiAnJ1xuICB9XG5cbiAgaWYgKHN0ci5jaGFyQ29kZUF0KHBvcykgPT09IDB4M0MgLyogPCAqLykge1xuICAgIHBvcysrXG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY29kZSA9IHN0ci5jaGFyQ29kZUF0KHBvcylcbiAgICAgIGlmIChjb2RlID09PSAweDBBIC8qIFxcbiAqLykgeyByZXR1cm4gcmVzdWx0IH1cbiAgICAgIGlmIChjb2RlID09PSAweDNDIC8qIDwgKi8pIHsgcmV0dXJuIHJlc3VsdCB9XG4gICAgICBpZiAoY29kZSA9PT0gMHgzRSAvKiA+ICovKSB7XG4gICAgICAgIHJlc3VsdC5wb3MgPSBwb3MgKyAxXG4gICAgICAgIHJlc3VsdC5zdHIgPSB1bmVzY2FwZUFsbChzdHIuc2xpY2Uoc3RhcnQgKyAxLCBwb3MpKVxuICAgICAgICByZXN1bHQub2sgPSB0cnVlXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgIH1cbiAgICAgIGlmIChjb2RlID09PSAweDVDIC8qIFxcICovICYmIHBvcyArIDEgPCBtYXgpIHtcbiAgICAgICAgcG9zICs9IDJcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgcG9zKytcbiAgICB9XG5cbiAgICAvLyBubyBjbG9zaW5nICc+J1xuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8vIHRoaXMgc2hvdWxkIGJlIC4uLiB9IGVsc2UgeyAuLi4gYnJhbmNoXG5cbiAgbGV0IGxldmVsID0gMFxuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY29kZSA9IHN0ci5jaGFyQ29kZUF0KHBvcylcblxuICAgIGlmIChjb2RlID09PSAweDIwKSB7IGJyZWFrIH1cblxuICAgIC8vIGFzY2lpIGNvbnRyb2wgY2hhcmFjdGVyc1xuICAgIGlmIChjb2RlIDwgMHgyMCB8fCBjb2RlID09PSAweDdGKSB7IGJyZWFrIH1cblxuICAgIGlmIChjb2RlID09PSAweDVDIC8qIFxcICovICYmIHBvcyArIDEgPCBtYXgpIHtcbiAgICAgIGlmIChzdHIuY2hhckNvZGVBdChwb3MgKyAxKSA9PT0gMHgyMCkgeyBicmVhayB9XG4gICAgICBwb3MgKz0gMlxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMHgyOCAvKiAoICovKSB7XG4gICAgICBsZXZlbCsrXG4gICAgICBpZiAobGV2ZWwgPiAzMikgeyByZXR1cm4gcmVzdWx0IH1cbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMHgyOSAvKiApICovKSB7XG4gICAgICBpZiAobGV2ZWwgPT09IDApIHsgYnJlYWsgfVxuICAgICAgbGV2ZWwtLVxuICAgIH1cblxuICAgIHBvcysrXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHBvcykgeyByZXR1cm4gcmVzdWx0IH1cbiAgaWYgKGxldmVsICE9PSAwKSB7IHJldHVybiByZXN1bHQgfVxuXG4gIHJlc3VsdC5zdHIgPSB1bmVzY2FwZUFsbChzdHIuc2xpY2Uoc3RhcnQsIHBvcykpXG4gIHJlc3VsdC5wb3MgPSBwb3NcbiAgcmVzdWx0Lm9rID0gdHJ1ZVxuICByZXR1cm4gcmVzdWx0XG59XG4iLCAiLy8gUGFyc2UgbGluayB0aXRsZVxuLy9cblxuaW1wb3J0IHsgdW5lc2NhcGVBbGwgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG4vLyBQYXJzZSBsaW5rIHRpdGxlIHdpdGhpbiBgc3RyYCBpbiBbc3RhcnQsIG1heF0gcmFuZ2UsXG4vLyBvciBjb250aW51ZSBwcmV2aW91cyBwYXJzaW5nIGlmIGBwcmV2X3N0YXRlYCBpcyBkZWZpbmVkIChlcXVhbCB0byByZXN1bHQgb2YgbGFzdCBleGVjdXRpb24pLlxuLy9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlTGlua1RpdGxlIChzdHIsIHN0YXJ0LCBtYXgsIHByZXZfc3RhdGUpIHtcbiAgbGV0IGNvZGVcbiAgbGV0IHBvcyA9IHN0YXJ0XG5cbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgLy8gaWYgYHRydWVgLCB0aGlzIGlzIGEgdmFsaWQgbGluayB0aXRsZVxuICAgIG9rOiBmYWxzZSxcbiAgICAvLyBpZiBgdHJ1ZWAsIHRoaXMgbGluayBjYW4gYmUgY29udGludWVkIG9uIHRoZSBuZXh0IGxpbmVcbiAgICBjYW5fY29udGludWU6IGZhbHNlLFxuICAgIC8vIGlmIGBva2AsIGl0J3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGNsb3NpbmcgbWFya2VyXG4gICAgcG9zOiAwLFxuICAgIC8vIGlmIGBva2AsIGl0J3MgdGhlIHVuZXNjYXBlZCB0aXRsZVxuICAgIHN0cjogJycsXG4gICAgLy8gZXhwZWN0ZWQgY2xvc2luZyBtYXJrZXIgY2hhcmFjdGVyIGNvZGVcbiAgICBtYXJrZXI6IDBcbiAgfVxuXG4gIGlmIChwcmV2X3N0YXRlKSB7XG4gICAgLy8gdGhpcyBpcyBhIGNvbnRpbnVhdGlvbiBvZiBhIHByZXZpb3VzIHBhcnNlTGlua1RpdGxlIGNhbGwgb24gdGhlIG5leHQgbGluZSxcbiAgICAvLyB1c2VkIGluIHJlZmVyZW5jZSBsaW5rcyBvbmx5XG4gICAgc3RhdGUuc3RyID0gcHJldl9zdGF0ZS5zdHJcbiAgICBzdGF0ZS5tYXJrZXIgPSBwcmV2X3N0YXRlLm1hcmtlclxuICB9IGVsc2Uge1xuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBzdGF0ZSB9XG5cbiAgICBsZXQgbWFya2VyID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmIChtYXJrZXIgIT09IDB4MjIgLyogXCIgKi8gJiYgbWFya2VyICE9PSAweDI3IC8qICcgKi8gJiYgbWFya2VyICE9PSAweDI4IC8qICggKi8pIHsgcmV0dXJuIHN0YXRlIH1cblxuICAgIHN0YXJ0KytcbiAgICBwb3MrK1xuXG4gICAgLy8gaWYgb3BlbmluZyBtYXJrZXIgaXMgXCIoXCIsIHN3aXRjaCBpdCB0byBjbG9zaW5nIG1hcmtlciBcIilcIlxuICAgIGlmIChtYXJrZXIgPT09IDB4MjgpIHsgbWFya2VyID0gMHgyOSB9XG5cbiAgICBzdGF0ZS5tYXJrZXIgPSBtYXJrZXJcbiAgfVxuXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmIChjb2RlID09PSBzdGF0ZS5tYXJrZXIpIHtcbiAgICAgIHN0YXRlLnBvcyA9IHBvcyArIDFcbiAgICAgIHN0YXRlLnN0ciArPSB1bmVzY2FwZUFsbChzdHIuc2xpY2Uoc3RhcnQsIHBvcykpXG4gICAgICBzdGF0ZS5vayA9IHRydWVcbiAgICAgIHJldHVybiBzdGF0ZVxuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHgyOCAvKiAoICovICYmIHN0YXRlLm1hcmtlciA9PT0gMHgyOSAvKiApICovKSB7XG4gICAgICByZXR1cm4gc3RhdGVcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgcG9zKytcbiAgICB9XG5cbiAgICBwb3MrK1xuICB9XG5cbiAgLy8gbm8gY2xvc2luZyBtYXJrZXIgZm91bmQsIGJ1dCB0aGlzIGxpbmsgdGl0bGUgbWF5IGNvbnRpbnVlIG9uIHRoZSBuZXh0IGxpbmUgKGZvciByZWZlcmVuY2VzKVxuICBzdGF0ZS5jYW5fY29udGludWUgPSB0cnVlXG4gIHN0YXRlLnN0ciArPSB1bmVzY2FwZUFsbChzdHIuc2xpY2Uoc3RhcnQsIHBvcykpXG4gIHJldHVybiBzdGF0ZVxufVxuIiwgIi8vIEp1c3QgYSBzaG9ydGN1dCBmb3IgYnVsayBleHBvcnRcblxuaW1wb3J0IHBhcnNlTGlua0xhYmVsIGZyb20gJy4vcGFyc2VfbGlua19sYWJlbC5tanMnXG5pbXBvcnQgcGFyc2VMaW5rRGVzdGluYXRpb24gZnJvbSAnLi9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uLm1qcydcbmltcG9ydCBwYXJzZUxpbmtUaXRsZSBmcm9tICcuL3BhcnNlX2xpbmtfdGl0bGUubWpzJ1xuXG5leHBvcnQge1xuICBwYXJzZUxpbmtMYWJlbCxcbiAgcGFyc2VMaW5rRGVzdGluYXRpb24sXG4gIHBhcnNlTGlua1RpdGxlXG59XG4iLCAiLyoqXG4gKiBjbGFzcyBSZW5kZXJlclxuICpcbiAqIEdlbmVyYXRlcyBIVE1MIGZyb20gcGFyc2VkIHRva2VuIHN0cmVhbS4gRWFjaCBpbnN0YW5jZSBoYXMgaW5kZXBlbmRlbnRcbiAqIGNvcHkgb2YgcnVsZXMuIFRob3NlIGNhbiBiZSByZXdyaXR0ZW4gd2l0aCBlYXNlLiBBbHNvLCB5b3UgY2FuIGFkZCBuZXdcbiAqIHJ1bGVzIGlmIHlvdSBjcmVhdGUgcGx1Z2luIGFuZCBhZGRzIG5ldyB0b2tlbiB0eXBlcy5cbiAqKi9cblxuaW1wb3J0IHsgYXNzaWduLCB1bmVzY2FwZUFsbCwgZXNjYXBlSHRtbCB9IGZyb20gJy4vY29tbW9uL3V0aWxzLm1qcydcblxuY29uc3QgZGVmYXVsdF9ydWxlcyA9IHt9XG5cbmRlZmF1bHRfcnVsZXMuY29kZV9pbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF1cblxuICByZXR1cm4gJzxjb2RlJyArIHNsZi5yZW5kZXJBdHRycyh0b2tlbikgKyAnPicgK1xuICAgICAgICAgIGVzY2FwZUh0bWwodG9rZW4uY29udGVudCkgK1xuICAgICAgICAgICc8L2NvZGU+J1xufVxuXG5kZWZhdWx0X3J1bGVzLmNvZGVfYmxvY2sgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF1cblxuICByZXR1cm4gJzxwcmUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+PGNvZGU+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT48L3ByZT5cXG4nXG59XG5cbmRlZmF1bHRfcnVsZXMuZmVuY2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF1cbiAgY29uc3QgaW5mbyA9IHRva2VuLmluZm8gPyB1bmVzY2FwZUFsbCh0b2tlbi5pbmZvKS50cmltKCkgOiAnJ1xuICBsZXQgbGFuZ05hbWUgPSAnJ1xuICBsZXQgbGFuZ0F0dHJzID0gJydcblxuICBpZiAoaW5mbykge1xuICAgIGNvbnN0IGFyciA9IGluZm8uc3BsaXQoLyhcXHMrKS9nKVxuICAgIGxhbmdOYW1lID0gYXJyWzBdXG4gICAgbGFuZ0F0dHJzID0gYXJyLnNsaWNlKDIpLmpvaW4oJycpXG4gIH1cblxuICBsZXQgaGlnaGxpZ2h0ZWRcbiAgaWYgKG9wdGlvbnMuaGlnaGxpZ2h0KSB7XG4gICAgaGlnaGxpZ2h0ZWQgPSBvcHRpb25zLmhpZ2hsaWdodCh0b2tlbi5jb250ZW50LCBsYW5nTmFtZSwgbGFuZ0F0dHJzKSB8fCBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpXG4gIH0gZWxzZSB7XG4gICAgaGlnaGxpZ2h0ZWQgPSBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpXG4gIH1cblxuICBpZiAoaGlnaGxpZ2h0ZWQuaW5kZXhPZignPHByZScpID09PSAwKSB7XG4gICAgcmV0dXJuIGhpZ2hsaWdodGVkICsgJ1xcbidcbiAgfVxuXG4gIC8vIElmIGxhbmd1YWdlIGV4aXN0cywgaW5qZWN0IGNsYXNzIGdlbnRseSwgd2l0aG91dCBtb2RpZnlpbmcgb3JpZ2luYWwgdG9rZW4uXG4gIC8vIE1heSBiZSwgb25lIGRheSB3ZSB3aWxsIGFkZCAuZGVlcENsb25lKCkgZm9yIHRva2VuIGFuZCBzaW1wbGlmeSB0aGlzIHBhcnQsIGJ1dFxuICAvLyBub3cgd2UgcHJlZmVyIHRvIGtlZXAgdGhpbmdzIGxvY2FsLlxuICBpZiAoaW5mbykge1xuICAgIGNvbnN0IGkgPSB0b2tlbi5hdHRySW5kZXgoJ2NsYXNzJylcbiAgICBjb25zdCB0bXBBdHRycyA9IHRva2VuLmF0dHJzID8gdG9rZW4uYXR0cnMuc2xpY2UoKSA6IFtdXG5cbiAgICBpZiAoaSA8IDApIHtcbiAgICAgIHRtcEF0dHJzLnB1c2goWydjbGFzcycsIG9wdGlvbnMubGFuZ1ByZWZpeCArIGxhbmdOYW1lXSlcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wQXR0cnNbaV0gPSB0bXBBdHRyc1tpXS5zbGljZSgpXG4gICAgICB0bXBBdHRyc1tpXVsxXSArPSAnICcgKyBvcHRpb25zLmxhbmdQcmVmaXggKyBsYW5nTmFtZVxuICAgIH1cblxuICAgIC8vIEZha2UgdG9rZW4ganVzdCB0byByZW5kZXIgYXR0cmlidXRlc1xuICAgIGNvbnN0IHRtcFRva2VuID0ge1xuICAgICAgYXR0cnM6IHRtcEF0dHJzXG4gICAgfVxuXG4gICAgcmV0dXJuIGA8cHJlPjxjb2RlJHtzbGYucmVuZGVyQXR0cnModG1wVG9rZW4pfT4ke2hpZ2hsaWdodGVkfTwvY29kZT48L3ByZT5cXG5gXG4gIH1cblxuICByZXR1cm4gYDxwcmU+PGNvZGUke3NsZi5yZW5kZXJBdHRycyh0b2tlbil9PiR7aGlnaGxpZ2h0ZWR9PC9jb2RlPjwvcHJlPlxcbmBcbn1cblxuZGVmYXVsdF9ydWxlcy5pbWFnZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XVxuXG4gIC8vIFwiYWx0XCIgYXR0ciBNVVNUIGJlIHNldCwgZXZlbiBpZiBlbXB0eS4gQmVjYXVzZSBpdCdzIG1hbmRhdG9yeSBhbmRcbiAgLy8gc2hvdWxkIGJlIHBsYWNlZCBvbiBwcm9wZXIgcG9zaXRpb24gZm9yIHRlc3RzLlxuICAvL1xuICAvLyBSZXBsYWNlIGNvbnRlbnQgd2l0aCBhY3R1YWwgdmFsdWVcblxuICB0b2tlbi5hdHRyc1t0b2tlbi5hdHRySW5kZXgoJ2FsdCcpXVsxXSA9XG4gICAgc2xmLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbi5jaGlsZHJlbiwgb3B0aW9ucywgZW52KVxuXG4gIHJldHVybiBzbGYucmVuZGVyVG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMpXG59XG5cbmRlZmF1bHRfcnVsZXMuaGFyZGJyZWFrID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zIC8qLCBlbnYgKi8pIHtcbiAgcmV0dXJuIG9wdGlvbnMueGh0bWxPdXQgPyAnPGJyIC8+XFxuJyA6ICc8YnI+XFxuJ1xufVxuZGVmYXVsdF9ydWxlcy5zb2Z0YnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy5icmVha3MgPyAob3B0aW9ucy54aHRtbE91dCA/ICc8YnIgLz5cXG4nIDogJzxicj5cXG4nKSA6ICdcXG4nXG59XG5cbmRlZmF1bHRfcnVsZXMudGV4dCA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiBlc2NhcGVIdG1sKHRva2Vuc1tpZHhdLmNvbnRlbnQpXG59XG5cbmRlZmF1bHRfcnVsZXMuaHRtbF9ibG9jayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiB0b2tlbnNbaWR4XS5jb250ZW50XG59XG5kZWZhdWx0X3J1bGVzLmh0bWxfaW5saW5lID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIHRva2Vuc1tpZHhdLmNvbnRlbnRcbn1cblxuLyoqXG4gKiBuZXcgUmVuZGVyZXIoKVxuICpcbiAqIENyZWF0ZXMgbmV3IFtbUmVuZGVyZXJdXSBpbnN0YW5jZSBhbmQgZmlsbCBbW1JlbmRlcmVyI3J1bGVzXV0gd2l0aCBkZWZhdWx0cy5cbiAqKi9cbmZ1bmN0aW9uIFJlbmRlcmVyICgpIHtcbiAgLyoqXG4gICAqIFJlbmRlcmVyI3J1bGVzIC0+IE9iamVjdFxuICAgKlxuICAgKiBDb250YWlucyByZW5kZXIgcnVsZXMgZm9yIHRva2Vucy4gQ2FuIGJlIHVwZGF0ZWQgYW5kIGV4dGVuZGVkLlxuICAgKlxuICAgKiAjIyMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICAgKlxuICAgKiBtZC5yZW5kZXJlci5ydWxlcy5zdHJvbmdfb3BlbiAgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnPGI+JzsgfTtcbiAgICogbWQucmVuZGVyZXIucnVsZXMuc3Ryb25nX2Nsb3NlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJzwvYj4nOyB9O1xuICAgKlxuICAgKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVySW5saW5lKC4uLik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBFYWNoIHJ1bGUgaXMgY2FsbGVkIGFzIGluZGVwZW5kZW50IHN0YXRpYyBmdW5jdGlvbiB3aXRoIGZpeGVkIHNpZ25hdHVyZTpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBmdW5jdGlvbiBteV90b2tlbl9yZW5kZXIodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgcmVuZGVyZXIpIHtcbiAgICogICAvLyAuLi5cbiAgICogICByZXR1cm4gcmVuZGVyZWRIVE1MO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBTZWUgW3NvdXJjZSBjb2RlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3JlbmRlcmVyLm1qcylcbiAgICogZm9yIG1vcmUgZGV0YWlscyBhbmQgZXhhbXBsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlcyA9IGFzc2lnbih7fSwgZGVmYXVsdF9ydWxlcylcbn1cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXJBdHRycyh0b2tlbikgLT4gU3RyaW5nXG4gKlxuICogUmVuZGVyIHRva2VuIGF0dHJpYnV0ZXMgdG8gc3RyaW5nLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlckF0dHJzID0gZnVuY3Rpb24gcmVuZGVyQXR0cnMgKHRva2VuKSB7XG4gIGxldCBpLCBsLCByZXN1bHRcblxuICBpZiAoIXRva2VuLmF0dHJzKSB7IHJldHVybiAnJyB9XG5cbiAgcmVzdWx0ID0gJydcblxuICBmb3IgKGkgPSAwLCBsID0gdG9rZW4uYXR0cnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcmVzdWx0ICs9ICcgJyArIGVzY2FwZUh0bWwodG9rZW4uYXR0cnNbaV1bMF0pICsgJz1cIicgKyBlc2NhcGVIdG1sKHRva2VuLmF0dHJzW2ldWzFdKSArICdcIidcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXJUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucykgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9mIHRva2Vuc1xuICogLSBpZHggKE51bWJlZCk6IHRva2VuIGluZGV4IHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKlxuICogRGVmYXVsdCB0b2tlbiByZW5kZXJlci4gQ2FuIGJlIG92ZXJyaWRlbiBieSBjdXN0b20gZnVuY3Rpb25cbiAqIGluIFtbUmVuZGVyZXIjcnVsZXNdXS5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJUb2tlbiA9IGZ1bmN0aW9uIHJlbmRlclRva2VuICh0b2tlbnMsIGlkeCwgb3B0aW9ucykge1xuICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdXG4gIGxldCByZXN1bHQgPSAnJ1xuXG4gIC8vIFRpZ2h0IGxpc3QgcGFyYWdyYXBoc1xuICBpZiAodG9rZW4uaGlkZGVuKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBJbnNlcnQgYSBuZXdsaW5lIGJldHdlZW4gaGlkZGVuIHBhcmFncmFwaCBhbmQgc3Vic2VxdWVudCBvcGVuaW5nXG4gIC8vIGJsb2NrLWxldmVsIHRhZy5cbiAgLy9cbiAgLy8gRm9yIGV4YW1wbGUsIGhlcmUgd2Ugc2hvdWxkIGluc2VydCBhIG5ld2xpbmUgYmVmb3JlIGJsb2NrcXVvdGU6XG4gIC8vICAtIGFcbiAgLy8gICAgPlxuICAvL1xuICBpZiAodG9rZW4uYmxvY2sgJiYgdG9rZW4ubmVzdGluZyAhPT0gLTEgJiYgaWR4ICYmIHRva2Vuc1tpZHggLSAxXS5oaWRkZW4pIHtcbiAgICByZXN1bHQgKz0gJ1xcbidcbiAgfVxuXG4gIC8vIEFkZCB0b2tlbiBuYW1lLCBlLmcuIGA8aW1nYFxuICByZXN1bHQgKz0gKHRva2VuLm5lc3RpbmcgPT09IC0xID8gJzwvJyA6ICc8JykgKyB0b2tlbi50YWdcblxuICAvLyBFbmNvZGUgYXR0cmlidXRlcywgZS5nLiBgPGltZyBzcmM9XCJmb29cImBcbiAgcmVzdWx0ICs9IHRoaXMucmVuZGVyQXR0cnModG9rZW4pXG5cbiAgLy8gQWRkIGEgc2xhc2ggZm9yIHNlbGYtY2xvc2luZyB0YWdzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiIC9gXG4gIGlmICh0b2tlbi5uZXN0aW5nID09PSAwICYmIG9wdGlvbnMueGh0bWxPdXQpIHtcbiAgICByZXN1bHQgKz0gJyAvJ1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBhZGQgYSBuZXdsaW5lIGFmdGVyIHRoaXMgdGFnXG4gIGxldCBuZWVkTGYgPSBmYWxzZVxuICBpZiAodG9rZW4uYmxvY2spIHtcbiAgICBuZWVkTGYgPSB0cnVlXG5cbiAgICBpZiAodG9rZW4ubmVzdGluZyA9PT0gMSkge1xuICAgICAgaWYgKGlkeCArIDEgPCB0b2tlbnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IG5leHRUb2tlbiA9IHRva2Vuc1tpZHggKyAxXVxuXG4gICAgICAgIGlmIChuZXh0VG9rZW4udHlwZSA9PT0gJ2lubGluZScgfHwgbmV4dFRva2VuLmhpZGRlbikge1xuICAgICAgICAgIC8vIEJsb2NrLWxldmVsIHRhZyBjb250YWluaW5nIGFuIGlubGluZSB0YWcuXG4gICAgICAgICAgLy9cbiAgICAgICAgICBuZWVkTGYgPSBmYWxzZVxuICAgICAgICB9IGVsc2UgaWYgKG5leHRUb2tlbi5uZXN0aW5nID09PSAtMSAmJiBuZXh0VG9rZW4udGFnID09PSB0b2tlbi50YWcpIHtcbiAgICAgICAgICAvLyBPcGVuaW5nIHRhZyArIGNsb3NpbmcgdGFnIG9mIHRoZSBzYW1lIHR5cGUuIEUuZy4gYDxsaT48L2xpPmAuXG4gICAgICAgICAgLy9cbiAgICAgICAgICBuZWVkTGYgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVzdWx0ICs9IG5lZWRMZiA/ICc+XFxuJyA6ICc+J1xuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXJJbmxpbmUodG9rZW5zLCBvcHRpb25zLCBlbnYpIC0+IFN0cmluZ1xuICogLSB0b2tlbnMgKEFycmF5KTogbGlzdCBvbiBibG9jayB0b2tlbnMgdG8gcmVuZGVyXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHBhcmFtcyBvZiBwYXJzZXIgaW5zdGFuY2VcbiAqIC0gZW52IChPYmplY3QpOiBhZGRpdGlvbmFsIGRhdGEgZnJvbSBwYXJzZWQgaW5wdXQgKHJlZmVyZW5jZXMsIGZvciBleGFtcGxlKVxuICpcbiAqIFRoZSBzYW1lIGFzIFtbUmVuZGVyZXIucmVuZGVyXV0sIGJ1dCBmb3Igc2luZ2xlIHRva2VuIG9mIGBpbmxpbmVgIHR5cGUuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVySW5saW5lID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIGxldCByZXN1bHQgPSAnJ1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXNcblxuICBmb3IgKGxldCBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgdHlwZSA9IHRva2Vuc1tpXS50eXBlXG5cbiAgICBpZiAodHlwZW9mIHJ1bGVzW3R5cGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ICs9IHJ1bGVzW3R5cGVdKHRva2VucywgaSwgb3B0aW9ucywgZW52LCB0aGlzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJUb2tlbih0b2tlbnMsIGksIG9wdGlvbnMpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKiogaW50ZXJuYWxcbiAqIFJlbmRlcmVyLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogU3BlY2lhbCBrbHVkZ2UgZm9yIGltYWdlIGBhbHRgIGF0dHJpYnV0ZXMgdG8gY29uZm9ybSBDb21tb25NYXJrIHNwZWMuXG4gKiBEb24ndCB0cnkgdG8gdXNlIGl0ISBTcGVjIHJlcXVpcmVzIHRvIHNob3cgYGFsdGAgY29udGVudCB3aXRoIHN0cmlwcGVkIG1hcmt1cCxcbiAqIGluc3RlYWQgb2Ygc2ltcGxlIGVzY2FwaW5nLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcklubGluZUFzVGV4dCA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICBsZXQgcmVzdWx0ID0gJydcblxuICBmb3IgKGxldCBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgc3dpdGNoICh0b2tlbnNbaV0udHlwZSkge1xuICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgIHJlc3VsdCArPSB0b2tlbnNbaV0uY29udGVudFxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJJbmxpbmVBc1RleHQodG9rZW5zW2ldLmNoaWxkcmVuLCBvcHRpb25zLCBlbnYpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdodG1sX2lubGluZSc6XG4gICAgICBjYXNlICdodG1sX2Jsb2NrJzpcbiAgICAgICAgcmVzdWx0ICs9IHRva2Vuc1tpXS5jb250ZW50XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdzb2Z0YnJlYWsnOlxuICAgICAgY2FzZSAnaGFyZGJyZWFrJzpcbiAgICAgICAgcmVzdWx0ICs9ICdcXG4nXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBhbGwgb3RoZXIgdG9rZW5zIGFyZSBza2lwcGVkXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlcih0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogVGFrZXMgdG9rZW4gc3RyZWFtIGFuZCBnZW5lcmF0ZXMgSFRNTC4gUHJvYmFibHksIHlvdSB3aWxsIG5ldmVyIG5lZWQgdG8gY2FsbFxuICogdGhpcyBtZXRob2QgZGlyZWN0bHkuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIGxldCByZXN1bHQgPSAnJ1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXNcblxuICBmb3IgKGxldCBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgdHlwZSA9IHRva2Vuc1tpXS50eXBlXG5cbiAgICBpZiAodHlwZSA9PT0gJ2lubGluZScpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlcklubGluZSh0b2tlbnNbaV0uY2hpbGRyZW4sIG9wdGlvbnMsIGVudilcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBydWxlc1t0eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJlc3VsdCArPSBydWxlc1t0eXBlXSh0b2tlbnMsIGksIG9wdGlvbnMsIGVudiwgdGhpcylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyVG9rZW4odG9rZW5zLCBpLCBvcHRpb25zLCBlbnYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZGVmYXVsdCBSZW5kZXJlclxuIiwgIi8qKlxuICogY2xhc3MgUnVsZXJcbiAqXG4gKiBIZWxwZXIgY2xhc3MsIHVzZWQgYnkgW1tNYXJrZG93bkl0I2NvcmVdXSwgW1tNYXJrZG93bkl0I2Jsb2NrXV0gYW5kXG4gKiBbW01hcmtkb3duSXQjaW5saW5lXV0gdG8gbWFuYWdlIHNlcXVlbmNlcyBvZiBmdW5jdGlvbnMgKHJ1bGVzKTpcbiAqXG4gKiAtIGtlZXAgcnVsZXMgaW4gZGVmaW5lZCBvcmRlclxuICogLSBhc3NpZ24gdGhlIG5hbWUgdG8gZWFjaCBydWxlXG4gKiAtIGVuYWJsZS9kaXNhYmxlIHJ1bGVzXG4gKiAtIGFkZC9yZXBsYWNlIHJ1bGVzXG4gKiAtIGFsbG93IGFzc2lnbiBydWxlcyB0byBhZGRpdGlvbmFsIG5hbWVkIGNoYWlucyAoaW4gdGhlIHNhbWUpXG4gKiAtIGNhY2hlaW5nIGxpc3RzIG9mIGFjdGl2ZSBydWxlc1xuICpcbiAqIFlvdSB3aWxsIG5vdCBuZWVkIHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5IHVudGlsIHdyaXRlIHBsdWdpbnMuIEZvciBzaW1wbGVcbiAqIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0sIFtbTWFya2Rvd25JdC5lbmFibGVdXSBhbmRcbiAqIFtbTWFya2Rvd25JdC51c2VdXS5cbiAqKi9cblxuLyoqXG4gKiBuZXcgUnVsZXIoKVxuICoqL1xuZnVuY3Rpb24gUnVsZXIgKCkge1xuICAvLyBMaXN0IG9mIGFkZGVkIHJ1bGVzLiBFYWNoIGVsZW1lbnQgaXM6XG4gIC8vXG4gIC8vIHtcbiAgLy8gICBuYW1lOiBYWFgsXG4gIC8vICAgZW5hYmxlZDogQm9vbGVhbixcbiAgLy8gICBmbjogRnVuY3Rpb24oKSxcbiAgLy8gICBhbHQ6IFsgbmFtZTIsIG5hbWUzIF1cbiAgLy8gfVxuICAvL1xuICB0aGlzLl9fcnVsZXNfXyA9IFtdXG5cbiAgLy8gQ2FjaGVkIHJ1bGUgY2hhaW5zLlxuICAvL1xuICAvLyBGaXJzdCBsZXZlbCAtIGNoYWluIG5hbWUsICcnIGZvciBkZWZhdWx0LlxuICAvLyBTZWNvbmQgbGV2ZWwgLSBkaWdpbmFsIGFuY2hvciBmb3IgZmFzdCBmaWx0ZXJpbmcgYnkgY2hhcmNvZGVzLlxuICAvL1xuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbn1cblxuLy8gSGVscGVyIG1ldGhvZHMsIHNob3VsZCBub3QgYmUgdXNlZCBkaXJlY3RseVxuXG4vLyBGaW5kIHJ1bGUgaW5kZXggYnkgbmFtZVxuLy9cblJ1bGVyLnByb3RvdHlwZS5fX2ZpbmRfXyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX3J1bGVzX18ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5fX3J1bGVzX19baV0ubmFtZSA9PT0gbmFtZSkge1xuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbi8vIEJ1aWxkIHJ1bGVzIGxvb2t1cCBjYWNoZVxuLy9cblJ1bGVyLnByb3RvdHlwZS5fX2NvbXBpbGVfXyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3Qgc2VsZiA9IHRoaXNcbiAgY29uc3QgY2hhaW5zID0gWycnXVxuXG4gIC8vIGNvbGxlY3QgdW5pcXVlIG5hbWVzXG4gIHNlbGYuX19ydWxlc19fLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICBpZiAoIXJ1bGUuZW5hYmxlZCkgeyByZXR1cm4gfVxuXG4gICAgcnVsZS5hbHQuZm9yRWFjaChmdW5jdGlvbiAoYWx0TmFtZSkge1xuICAgICAgaWYgKGNoYWlucy5pbmRleE9mKGFsdE5hbWUpIDwgMCkge1xuICAgICAgICBjaGFpbnMucHVzaChhbHROYW1lKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgc2VsZi5fX2NhY2hlX18gPSB7fVxuXG4gIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChjaGFpbikge1xuICAgIHNlbGYuX19jYWNoZV9fW2NoYWluXSA9IFtdXG4gICAgc2VsZi5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgaWYgKCFydWxlLmVuYWJsZWQpIHsgcmV0dXJuIH1cblxuICAgICAgaWYgKGNoYWluICYmIHJ1bGUuYWx0LmluZGV4T2YoY2hhaW4pIDwgMCkgeyByZXR1cm4gfVxuXG4gICAgICBzZWxmLl9fY2FjaGVfX1tjaGFpbl0ucHVzaChydWxlLmZuKVxuICAgIH0pXG4gIH0pXG59XG5cbi8qKlxuICogUnVsZXIuYXQobmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIG5hbWUgKFN0cmluZyk6IHJ1bGUgbmFtZSB0byByZXBsYWNlLlxuICogLSBmbiAoRnVuY3Rpb24pOiBuZXcgcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogbmV3IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogUmVwbGFjZSBydWxlIGJ5IG5hbWUgd2l0aCBuZXcgZnVuY3Rpb24gJiBvcHRpb25zLiBUaHJvd3MgZXJyb3IgaWYgbmFtZSBub3RcbiAqIGZvdW5kLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogUmVwbGFjZSBleGlzdGluZyB0eXBvZ3JhcGhlciByZXBsYWNlbWVudCBydWxlIHdpdGggbmV3IG9uZTpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKlxuICogbWQuY29yZS5ydWxlci5hdCgncmVwbGFjZW1lbnRzJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChuYW1lLCBmbiwgb3B0aW9ucykge1xuICBjb25zdCBpbmRleCA9IHRoaXMuX19maW5kX18obmFtZSlcbiAgY29uc3Qgb3B0ID0gb3B0aW9ucyB8fCB7fVxuXG4gIGlmIChpbmRleCA9PT0gLTEpIHsgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBuYW1lKSB9XG5cbiAgdGhpcy5fX3J1bGVzX19baW5kZXhdLmZuID0gZm5cbiAgdGhpcy5fX3J1bGVzX19baW5kZXhdLmFsdCA9IG9wdC5hbHQgfHwgW11cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsXG59XG5cbi8qKlxuICogUnVsZXIuYmVmb3JlKGJlZm9yZU5hbWUsIHJ1bGVOYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gYmVmb3JlTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBiZWZvcmUgdGhpcyBvbmUuXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogQWRkIG5ldyBydWxlIHRvIGNoYWluIGJlZm9yZSBvbmUgd2l0aCBnaXZlbiBuYW1lLiBTZWUgYWxzb1xuICogW1tSdWxlci5hZnRlcl1dLCBbW1J1bGVyLnB1c2hdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5ibG9jay5ydWxlci5iZWZvcmUoJ3BhcmFncmFwaCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5iZWZvcmUgPSBmdW5jdGlvbiAoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIGNvbnN0IGluZGV4ID0gdGhpcy5fX2ZpbmRfXyhiZWZvcmVOYW1lKVxuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIGJlZm9yZU5hbWUpIH1cblxuICB0aGlzLl9fcnVsZXNfXy5zcGxpY2UoaW5kZXgsIDAsIHtcbiAgICBuYW1lOiBydWxlTmFtZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KVxuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbFxufVxuXG4vKipcbiAqIFJ1bGVyLmFmdGVyKGFmdGVyTmFtZSwgcnVsZU5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBhZnRlck5hbWUgKFN0cmluZyk6IG5ldyBydWxlIHdpbGwgYmUgYWRkZWQgYWZ0ZXIgdGhpcyBvbmUuXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogQWRkIG5ldyBydWxlIHRvIGNoYWluIGFmdGVyIG9uZSB3aXRoIGdpdmVuIG5hbWUuIFNlZSBhbHNvXG4gKiBbW1J1bGVyLmJlZm9yZV1dLCBbW1J1bGVyLnB1c2hdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5pbmxpbmUucnVsZXIuYWZ0ZXIoJ3RleHQnLCAnbXlfcnVsZScsIGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAqICAgLy8uLi5cbiAqIH0pO1xuICogYGBgXG4gKiovXG5SdWxlci5wcm90b3R5cGUuYWZ0ZXIgPSBmdW5jdGlvbiAoYWZ0ZXJOYW1lLCBydWxlTmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgY29uc3QgaW5kZXggPSB0aGlzLl9fZmluZF9fKGFmdGVyTmFtZSlcbiAgY29uc3Qgb3B0ID0gb3B0aW9ucyB8fCB7fVxuXG4gIGlmIChpbmRleCA9PT0gLTEpIHsgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBhZnRlck5hbWUpIH1cblxuICB0aGlzLl9fcnVsZXNfXy5zcGxpY2UoaW5kZXggKyAxLCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSlcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbn1cblxuLyoqXG4gKiBSdWxlci5wdXNoKHJ1bGVOYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBQdXNoIG5ldyBydWxlIHRvIHRoZSBlbmQgb2YgY2hhaW4uIFNlZSBhbHNvXG4gKiBbW1J1bGVyLmJlZm9yZV1dLCBbW1J1bGVyLmFmdGVyXV0uXG4gKlxuICogIyMjIyMgT3B0aW9uczpcbiAqXG4gKiAtIF9fYWx0X18gLSBhcnJheSB3aXRoIG5hbWVzIG9mIFwiYWx0ZXJuYXRlXCIgY2hhaW5zLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKlxuICogbWQuY29yZS5ydWxlci5wdXNoKCdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9XG5cbiAgdGhpcy5fX3J1bGVzX18ucHVzaCh7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSlcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbn1cblxuLyoqXG4gKiBSdWxlci5lbmFibGUobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSkgLT4gQXJyYXlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIEVuYWJsZSBydWxlcyB3aXRoIGdpdmVuIG5hbWVzLiBJZiBhbnkgcnVsZSBuYW1lIG5vdCBmb3VuZCAtIHRocm93IEVycm9yLlxuICogRXJyb3JzIGNhbiBiZSBkaXNhYmxlZCBieSBzZWNvbmQgcGFyYW0uXG4gKlxuICogUmV0dXJucyBsaXN0IG9mIGZvdW5kIHJ1bGUgbmFtZXMgKGlmIG5vIGV4Y2VwdGlvbiBoYXBwZW5lZCkuXG4gKlxuICogU2VlIGFsc28gW1tSdWxlci5kaXNhYmxlXV0sIFtbUnVsZXIuZW5hYmxlT25seV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkgeyBsaXN0ID0gW2xpc3RdIH1cblxuICBjb25zdCByZXN1bHQgPSBbXVxuXG4gIC8vIFNlYXJjaCBieSBuYW1lIGFuZCBlbmFibGVcbiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKVxuXG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGlmIChpZ25vcmVJbnZhbGlkKSB7IHJldHVybiB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1J1bGVzIG1hbmFnZXI6IGludmFsaWQgcnVsZSBuYW1lICcgKyBuYW1lKVxuICAgIH1cbiAgICB0aGlzLl9fcnVsZXNfX1tpZHhdLmVuYWJsZWQgPSB0cnVlXG4gICAgcmVzdWx0LnB1c2gobmFtZSlcbiAgfSwgdGhpcylcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJ1bGVyLmVuYWJsZU9ubHkobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZSAod2hpdGVsaXN0KS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIEVuYWJsZSBydWxlcyB3aXRoIGdpdmVuIG5hbWVzLCBhbmQgZGlzYWJsZSBldmVyeXRoaW5nIGVsc2UuIElmIGFueSBydWxlIG5hbWVcbiAqIG5vdCBmb3VuZCAtIHRocm93IEVycm9yLiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmRpc2FibGVdXSwgW1tSdWxlci5lbmFibGVdXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5lbmFibGVPbmx5ID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbbGlzdF0gfVxuXG4gIHRoaXMuX19ydWxlc19fLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHsgcnVsZS5lbmFibGVkID0gZmFsc2UgfSlcblxuICB0aGlzLmVuYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKVxufVxuXG4vKipcbiAqIFJ1bGVyLmRpc2FibGUobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSkgLT4gQXJyYXlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGRpc2FibGUuXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBEaXNhYmxlIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIGFueSBydWxlIG5hbWUgbm90IGZvdW5kIC0gdGhyb3cgRXJyb3IuXG4gKiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBSZXR1cm5zIGxpc3Qgb2YgZm91bmQgcnVsZSBuYW1lcyAoaWYgbm8gZXhjZXB0aW9uIGhhcHBlbmVkKS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmVuYWJsZV1dLCBbW1J1bGVyLmVuYWJsZU9ubHldXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbbGlzdF0gfVxuXG4gIGNvbnN0IHJlc3VsdCA9IFtdXG5cbiAgLy8gU2VhcmNoIGJ5IG5hbWUgYW5kIGRpc2FibGVcbiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKVxuXG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGlmIChpZ25vcmVJbnZhbGlkKSB7IHJldHVybiB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1J1bGVzIG1hbmFnZXI6IGludmFsaWQgcnVsZSBuYW1lICcgKyBuYW1lKVxuICAgIH1cbiAgICB0aGlzLl9fcnVsZXNfX1tpZHhdLmVuYWJsZWQgPSBmYWxzZVxuICAgIHJlc3VsdC5wdXNoKG5hbWUpXG4gIH0sIHRoaXMpXG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBSdWxlci5nZXRSdWxlcyhjaGFpbk5hbWUpIC0+IEFycmF5XG4gKlxuICogUmV0dXJuIGFycmF5IG9mIGFjdGl2ZSBmdW5jdGlvbnMgKHJ1bGVzKSBmb3IgZ2l2ZW4gY2hhaW4gbmFtZS4gSXQgYW5hbHl6ZXNcbiAqIHJ1bGVzIGNvbmZpZ3VyYXRpb24sIGNvbXBpbGVzIGNhY2hlcyBpZiBub3QgZXhpc3RzIGFuZCByZXR1cm5zIHJlc3VsdC5cbiAqXG4gKiBEZWZhdWx0IGNoYWluIG5hbWUgaXMgYCcnYCAoZW1wdHkgc3RyaW5nKS4gSXQgY2FuJ3QgYmUgc2tpcHBlZC4gVGhhdCdzXG4gKiBkb25lIGludGVudGlvbmFsbHksIHRvIGtlZXAgc2lnbmF0dXJlIG1vbm9tb3JwaGljIGZvciBoaWdoIHNwZWVkLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmdldFJ1bGVzID0gZnVuY3Rpb24gKGNoYWluTmFtZSkge1xuICBpZiAodGhpcy5fX2NhY2hlX18gPT09IG51bGwpIHtcbiAgICB0aGlzLl9fY29tcGlsZV9fKClcbiAgfVxuXG4gIC8vIENoYWluIGNhbiBiZSBlbXB0eSwgaWYgcnVsZXMgZGlzYWJsZWQuIEJ1dCB3ZSBzdGlsbCBoYXZlIHRvIHJldHVybiBBcnJheS5cbiAgcmV0dXJuIHRoaXMuX19jYWNoZV9fW2NoYWluTmFtZV0gfHwgW11cbn1cblxuZXhwb3J0IGRlZmF1bHQgUnVsZXJcbiIsICIvLyBUb2tlbiBjbGFzc1xuXG4vKipcbiAqIGNsYXNzIFRva2VuXG4gKiovXG5cbi8qKlxuICogbmV3IFRva2VuKHR5cGUsIHRhZywgbmVzdGluZylcbiAqXG4gKiBDcmVhdGUgbmV3IHRva2VuIGFuZCBmaWxsIHBhc3NlZCBwcm9wZXJ0aWVzLlxuICoqL1xuZnVuY3Rpb24gVG9rZW4gKHR5cGUsIHRhZywgbmVzdGluZykge1xuICAvKipcbiAgICogVG9rZW4jdHlwZSAtPiBTdHJpbmdcbiAgICpcbiAgICogVHlwZSBvZiB0aGUgdG9rZW4gKHN0cmluZywgZS5nLiBcInBhcmFncmFwaF9vcGVuXCIpXG4gICAqKi9cbiAgdGhpcy50eXBlID0gdHlwZVxuXG4gIC8qKlxuICAgKiBUb2tlbiN0YWcgLT4gU3RyaW5nXG4gICAqXG4gICAqIGh0bWwgdGFnIG5hbWUsIGUuZy4gXCJwXCJcbiAgICoqL1xuICB0aGlzLnRhZyA9IHRhZ1xuXG4gIC8qKlxuICAgKiBUb2tlbiNhdHRycyAtPiBBcnJheVxuICAgKlxuICAgKiBIdG1sIGF0dHJpYnV0ZXMuIEZvcm1hdDogYFsgWyBuYW1lMSwgdmFsdWUxIF0sIFsgbmFtZTIsIHZhbHVlMiBdIF1gXG4gICAqKi9cbiAgdGhpcy5hdHRycyA9IG51bGxcblxuICAvKipcbiAgICogVG9rZW4jbWFwIC0+IEFycmF5XG4gICAqXG4gICAqIFNvdXJjZSBtYXAgaW5mby4gRm9ybWF0OiBgWyBsaW5lX2JlZ2luLCBsaW5lX2VuZCBdYFxuICAgKiovXG4gIHRoaXMubWFwID0gbnVsbFxuXG4gIC8qKlxuICAgKiBUb2tlbiNuZXN0aW5nIC0+IE51bWJlclxuICAgKlxuICAgKiBMZXZlbCBjaGFuZ2UgKG51bWJlciBpbiB7LTEsIDAsIDF9IHNldCksIHdoZXJlOlxuICAgKlxuICAgKiAtICBgMWAgbWVhbnMgdGhlIHRhZyBpcyBvcGVuaW5nXG4gICAqIC0gIGAwYCBtZWFucyB0aGUgdGFnIGlzIHNlbGYtY2xvc2luZ1xuICAgKiAtIGAtMWAgbWVhbnMgdGhlIHRhZyBpcyBjbG9zaW5nXG4gICAqKi9cbiAgdGhpcy5uZXN0aW5nID0gbmVzdGluZ1xuXG4gIC8qKlxuICAgKiBUb2tlbiNsZXZlbCAtPiBOdW1iZXJcbiAgICpcbiAgICogbmVzdGluZyBsZXZlbCwgdGhlIHNhbWUgYXMgYHN0YXRlLmxldmVsYFxuICAgKiovXG4gIHRoaXMubGV2ZWwgPSAwXG5cbiAgLyoqXG4gICAqIFRva2VuI2NoaWxkcmVuIC0+IEFycmF5XG4gICAqXG4gICAqIEFuIGFycmF5IG9mIGNoaWxkIG5vZGVzIChpbmxpbmUgYW5kIGltZyB0b2tlbnMpXG4gICAqKi9cbiAgdGhpcy5jaGlsZHJlbiA9IG51bGxcblxuICAvKipcbiAgICogVG9rZW4jY29udGVudCAtPiBTdHJpbmdcbiAgICpcbiAgICogSW4gYSBjYXNlIG9mIHNlbGYtY2xvc2luZyB0YWcgKGNvZGUsIGh0bWwsIGZlbmNlLCBldGMuKSxcbiAgICogaXQgaGFzIGNvbnRlbnRzIG9mIHRoaXMgdGFnLlxuICAgKiovXG4gIHRoaXMuY29udGVudCA9ICcnXG5cbiAgLyoqXG4gICAqIFRva2VuI21hcmt1cCAtPiBTdHJpbmdcbiAgICpcbiAgICogJyonIG9yICdfJyBmb3IgZW1waGFzaXMsIGZlbmNlIHN0cmluZyBmb3IgZmVuY2UsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm1hcmt1cCA9ICcnXG5cbiAgLyoqXG4gICAqIFRva2VuI2luZm8gLT4gU3RyaW5nXG4gICAqXG4gICAqIEFkZGl0aW9uYWwgaW5mb3JtYXRpb246XG4gICAqXG4gICAqIC0gSW5mbyBzdHJpbmcgZm9yIFwiZmVuY2VcIiB0b2tlbnNcbiAgICogLSBUaGUgdmFsdWUgXCJhdXRvXCIgZm9yIGF1dG9saW5rIFwibGlua19vcGVuXCIgYW5kIFwibGlua19jbG9zZVwiIHRva2Vuc1xuICAgKiAtIFRoZSBzdHJpbmcgdmFsdWUgb2YgdGhlIGl0ZW0gbWFya2VyIGZvciBvcmRlcmVkLWxpc3QgXCJsaXN0X2l0ZW1fb3BlblwiIHRva2Vuc1xuICAgKiovXG4gIHRoaXMuaW5mbyA9ICcnXG5cbiAgLyoqXG4gICAqIFRva2VuI21ldGEgLT4gT2JqZWN0XG4gICAqXG4gICAqIEEgcGxhY2UgZm9yIHBsdWdpbnMgdG8gc3RvcmUgYW4gYXJiaXRyYXJ5IGRhdGFcbiAgICoqL1xuICB0aGlzLm1ldGEgPSBudWxsXG5cbiAgLyoqXG4gICAqIFRva2VuI2Jsb2NrIC0+IEJvb2xlYW5cbiAgICpcbiAgICogVHJ1ZSBmb3IgYmxvY2stbGV2ZWwgdG9rZW5zLCBmYWxzZSBmb3IgaW5saW5lIHRva2Vucy5cbiAgICogVXNlZCBpbiByZW5kZXJlciB0byBjYWxjdWxhdGUgbGluZSBicmVha3NcbiAgICoqL1xuICB0aGlzLmJsb2NrID0gZmFsc2VcblxuICAvKipcbiAgICogVG9rZW4jaGlkZGVuIC0+IEJvb2xlYW5cbiAgICpcbiAgICogSWYgaXQncyB0cnVlLCBpZ25vcmUgdGhpcyBlbGVtZW50IHdoZW4gcmVuZGVyaW5nLiBVc2VkIGZvciB0aWdodCBsaXN0c1xuICAgKiB0byBoaWRlIHBhcmFncmFwaHMuXG4gICAqKi9cbiAgdGhpcy5oaWRkZW4gPSBmYWxzZVxufVxuXG4vKipcbiAqIFRva2VuLmF0dHJJbmRleChuYW1lKSAtPiBOdW1iZXJcbiAqXG4gKiBTZWFyY2ggYXR0cmlidXRlIGluZGV4IGJ5IG5hbWUuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0ckluZGV4ID0gZnVuY3Rpb24gYXR0ckluZGV4IChuYW1lKSB7XG4gIGlmICghdGhpcy5hdHRycykgeyByZXR1cm4gLTEgfVxuXG4gIGNvbnN0IGF0dHJzID0gdGhpcy5hdHRyc1xuXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBhdHRycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChhdHRyc1tpXVswXSA9PT0gbmFtZSkgeyByZXR1cm4gaSB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbi8qKlxuICogVG9rZW4uYXR0clB1c2goYXR0ckRhdGEpXG4gKlxuICogQWRkIGBbIG5hbWUsIHZhbHVlIF1gIGF0dHJpYnV0ZSB0byBsaXN0LiBJbml0IGF0dHJzIGlmIG5lY2Vzc2FyeVxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJQdXNoID0gZnVuY3Rpb24gYXR0clB1c2ggKGF0dHJEYXRhKSB7XG4gIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgdGhpcy5hdHRycy5wdXNoKGF0dHJEYXRhKVxuICB9IGVsc2Uge1xuICAgIHRoaXMuYXR0cnMgPSBbYXR0ckRhdGFdXG4gIH1cbn1cblxuLyoqXG4gKiBUb2tlbi5hdHRyU2V0KG5hbWUsIHZhbHVlKVxuICpcbiAqIFNldCBgbmFtZWAgYXR0cmlidXRlIHRvIGB2YWx1ZWAuIE92ZXJyaWRlIG9sZCB2YWx1ZSBpZiBleGlzdHMuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0clNldCA9IGZ1bmN0aW9uIGF0dHJTZXQgKG5hbWUsIHZhbHVlKSB7XG4gIGNvbnN0IGlkeCA9IHRoaXMuYXR0ckluZGV4KG5hbWUpXG4gIGNvbnN0IGF0dHJEYXRhID0gW25hbWUsIHZhbHVlXVxuXG4gIGlmIChpZHggPCAwKSB7XG4gICAgdGhpcy5hdHRyUHVzaChhdHRyRGF0YSlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF0gPSBhdHRyRGF0YVxuICB9XG59XG5cbi8qKlxuICogVG9rZW4uYXR0ckdldChuYW1lKVxuICpcbiAqIEdldCB0aGUgdmFsdWUgb2YgYXR0cmlidXRlIGBuYW1lYCwgb3IgbnVsbCBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRyR2V0ID0gZnVuY3Rpb24gYXR0ckdldCAobmFtZSkge1xuICBjb25zdCBpZHggPSB0aGlzLmF0dHJJbmRleChuYW1lKVxuICBsZXQgdmFsdWUgPSBudWxsXG4gIGlmIChpZHggPj0gMCkge1xuICAgIHZhbHVlID0gdGhpcy5hdHRyc1tpZHhdWzFdXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogVG9rZW4uYXR0ckpvaW4obmFtZSwgdmFsdWUpXG4gKlxuICogSm9pbiB2YWx1ZSB0byBleGlzdGluZyBhdHRyaWJ1dGUgdmlhIHNwYWNlLiBPciBjcmVhdGUgbmV3IGF0dHJpYnV0ZSBpZiBub3RcbiAqIGV4aXN0cy4gVXNlZnVsIHRvIG9wZXJhdGUgd2l0aCB0b2tlbiBjbGFzc2VzLlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJKb2luID0gZnVuY3Rpb24gYXR0ckpvaW4gKG5hbWUsIHZhbHVlKSB7XG4gIGNvbnN0IGlkeCA9IHRoaXMuYXR0ckluZGV4KG5hbWUpXG5cbiAgaWYgKGlkeCA8IDApIHtcbiAgICB0aGlzLmF0dHJQdXNoKFtuYW1lLCB2YWx1ZV0pXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hdHRyc1tpZHhdWzFdID0gdGhpcy5hdHRyc1tpZHhdWzFdICsgJyAnICsgdmFsdWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUb2tlblxuIiwgIi8vIENvcmUgc3RhdGUgb2JqZWN0XG4vL1xuXG5pbXBvcnQgVG9rZW4gZnJvbSAnLi4vdG9rZW4ubWpzJ1xuXG5mdW5jdGlvbiBTdGF0ZUNvcmUgKHNyYywgbWQsIGVudikge1xuICB0aGlzLnNyYyA9IHNyY1xuICB0aGlzLmVudiA9IGVudlxuICB0aGlzLnRva2VucyA9IFtdXG4gIHRoaXMuaW5saW5lTW9kZSA9IGZhbHNlXG4gIHRoaXMubWQgPSBtZCAvLyBsaW5rIHRvIHBhcnNlciBpbnN0YW5jZVxufVxuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGNvcmUgcnVsZXNcblN0YXRlQ29yZS5wcm90b3R5cGUuVG9rZW4gPSBUb2tlblxuXG5leHBvcnQgZGVmYXVsdCBTdGF0ZUNvcmVcbiIsICIvLyBOb3JtYWxpemUgaW5wdXQgc3RyaW5nXG5cbi8vIGh0dHBzOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjI5LyNsaW5lLWVuZGluZ1xuY29uc3QgTkVXTElORVNfUkUgPSAvXFxyXFxuP3xcXG4vZ1xuY29uc3QgTlVMTF9SRSA9IC9cXDAvZ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBub3JtYWxpemUgKHN0YXRlKSB7XG4gIGxldCBzdHJcblxuICAvLyBOb3JtYWxpemUgbmV3bGluZXNcbiAgc3RyID0gc3RhdGUuc3JjLnJlcGxhY2UoTkVXTElORVNfUkUsICdcXG4nKVxuXG4gIC8vIFJlcGxhY2UgTlVMTCBjaGFyYWN0ZXJzXG4gIHN0ciA9IHN0ci5yZXBsYWNlKE5VTExfUkUsICdcXHVGRkZEJylcblxuICBzdGF0ZS5zcmMgPSBzdHJcbn1cbiIsICJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBibG9jayAoc3RhdGUpIHtcbiAgbGV0IHRva2VuXG5cbiAgaWYgKHN0YXRlLmlubGluZU1vZGUpIHtcbiAgICB0b2tlbiA9IG5ldyBzdGF0ZS5Ub2tlbignaW5saW5lJywgJycsIDApXG4gICAgdG9rZW4uY29udGVudCA9IHN0YXRlLnNyY1xuICAgIHRva2VuLm1hcCA9IFswLCAxXVxuICAgIHRva2VuLmNoaWxkcmVuID0gW11cbiAgICBzdGF0ZS50b2tlbnMucHVzaCh0b2tlbilcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5tZC5ibG9jay5wYXJzZShzdGF0ZS5zcmMsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHN0YXRlLnRva2VucylcbiAgfVxufVxuIiwgImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlubGluZSAoc3RhdGUpIHtcbiAgY29uc3QgdG9rZW5zID0gc3RhdGUudG9rZW5zXG5cbiAgLy8gUGFyc2UgaW5saW5lc1xuICBmb3IgKGxldCBpID0gMCwgbCA9IHRva2Vucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCB0b2sgPSB0b2tlbnNbaV1cbiAgICBpZiAodG9rLnR5cGUgPT09ICdpbmxpbmUnKSB7XG4gICAgICBzdGF0ZS5tZC5pbmxpbmUucGFyc2UodG9rLmNvbnRlbnQsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHRvay5jaGlsZHJlbilcbiAgICB9XG4gIH1cbn1cbiIsICIvLyBSZXBsYWNlIGxpbmstbGlrZSB0ZXh0cyB3aXRoIGxpbmsgbm9kZXMuXG4vL1xuLy8gQ3VycmVudGx5IHJlc3RyaWN0ZWQgYnkgYG1kLnZhbGlkYXRlTGluaygpYCB0byBodHRwL2h0dHBzL2Z0cFxuLy9cblxuaW1wb3J0IHsgYXJyYXlSZXBsYWNlQXQgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5mdW5jdGlvbiBpc0xpbmtPcGVuIChzdHIpIHtcbiAgcmV0dXJuIC9ePGFbPlxcc10vaS50ZXN0KHN0cilcbn1cbmZ1bmN0aW9uIGlzTGlua0Nsb3NlIChzdHIpIHtcbiAgcmV0dXJuIC9ePFxcL2FcXHMqPi9pLnRlc3Qoc3RyKVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsaW5raWZ5IChzdGF0ZSkge1xuICBjb25zdCBibG9ja1Rva2VucyA9IHN0YXRlLnRva2Vuc1xuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5saW5raWZ5KSB7IHJldHVybiB9XG5cbiAgZm9yIChsZXQgaiA9IDAsIGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICBpZiAoYmxvY2tUb2tlbnNbal0udHlwZSAhPT0gJ2lubGluZScgfHxcbiAgICAgICAgIXN0YXRlLm1kLmxpbmtpZnkucHJldGVzdChibG9ja1Rva2Vuc1tqXS5jb250ZW50KSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBsZXQgdG9rZW5zID0gYmxvY2tUb2tlbnNbal0uY2hpbGRyZW5cblxuICAgIGxldCBodG1sTGlua0xldmVsID0gMFxuXG4gICAgLy8gV2Ugc2NhbiBmcm9tIHRoZSBlbmQsIHRvIGtlZXAgcG9zaXRpb24gd2hlbiBuZXcgdGFncyBhZGRlZC5cbiAgICAvLyBVc2UgcmV2ZXJzZWQgbG9naWMgaW4gbGlua3Mgc3RhcnQvZW5kIG1hdGNoXG4gICAgZm9yIChsZXQgaSA9IHRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgY3VycmVudFRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIC8vIFNraXAgY29udGVudCBvZiBtYXJrZG93biBsaW5rc1xuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAnbGlua19jbG9zZScpIHtcbiAgICAgICAgaS0tXG4gICAgICAgIHdoaWxlICh0b2tlbnNbaV0ubGV2ZWwgIT09IGN1cnJlbnRUb2tlbi5sZXZlbCAmJiB0b2tlbnNbaV0udHlwZSAhPT0gJ2xpbmtfb3BlbicpIHtcbiAgICAgICAgICBpLS1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGNvbnRlbnQgb2YgaHRtbCB0YWcgbGlua3NcbiAgICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gJ2h0bWxfaW5saW5lJykge1xuICAgICAgICBpZiAoaXNMaW5rT3BlbihjdXJyZW50VG9rZW4uY29udGVudCkgJiYgaHRtbExpbmtMZXZlbCA+IDApIHtcbiAgICAgICAgICBodG1sTGlua0xldmVsLS1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNMaW5rQ2xvc2UoY3VycmVudFRva2VuLmNvbnRlbnQpKSB7XG4gICAgICAgICAgaHRtbExpbmtMZXZlbCsrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChodG1sTGlua0xldmVsID4gMCkgeyBjb250aW51ZSB9XG5cbiAgICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gJ3RleHQnICYmIHN0YXRlLm1kLmxpbmtpZnkudGVzdChjdXJyZW50VG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGN1cnJlbnRUb2tlbi5jb250ZW50XG4gICAgICAgIGxldCBsaW5rcyA9IHN0YXRlLm1kLmxpbmtpZnkubWF0Y2godGV4dClcblxuICAgICAgICAvLyBOb3cgc3BsaXQgc3RyaW5nIHRvIG5vZGVzXG4gICAgICAgIGNvbnN0IG5vZGVzID0gW11cbiAgICAgICAgbGV0IGxldmVsID0gY3VycmVudFRva2VuLmxldmVsXG4gICAgICAgIGxldCBsYXN0UG9zID0gMFxuXG4gICAgICAgIC8vIGZvcmJpZCBlc2NhcGUgc2VxdWVuY2UgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzdHJpbmcsXG4gICAgICAgIC8vIHRoaXMgYXZvaWRzIGh0dHBcXDovL2V4YW1wbGUuY29tLyBmcm9tIGJlaW5nIGxpbmtpZmllZCBhc1xuICAgICAgICAvLyBodHRwOjxhIGhyZWY9XCIvL2V4YW1wbGUuY29tL1wiPi8vZXhhbXBsZS5jb20vPC9hPlxuICAgICAgICBpZiAobGlua3MubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgbGlua3NbMF0uaW5kZXggPT09IDAgJiZcbiAgICAgICAgICAgIGkgPiAwICYmXG4gICAgICAgICAgICB0b2tlbnNbaSAtIDFdLnR5cGUgPT09ICd0ZXh0X3NwZWNpYWwnKSB7XG4gICAgICAgICAgbGlua3MgPSBsaW5rcy5zbGljZSgxKVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgbG4gPSAwOyBsbiA8IGxpbmtzLmxlbmd0aDsgbG4rKykge1xuICAgICAgICAgIGNvbnN0IHVybCA9IGxpbmtzW2xuXS51cmxcbiAgICAgICAgICBjb25zdCBmdWxsVXJsID0gc3RhdGUubWQubm9ybWFsaXplTGluayh1cmwpXG4gICAgICAgICAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHsgY29udGludWUgfVxuXG4gICAgICAgICAgbGV0IHVybFRleHQgPSBsaW5rc1tsbl0udGV4dFxuXG4gICAgICAgICAgLy8gTGlua2lmaWVyIG1pZ2h0IHNlbmQgcmF3IGhvc3RuYW1lcyBsaWtlIFwiZXhhbXBsZS5jb21cIiwgd2hlcmUgdXJsXG4gICAgICAgICAgLy8gc3RhcnRzIHdpdGggZG9tYWluIG5hbWUuIFNvIHdlIHByZXBlbmQgaHR0cDovLyBpbiB0aG9zZSBjYXNlcyxcbiAgICAgICAgICAvLyBhbmQgcmVtb3ZlIGl0IGFmdGVyd2FyZHMuXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZiAoIWxpbmtzW2xuXS5zY2hlbWEpIHtcbiAgICAgICAgICAgIHVybFRleHQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCgnaHR0cDovLycgKyB1cmxUZXh0KS5yZXBsYWNlKC9eaHR0cDpcXC9cXC8vLCAnJylcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmtzW2xuXS5zY2hlbWEgPT09ICdtYWlsdG86JyAmJiAhL15tYWlsdG86L2kudGVzdCh1cmxUZXh0KSkge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KCdtYWlsdG86JyArIHVybFRleHQpLnJlcGxhY2UoL15tYWlsdG86LywgJycpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVybFRleHQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCh1cmxUZXh0KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHBvcyA9IGxpbmtzW2xuXS5pbmRleFxuXG4gICAgICAgICAgaWYgKHBvcyA+IGxhc3RQb3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApXG4gICAgICAgICAgICB0b2tlbi5jb250ZW50ID0gdGV4dC5zbGljZShsYXN0UG9zLCBwb3MpXG4gICAgICAgICAgICB0b2tlbi5sZXZlbCA9IGxldmVsXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHRva2VuX28gPSBuZXcgc3RhdGUuVG9rZW4oJ2xpbmtfb3BlbicsICdhJywgMSlcbiAgICAgICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXVxuICAgICAgICAgIHRva2VuX28ubGV2ZWwgPSBsZXZlbCsrXG4gICAgICAgICAgdG9rZW5fby5tYXJrdXAgPSAnbGlua2lmeSdcbiAgICAgICAgICB0b2tlbl9vLmluZm8gPSAnYXV0bydcbiAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuX28pXG5cbiAgICAgICAgICBjb25zdCB0b2tlbl90ID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApXG4gICAgICAgICAgdG9rZW5fdC5jb250ZW50ID0gdXJsVGV4dFxuICAgICAgICAgIHRva2VuX3QubGV2ZWwgPSBsZXZlbFxuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW5fdClcblxuICAgICAgICAgIGNvbnN0IHRva2VuX2MgPSBuZXcgc3RhdGUuVG9rZW4oJ2xpbmtfY2xvc2UnLCAnYScsIC0xKVxuICAgICAgICAgIHRva2VuX2MubGV2ZWwgPSAtLWxldmVsXG4gICAgICAgICAgdG9rZW5fYy5tYXJrdXAgPSAnbGlua2lmeSdcbiAgICAgICAgICB0b2tlbl9jLmluZm8gPSAnYXV0bydcbiAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuX2MpXG5cbiAgICAgICAgICBsYXN0UG9zID0gbGlua3NbbG5dLmxhc3RJbmRleFxuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0UG9zIDwgdGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IG5ldyBzdGF0ZS5Ub2tlbigndGV4dCcsICcnLCAwKVxuICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSB0ZXh0LnNsaWNlKGxhc3RQb3MpXG4gICAgICAgICAgdG9rZW4ubGV2ZWwgPSBsZXZlbFxuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pXG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXBsYWNlIGN1cnJlbnQgbm9kZVxuICAgICAgICBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbiA9IHRva2VucyA9IGFycmF5UmVwbGFjZUF0KHRva2VucywgaSwgbm9kZXMpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCAiLy8gU2ltcGxlIHR5cG9ncmFwaGljIHJlcGxhY2VtZW50c1xuLy9cbi8vIChjKSAoQykg4oaSIMKpXG4vLyAodG0pIChUTSkg4oaSIOKEolxuLy8gKHIpIChSKSDihpIgwq5cbi8vICstIOKGkiDCsVxuLy8gLi4uIOKGkiDigKYgKGFsc28gPy4uLi4g4oaSID8uLiwgIS4uLi4g4oaSICEuLilcbi8vID8/Pz8/Pz8/IOKGkiA/Pz8sICEhISEhIOKGkiAhISEsIGAsLGAg4oaSIGAsYFxuLy8gLS0g4oaSICZuZGFzaDssIC0tLSDihpIgJm1kYXNoO1xuLy9cblxuLy8gVE9ETzpcbi8vIC0gZnJhY3Rpb25hbHMgMS8yLCAxLzQsIDMvNCAtPiDCvSwgwrwsIMK+XG4vLyAtIG11bHRpcGxpY2F0aW9ucyAyIHggNCAtPiAyIMOXIDRcblxuY29uc3QgUkFSRV9SRSA9IC9cXCstfFxcLlxcLnxcXD9cXD9cXD9cXD98ISEhIXwsLHwtLS9cblxuLy8gV29ya2Fyb3VuZCBmb3IgcGhhbnRvbWpzIC0gbmVlZCByZWdleCB3aXRob3V0IC9nIGZsYWcsXG4vLyBvciByb290IGNoZWNrIHdpbGwgZmFpbCBldmVyeSBzZWNvbmQgdGltZVxuY29uc3QgU0NPUEVEX0FCQlJfVEVTVF9SRSA9IC9cXCgoY3x0bXxyKVxcKS9pXG5cbmNvbnN0IFNDT1BFRF9BQkJSX1JFID0gL1xcKChjfHRtfHIpXFwpL2lnXG5jb25zdCBTQ09QRURfQUJCUiA9IHtcbiAgYzogJ8KpJyxcbiAgcjogJ8KuJyxcbiAgdG06ICfihKInXG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VGbiAobWF0Y2gsIG5hbWUpIHtcbiAgcmV0dXJuIFNDT1BFRF9BQkJSW25hbWUudG9Mb3dlckNhc2UoKV1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZV9zY29wZWQgKGlubGluZVRva2Vucykge1xuICBsZXQgaW5zaWRlX2F1dG9saW5rID0gMFxuXG4gIGZvciAobGV0IGkgPSBpbmxpbmVUb2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBjb25zdCB0b2tlbiA9IGlubGluZVRva2Vuc1tpXVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiAhaW5zaWRlX2F1dG9saW5rKSB7XG4gICAgICB0b2tlbi5jb250ZW50ID0gdG9rZW4uY29udGVudC5yZXBsYWNlKFNDT1BFRF9BQkJSX1JFLCByZXBsYWNlRm4pXG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS1cbiAgICB9XG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2xpbmtfY2xvc2UnICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rKytcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZV9yYXJlIChpbmxpbmVUb2tlbnMpIHtcbiAgbGV0IGluc2lkZV9hdXRvbGluayA9IDBcblxuICBmb3IgKGxldCBpID0gaW5saW5lVG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgdG9rZW4gPSBpbmxpbmVUb2tlbnNbaV1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAndGV4dCcgJiYgIWluc2lkZV9hdXRvbGluaykge1xuICAgICAgaWYgKFJBUkVfUkUudGVzdCh0b2tlbi5jb250ZW50KSkge1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gdG9rZW4uY29udGVudFxuICAgICAgICAgIC5yZXBsYWNlKC9cXCstL2csICfCsScpXG4gICAgICAgICAgLy8gLi4sIC4uLiwgLi4uLi4uLiAtPiDigKZcbiAgICAgICAgICAvLyBidXQgPy4uLi4uICYgIS4uLi4uIC0+ID8uLiAmICEuLlxuICAgICAgICAgIC5yZXBsYWNlKC9cXC57Mix9L2csICfigKYnKS5yZXBsYWNlKC8oWz8hXSnigKYvZywgJyQxLi4nKVxuICAgICAgICAgIC5yZXBsYWNlKC8oWz8hXSl7NCx9L2csICckMSQxJDEnKS5yZXBsYWNlKC8sezIsfS9nLCAnLCcpXG4gICAgICAgICAgLy8gZW0tZGFzaFxuICAgICAgICAgIC5yZXBsYWNlKC8oXnxbXi1dKS0tLSg/PVteLV18JCkvbWcsICckMVxcdTIwMTQnKVxuICAgICAgICAgIC8vIGVuLWRhc2hcbiAgICAgICAgICAucmVwbGFjZSgvKF58XFxzKS0tKD89XFxzfCQpL21nLCAnJDFcXHUyMDEzJylcbiAgICAgICAgICAucmVwbGFjZSgvKF58W14tXFxzXSktLSg/PVteLVxcc118JCkvbWcsICckMVxcdTIwMTMnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19vcGVuJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluay0tXG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluaysrXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlcGxhY2UgKHN0YXRlKSB7XG4gIGxldCBibGtJZHhcblxuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMudHlwb2dyYXBoZXIpIHsgcmV0dXJuIH1cblxuICBmb3IgKGJsa0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxOyBibGtJZHggPj0gMDsgYmxrSWR4LS0pIHtcbiAgICBpZiAoc3RhdGUudG9rZW5zW2Jsa0lkeF0udHlwZSAhPT0gJ2lubGluZScpIHsgY29udGludWUgfVxuXG4gICAgaWYgKFNDT1BFRF9BQkJSX1RFU1RfUkUudGVzdChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jb250ZW50KSkge1xuICAgICAgcmVwbGFjZV9zY29wZWQoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4pXG4gICAgfVxuXG4gICAgaWYgKFJBUkVfUkUudGVzdChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jb250ZW50KSkge1xuICAgICAgcmVwbGFjZV9yYXJlKHN0YXRlLnRva2Vuc1tibGtJZHhdLmNoaWxkcmVuKVxuICAgIH1cbiAgfVxufVxuIiwgIi8vIENvbnZlcnQgc3RyYWlnaHQgcXVvdGF0aW9uIG1hcmtzIHRvIHR5cG9ncmFwaGljIG9uZXNcbi8vXG5cbmltcG9ydCB7IGlzV2hpdGVTcGFjZSwgaXNQdW5jdENoYXJDb2RlLCBpc01kQXNjaWlQdW5jdCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmNvbnN0IFFVT1RFX1RFU1RfUkUgPSAvWydcIl0vXG5jb25zdCBRVU9URV9SRSA9IC9bJ1wiXS9nXG5jb25zdCBBUE9TVFJPUEhFID0gJ1xcdTIwMTknIC8qIOKAmSAqL1xuXG5mdW5jdGlvbiBhZGRSZXBsYWNlbWVudCAocmVwbGFjZW1lbnRzLCB0b2tlbklkeCwgcG9zLCBjaCkge1xuICBpZiAoIXJlcGxhY2VtZW50c1t0b2tlbklkeF0pIHtcbiAgICByZXBsYWNlbWVudHNbdG9rZW5JZHhdID0gW11cbiAgfVxuXG4gIHJlcGxhY2VtZW50c1t0b2tlbklkeF0ucHVzaCh7IHBvcywgY2ggfSlcbn1cblxuZnVuY3Rpb24gYXBwbHlSZXBsYWNlbWVudHMgKHN0ciwgcmVwbGFjZW1lbnRzKSB7XG4gIGxldCByZXN1bHQgPSAnJ1xuICBsZXQgbGFzdFBvcyA9IDBcblxuICByZXBsYWNlbWVudHMuc29ydCgoYSwgYikgPT4gYS5wb3MgLSBiLnBvcylcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHJlcGxhY2VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gcmVwbGFjZW1lbnRzW2ldXG5cbiAgICByZXN1bHQgKz0gc3RyLnNsaWNlKGxhc3RQb3MsIHJlcGxhY2VtZW50LnBvcykgKyByZXBsYWNlbWVudC5jaFxuICAgIGxhc3RQb3MgPSByZXBsYWNlbWVudC5wb3MgKyAxXG4gIH1cblxuICByZXR1cm4gcmVzdWx0ICsgc3RyLnNsaWNlKGxhc3RQb3MpXG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NfaW5saW5lcyAodG9rZW5zLCBzdGF0ZSkge1xuICBsZXQgalxuXG4gIGNvbnN0IHN0YWNrID0gW11cbiAgLy8gdG9rZW4gaW5kZXggLT4gbGlzdCBvZiByZXBsYWNlbWVudHMgaW4gdGhlIG9yaWdpbmFsIHRva2VuIGNvbnRlbnRcbiAgY29uc3QgcmVwbGFjZW1lbnRzID0ge31cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBjb25zdCB0aGlzTGV2ZWwgPSB0b2tlbnNbaV0ubGV2ZWxcblxuICAgIGZvciAoaiA9IHN0YWNrLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICBpZiAoc3RhY2tbal0ubGV2ZWwgPD0gdGhpc0xldmVsKSB7IGJyZWFrIH1cbiAgICB9XG4gICAgc3RhY2subGVuZ3RoID0gaiArIDFcblxuICAgIGlmICh0b2tlbi50eXBlICE9PSAndGV4dCcpIHsgY29udGludWUgfVxuXG4gICAgY29uc3QgdGV4dCA9IHRva2VuLmNvbnRlbnRcbiAgICBsZXQgcG9zID0gMFxuICAgIGNvbnN0IG1heCA9IHRleHQubGVuZ3RoXG5cbiAgICAvKiBlc2xpbnQgbm8tbGFiZWxzOjAsYmxvY2stc2NvcGVkLXZhcjowICovXG4gICAgT1VURVI6XG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgUVVPVEVfUkUubGFzdEluZGV4ID0gcG9zXG4gICAgICBjb25zdCB0ID0gUVVPVEVfUkUuZXhlYyh0ZXh0KVxuICAgICAgaWYgKCF0KSB7IGJyZWFrIH1cblxuICAgICAgbGV0IGNhbk9wZW4gPSB0cnVlXG4gICAgICBsZXQgY2FuQ2xvc2UgPSB0cnVlXG4gICAgICBwb3MgPSB0LmluZGV4ICsgMVxuICAgICAgY29uc3QgaXNTaW5nbGUgPSAodFswXSA9PT0gXCInXCIpXG5cbiAgICAgIC8vIEZpbmQgcHJldmlvdXMgY2hhcmFjdGVyLFxuICAgICAgLy8gZGVmYXVsdCB0byBzcGFjZSBpZiBpdCdzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmVcbiAgICAgIC8vXG4gICAgICBsZXQgbGFzdENoYXIgPSAweDIwXG5cbiAgICAgIGlmICh0LmluZGV4IC0gMSA+PSAwKSB7XG4gICAgICAgIGxhc3RDaGFyID0gdGV4dC5jaGFyQ29kZUF0KHQuaW5kZXggLSAxKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgaWYgKHRva2Vuc1tqXS50eXBlID09PSAnc29mdGJyZWFrJyB8fCB0b2tlbnNbal0udHlwZSA9PT0gJ2hhcmRicmVhaycpIGJyZWFrIC8vIGxhc3RDaGFyIGRlZmF1bHRzIHRvIDB4MjBcbiAgICAgICAgICBpZiAoIXRva2Vuc1tqXS5jb250ZW50KSBjb250aW51ZSAvLyBzaG91bGQgc2tpcCBhbGwgdG9rZW5zIGV4Y2VwdCAndGV4dCcsICdodG1sX2lubGluZScgb3IgJ2NvZGVfaW5saW5lJ1xuXG4gICAgICAgICAgbGFzdENoYXIgPSB0b2tlbnNbal0uY29udGVudC5jaGFyQ29kZUF0KHRva2Vuc1tqXS5jb250ZW50Lmxlbmd0aCAtIDEpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGaW5kIG5leHQgY2hhcmFjdGVyLFxuICAgICAgLy8gZGVmYXVsdCB0byBzcGFjZSBpZiBpdCdzIHRoZSBlbmQgb2YgdGhlIGxpbmVcbiAgICAgIC8vXG4gICAgICBsZXQgbmV4dENoYXIgPSAweDIwXG5cbiAgICAgIGlmIChwb3MgPCBtYXgpIHtcbiAgICAgICAgbmV4dENoYXIgPSB0ZXh0LmNoYXJDb2RlQXQocG9zKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSArIDE7IGogPCB0b2tlbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgPT09ICdzb2Z0YnJlYWsnIHx8IHRva2Vuc1tqXS50eXBlID09PSAnaGFyZGJyZWFrJykgYnJlYWsgLy8gbmV4dENoYXIgZGVmYXVsdHMgdG8gMHgyMFxuICAgICAgICAgIGlmICghdG9rZW5zW2pdLmNvbnRlbnQpIGNvbnRpbnVlIC8vIHNob3VsZCBza2lwIGFsbCB0b2tlbnMgZXhjZXB0ICd0ZXh0JywgJ2h0bWxfaW5saW5lJyBvciAnY29kZV9pbmxpbmUnXG5cbiAgICAgICAgICBuZXh0Q2hhciA9IHRva2Vuc1tqXS5jb250ZW50LmNoYXJDb2RlQXQoMClcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzTGFzdFB1bmN0Q2hhciA9IGlzTWRBc2NpaVB1bmN0KGxhc3RDaGFyKSB8fCBpc1B1bmN0Q2hhckNvZGUobGFzdENoYXIpXG4gICAgICBjb25zdCBpc05leHRQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChuZXh0Q2hhcikgfHwgaXNQdW5jdENoYXJDb2RlKG5leHRDaGFyKVxuXG4gICAgICBjb25zdCBpc0xhc3RXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKGxhc3RDaGFyKVxuICAgICAgY29uc3QgaXNOZXh0V2hpdGVTcGFjZSA9IGlzV2hpdGVTcGFjZShuZXh0Q2hhcilcblxuICAgICAgaWYgKGlzTmV4dFdoaXRlU3BhY2UpIHtcbiAgICAgICAgY2FuT3BlbiA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKGlzTmV4dFB1bmN0Q2hhcikge1xuICAgICAgICBpZiAoIShpc0xhc3RXaGl0ZVNwYWNlIHx8IGlzTGFzdFB1bmN0Q2hhcikpIHtcbiAgICAgICAgICBjYW5PcGVuID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNMYXN0V2hpdGVTcGFjZSkge1xuICAgICAgICBjYW5DbG9zZSA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKGlzTGFzdFB1bmN0Q2hhcikge1xuICAgICAgICBpZiAoIShpc05leHRXaGl0ZVNwYWNlIHx8IGlzTmV4dFB1bmN0Q2hhcikpIHtcbiAgICAgICAgICBjYW5DbG9zZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5leHRDaGFyID09PSAweDIyIC8qIFwiICovICYmIHRbMF0gPT09ICdcIicpIHtcbiAgICAgICAgaWYgKGxhc3RDaGFyID49IDB4MzAgLyogMCAqLyAmJiBsYXN0Q2hhciA8PSAweDM5IC8qIDkgKi8pIHtcbiAgICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IDFcIlwiIC0gY291bnQgZmlyc3QgcXVvdGUgYXMgYW4gaW5jaFxuICAgICAgICAgIGNhbkNsb3NlID0gY2FuT3BlbiA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNhbk9wZW4gJiYgY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gUmVwbGFjZSBxdW90ZXMgaW4gdGhlIG1pZGRsZSBvZiBwdW5jdHVhdGlvbiBzZXF1ZW5jZSwgYnV0IG5vdFxuICAgICAgICAvLyBpbiB0aGUgbWlkZGxlIG9mIHRoZSB3b3JkcywgaS5lLjpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gMS4gZm9vIFwiIGJhciBcIiBiYXogLSBub3QgcmVwbGFjZWRcbiAgICAgICAgLy8gMi4gZm9vLVwiLWJhci1cIi1iYXogLSByZXBsYWNlZFxuICAgICAgICAvLyAzLiBmb29cImJhclwiYmF6ICAgICAtIG5vdCByZXBsYWNlZFxuICAgICAgICAvL1xuICAgICAgICBjYW5PcGVuID0gaXNMYXN0UHVuY3RDaGFyXG4gICAgICAgIGNhbkNsb3NlID0gaXNOZXh0UHVuY3RDaGFyXG4gICAgICB9XG5cbiAgICAgIGlmICghY2FuT3BlbiAmJiAhY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gbWlkZGxlIG9mIHdvcmRcbiAgICAgICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICAgICAgYWRkUmVwbGFjZW1lbnQocmVwbGFjZW1lbnRzLCBpLCB0LmluZGV4LCBBUE9TVFJPUEhFKVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5DbG9zZSkge1xuICAgICAgICAvLyB0aGlzIGNvdWxkIGJlIGEgY2xvc2luZyBxdW90ZSwgcmV3aW5kIHRoZSBzdGFjayB0byBnZXQgYSBtYXRjaFxuICAgICAgICBmb3IgKGogPSBzdGFjay5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgIGxldCBpdGVtID0gc3RhY2tbal1cbiAgICAgICAgICBpZiAoc3RhY2tbal0ubGV2ZWwgPCB0aGlzTGV2ZWwpIHsgYnJlYWsgfVxuICAgICAgICAgIGlmIChpdGVtLnNpbmdsZSA9PT0gaXNTaW5nbGUgJiYgc3RhY2tbal0ubGV2ZWwgPT09IHRoaXNMZXZlbCkge1xuICAgICAgICAgICAgaXRlbSA9IHN0YWNrW2pdXG5cbiAgICAgICAgICAgIGxldCBvcGVuUXVvdGVcbiAgICAgICAgICAgIGxldCBjbG9zZVF1b3RlXG4gICAgICAgICAgICBpZiAoaXNTaW5nbGUpIHtcbiAgICAgICAgICAgICAgb3BlblF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMl1cbiAgICAgICAgICAgICAgY2xvc2VRdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzNdXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvcGVuUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1swXVxuICAgICAgICAgICAgICBjbG9zZVF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMV1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWRkUmVwbGFjZW1lbnQocmVwbGFjZW1lbnRzLCBpLCB0LmluZGV4LCBjbG9zZVF1b3RlKVxuICAgICAgICAgICAgYWRkUmVwbGFjZW1lbnQocmVwbGFjZW1lbnRzLCBpdGVtLnRva2VuLCBpdGVtLnBvcywgb3BlblF1b3RlKVxuXG4gICAgICAgICAgICBzdGFjay5sZW5ndGggPSBqXG4gICAgICAgICAgICBjb250aW51ZSBPVVRFUlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FuT3Blbikge1xuICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICB0b2tlbjogaSxcbiAgICAgICAgICBwb3M6IHQuaW5kZXgsXG4gICAgICAgICAgc2luZ2xlOiBpc1NpbmdsZSxcbiAgICAgICAgICBsZXZlbDogdGhpc0xldmVsXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKGNhbkNsb3NlICYmIGlzU2luZ2xlKSB7XG4gICAgICAgIGFkZFJlcGxhY2VtZW50KHJlcGxhY2VtZW50cywgaSwgdC5pbmRleCwgQVBPU1RST1BIRSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmZvckVhY2goZnVuY3Rpb24gKHRva2VuSWR4KSB7XG4gICAgdG9rZW5zW3Rva2VuSWR4XS5jb250ZW50ID0gYXBwbHlSZXBsYWNlbWVudHModG9rZW5zW3Rva2VuSWR4XS5jb250ZW50LCByZXBsYWNlbWVudHNbdG9rZW5JZHhdKVxuICB9KVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzbWFydHF1b3RlcyAoc3RhdGUpIHtcbiAgLyogZXNsaW50IG1heC1kZXB0aDowICovXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy50eXBvZ3JhcGhlcikgeyByZXR1cm4gfVxuXG4gIGZvciAobGV0IGJsa0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxOyBibGtJZHggPj0gMDsgYmxrSWR4LS0pIHtcbiAgICBpZiAoc3RhdGUudG9rZW5zW2Jsa0lkeF0udHlwZSAhPT0gJ2lubGluZScgfHxcbiAgICAgICAgIVFVT1RFX1RFU1RfUkUudGVzdChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jb250ZW50KSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBwcm9jZXNzX2lubGluZXMoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4sIHN0YXRlKVxuICB9XG59XG4iLCAiLy8gSm9pbiByYXcgdGV4dCB0b2tlbnMgd2l0aCB0aGUgcmVzdCBvZiB0aGUgdGV4dFxuLy9cbi8vIFRoaXMgaXMgc2V0IGFzIGEgc2VwYXJhdGUgcnVsZSB0byBwcm92aWRlIGFuIG9wcG9ydHVuaXR5IGZvciBwbHVnaW5zXG4vLyB0byBydW4gdGV4dCByZXBsYWNlbWVudHMgYWZ0ZXIgdGV4dCBqb2luLCBidXQgYmVmb3JlIGVzY2FwZSBqb2luLlxuLy9cbi8vIEZvciBleGFtcGxlLCBgXFw6KWAgc2hvdWxkbid0IGJlIHJlcGxhY2VkIHdpdGggYW4gZW1vamkuXG4vL1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXh0X2pvaW4gKHN0YXRlKSB7XG4gIGxldCBjdXJyLCBsYXN0XG4gIGNvbnN0IGJsb2NrVG9rZW5zID0gc3RhdGUudG9rZW5zXG4gIGNvbnN0IGwgPSBibG9ja1Rva2Vucy5sZW5ndGhcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGw7IGorKykge1xuICAgIGlmIChibG9ja1Rva2Vuc1tqXS50eXBlICE9PSAnaW5saW5lJykgY29udGludWVcblxuICAgIGNvbnN0IHRva2VucyA9IGJsb2NrVG9rZW5zW2pdLmNoaWxkcmVuXG4gICAgY29uc3QgbWF4ID0gdG9rZW5zLmxlbmd0aFxuXG4gICAgZm9yIChjdXJyID0gMDsgY3VyciA8IG1heDsgY3VycisrKSB7XG4gICAgICBpZiAodG9rZW5zW2N1cnJdLnR5cGUgPT09ICd0ZXh0X3NwZWNpYWwnKSB7XG4gICAgICAgIHRva2Vuc1tjdXJyXS50eXBlID0gJ3RleHQnXG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjdXJyID0gbGFzdCA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dCcgJiZcbiAgICAgICAgICBjdXJyICsgMSA8IG1heCAmJlxuICAgICAgICAgIHRva2Vuc1tjdXJyICsgMV0udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgIC8vIGNvbGxhcHNlIHR3byBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICAgIHRva2Vuc1tjdXJyICsgMV0uY29udGVudCA9IHRva2Vuc1tjdXJyXS5jb250ZW50ICsgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY3VyciAhPT0gbGFzdCkgeyB0b2tlbnNbbGFzdF0gPSB0b2tlbnNbY3Vycl0gfVxuXG4gICAgICAgIGxhc3QrK1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjdXJyICE9PSBsYXN0KSB7XG4gICAgICB0b2tlbnMubGVuZ3RoID0gbGFzdFxuICAgIH1cbiAgfVxufVxuIiwgIi8qKiBpbnRlcm5hbFxuICogY2xhc3MgQ29yZVxuICpcbiAqIFRvcC1sZXZlbCBydWxlcyBleGVjdXRvci4gR2x1ZXMgYmxvY2svaW5saW5lIHBhcnNlcnMgYW5kIGRvZXMgaW50ZXJtZWRpYXRlXG4gKiB0cmFuc2Zvcm1hdGlvbnMuXG4gKiovXG5cbmltcG9ydCBSdWxlciBmcm9tICcuL3J1bGVyLm1qcydcbmltcG9ydCBTdGF0ZUNvcmUgZnJvbSAnLi9ydWxlc19jb3JlL3N0YXRlX2NvcmUubWpzJ1xuXG5pbXBvcnQgcl9ub3JtYWxpemUgZnJvbSAnLi9ydWxlc19jb3JlL25vcm1hbGl6ZS5tanMnXG5pbXBvcnQgcl9ibG9jayBmcm9tICcuL3J1bGVzX2NvcmUvYmxvY2subWpzJ1xuaW1wb3J0IHJfaW5saW5lIGZyb20gJy4vcnVsZXNfY29yZS9pbmxpbmUubWpzJ1xuaW1wb3J0IHJfbGlua2lmeSBmcm9tICcuL3J1bGVzX2NvcmUvbGlua2lmeS5tanMnXG5pbXBvcnQgcl9yZXBsYWNlbWVudHMgZnJvbSAnLi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5tanMnXG5pbXBvcnQgcl9zbWFydHF1b3RlcyBmcm9tICcuL3J1bGVzX2NvcmUvc21hcnRxdW90ZXMubWpzJ1xuaW1wb3J0IHJfdGV4dF9qb2luIGZyb20gJy4vcnVsZXNfY29yZS90ZXh0X2pvaW4ubWpzJ1xuXG5jb25zdCBfcnVsZXMgPSBbXG4gIFsnbm9ybWFsaXplJywgcl9ub3JtYWxpemVdLFxuICBbJ2Jsb2NrJywgcl9ibG9ja10sXG4gIFsnaW5saW5lJywgcl9pbmxpbmVdLFxuICBbJ2xpbmtpZnknLCByX2xpbmtpZnldLFxuICBbJ3JlcGxhY2VtZW50cycsIHJfcmVwbGFjZW1lbnRzXSxcbiAgWydzbWFydHF1b3RlcycsIHJfc21hcnRxdW90ZXNdLFxuICAvLyBgdGV4dF9qb2luYCBmaW5kcyBgdGV4dF9zcGVjaWFsYCB0b2tlbnMgKGZvciBlc2NhcGUgc2VxdWVuY2VzKVxuICAvLyBhbmQgam9pbnMgdGhlbSB3aXRoIHRoZSByZXN0IG9mIHRoZSB0ZXh0XG4gIFsndGV4dF9qb2luJywgcl90ZXh0X2pvaW5dXG5dXG5cbi8qKlxuICogbmV3IENvcmUoKVxuICoqL1xuZnVuY3Rpb24gQ29yZSAoKSB7XG4gIC8qKlxuICAgKiBDb3JlI3J1bGVyIC0+IFJ1bGVyXG4gICAqXG4gICAqIFtbUnVsZXJdXSBpbnN0YW5jZS4gS2VlcCBjb25maWd1cmF0aW9uIG9mIGNvcmUgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBfcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyLnB1c2goX3J1bGVzW2ldWzBdLCBfcnVsZXNbaV1bMV0pXG4gIH1cbn1cblxuLyoqXG4gKiBDb3JlLnByb2Nlc3Moc3RhdGUpXG4gKlxuICogRXhlY3V0ZXMgY29yZSBjaGFpbiBydWxlcy5cbiAqKi9cbkNvcmUucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKVxuXG4gIGZvciAobGV0IGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpXG4gIH1cbn1cblxuQ29yZS5wcm90b3R5cGUuU3RhdGUgPSBTdGF0ZUNvcmVcblxuZXhwb3J0IGRlZmF1bHQgQ29yZVxuIiwgIi8vIFBhcnNlciBzdGF0ZSBjbGFzc1xuXG5pbXBvcnQgVG9rZW4gZnJvbSAnLi4vdG9rZW4ubWpzJ1xuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmZ1bmN0aW9uIFN0YXRlQmxvY2sgKHNyYywgbWQsIGVudiwgdG9rZW5zKSB7XG4gIHRoaXMuc3JjID0gc3JjXG5cbiAgLy8gbGluayB0byBwYXJzZXIgaW5zdGFuY2VcbiAgdGhpcy5tZCA9IG1kXG5cbiAgdGhpcy5lbnYgPSBlbnZcblxuICAvL1xuICAvLyBJbnRlcm5hbCBzdGF0ZSB2YXJ0aWFibGVzXG4gIC8vXG5cbiAgdGhpcy50b2tlbnMgPSB0b2tlbnNcblxuICB0aGlzLmJNYXJrcyA9IFtdICAvLyBsaW5lIGJlZ2luIG9mZnNldHMgZm9yIGZhc3QganVtcHNcbiAgdGhpcy5lTWFya3MgPSBbXSAgLy8gbGluZSBlbmQgb2Zmc2V0cyBmb3IgZmFzdCBqdW1wc1xuICB0aGlzLnRTaGlmdCA9IFtdICAvLyBvZmZzZXRzIG9mIHRoZSBmaXJzdCBub24tc3BhY2UgY2hhcmFjdGVycyAodGFicyBub3QgZXhwYW5kZWQpXG4gIHRoaXMuc0NvdW50ID0gW10gIC8vIGluZGVudHMgZm9yIGVhY2ggbGluZSAodGFicyBleHBhbmRlZClcblxuICAvLyBBbiBhbW91bnQgb2YgdmlydHVhbCBzcGFjZXMgKHRhYnMgZXhwYW5kZWQpIGJldHdlZW4gYmVnaW5uaW5nXG4gIC8vIG9mIGVhY2ggbGluZSAoYk1hcmtzKSBhbmQgcmVhbCBiZWdpbm5pbmcgb2YgdGhhdCBsaW5lLlxuICAvL1xuICAvLyBJdCBleGlzdHMgb25seSBhcyBhIGhhY2sgYmVjYXVzZSBibG9ja3F1b3RlcyBvdmVycmlkZSBiTWFya3NcbiAgLy8gbG9zaW5nIGluZm9ybWF0aW9uIGluIHRoZSBwcm9jZXNzLlxuICAvL1xuICAvLyBJdCdzIHVzZWQgb25seSB3aGVuIGV4cGFuZGluZyB0YWJzLCB5b3UgY2FuIHRoaW5rIGFib3V0IGl0IGFzXG4gIC8vIGFuIGluaXRpYWwgdGFiIGxlbmd0aCwgZS5nLiBic0NvdW50PTIxIGFwcGxpZWQgdG8gc3RyaW5nIGBcXHQxMjNgXG4gIC8vIG1lYW5zIGZpcnN0IHRhYiBzaG91bGQgYmUgZXhwYW5kZWQgdG8gNC0yMSU0ID09PSAzIHNwYWNlcy5cbiAgLy9cbiAgdGhpcy5ic0NvdW50ID0gW11cblxuICAvLyBibG9jayBwYXJzZXIgdmFyaWFibGVzXG5cbiAgLy8gcmVxdWlyZWQgYmxvY2sgY29udGVudCBpbmRlbnQgKGZvciBleGFtcGxlLCBpZiB3ZSBhcmVcbiAgLy8gaW5zaWRlIGEgbGlzdCwgaXQgd291bGQgYmUgcG9zaXRpb25lZCBhZnRlciBsaXN0IG1hcmtlcilcbiAgdGhpcy5ibGtJbmRlbnQgPSAwXG4gIHRoaXMubGluZSA9IDAgLy8gbGluZSBpbmRleCBpbiBzcmNcbiAgdGhpcy5saW5lTWF4ID0gMCAvLyBsaW5lcyBjb3VudFxuICB0aGlzLnRpZ2h0ID0gZmFsc2UgIC8vIGxvb3NlL3RpZ2h0IG1vZGUgZm9yIGxpc3RzXG4gIHRoaXMuZGRJbmRlbnQgPSAtMSAvLyBpbmRlbnQgb2YgdGhlIGN1cnJlbnQgZGQgYmxvY2sgKC0xIGlmIHRoZXJlIGlzbid0IGFueSlcbiAgdGhpcy5saXN0SW5kZW50ID0gLTEgLy8gaW5kZW50IG9mIHRoZSBjdXJyZW50IGxpc3QgYmxvY2sgKC0xIGlmIHRoZXJlIGlzbid0IGFueSlcblxuICAvLyBjYW4gYmUgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcsICdyb290JywgJ3BhcmFncmFwaCcgb3IgJ3JlZmVyZW5jZSdcbiAgLy8gdXNlZCBpbiBsaXN0cyB0byBkZXRlcm1pbmUgaWYgdGhleSBpbnRlcnJ1cHQgYSBwYXJhZ3JhcGhcbiAgdGhpcy5wYXJlbnRUeXBlID0gJ3Jvb3QnXG5cbiAgdGhpcy5sZXZlbCA9IDBcblxuICAvLyBDcmVhdGUgY2FjaGVzXG4gIC8vIEdlbmVyYXRlIG1hcmtlcnMuXG4gIGNvbnN0IHMgPSB0aGlzLnNyY1xuXG4gIGZvciAobGV0IHN0YXJ0ID0gMCwgcG9zID0gMCwgaW5kZW50ID0gMCwgb2Zmc2V0ID0gMCwgbGVuID0gcy5sZW5ndGgsIGluZGVudF9mb3VuZCA9IGZhbHNlOyBwb3MgPCBsZW47IHBvcysrKSB7XG4gICAgY29uc3QgY2ggPSBzLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgaWYgKCFpbmRlbnRfZm91bmQpIHtcbiAgICAgIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgICBpbmRlbnQrK1xuXG4gICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgIG9mZnNldCArPSA0IC0gb2Zmc2V0ICUgNFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9mZnNldCsrXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGVudF9mb3VuZCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2ggPT09IDB4MEEgfHwgcG9zID09PSBsZW4gLSAxKSB7XG4gICAgICBpZiAoY2ggIT09IDB4MEEpIHsgcG9zKysgfVxuICAgICAgdGhpcy5iTWFya3MucHVzaChzdGFydClcbiAgICAgIHRoaXMuZU1hcmtzLnB1c2gocG9zKVxuICAgICAgdGhpcy50U2hpZnQucHVzaChpbmRlbnQpXG4gICAgICB0aGlzLnNDb3VudC5wdXNoKG9mZnNldClcbiAgICAgIHRoaXMuYnNDb3VudC5wdXNoKDApXG5cbiAgICAgIGluZGVudF9mb3VuZCA9IGZhbHNlXG4gICAgICBpbmRlbnQgPSAwXG4gICAgICBvZmZzZXQgPSAwXG4gICAgICBzdGFydCA9IHBvcyArIDFcbiAgICB9XG4gIH1cblxuICAvLyBQdXNoIGZha2UgZW50cnkgdG8gc2ltcGxpZnkgY2FjaGUgYm91bmRzIGNoZWNrc1xuICB0aGlzLmJNYXJrcy5wdXNoKHMubGVuZ3RoKVxuICB0aGlzLmVNYXJrcy5wdXNoKHMubGVuZ3RoKVxuICB0aGlzLnRTaGlmdC5wdXNoKDApXG4gIHRoaXMuc0NvdW50LnB1c2goMClcbiAgdGhpcy5ic0NvdW50LnB1c2goMClcblxuICB0aGlzLmxpbmVNYXggPSB0aGlzLmJNYXJrcy5sZW5ndGggLSAxIC8vIGRvbid0IGNvdW50IGxhc3QgZmFrZSBsaW5lXG59XG5cbi8vIFB1c2ggbmV3IHRva2VuIHRvIFwic3RyZWFtXCIuXG4vL1xuU3RhdGVCbG9jay5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh0eXBlLCB0YWcsIG5lc3RpbmcpIHtcbiAgY29uc3QgdG9rZW4gPSBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKVxuICB0b2tlbi5ibG9jayA9IHRydWVcblxuICBpZiAobmVzdGluZyA8IDApIHRoaXMubGV2ZWwtLSAvLyBjbG9zaW5nIHRhZ1xuICB0b2tlbi5sZXZlbCA9IHRoaXMubGV2ZWxcbiAgaWYgKG5lc3RpbmcgPiAwKSB0aGlzLmxldmVsKysgLy8gb3BlbmluZyB0YWdcblxuICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKVxuICByZXR1cm4gdG9rZW5cbn1cblxuU3RhdGVCbG9jay5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uIGlzRW1wdHkgKGxpbmUpIHtcbiAgcmV0dXJuIHRoaXMuYk1hcmtzW2xpbmVdICsgdGhpcy50U2hpZnRbbGluZV0gPj0gdGhpcy5lTWFya3NbbGluZV1cbn1cblxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcEVtcHR5TGluZXMgPSBmdW5jdGlvbiBza2lwRW1wdHlMaW5lcyAoZnJvbSkge1xuICBmb3IgKGxldCBtYXggPSB0aGlzLmxpbmVNYXg7IGZyb20gPCBtYXg7IGZyb20rKykge1xuICAgIGlmICh0aGlzLmJNYXJrc1tmcm9tXSArIHRoaXMudFNoaWZ0W2Zyb21dIDwgdGhpcy5lTWFya3NbZnJvbV0pIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiBmcm9tXG59XG5cbi8vIFNraXAgc3BhY2VzIGZyb20gZ2l2ZW4gcG9zaXRpb24uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwU3BhY2VzID0gZnVuY3Rpb24gc2tpcFNwYWNlcyAocG9zKSB7XG4gIGZvciAobGV0IG1heCA9IHRoaXMuc3JjLmxlbmd0aDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNvbnN0IGNoID0gdGhpcy5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhayB9XG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG4vLyBTa2lwIHNwYWNlcyBmcm9tIGdpdmVuIHBvc2l0aW9uIGluIHJldmVyc2UuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwU3BhY2VzQmFjayA9IGZ1bmN0aW9uIHNraXBTcGFjZXNCYWNrIChwb3MsIG1pbikge1xuICBpZiAocG9zIDw9IG1pbikgeyByZXR1cm4gcG9zIH1cblxuICB3aGlsZSAocG9zID4gbWluKSB7XG4gICAgaWYgKCFpc1NwYWNlKHRoaXMuc3JjLmNoYXJDb2RlQXQoLS1wb3MpKSkgeyByZXR1cm4gcG9zICsgMSB9XG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG4vLyBTa2lwIGNoYXIgY29kZXMgZnJvbSBnaXZlbiBwb3NpdGlvblxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcENoYXJzID0gZnVuY3Rpb24gc2tpcENoYXJzIChwb3MsIGNvZGUpIHtcbiAgZm9yIChsZXQgbWF4ID0gdGhpcy5zcmMubGVuZ3RoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgaWYgKHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gY29kZSkgeyBicmVhayB9XG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG4vLyBTa2lwIGNoYXIgY29kZXMgcmV2ZXJzZSBmcm9tIGdpdmVuIHBvc2l0aW9uIC0gMVxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcENoYXJzQmFjayA9IGZ1bmN0aW9uIHNraXBDaGFyc0JhY2sgKHBvcywgY29kZSwgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7IHJldHVybiBwb3MgfVxuXG4gIHdoaWxlIChwb3MgPiBtaW4pIHtcbiAgICBpZiAoY29kZSAhPT0gdGhpcy5zcmMuY2hhckNvZGVBdCgtLXBvcykpIHsgcmV0dXJuIHBvcyArIDEgfVxuICB9XG4gIHJldHVybiBwb3Ncbn1cblxuLy8gY3V0IGxpbmVzIHJhbmdlIGZyb20gc291cmNlLlxuU3RhdGVCbG9jay5wcm90b3R5cGUuZ2V0TGluZXMgPSBmdW5jdGlvbiBnZXRMaW5lcyAoYmVnaW4sIGVuZCwgaW5kZW50LCBrZWVwTGFzdExGKSB7XG4gIGlmIChiZWdpbiA+PSBlbmQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGNvbnN0IHF1ZXVlID0gbmV3IEFycmF5KGVuZCAtIGJlZ2luKVxuXG4gIGZvciAobGV0IGkgPSAwLCBsaW5lID0gYmVnaW47IGxpbmUgPCBlbmQ7IGxpbmUrKywgaSsrKSB7XG4gICAgbGV0IGxpbmVJbmRlbnQgPSAwXG4gICAgY29uc3QgbGluZVN0YXJ0ID0gdGhpcy5iTWFya3NbbGluZV1cbiAgICBsZXQgZmlyc3QgPSBsaW5lU3RhcnRcbiAgICBsZXQgbGFzdFxuXG4gICAgaWYgKGxpbmUgKyAxIDwgZW5kIHx8IGtlZXBMYXN0TEYpIHtcbiAgICAgIC8vIE5vIG5lZWQgZm9yIGJvdW5kcyBjaGVjayBiZWNhdXNlIHdlIGhhdmUgZmFrZSBlbnRyeSBvbiB0YWlsLlxuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdICsgMVxuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0ID0gdGhpcy5lTWFya3NbbGluZV1cbiAgICB9XG5cbiAgICB3aGlsZSAoZmlyc3QgPCBsYXN0ICYmIGxpbmVJbmRlbnQgPCBpbmRlbnQpIHtcbiAgICAgIGNvbnN0IGNoID0gdGhpcy5zcmMuY2hhckNvZGVBdChmaXJzdClcblxuICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgIGxpbmVJbmRlbnQgKz0gNCAtIChsaW5lSW5kZW50ICsgdGhpcy5ic0NvdW50W2xpbmVdKSAlIDRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lSW5kZW50KytcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmaXJzdCAtIGxpbmVTdGFydCA8IHRoaXMudFNoaWZ0W2xpbmVdKSB7XG4gICAgICAgIC8vIHBhdGNoZWQgdFNoaWZ0IG1hc2tlZCBjaGFyYWN0ZXJzIHRvIGxvb2sgbGlrZSBzcGFjZXMgKGJsb2NrcXVvdGVzLCBsaXN0IG1hcmtlcnMpXG4gICAgICAgIGxpbmVJbmRlbnQrK1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgZmlyc3QrK1xuICAgIH1cblxuICAgIGlmIChsaW5lSW5kZW50ID4gaW5kZW50KSB7XG4gICAgICAvLyBwYXJ0aWFsbHkgZXhwYW5kaW5nIHRhYnMgaW4gY29kZSBibG9ja3MsIGUuZyAnXFx0XFx0Zm9vYmFyJ1xuICAgICAgLy8gd2l0aCBpbmRlbnQ9MiBiZWNvbWVzICcgIFxcdGZvb2JhcidcbiAgICAgIHF1ZXVlW2ldID0gbmV3IEFycmF5KGxpbmVJbmRlbnQgLSBpbmRlbnQgKyAxKS5qb2luKCcgJykgKyB0aGlzLnNyYy5zbGljZShmaXJzdCwgbGFzdClcbiAgICB9IGVsc2Uge1xuICAgICAgcXVldWVbaV0gPSB0aGlzLnNyYy5zbGljZShmaXJzdCwgbGFzdClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcXVldWUuam9pbignJylcbn1cblxuLy8gcmUtZXhwb3J0IFRva2VuIGNsYXNzIHRvIHVzZSBpbiBibG9jayBydWxlc1xuU3RhdGVCbG9jay5wcm90b3R5cGUuVG9rZW4gPSBUb2tlblxuXG5leHBvcnQgZGVmYXVsdCBTdGF0ZUJsb2NrXG4iLCAiLy8gR0ZNIHRhYmxlLCBodHRwczovL2dpdGh1Yi5naXRodWIuY29tL2dmbS8jdGFibGVzLWV4dGVuc2lvbi1cblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbi8vIExpbWl0IHRoZSBhbW91bnQgb2YgZW1wdHkgYXV0b2NvbXBsZXRlZCBjZWxscyBpbiBhIHRhYmxlLFxuLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9pc3N1ZXMvMTAwMCxcbi8vXG4vLyBCb3RoIHB1bGxkb3duLWNtYXJrIGFuZCBjb21tb25tYXJrLWhzIGxpbWl0IHRoZSBudW1iZXIgb2YgY2VsbHMgdGhpcyB3YXkgdG8gfjIwMGsuXG4vLyBXZSBzZXQgaXQgdG8gNjVrLCB3aGljaCBjYW4gZXhwYW5kIHVzZXIgaW5wdXQgYnkgYSBmYWN0b3Igb2YgeDM3MFxuLy8gKDI1NngyNTYgc3F1YXJlIGlzIDEuOGtCIGV4cGFuZGVkIGludG8gNjUwa0IpLlxuY29uc3QgTUFYX0FVVE9DT01QTEVURURfQ0VMTFMgPSAweDEwMDAwXG5cbmZ1bmN0aW9uIGdldExpbmUgKHN0YXRlLCBsaW5lKSB7XG4gIGNvbnN0IHBvcyA9IHN0YXRlLmJNYXJrc1tsaW5lXSArIHN0YXRlLnRTaGlmdFtsaW5lXVxuICBjb25zdCBtYXggPSBzdGF0ZS5lTWFya3NbbGluZV1cblxuICByZXR1cm4gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KVxufVxuXG5mdW5jdGlvbiBlc2NhcGVkU3BsaXQgKHN0cikge1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBjb25zdCBtYXggPSBzdHIubGVuZ3RoXG5cbiAgbGV0IHBvcyA9IDBcbiAgbGV0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICBsZXQgaXNFc2NhcGVkID0gZmFsc2VcbiAgbGV0IGxhc3RQb3MgPSAwXG4gIGxldCBjdXJyZW50ID0gJydcblxuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgaWYgKGNoID09PSAweDdjLyogfCAqLykge1xuICAgICAgaWYgKCFpc0VzY2FwZWQpIHtcbiAgICAgICAgLy8gcGlwZSBzZXBhcmF0aW5nIGNlbGxzLCAnfCdcbiAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCArIHN0ci5zdWJzdHJpbmcobGFzdFBvcywgcG9zKSlcbiAgICAgICAgY3VycmVudCA9ICcnXG4gICAgICAgIGxhc3RQb3MgPSBwb3MgKyAxXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlc2NhcGVkIHBpcGUsICdcXHwnXG4gICAgICAgIGN1cnJlbnQgKz0gc3RyLnN1YnN0cmluZyhsYXN0UG9zLCBwb3MgLSAxKVxuICAgICAgICBsYXN0UG9zID0gcG9zXG4gICAgICB9XG4gICAgfVxuXG4gICAgaXNFc2NhcGVkID0gKGNoID09PSAweDVjLyogXFwgKi8pXG4gICAgcG9zKytcblxuICAgIGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICB9XG5cbiAgcmVzdWx0LnB1c2goY3VycmVudCArIHN0ci5zdWJzdHJpbmcobGFzdFBvcykpXG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0YWJsZSAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIC8vIHNob3VsZCBoYXZlIGF0IGxlYXN0IHR3byBsaW5lc1xuICBpZiAoc3RhcnRMaW5lICsgMiA+IGVuZExpbmUpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBsZXQgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxXG5cbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBzZWNvbmQgbGluZSBzaG91bGQgYmUgJ3wnLCAnLScsICc6JyxcbiAgLy8gYW5kIG5vIG90aGVyIGNoYXJhY3RlcnMgYXJlIGFsbG93ZWQgYnV0IHNwYWNlcztcbiAgLy8gYmFzaWNhbGx5LCB0aGlzIGlzIHRoZSBlcXVpdmFsZW50IG9mIC9eWy06fF1bLTp8XFxzXSokLyByZWdleHBcblxuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgaWYgKHBvcyA+PSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3QgZmlyc3RDaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuICBpZiAoZmlyc3RDaCAhPT0gMHg3Qy8qIHwgKi8gJiYgZmlyc3RDaCAhPT0gMHgyRC8qIC0gKi8gJiYgZmlyc3RDaCAhPT0gMHgzQS8qIDogKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAocG9zID49IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBzZWNvbmRDaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuICBpZiAoc2Vjb25kQ2ggIT09IDB4N0MvKiB8ICovICYmIHNlY29uZENoICE9PSAweDJELyogLSAqLyAmJiBzZWNvbmRDaCAhPT0gMHgzQS8qIDogKi8gJiYgIWlzU3BhY2Uoc2Vjb25kQ2gpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBpZiBmaXJzdCBjaGFyYWN0ZXIgaXMgJy0nLCB0aGVuIHNlY29uZCBjaGFyYWN0ZXIgbXVzdCBub3QgYmUgYSBzcGFjZVxuICAvLyAoZHVlIHRvIHBhcnNpbmcgYW1iaWd1aXR5IHdpdGggbGlzdClcbiAgaWYgKGZpcnN0Q2ggPT09IDB4MkQvKiAtICovICYmIGlzU3BhY2Uoc2Vjb25kQ2gpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgd2hpbGUgKHBvcyA8IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHtcbiAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICAgIGlmIChjaCAhPT0gMHg3Qy8qIHwgKi8gJiYgY2ggIT09IDB4MkQvKiAtICovICYmIGNoICE9PSAweDNBLyogOiAqLyAmJiAhaXNTcGFjZShjaCkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAgIHBvcysrXG4gIH1cblxuICBsZXQgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBzdGFydExpbmUgKyAxKVxuICBsZXQgY29sdW1ucyA9IGxpbmVUZXh0LnNwbGl0KCd8JylcbiAgY29uc3QgYWxpZ25zID0gW11cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdCA9IGNvbHVtbnNbaV0udHJpbSgpXG4gICAgaWYgKCF0KSB7XG4gICAgICAvLyBhbGxvdyBlbXB0eSBjb2x1bW5zIGJlZm9yZSBhbmQgYWZ0ZXIgdGFibGUsIGJ1dCBub3QgaW4gYmV0d2VlbiBjb2x1bW5zO1xuICAgICAgLy8gZS5nLiBhbGxvdyBgIHwtLS18IGAsIGRpc2FsbG93IGAgLS0tfHwtLS0gYFxuICAgICAgaWYgKGkgPT09IDAgfHwgaSA9PT0gY29sdW1ucy5sZW5ndGggLSAxKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIS9eOj8tKzo/JC8udGVzdCh0KSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIGlmICh0LmNoYXJDb2RlQXQodC5sZW5ndGggLSAxKSA9PT0gMHgzQS8qIDogKi8pIHtcbiAgICAgIGFsaWducy5wdXNoKHQuY2hhckNvZGVBdCgwKSA9PT0gMHgzQS8qIDogKi8gPyAnY2VudGVyJyA6ICdyaWdodCcpXG4gICAgfSBlbHNlIGlmICh0LmNoYXJDb2RlQXQoMCkgPT09IDB4M0EvKiA6ICovKSB7XG4gICAgICBhbGlnbnMucHVzaCgnbGVmdCcpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFsaWducy5wdXNoKCcnKVxuICAgIH1cbiAgfVxuXG4gIGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgc3RhcnRMaW5lKS50cmltKClcbiAgaWYgKGxpbmVUZXh0LmluZGV4T2YoJ3wnKSA9PT0gLTEpIHsgcmV0dXJuIGZhbHNlIH1cbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlIH1cbiAgY29sdW1ucyA9IGVzY2FwZWRTcGxpdChsaW5lVGV4dClcbiAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbMF0gPT09ICcnKSBjb2x1bW5zLnNoaWZ0KClcbiAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbY29sdW1ucy5sZW5ndGggLSAxXSA9PT0gJycpIGNvbHVtbnMucG9wKClcblxuICAvLyBoZWFkZXIgcm93IHdpbGwgZGVmaW5lIGFuIGFtb3VudCBvZiBjb2x1bW5zIGluIHRoZSBlbnRpcmUgdGFibGUsXG4gIC8vIGFuZCBhbGlnbiByb3cgc2hvdWxkIGJlIGV4YWN0bHkgdGhlIHNhbWUgKHRoZSByZXN0IG9mIHRoZSByb3dzIGNhbiBkaWZmZXIpXG4gIGNvbnN0IGNvbHVtbkNvdW50ID0gY29sdW1ucy5sZW5ndGhcbiAgaWYgKGNvbHVtbkNvdW50ID09PSAwIHx8IGNvbHVtbkNvdW50ICE9PSBhbGlnbnMubGVuZ3RoKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGVcbiAgc3RhdGUucGFyZW50VHlwZSA9ICd0YWJsZSdcblxuICAvLyB1c2UgJ2Jsb2NrcXVvdGUnIGxpc3RzIGZvciB0ZXJtaW5hdGlvbiBiZWNhdXNlIGl0J3NcbiAgLy8gdGhlIG1vc3Qgc2ltaWxhciB0byB0YWJsZXNcbiAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ2Jsb2NrcXVvdGUnKVxuXG4gIGNvbnN0IHRva2VuX3RvID0gc3RhdGUucHVzaCgndGFibGVfb3BlbicsICd0YWJsZScsIDEpXG4gIGNvbnN0IHRhYmxlTGluZXMgPSBbc3RhcnRMaW5lLCAwXVxuICB0b2tlbl90by5tYXAgPSB0YWJsZUxpbmVzXG5cbiAgY29uc3QgdG9rZW5fdGhvID0gc3RhdGUucHVzaCgndGhlYWRfb3BlbicsICd0aGVhZCcsIDEpXG4gIHRva2VuX3Roby5tYXAgPSBbc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxXVxuXG4gIGNvbnN0IHRva2VuX2h0cm8gPSBzdGF0ZS5wdXNoKCd0cl9vcGVuJywgJ3RyJywgMSlcbiAgdG9rZW5faHRyby5tYXAgPSBbc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxXVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHRva2VuX2hvID0gc3RhdGUucHVzaCgndGhfb3BlbicsICd0aCcsIDEpXG4gICAgaWYgKGFsaWduc1tpXSkge1xuICAgICAgdG9rZW5faG8uYXR0cnMgPSBbWydzdHlsZScsICd0ZXh0LWFsaWduOicgKyBhbGlnbnNbaV1dXVxuICAgIH1cblxuICAgIGNvbnN0IHRva2VuX2lsID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApXG4gICAgdG9rZW5faWwuY29udGVudCA9IGNvbHVtbnNbaV0udHJpbSgpXG4gICAgdG9rZW5faWwuY2hpbGRyZW4gPSBbXVxuXG4gICAgc3RhdGUucHVzaCgndGhfY2xvc2UnLCAndGgnLCAtMSlcbiAgfVxuXG4gIHN0YXRlLnB1c2goJ3RyX2Nsb3NlJywgJ3RyJywgLTEpXG4gIHN0YXRlLnB1c2goJ3RoZWFkX2Nsb3NlJywgJ3RoZWFkJywgLTEpXG5cbiAgbGV0IHRib2R5TGluZXNcbiAgbGV0IGF1dG9jb21wbGV0ZWRDZWxscyA9IDBcblxuICBmb3IgKG5leHRMaW5lID0gc3RhcnRMaW5lICsgMjsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWsgfVxuXG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWsgfVxuICAgIGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgbmV4dExpbmUpLnRyaW0oKVxuICAgIGlmICghbGluZVRleHQpIHsgYnJlYWsgfVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgYnJlYWsgfVxuICAgIGNvbHVtbnMgPSBlc2NhcGVkU3BsaXQobGluZVRleHQpXG4gICAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbMF0gPT09ICcnKSBjb2x1bW5zLnNoaWZ0KClcbiAgICBpZiAoY29sdW1ucy5sZW5ndGggJiYgY29sdW1uc1tjb2x1bW5zLmxlbmd0aCAtIDFdID09PSAnJykgY29sdW1ucy5wb3AoKVxuXG4gICAgLy8gbm90ZTogYXV0b2NvbXBsZXRlIGNvdW50IGNhbiBiZSBuZWdhdGl2ZSBpZiB1c2VyIHNwZWNpZmllcyBtb3JlIGNvbHVtbnMgdGhhbiBoZWFkZXIsXG4gICAgLy8gYnV0IHRoYXQgZG9lcyBub3QgYWZmZWN0IGludGVuZGVkIHVzZSAod2hpY2ggaXMgbGltaXRpbmcgZXhwYW5zaW9uKVxuICAgIGF1dG9jb21wbGV0ZWRDZWxscyArPSBjb2x1bW5Db3VudCAtIGNvbHVtbnMubGVuZ3RoXG4gICAgaWYgKGF1dG9jb21wbGV0ZWRDZWxscyA+IE1BWF9BVVRPQ09NUExFVEVEX0NFTExTKSB7IGJyZWFrIH1cblxuICAgIGlmIChuZXh0TGluZSA9PT0gc3RhcnRMaW5lICsgMikge1xuICAgICAgY29uc3QgdG9rZW5fdGJvID0gc3RhdGUucHVzaCgndGJvZHlfb3BlbicsICd0Ym9keScsIDEpXG4gICAgICB0b2tlbl90Ym8ubWFwID0gdGJvZHlMaW5lcyA9IFtzdGFydExpbmUgKyAyLCAwXVxuICAgIH1cblxuICAgIGNvbnN0IHRva2VuX3RybyA9IHN0YXRlLnB1c2goJ3RyX29wZW4nLCAndHInLCAxKVxuICAgIHRva2VuX3Ryby5tYXAgPSBbbmV4dExpbmUsIG5leHRMaW5lICsgMV1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sdW1uQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgdG9rZW5fdGRvID0gc3RhdGUucHVzaCgndGRfb3BlbicsICd0ZCcsIDEpXG4gICAgICBpZiAoYWxpZ25zW2ldKSB7XG4gICAgICAgIHRva2VuX3Rkby5hdHRycyA9IFtbJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXV1dXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRva2VuX2lsID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApXG4gICAgICB0b2tlbl9pbC5jb250ZW50ID0gY29sdW1uc1tpXSA/IGNvbHVtbnNbaV0udHJpbSgpIDogJydcbiAgICAgIHRva2VuX2lsLmNoaWxkcmVuID0gW11cblxuICAgICAgc3RhdGUucHVzaCgndGRfY2xvc2UnLCAndGQnLCAtMSlcbiAgICB9XG4gICAgc3RhdGUucHVzaCgndHJfY2xvc2UnLCAndHInLCAtMSlcbiAgfVxuXG4gIGlmICh0Ym9keUxpbmVzKSB7XG4gICAgc3RhdGUucHVzaCgndGJvZHlfY2xvc2UnLCAndGJvZHknLCAtMSlcbiAgICB0Ym9keUxpbmVzWzFdID0gbmV4dExpbmVcbiAgfVxuXG4gIHN0YXRlLnB1c2goJ3RhYmxlX2Nsb3NlJywgJ3RhYmxlJywgLTEpXG4gIHRhYmxlTGluZXNbMV0gPSBuZXh0TGluZVxuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIENvZGUgYmxvY2sgKDQgc3BhY2VzIHBhZGRlZClcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29kZSAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZS8qLCBzaWxlbnQgKi8pIHtcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50IDwgNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcbiAgbGV0IGxhc3QgPSBuZXh0TGluZVxuXG4gIHdoaWxlIChuZXh0TGluZSA8IGVuZExpbmUpIHtcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICAgIG5leHRMaW5lKytcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgbmV4dExpbmUrK1xuICAgICAgbGFzdCA9IG5leHRMaW5lXG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBicmVha1xuICB9XG5cbiAgc3RhdGUubGluZSA9IGxhc3RcblxuICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2NvZGVfYmxvY2snLCAnY29kZScsIDApXG4gIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIGxhc3QsIDQgKyBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKSArICdcXG4nXG4gIHRva2VuLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBmZW5jZXMgKGBgYCBsYW5nLCB+fn4gbGFuZylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmVuY2UgKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChwb3MgKyAzID4gbWF4KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gIGlmIChtYXJrZXIgIT09IDB4N0UvKiB+ICovICYmIG1hcmtlciAhPT0gMHg2MCAvKiBgICovKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBzY2FuIG1hcmtlciBsZW5ndGhcbiAgbGV0IG1lbSA9IHBvc1xuICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpXG5cbiAgbGV0IGxlbiA9IHBvcyAtIG1lbVxuXG4gIGlmIChsZW4gPCAzKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3QgbWFya3VwID0gc3RhdGUuc3JjLnNsaWNlKG1lbSwgcG9zKVxuICBjb25zdCBwYXJhbXMgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpXG5cbiAgaWYgKG1hcmtlciA9PT0gMHg2MCAvKiBgICovKSB7XG4gICAgaWYgKHBhcmFtcy5pbmRleE9mKFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKSkgPj0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLy8gU2luY2Ugc3RhcnQgaXMgZm91bmQsIHdlIGNhbiByZXBvcnQgc3VjY2VzcyBoZXJlIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlIH1cblxuICAvLyBzZWFyY2ggZW5kIG9mIGJsb2NrXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZVxuICBsZXQgaGF2ZUVuZE1hcmtlciA9IGZhbHNlXG5cbiAgZm9yICg7Oykge1xuICAgIG5leHRMaW5lKytcbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkge1xuICAgICAgLy8gdW5jbG9zZWQgYmxvY2sgc2hvdWxkIGJlIGF1dG9jbG9zZWQgYnkgZW5kIG9mIGRvY3VtZW50LlxuICAgICAgLy8gYWxzbyBibG9jayBzZWVtcyB0byBiZSBhdXRvY2xvc2VkIGJ5IGVuZCBvZiBwYXJlbnRcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcG9zID0gbWVtID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdXG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIC8vIG5vbi1lbXB0eSBsaW5lIHdpdGggbmVnYXRpdmUgaW5kZW50IHNob3VsZCBzdG9wIHRoZSBsaXN0OlxuICAgICAgLy8gLSBgYGBcbiAgICAgIC8vICB0ZXN0XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSBtYXJrZXIpIHsgY29udGludWUgfVxuXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgLy8gY2xvc2luZyBmZW5jZSBzaG91bGQgYmUgaW5kZW50ZWQgbGVzcyB0aGFuIDQgc3BhY2VzXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcilcblxuICAgIC8vIGNsb3NpbmcgY29kZSBmZW5jZSBtdXN0IGJlIGF0IGxlYXN0IGFzIGxvbmcgYXMgdGhlIG9wZW5pbmcgb25lXG4gICAgaWYgKHBvcyAtIG1lbSA8IGxlbikgeyBjb250aW51ZSB9XG5cbiAgICAvLyBtYWtlIHN1cmUgdGFpbCBoYXMgc3BhY2VzIG9ubHlcbiAgICBwb3MgPSBzdGF0ZS5za2lwU3BhY2VzKHBvcylcblxuICAgIGlmIChwb3MgPCBtYXgpIHsgY29udGludWUgfVxuXG4gICAgaGF2ZUVuZE1hcmtlciA9IHRydWVcbiAgICAvLyBmb3VuZCFcbiAgICBicmVha1xuICB9XG5cbiAgLy8gSWYgYSBmZW5jZSBoYXMgaGVhZGluZyBzcGFjZXMsIHRoZXkgc2hvdWxkIGJlIHJlbW92ZWQgZnJvbSBpdHMgaW5uZXIgYmxvY2tcbiAgbGVuID0gc3RhdGUuc0NvdW50W3N0YXJ0TGluZV1cblxuICBzdGF0ZS5saW5lID0gbmV4dExpbmUgKyAoaGF2ZUVuZE1hcmtlciA/IDEgOiAwKVxuXG4gIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnZmVuY2UnLCAnY29kZScsIDApXG4gIHRva2VuLmluZm8gPSBwYXJhbXNcbiAgdG9rZW4uY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSArIDEsIG5leHRMaW5lLCBsZW4sIHRydWUpXG4gIHRva2VuLm1hcmt1cCA9IG1hcmt1cFxuICB0b2tlbi5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXVxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gQmxvY2sgcXVvdGVzXG5cbmltcG9ydCB7IGlzU3BhY2UgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBibG9ja3F1b3RlIChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV1cbiAgbGV0IG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdXG5cbiAgY29uc3Qgb2xkTGluZU1heCA9IHN0YXRlLmxpbmVNYXhcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIGNoZWNrIHRoZSBibG9jayBxdW90ZSBtYXJrZXJcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0UvKiA+ICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gd2Uga25vdyB0aGF0IGl0J3MgZ29pbmcgdG8gYmUgYSB2YWxpZCBibG9ja3F1b3RlLFxuICAvLyBzbyBubyBwb2ludCB0cnlpbmcgdG8gZmluZCB0aGUgZW5kIG9mIGl0IGluIHNpbGVudCBtb2RlXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWUgfVxuXG4gIGNvbnN0IG9sZEJNYXJrcyA9IFtdXG4gIGNvbnN0IG9sZEJTQ291bnQgPSBbXVxuICBjb25zdCBvbGRTQ291bnQgPSBbXVxuICBjb25zdCBvbGRUU2hpZnQgPSBbXVxuXG4gIGNvbnN0IHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdibG9ja3F1b3RlJylcblxuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZVxuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ2Jsb2NrcXVvdGUnXG4gIGxldCBsYXN0TGluZUVtcHR5ID0gZmFsc2VcbiAgbGV0IG5leHRMaW5lXG5cbiAgLy8gU2VhcmNoIHRoZSBlbmQgb2YgdGhlIGJsb2NrXG4gIC8vXG4gIC8vIEJsb2NrIGVuZHMgd2l0aCBlaXRoZXI6XG4gIC8vICAxLiBhbiBlbXB0eSBsaW5lIG91dHNpZGU6XG4gIC8vICAgICBgYGBcbiAgLy8gICAgID4gdGVzdFxuICAvL1xuICAvLyAgICAgYGBgXG4gIC8vICAyLiBhbiBlbXB0eSBsaW5lIGluc2lkZTpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPlxuICAvLyAgICAgdGVzdFxuICAvLyAgICAgYGBgXG4gIC8vICAzLiBhbm90aGVyIHRhZzpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPiB0ZXN0XG4gIC8vICAgICAgLSAtIC1cbiAgLy8gICAgIGBgYFxuICBmb3IgKG5leHRMaW5lID0gc3RhcnRMaW5lOyBuZXh0TGluZSA8IGVuZExpbmU7IG5leHRMaW5lKyspIHtcbiAgICAvLyBjaGVjayBpZiBpdCdzIG91dGRlbnRlZCwgaS5lLiBpdCdzIGluc2lkZSBsaXN0IGl0ZW0gYW5kIGluZGVudGVkXG4gICAgLy8gbGVzcyB0aGFuIHNhaWQgbGlzdCBpdGVtOlxuICAgIC8vXG4gICAgLy8gYGBgXG4gICAgLy8gMS4gYW55dGhpbmdcbiAgICAvLyAgICA+IGN1cnJlbnQgYmxvY2txdW90ZVxuICAgIC8vIDIuIGNoZWNraW5nIHRoaXMgbGluZVxuICAgIC8vIGBgYFxuICAgIGNvbnN0IGlzT3V0ZGVudGVkID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudFxuXG4gICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdXG5cbiAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgLy8gQ2FzZSAxOiBsaW5lIGlzIG5vdCBpbnNpZGUgdGhlIGJsb2NrcXVvdGUsIGFuZCB0aGlzIGxpbmUgaXMgZW1wdHkuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKykgPT09IDB4M0UvKiA+ICovICYmICFpc091dGRlbnRlZCkge1xuICAgICAgLy8gVGhpcyBsaW5lIGlzIGluc2lkZSB0aGUgYmxvY2txdW90ZS5cblxuICAgICAgLy8gc2V0IG9mZnNldCBwYXN0IHNwYWNlcyBhbmQgXCI+XCJcbiAgICAgIGxldCBpbml0aWFsID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIDFcbiAgICAgIGxldCBzcGFjZUFmdGVyTWFya2VyXG4gICAgICBsZXQgYWRqdXN0VGFiXG5cbiAgICAgIC8vIHNraXAgb25lIG9wdGlvbmFsIHNwYWNlIGFmdGVyICc+J1xuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjAgLyogc3BhY2UgKi8pIHtcbiAgICAgICAgLy8gJyA+ICAgdGVzdCAnXG4gICAgICAgIC8vICAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZTpcbiAgICAgICAgcG9zKytcbiAgICAgICAgaW5pdGlhbCsrXG4gICAgICAgIGFkanVzdFRhYiA9IGZhbHNlXG4gICAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MDkgLyogdGFiICovKSB7XG4gICAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlXG5cbiAgICAgICAgaWYgKChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIGluaXRpYWwpICUgNCA9PT0gMykge1xuICAgICAgICAgIC8vICcgID5cXHQgIHRlc3QgJ1xuICAgICAgICAgIC8vICAgICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICh0YWIgaGFzIHdpZHRoPT09MSlcbiAgICAgICAgICBwb3MrK1xuICAgICAgICAgIGluaXRpYWwrK1xuICAgICAgICAgIGFkanVzdFRhYiA9IGZhbHNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gJyA+XFx0ICB0ZXN0ICdcbiAgICAgICAgICAvLyAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZSArIHNoaWZ0IGJzQ291bnQgc2xpZ2h0bHlcbiAgICAgICAgICAvLyAgICAgICAgIHRvIG1ha2UgZXh0cmEgc3BhY2UgYXBwZWFyXG4gICAgICAgICAgYWRqdXN0VGFiID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzcGFjZUFmdGVyTWFya2VyID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgbGV0IG9mZnNldCA9IGluaXRpYWxcbiAgICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pXG4gICAgICBzdGF0ZS5iTWFya3NbbmV4dExpbmVdID0gcG9zXG5cbiAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gNCAtIChvZmZzZXQgKyBzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIChhZGp1c3RUYWIgPyAxIDogMCkpICUgNFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvZmZzZXQrK1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgcG9zKytcbiAgICAgIH1cblxuICAgICAgbGFzdExpbmVFbXB0eSA9IHBvcyA+PSBtYXhcblxuICAgICAgb2xkQlNDb3VudC5wdXNoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKVxuICAgICAgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0gPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdICsgMSArIChzcGFjZUFmdGVyTWFya2VyID8gMSA6IDApXG5cbiAgICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pXG4gICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2Zmc2V0IC0gaW5pdGlhbFxuXG4gICAgICBvbGRUU2hpZnQucHVzaChzdGF0ZS50U2hpZnRbbmV4dExpbmVdKVxuICAgICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IHBvcyAtIHN0YXRlLmJNYXJrc1tuZXh0TGluZV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gQ2FzZSAyOiBsaW5lIGlzIG5vdCBpbnNpZGUgdGhlIGJsb2NrcXVvdGUsIGFuZCB0aGUgbGFzdCBsaW5lIHdhcyBlbXB0eS5cbiAgICBpZiAobGFzdExpbmVFbXB0eSkgeyBicmVhayB9XG5cbiAgICAvLyBDYXNlIDM6IGFub3RoZXIgdGFnIGZvdW5kLlxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICAvLyBRdWlyayB0byBlbmZvcmNlIFwiaGFyZCB0ZXJtaW5hdGlvbiBtb2RlXCIgZm9yIHBhcmFncmFwaHM7XG4gICAgICAvLyBub3JtYWxseSBpZiB5b3UgY2FsbCBgdG9rZW5pemUoc3RhdGUsIHN0YXJ0TGluZSwgbmV4dExpbmUpYCxcbiAgICAgIC8vIHBhcmFncmFwaHMgd2lsbCBsb29rIGJlbG93IG5leHRMaW5lIGZvciBwYXJhZ3JhcGggY29udGludWF0aW9uLFxuICAgICAgLy8gYnV0IGlmIGJsb2NrcXVvdGUgaXMgdGVybWluYXRlZCBieSBhbm90aGVyIHRhZywgdGhleSBzaG91bGRuJ3RcbiAgICAgIHN0YXRlLmxpbmVNYXggPSBuZXh0TGluZVxuXG4gICAgICBpZiAoc3RhdGUuYmxrSW5kZW50ICE9PSAwKSB7XG4gICAgICAgIC8vIHN0YXRlLmJsa0luZGVudCB3YXMgbm9uLXplcm8sIHdlIG5vdyBzZXQgaXQgdG8gemVybyxcbiAgICAgICAgLy8gc28gd2UgbmVlZCB0byByZS1jYWxjdWxhdGUgYWxsIG9mZnNldHMgdG8gYXBwZWFyIGFzXG4gICAgICAgIC8vIGlmIGluZGVudCB3YXNuJ3QgY2hhbmdlZFxuICAgICAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKVxuICAgICAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pXG4gICAgICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pXG4gICAgICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pXG4gICAgICAgIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLT0gc3RhdGUuYmxrSW5kZW50XG4gICAgICB9XG5cbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgb2xkQk1hcmtzLnB1c2goc3RhdGUuYk1hcmtzW25leHRMaW5lXSlcbiAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pXG4gICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSlcbiAgICBvbGRTQ291bnQucHVzaChzdGF0ZS5zQ291bnRbbmV4dExpbmVdKVxuXG4gICAgLy8gQSBuZWdhdGl2ZSBpbmRlbnRhdGlvbiBtZWFucyB0aGF0IHRoaXMgaXMgYSBwYXJhZ3JhcGggY29udGludWF0aW9uXG4gICAgLy9cbiAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gLTFcbiAgfVxuXG4gIGNvbnN0IG9sZEluZGVudCA9IHN0YXRlLmJsa0luZGVudFxuICBzdGF0ZS5ibGtJbmRlbnQgPSAwXG5cbiAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2Jsb2NrcXVvdGVfb3BlbicsICdibG9ja3F1b3RlJywgMSlcbiAgdG9rZW5fby5tYXJrdXAgPSAnPidcbiAgY29uc3QgbGluZXMgPSBbc3RhcnRMaW5lLCAwXVxuICB0b2tlbl9vLm1hcCA9IGxpbmVzXG5cbiAgc3RhdGUubWQuYmxvY2sudG9rZW5pemUoc3RhdGUsIHN0YXJ0TGluZSwgbmV4dExpbmUpXG5cbiAgY29uc3QgdG9rZW5fYyA9IHN0YXRlLnB1c2goJ2Jsb2NrcXVvdGVfY2xvc2UnLCAnYmxvY2txdW90ZScsIC0xKVxuICB0b2tlbl9jLm1hcmt1cCA9ICc+J1xuXG4gIHN0YXRlLmxpbmVNYXggPSBvbGRMaW5lTWF4XG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlXG4gIGxpbmVzWzFdID0gc3RhdGUubGluZVxuXG4gIC8vIFJlc3RvcmUgb3JpZ2luYWwgdFNoaWZ0OyB0aGlzIG1pZ2h0IG5vdCBiZSBuZWNlc3Nhcnkgc2luY2UgdGhlIHBhcnNlclxuICAvLyBoYXMgYWxyZWFkeSBiZWVuIGhlcmUsIGJ1dCBqdXN0IHRvIG1ha2Ugc3VyZSB3ZSBjYW4gZG8gdGhhdC5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvbGRUU2hpZnQubGVuZ3RoOyBpKyspIHtcbiAgICBzdGF0ZS5iTWFya3NbaSArIHN0YXJ0TGluZV0gPSBvbGRCTWFya3NbaV1cbiAgICBzdGF0ZS50U2hpZnRbaSArIHN0YXJ0TGluZV0gPSBvbGRUU2hpZnRbaV1cbiAgICBzdGF0ZS5zQ291bnRbaSArIHN0YXJ0TGluZV0gPSBvbGRTQ291bnRbaV1cbiAgICBzdGF0ZS5ic0NvdW50W2kgKyBzdGFydExpbmVdID0gb2xkQlNDb3VudFtpXVxuICB9XG4gIHN0YXRlLmJsa0luZGVudCA9IG9sZEluZGVudFxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gSG9yaXpvbnRhbCBydWxlXG5cbmltcG9ydCB7IGlzU3BhY2UgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBociAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV1cbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspXG5cbiAgLy8gQ2hlY2sgaHIgbWFya2VyXG4gIGlmIChtYXJrZXIgIT09IDB4MkEvKiAqICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkQvKiAtICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4NUYvKiBfICovKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBtYXJrZXJzIGNhbiBiZSBtaXhlZCB3aXRoIHNwYWNlcywgYnV0IHRoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCAzIG9mIHRoZW1cblxuICBsZXQgY250ID0gMVxuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKylcbiAgICBpZiAoY2ggIT09IG1hcmtlciAmJiAhaXNTcGFjZShjaCkpIHsgcmV0dXJuIGZhbHNlIH1cbiAgICBpZiAoY2ggPT09IG1hcmtlcikgeyBjbnQrKyB9XG4gIH1cblxuICBpZiAoY250IDwgMykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWUgfVxuXG4gIHN0YXRlLmxpbmUgPSBzdGFydExpbmUgKyAxXG5cbiAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdocicsICdocicsIDApXG4gIHRva2VuLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG4gIHRva2VuLm1hcmt1cCA9IEFycmF5KGNudCArIDEpLmpvaW4oU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpKVxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gTGlzdHNcblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbi8vIFNlYXJjaCBgWy0rKl1bXFxuIF1gLCByZXR1cm5zIG5leHQgcG9zIGFmdGVyIG1hcmtlciBvbiBzdWNjZXNzXG4vLyBvciAtMSBvbiBmYWlsLlxuZnVuY3Rpb24gc2tpcEJ1bGxldExpc3RNYXJrZXIgKHN0YXRlLCBzdGFydExpbmUpIHtcbiAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV1cblxuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKylcbiAgLy8gQ2hlY2sgYnVsbGV0XG4gIGlmIChtYXJrZXIgIT09IDB4MkEvKiAqICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkQvKiAtICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkIvKiArICovKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICBpZiAocG9zIDwgbWF4KSB7XG4gICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAvLyBcIiAtdGVzdCBcIiAtIGlzIG5vdCBhIGxpc3QgaXRlbVxuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBvc1xufVxuXG4vLyBTZWFyY2ggYFxcZCtbLildW1xcbiBdYCwgcmV0dXJucyBuZXh0IHBvcyBhZnRlciBtYXJrZXIgb24gc3VjY2Vzc1xuLy8gb3IgLTEgb24gZmFpbC5cbmZ1bmN0aW9uIHNraXBPcmRlcmVkTGlzdE1hcmtlciAoc3RhdGUsIHN0YXJ0TGluZSkge1xuICBjb25zdCBzdGFydCA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV1cbiAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cbiAgbGV0IHBvcyA9IHN0YXJ0XG5cbiAgLy8gTGlzdCBtYXJrZXIgc2hvdWxkIGhhdmUgYXQgbGVhc3QgMiBjaGFycyAoZGlnaXQgKyBkb3QpXG4gIGlmIChwb3MgKyAxID49IG1heCkgeyByZXR1cm4gLTEgfVxuXG4gIGxldCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuXG4gIGlmIChjaCA8IDB4MzAvKiAwICovIHx8IGNoID4gMHgzOS8qIDkgKi8pIHsgcmV0dXJuIC0xIH1cblxuICBmb3IgKDs7KSB7XG4gICAgLy8gRU9MIC0+IGZhaWxcbiAgICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gLTEgfVxuXG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKylcblxuICAgIGlmIChjaCA+PSAweDMwLyogMCAqLyAmJiBjaCA8PSAweDM5LyogOSAqLykge1xuICAgICAgLy8gTGlzdCBtYXJrZXIgc2hvdWxkIGhhdmUgbm8gbW9yZSB0aGFuIDkgZGlnaXRzXG4gICAgICAvLyAocHJldmVudHMgaW50ZWdlciBvdmVyZmxvdyBpbiBicm93c2VycylcbiAgICAgIGlmIChwb3MgLSBzdGFydCA+PSAxMCkgeyByZXR1cm4gLTEgfVxuXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vIGZvdW5kIHZhbGlkIG1hcmtlclxuICAgIGlmIChjaCA9PT0gMHgyOS8qICkgKi8gfHwgY2ggPT09IDB4MmUvKiAuICovKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIHJldHVybiAtMVxuICB9XG5cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgaWYgKCFpc1NwYWNlKGNoKSkge1xuICAgICAgLy8gXCIgMS50ZXN0IFwiIC0gaXMgbm90IGEgbGlzdCBpdGVtXG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG5mdW5jdGlvbiBtYXJrVGlnaHRQYXJhZ3JhcGhzIChzdGF0ZSwgaWR4KSB7XG4gIGNvbnN0IGxldmVsID0gc3RhdGUubGV2ZWwgKyAyXG5cbiAgZm9yIChsZXQgaSA9IGlkeCArIDIsIGwgPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMjsgaSA8IGw7IGkrKykge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbaV0ubGV2ZWwgPT09IGxldmVsICYmIHN0YXRlLnRva2Vuc1tpXS50eXBlID09PSAncGFyYWdyYXBoX29wZW4nKSB7XG4gICAgICBzdGF0ZS50b2tlbnNbaSArIDJdLmhpZGRlbiA9IHRydWVcbiAgICAgIHN0YXRlLnRva2Vuc1tpXS5oaWRkZW4gPSB0cnVlXG4gICAgICBpICs9IDJcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGlzdCAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBtYXgsIHBvcywgc3RhcnQsIHRva2VuXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZVxuICBsZXQgdGlnaHQgPSB0cnVlXG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIFNwZWNpYWwgY2FzZTpcbiAgLy8gIC0gaXRlbSAxXG4gIC8vICAgLSBpdGVtIDJcbiAgLy8gICAgLSBpdGVtIDNcbiAgLy8gICAgIC0gaXRlbSA0XG4gIC8vICAgICAgLSB0aGlzIG9uZSBpcyBhIHBhcmFncmFwaCBjb250aW51YXRpb25cbiAgaWYgKHN0YXRlLmxpc3RJbmRlbnQgPj0gMCAmJlxuICAgICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmxpc3RJbmRlbnQgPj0gNCAmJlxuICAgICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgbGV0IGlzVGVybWluYXRpbmdQYXJhZ3JhcGggPSBmYWxzZVxuXG4gIC8vIGxpbWl0IGNvbmRpdGlvbnMgd2hlbiBsaXN0IGNhbiBpbnRlcnJ1cHRcbiAgLy8gYSBwYXJhZ3JhcGggKHZhbGlkYXRpb24gbW9kZSBvbmx5KVxuICBpZiAoc2lsZW50ICYmIHN0YXRlLnBhcmVudFR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgLy8gTmV4dCBsaXN0IGl0ZW0gc2hvdWxkIHN0aWxsIHRlcm1pbmF0ZSBwcmV2aW91cyBsaXN0IGl0ZW07XG4gICAgLy9cbiAgICAvLyBUaGlzIGNvZGUgY2FuIGZhaWwgaWYgcGx1Z2lucyB1c2UgYmxrSW5kZW50IGFzIHdlbGwgYXMgbGlzdHMsXG4gICAgLy8gYnV0IEkgaG9wZSB0aGUgc3BlYyBnZXRzIGZpeGVkIGxvbmcgYmVmb3JlIHRoYXQgaGFwcGVucy5cbiAgICAvL1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdID49IHN0YXRlLmJsa0luZGVudCkge1xuICAgICAgaXNUZXJtaW5hdGluZ1BhcmFncmFwaCA9IHRydWVcbiAgICB9XG4gIH1cblxuICAvLyBEZXRlY3QgbGlzdCB0eXBlIGFuZCBwb3NpdGlvbiBhZnRlciBtYXJrZXJcbiAgbGV0IGlzT3JkZXJlZFxuICBsZXQgbWFya2VyVmFsdWVcbiAgbGV0IHBvc0FmdGVyTWFya2VyXG4gIGlmICgocG9zQWZ0ZXJNYXJrZXIgPSBza2lwT3JkZXJlZExpc3RNYXJrZXIoc3RhdGUsIG5leHRMaW5lKSkgPj0gMCkge1xuICAgIGlzT3JkZXJlZCA9IHRydWVcbiAgICBzdGFydCA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdXG4gICAgbWFya2VyVmFsdWUgPSBOdW1iZXIoc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3NBZnRlck1hcmtlciAtIDEpKVxuXG4gICAgLy8gSWYgd2UncmUgc3RhcnRpbmcgYSBuZXcgb3JkZXJlZCBsaXN0IHJpZ2h0IGFmdGVyXG4gICAgLy8gYSBwYXJhZ3JhcGgsIGl0IHNob3VsZCBzdGFydCB3aXRoIDEuXG4gICAgaWYgKGlzVGVybWluYXRpbmdQYXJhZ3JhcGggJiYgbWFya2VyVmFsdWUgIT09IDEpIHJldHVybiBmYWxzZVxuICB9IGVsc2UgaWYgKChwb3NBZnRlck1hcmtlciA9IHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSkpID49IDApIHtcbiAgICBpc09yZGVyZWQgPSBmYWxzZVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gSWYgd2UncmUgc3RhcnRpbmcgYSBuZXcgdW5vcmRlcmVkIGxpc3QgcmlnaHQgYWZ0ZXJcbiAgLy8gYSBwYXJhZ3JhcGgsIGZpcnN0IGxpbmUgc2hvdWxkIG5vdCBiZSBlbXB0eS5cbiAgaWYgKGlzVGVybWluYXRpbmdQYXJhZ3JhcGgpIHtcbiAgICBpZiAoc3RhdGUuc2tpcFNwYWNlcyhwb3NBZnRlck1hcmtlcikgPj0gc3RhdGUuZU1hcmtzW25leHRMaW5lXSkgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBGb3IgdmFsaWRhdGlvbiBtb2RlIHdlIGNhbiB0ZXJtaW5hdGUgaW1tZWRpYXRlbHlcbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgLy8gV2Ugc2hvdWxkIHRlcm1pbmF0ZSBsaXN0IG9uIHN0eWxlIGNoYW5nZS4gUmVtZW1iZXIgZmlyc3Qgb25lIHRvIGNvbXBhcmUuXG4gIGNvbnN0IG1hcmtlckNoYXJDb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKVxuXG4gIC8vIFN0YXJ0IGxpc3RcbiAgY29uc3QgbGlzdFRva0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGhcblxuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3Rfb3BlbicsICdvbCcsIDEpXG4gICAgaWYgKG1hcmtlclZhbHVlICE9PSAxKSB7XG4gICAgICB0b2tlbi5hdHRycyA9IFtbJ3N0YXJ0JywgbWFya2VyVmFsdWVdXVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ2J1bGxldF9saXN0X29wZW4nLCAndWwnLCAxKVxuICB9XG5cbiAgY29uc3QgbGlzdExpbmVzID0gW25leHRMaW5lLCAwXVxuICB0b2tlbi5tYXAgPSBsaXN0TGluZXNcbiAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSlcblxuICAvL1xuICAvLyBJdGVyYXRlIGxpc3QgaXRlbXNcbiAgLy9cblxuICBsZXQgcHJldkVtcHR5RW5kID0gZmFsc2VcbiAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ2xpc3QnKVxuXG4gIGNvbnN0IG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlXG4gIHN0YXRlLnBhcmVudFR5cGUgPSAnbGlzdCdcblxuICB3aGlsZSAobmV4dExpbmUgPCBlbmRMaW5lKSB7XG4gICAgcG9zID0gcG9zQWZ0ZXJNYXJrZXJcbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdXG5cbiAgICBjb25zdCBpbml0aWFsID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIHBvc0FmdGVyTWFya2VyIC0gKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdKVxuICAgIGxldCBvZmZzZXQgPSBpbml0aWFsXG5cbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgIG9mZnNldCArPSA0IC0gKG9mZnNldCArIHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKSAlIDRcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MjApIHtcbiAgICAgICAgb2Zmc2V0KytcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIHBvcysrXG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudFN0YXJ0ID0gcG9zXG4gICAgbGV0IGluZGVudEFmdGVyTWFya2VyXG5cbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCkge1xuICAgICAgLy8gdHJpbW1pbmcgc3BhY2UgaW4gXCItICAgIFxcbiAgM1wiIGNhc2UsIGluZGVudCBpcyAxIGhlcmVcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICBpbmRlbnRBZnRlck1hcmtlciA9IG9mZnNldCAtIGluaXRpYWxcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIG1vcmUgdGhhbiA0IHNwYWNlcywgdGhlIGluZGVudCBpcyAxXG4gICAgLy8gKHRoZSByZXN0IGlzIGp1c3QgaW5kZW50ZWQgY29kZSBibG9jaylcbiAgICBpZiAoaW5kZW50QWZ0ZXJNYXJrZXIgPiA0KSB7IGluZGVudEFmdGVyTWFya2VyID0gMSB9XG5cbiAgICAvLyBcIiAgLSAgdGVzdFwiXG4gICAgLy8gIF5eXl5eIC0gY2FsY3VsYXRpbmcgdG90YWwgbGVuZ3RoIG9mIHRoaXMgdGhpbmdcbiAgICBjb25zdCBpbmRlbnQgPSBpbml0aWFsICsgaW5kZW50QWZ0ZXJNYXJrZXJcblxuICAgIC8vIFJ1biBzdWJwYXJzZXIgJiB3cml0ZSB0b2tlbnNcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ2xpc3RfaXRlbV9vcGVuJywgJ2xpJywgMSlcbiAgICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKVxuICAgIGNvbnN0IGl0ZW1MaW5lcyA9IFtuZXh0TGluZSwgMF1cbiAgICB0b2tlbi5tYXAgPSBpdGVtTGluZXNcbiAgICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgICB0b2tlbi5pbmZvID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3NBZnRlck1hcmtlciAtIDEpXG4gICAgfVxuXG4gICAgLy8gY2hhbmdlIGN1cnJlbnQgc3RhdGUsIHRoZW4gcmVzdG9yZSBpdCBhZnRlciBwYXJzZXIgc3ViY2FsbFxuICAgIGNvbnN0IG9sZFRpZ2h0ID0gc3RhdGUudGlnaHRcbiAgICBjb25zdCBvbGRUU2hpZnQgPSBzdGF0ZS50U2hpZnRbbmV4dExpbmVdXG4gICAgY29uc3Qgb2xkU0NvdW50ID0gc3RhdGUuc0NvdW50W25leHRMaW5lXVxuXG4gICAgLy8gIC0gZXhhbXBsZSBsaXN0XG4gICAgLy8gXiBsaXN0SW5kZW50IHBvc2l0aW9uIHdpbGwgYmUgaGVyZVxuICAgIC8vICAgXiBibGtJbmRlbnQgcG9zaXRpb24gd2lsbCBiZSBoZXJlXG4gICAgLy9cbiAgICBjb25zdCBvbGRMaXN0SW5kZW50ID0gc3RhdGUubGlzdEluZGVudFxuICAgIHN0YXRlLmxpc3RJbmRlbnQgPSBzdGF0ZS5ibGtJbmRlbnRcbiAgICBzdGF0ZS5ibGtJbmRlbnQgPSBpbmRlbnRcblxuICAgIHN0YXRlLnRpZ2h0ID0gdHJ1ZVxuICAgIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPSBjb250ZW50U3RhcnQgLSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdXG4gICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSA9IG9mZnNldFxuXG4gICAgaWYgKGNvbnRlbnRTdGFydCA+PSBtYXggJiYgc3RhdGUuaXNFbXB0eShuZXh0TGluZSArIDEpKSB7XG4gICAgICAvLyB3b3JrYXJvdW5kIGZvciB0aGlzIGNhc2VcbiAgICAgIC8vIChsaXN0IGl0ZW0gaXMgZW1wdHksIGxpc3QgdGVybWluYXRlcyBiZWZvcmUgXCJmb29cIik6XG4gICAgICAvLyB+fn5+fn5+flxuICAgICAgLy8gICAtXG4gICAgICAvL1xuICAgICAgLy8gICAgIGZvb1xuICAgICAgLy8gfn5+fn5+fn5cbiAgICAgIHN0YXRlLmxpbmUgPSBNYXRoLm1pbihzdGF0ZS5saW5lICsgMiwgZW5kTGluZSlcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUubWQuYmxvY2sudG9rZW5pemUoc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKVxuICAgIH1cblxuICAgIC8vIElmIGFueSBvZiBsaXN0IGl0ZW0gaXMgdGlnaHQsIG1hcmsgbGlzdCBhcyB0aWdodFxuICAgIGlmICghc3RhdGUudGlnaHQgfHwgcHJldkVtcHR5RW5kKSB7XG4gICAgICB0aWdodCA9IGZhbHNlXG4gICAgfVxuICAgIC8vIEl0ZW0gYmVjb21lIGxvb3NlIGlmIGZpbmlzaCB3aXRoIGVtcHR5IGxpbmUsXG4gICAgLy8gYnV0IHdlIHNob3VsZCBmaWx0ZXIgbGFzdCBlbGVtZW50LCBiZWNhdXNlIGl0IG1lYW5zIGxpc3QgZmluaXNoXG4gICAgcHJldkVtcHR5RW5kID0gKHN0YXRlLmxpbmUgLSBuZXh0TGluZSkgPiAxICYmIHN0YXRlLmlzRW1wdHkoc3RhdGUubGluZSAtIDEpXG5cbiAgICBzdGF0ZS5ibGtJbmRlbnQgPSBzdGF0ZS5saXN0SW5kZW50XG4gICAgc3RhdGUubGlzdEluZGVudCA9IG9sZExpc3RJbmRlbnRcbiAgICBzdGF0ZS50U2hpZnRbbmV4dExpbmVdID0gb2xkVFNoaWZ0XG4gICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSA9IG9sZFNDb3VudFxuICAgIHN0YXRlLnRpZ2h0ID0gb2xkVGlnaHRcblxuICAgIHRva2VuID0gc3RhdGUucHVzaCgnbGlzdF9pdGVtX2Nsb3NlJywgJ2xpJywgLTEpXG4gICAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSlcblxuICAgIG5leHRMaW5lID0gc3RhdGUubGluZVxuICAgIGl0ZW1MaW5lc1sxXSA9IG5leHRMaW5lXG5cbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkgeyBicmVhayB9XG5cbiAgICAvL1xuICAgIC8vIFRyeSB0byBjaGVjayBpZiBsaXN0IGlzIHRlcm1pbmF0ZWQgb3IgY29udGludWVkLlxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWsgfVxuXG4gICAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IGJyZWFrIH1cblxuICAgIC8vIGZhaWwgaWYgdGVybWluYXRpbmcgYmxvY2sgZm91bmRcbiAgICBsZXQgdGVybWluYXRlID0gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWsgfVxuXG4gICAgLy8gZmFpbCBpZiBsaXN0IGhhcyBhbm90aGVyIHR5cGVcbiAgICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgICBwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpXG4gICAgICBpZiAocG9zQWZ0ZXJNYXJrZXIgPCAwKSB7IGJyZWFrIH1cbiAgICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICB9IGVsc2Uge1xuICAgICAgcG9zQWZ0ZXJNYXJrZXIgPSBza2lwQnVsbGV0TGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpXG4gICAgICBpZiAocG9zQWZ0ZXJNYXJrZXIgPCAwKSB7IGJyZWFrIH1cbiAgICB9XG5cbiAgICBpZiAobWFya2VyQ2hhckNvZGUgIT09IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvc0FmdGVyTWFya2VyIC0gMSkpIHsgYnJlYWsgfVxuICB9XG5cbiAgLy8gRmluYWxpemUgbGlzdFxuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3RfY2xvc2UnLCAnb2wnLCAtMSlcbiAgfSBlbHNlIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ2J1bGxldF9saXN0X2Nsb3NlJywgJ3VsJywgLTEpXG4gIH1cbiAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSlcblxuICBsaXN0TGluZXNbMV0gPSBuZXh0TGluZVxuICBzdGF0ZS5saW5lID0gbmV4dExpbmVcblxuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZVxuXG4gIC8vIG1hcmsgcGFyYWdyYXBocyB0aWdodCBpZiBuZWVkZWRcbiAgaWYgKHRpZ2h0KSB7XG4gICAgbWFya1RpZ2h0UGFyYWdyYXBocyhzdGF0ZSwgbGlzdFRva0lkeClcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiaW1wb3J0IHsgaXNTcGFjZSwgbm9ybWFsaXplUmVmZXJlbmNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVmZXJlbmNlIChzdGF0ZSwgc3RhcnRMaW5lLCBfZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdXG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuICBsZXQgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxXG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHg1Qi8qIFsgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBmdW5jdGlvbiBnZXROZXh0TGluZSAobmV4dExpbmUpIHtcbiAgICBjb25zdCBlbmRMaW5lID0gc3RhdGUubGluZU1heFxuXG4gICAgaWYgKG5leHRMaW5lID49IGVuZExpbmUgfHwgc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICAgIC8vIGVtcHR5IGxpbmUgb3IgZW5kIG9mIGlucHV0XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIGxldCBpc0NvbnRpbnVhdGlvbiA9IGZhbHNlXG5cbiAgICAvLyB0aGlzIHdvdWxkIGJlIGEgY29kZSBibG9jayBub3JtYWxseSwgYnV0IGFmdGVyIHBhcmFncmFwaFxuICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPiAzKSB7IGlzQ29udGludWF0aW9uID0gdHJ1ZSB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBpc0NvbnRpbnVhdGlvbiA9IHRydWUgfVxuXG4gICAgaWYgKCFpc0NvbnRpbnVhdGlvbikge1xuICAgICAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3JlZmVyZW5jZScpXG4gICAgICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZVxuICAgICAgc3RhdGUucGFyZW50VHlwZSA9ICdyZWZlcmVuY2UnXG5cbiAgICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgICBsZXQgdGVybWluYXRlID0gZmFsc2VcbiAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZVxuICAgICAgaWYgKHRlcm1pbmF0ZSkge1xuICAgICAgICAvLyB0ZXJtaW5hdGVkIGJ5IGFub3RoZXIgYmxvY2tcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICAgIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV1cblxuICAgIC8vIG1heCArIDEgZXhwbGljaXRseSBpbmNsdWRlcyB0aGUgbmV3bGluZVxuICAgIHJldHVybiBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXggKyAxKVxuICB9XG5cbiAgbGV0IHN0ciA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCArIDEpXG5cbiAgbWF4ID0gc3RyLmxlbmd0aFxuICBsZXQgbGFiZWxFbmQgPSAtMVxuXG4gIGZvciAocG9zID0gMTsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmIChjaCA9PT0gMHg1QiAvKiBbICovKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVEIC8qIF0gKi8pIHtcbiAgICAgIGxhYmVsRW5kID0gcG9zXG4gICAgICBicmVha1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MEEgLyogXFxuICovKSB7XG4gICAgICBjb25zdCBsaW5lQ29udGVudCA9IGdldE5leHRMaW5lKG5leHRMaW5lKVxuICAgICAgaWYgKGxpbmVDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHN0ciArPSBsaW5lQ29udGVudFxuICAgICAgICBtYXggPSBzdHIubGVuZ3RoXG4gICAgICAgIG5leHRMaW5lKytcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVDIC8qIFxcICovKSB7XG4gICAgICBwb3MrK1xuICAgICAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpID09PSAweDBBKSB7XG4gICAgICAgIGNvbnN0IGxpbmVDb250ZW50ID0gZ2V0TmV4dExpbmUobmV4dExpbmUpXG4gICAgICAgIGlmIChsaW5lQ29udGVudCAhPT0gbnVsbCkge1xuICAgICAgICAgIHN0ciArPSBsaW5lQ29udGVudFxuICAgICAgICAgIG1heCA9IHN0ci5sZW5ndGhcbiAgICAgICAgICBuZXh0TGluZSsrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAobGFiZWxFbmQgPCAwIHx8IHN0ci5jaGFyQ29kZUF0KGxhYmVsRW5kICsgMSkgIT09IDB4M0EvKiA6ICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICBeXl4gc2tpcCBvcHRpb25hbCB3aGl0ZXNwYWNlIGhlcmVcbiAgZm9yIChwb3MgPSBsYWJlbEVuZCArIDI7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcylcbiAgICBpZiAoY2ggPT09IDB4MEEpIHtcbiAgICAgIGNvbnN0IGxpbmVDb250ZW50ID0gZ2V0TmV4dExpbmUobmV4dExpbmUpXG4gICAgICBpZiAobGluZUNvbnRlbnQgIT09IG51bGwpIHtcbiAgICAgICAgc3RyICs9IGxpbmVDb250ZW50XG4gICAgICAgIG1heCA9IHN0ci5sZW5ndGhcbiAgICAgICAgbmV4dExpbmUrK1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgIC8qIGVzbGludCBuby1lbXB0eTowICovXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICAgICBeXl5eXl5eXl5eXiBwYXJzZSB0aGlzXG4gIGNvbnN0IGRlc3RSZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0ciwgcG9zLCBtYXgpXG4gIGlmICghZGVzdFJlcy5vaykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGNvbnN0IGhyZWYgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKGRlc3RSZXMuc3RyKVxuICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhocmVmKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIHBvcyA9IGRlc3RSZXMucG9zXG5cbiAgLy8gc2F2ZSBjdXJzb3Igc3RhdGUsIHdlIGNvdWxkIHJlcXVpcmUgdG8gcm9sbGJhY2sgbGF0ZXJcbiAgY29uc3QgZGVzdEVuZFBvcyA9IHBvc1xuICBjb25zdCBkZXN0RW5kTGluZU5vID0gbmV4dExpbmVcblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgXl5eIHNraXBwaW5nIHRob3NlIHNwYWNlc1xuICBjb25zdCBzdGFydCA9IHBvc1xuICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmIChjaCA9PT0gMHgwQSkge1xuICAgICAgY29uc3QgbGluZUNvbnRlbnQgPSBnZXROZXh0TGluZShuZXh0TGluZSlcbiAgICAgIGlmIChsaW5lQ29udGVudCAhPT0gbnVsbCkge1xuICAgICAgICBzdHIgKz0gbGluZUNvbnRlbnRcbiAgICAgICAgbWF4ID0gc3RyLmxlbmd0aFxuICAgICAgICBuZXh0TGluZSsrXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgLyogTm90aGluZyAqL1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNlIHRoaXNcbiAgbGV0IHRpdGxlUmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4KVxuICB3aGlsZSAodGl0bGVSZXMuY2FuX2NvbnRpbnVlKSB7XG4gICAgY29uc3QgbGluZUNvbnRlbnQgPSBnZXROZXh0TGluZShuZXh0TGluZSlcbiAgICBpZiAobGluZUNvbnRlbnQgPT09IG51bGwpIGJyZWFrXG4gICAgc3RyICs9IGxpbmVDb250ZW50XG4gICAgcG9zID0gbWF4XG4gICAgbWF4ID0gc3RyLmxlbmd0aFxuICAgIG5leHRMaW5lKytcbiAgICB0aXRsZVJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rVGl0bGUoc3RyLCBwb3MsIG1heCwgdGl0bGVSZXMpXG4gIH1cbiAgbGV0IHRpdGxlXG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHRpdGxlUmVzLm9rKSB7XG4gICAgdGl0bGUgPSB0aXRsZVJlcy5zdHJcbiAgICBwb3MgPSB0aXRsZVJlcy5wb3NcbiAgfSBlbHNlIHtcbiAgICB0aXRsZSA9ICcnXG4gICAgcG9zID0gZGVzdEVuZFBvc1xuICAgIG5leHRMaW5lID0gZGVzdEVuZExpbmVOb1xuICB9XG5cbiAgLy8gc2tpcCB0cmFpbGluZyBzcGFjZXMgdW50aWwgdGhlIHJlc3Qgb2YgdGhlIGxpbmVcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmICghaXNTcGFjZShjaCkpIHsgYnJlYWsgfVxuICAgIHBvcysrXG4gIH1cblxuICBpZiAocG9zIDwgbWF4ICYmIHN0ci5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEpIHtcbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIC8vIGdhcmJhZ2UgYXQgdGhlIGVuZCBvZiB0aGUgbGluZSBhZnRlciB0aXRsZSxcbiAgICAgIC8vIGJ1dCBpdCBjb3VsZCBzdGlsbCBiZSBhIHZhbGlkIHJlZmVyZW5jZSBpZiB3ZSByb2xsIGJhY2tcbiAgICAgIHRpdGxlID0gJydcbiAgICAgIHBvcyA9IGRlc3RFbmRQb3NcbiAgICAgIG5leHRMaW5lID0gZGVzdEVuZExpbmVOb1xuICAgICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgICBjb25zdCBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcylcbiAgICAgICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhayB9XG4gICAgICAgIHBvcysrXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpICE9PSAweDBBKSB7XG4gICAgLy8gZ2FyYmFnZSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBjb25zdCBsYWJlbCA9IG5vcm1hbGl6ZVJlZmVyZW5jZShzdHIuc2xpY2UoMSwgbGFiZWxFbmQpKVxuICBpZiAoIWxhYmVsKSB7XG4gICAgLy8gQ29tbW9uTWFyayAwLjIwIGRpc2FsbG93cyBlbXB0eSBsYWJlbHNcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIFJlZmVyZW5jZSBjYW4gbm90IHRlcm1pbmF0ZSBhbnl0aGluZy4gVGhpcyBjaGVjayBpcyBmb3Igc2FmZXR5IG9ubHkuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlIH1cblxuICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLmVudi5yZWZlcmVuY2VzID0ge31cbiAgfVxuICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzW2xhYmVsXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBzdGF0ZS5lbnYucmVmZXJlbmNlc1tsYWJlbF0gPSB7IHRpdGxlLCBocmVmIH1cbiAgfVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIExpc3Qgb2YgdmFsaWQgaHRtbCBibG9ja3MgbmFtZXMsIGFjY29yZGluZyB0byBjb21tb25tYXJrIHNwZWNcbi8vIGh0dHBzOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjMwLyNodG1sLWJsb2Nrc1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICdhZGRyZXNzJyxcbiAgJ2FydGljbGUnLFxuICAnYXNpZGUnLFxuICAnYmFzZScsXG4gICdiYXNlZm9udCcsXG4gICdibG9ja3F1b3RlJyxcbiAgJ2JvZHknLFxuICAnY2FwdGlvbicsXG4gICdjZW50ZXInLFxuICAnY29sJyxcbiAgJ2NvbGdyb3VwJyxcbiAgJ2RkJyxcbiAgJ2RldGFpbHMnLFxuICAnZGlhbG9nJyxcbiAgJ2RpcicsXG4gICdkaXYnLFxuICAnZGwnLFxuICAnZHQnLFxuICAnZmllbGRzZXQnLFxuICAnZmlnY2FwdGlvbicsXG4gICdmaWd1cmUnLFxuICAnZm9vdGVyJyxcbiAgJ2Zvcm0nLFxuICAnZnJhbWUnLFxuICAnZnJhbWVzZXQnLFxuICAnaDEnLFxuICAnaDInLFxuICAnaDMnLFxuICAnaDQnLFxuICAnaDUnLFxuICAnaDYnLFxuICAnaGVhZCcsXG4gICdoZWFkZXInLFxuICAnaHInLFxuICAnaHRtbCcsXG4gICdpZnJhbWUnLFxuICAnbGVnZW5kJyxcbiAgJ2xpJyxcbiAgJ2xpbmsnLFxuICAnbWFpbicsXG4gICdtZW51JyxcbiAgJ21lbnVpdGVtJyxcbiAgJ25hdicsXG4gICdub2ZyYW1lcycsXG4gICdvbCcsXG4gICdvcHRncm91cCcsXG4gICdvcHRpb24nLFxuICAncCcsXG4gICdwYXJhbScsXG4gICdzZWFyY2gnLFxuICAnc2VjdGlvbicsXG4gICdzdW1tYXJ5JyxcbiAgJ3RhYmxlJyxcbiAgJ3Rib2R5JyxcbiAgJ3RkJyxcbiAgJ3Rmb290JyxcbiAgJ3RoJyxcbiAgJ3RoZWFkJyxcbiAgJ3RpdGxlJyxcbiAgJ3RyJyxcbiAgJ3RyYWNrJyxcbiAgJ3VsJ1xuXVxuIiwgIi8vIFJlZ2V4cHMgdG8gbWF0Y2ggaHRtbCBlbGVtZW50c1xuXG5jb25zdCBhdHRyX25hbWUgPSAnW2EtekEtWl86XVthLXpBLVowLTk6Ll8tXSonXG5cbmNvbnN0IHVucXVvdGVkID0gJ1teXCJcXCc9PD5gXFxcXHgwMC1cXFxceDIwXSsnXG5jb25zdCBzaW5nbGVfcXVvdGVkID0gXCInW14nXSonXCJcbmNvbnN0IGRvdWJsZV9xdW90ZWQgPSAnXCJbXlwiXSpcIidcblxuY29uc3QgYXR0cl92YWx1ZSA9ICcoPzonICsgdW5xdW90ZWQgKyAnfCcgKyBzaW5nbGVfcXVvdGVkICsgJ3wnICsgZG91YmxlX3F1b3RlZCArICcpJ1xuXG5jb25zdCBhdHRyaWJ1dGUgPSAnKD86XFxcXHMrJyArIGF0dHJfbmFtZSArICcoPzpcXFxccyo9XFxcXHMqJyArIGF0dHJfdmFsdWUgKyAnKT8pJ1xuXG5jb25zdCBvcGVuX3RhZyA9ICc8W0EtWmEtel1bQS1aYS16MC05XFxcXC1dKicgKyBhdHRyaWJ1dGUgKyAnKlxcXFxzKlxcXFwvPz4nXG5cbmNvbnN0IGNsb3NlX3RhZyA9ICc8XFxcXC9bQS1aYS16XVtBLVphLXowLTlcXFxcLV0qXFxcXHMqPidcbmNvbnN0IGNvbW1lbnQgPSAnPCEtLS0/Pnw8IS0tKD86W14tXXwtW14tXXwtLVtePl0pKi0tPidcbmNvbnN0IHByb2Nlc3NpbmcgPSAnPFs/XVtcXFxcc1xcXFxTXSo/Wz9dPidcbmNvbnN0IGRlY2xhcmF0aW9uID0gJzwhW0EtWmEtel1bXj5dKj4nXG5jb25zdCBjZGF0YSA9ICc8IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/XFxcXF1cXFxcXT4nXG5cbmNvbnN0IEhUTUxfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICd8JyArIGNvbW1lbnQgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3wnICsgcHJvY2Vzc2luZyArICd8JyArIGRlY2xhcmF0aW9uICsgJ3wnICsgY2RhdGEgKyAnKScpXG5jb25zdCBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICcpJylcblxuZXhwb3J0IHsgSFRNTF9UQUdfUkUsIEhUTUxfT1BFTl9DTE9TRV9UQUdfUkUgfVxuIiwgIi8vIEhUTUwgYmxvY2tcblxuaW1wb3J0IGJsb2NrX25hbWVzIGZyb20gJy4uL2NvbW1vbi9odG1sX2Jsb2Nrcy5tanMnXG5pbXBvcnQgeyBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFIH0gZnJvbSAnLi4vY29tbW9uL2h0bWxfcmUubWpzJ1xuXG4vLyBBbiBhcnJheSBvZiBvcGVuaW5nIGFuZCBjb3JyZXNwb25kaW5nIGNsb3Npbmcgc2VxdWVuY2VzIGZvciBodG1sIHRhZ3MsXG4vLyBsYXN0IGFyZ3VtZW50IGRlZmluZXMgd2hldGhlciBpdCBjYW4gdGVybWluYXRlIGEgcGFyYWdyYXBoIG9yIG5vdFxuLy9cbmNvbnN0IEhUTUxfU0VRVUVOQ0VTID0gW1xuICBbL148KHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpKD89KFxcc3w+fCQpKS9pLCAvPFxcLyhzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKT4vaSwgdHJ1ZV0sXG4gIFsvXjwhLS0vLCAvLS0+LywgdHJ1ZV0sXG4gIFsvXjxcXD8vLCAvXFw/Pi8sIHRydWVdLFxuICBbL148IVtBLVpdLywgLz4vLCB0cnVlXSxcbiAgWy9ePCFcXFtDREFUQVxcWy8sIC9cXF1cXF0+LywgdHJ1ZV0sXG4gIFtuZXcgUmVnRXhwKCdePC8/KCcgKyBibG9ja19uYW1lcy5qb2luKCd8JykgKyAnKSg/PShcXFxcc3wvPz58JCkpJywgJ2knKSwgL14kLywgdHJ1ZV0sXG4gIFtuZXcgUmVnRXhwKEhUTUxfT1BFTl9DTE9TRV9UQUdfUkUuc291cmNlICsgJ1xcXFxzKiQnKSwgL14kLywgZmFsc2VdXG5dXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGh0bWxfYmxvY2sgKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5odG1sKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IGxpbmVUZXh0ID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KVxuXG4gIGxldCBpID0gMFxuICBmb3IgKDsgaSA8IEhUTUxfU0VRVUVOQ0VTLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEhUTUxfU0VRVUVOQ0VTW2ldWzBdLnRlc3QobGluZVRleHQpKSB7IGJyZWFrIH1cbiAgfVxuICBpZiAoaSA9PT0gSFRNTF9TRVFVRU5DRVMubGVuZ3RoKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKHNpbGVudCkge1xuICAgIC8vIHRydWUgaWYgdGhpcyBzZXF1ZW5jZSBjYW4gYmUgYSB0ZXJtaW5hdG9yLCBmYWxzZSBvdGhlcndpc2VcbiAgICByZXR1cm4gSFRNTF9TRVFVRU5DRVNbaV1bMl1cbiAgfVxuXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcblxuICAvLyBCbG9jayB0eXBlcyA2IGFuZCA3ICh0aGUgb25seSBvbmVzIHdob3NlIGVuZCBjb25kaXRpb24gaXMgYSBibGFuayBsaW5lKVxuICAvLyBoYXZlIGAvXiQvYCBhcyB0aGVpciBjbG9zaW5nIHJlZ2V4cC4gRm9yIGFsbCBvdGhlciB0eXBlcyAoMS01LCBlLmcuXG4gIC8vIGA8IS0tYCBjb21tZW50cyksIGEgYmxhbmsgbGluZSBpcyByZWd1bGFyIGNvbnRlbnQgYW5kIG11c3Qgbm90IHRlcm1pbmF0ZVxuICAvLyB0aGUgYmxvY2sgLSBpdCBlbmRzIG9ubHkgd2hlbiBpdHMgY2xvc2luZyBzZXF1ZW5jZSBpcyBmb3VuZC5cbiAgY29uc3QgZW5kc09uQmxhbmtMaW5lID0gSFRNTF9TRVFVRU5DRVNbaV1bMV0udGVzdCgnJylcblxuICAvLyBJZiB3ZSBhcmUgaGVyZSAtIHdlIGRldGVjdGVkIEhUTUwgYmxvY2suXG4gIC8vIExldCdzIHJvbGwgZG93biB0aWxsIGJsb2NrIGVuZC5cbiAgaWYgKCFIVE1MX1NFUVVFTkNFU1tpXVsxXS50ZXN0KGxpbmVUZXh0KSkge1xuICAgIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmU7IG5leHRMaW5lKyspIHtcbiAgICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICAgIC8vIEFuIG91dGRlbnRlZCBibGFuayBsaW5lIHNob3VsZG4ndCBlbmQgYSBibG9jayB0aGF0IGRvZXNuJ3QgZW5kIG9uIGFcbiAgICAgICAgLy8gYmxhbmsgbGluZSAoZS5nLiBhIGA8IS0tYCBjb21tZW50IGluc2lkZSBhIGxpc3QgaXRlbSkuIFN1Y2ggYmxvY2tzXG4gICAgICAgIC8vIG11c3QgY29udGludWUgdW50aWwgdGhlaXIgY2xvc2luZyBzZXF1ZW5jZSByZWdhcmRsZXNzIG9mIGluZGVudC5cbiAgICAgICAgaWYgKGVuZHNPbkJsYW5rTGluZSB8fCAhc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHsgYnJlYWsgfVxuICAgICAgfVxuXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXVxuICAgICAgbGluZVRleHQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpXG5cbiAgICAgIGlmIChIVE1MX1NFUVVFTkNFU1tpXVsxXS50ZXN0KGxpbmVUZXh0KSkge1xuICAgICAgICBpZiAobGluZVRleHQubGVuZ3RoICE9PSAwKSB7IG5leHRMaW5lKysgfVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZVxuXG4gIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaHRtbF9ibG9jaycsICcnLCAwKVxuICB0b2tlbi5tYXAgPSBbc3RhcnRMaW5lLCBuZXh0TGluZV1cbiAgdG9rZW4uY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgdHJ1ZSlcblxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIGhlYWRpbmcgKCMsICMjLCAuLi4pXG5cbmltcG9ydCB7IGlzU3BhY2UsIGFzY2lpVHJpbSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhlYWRpbmcgKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICBpZiAoY2ggIT09IDB4MjMvKiAjICovIHx8IHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyBjb3VudCBoZWFkaW5nIGxldmVsXG4gIGxldCBsZXZlbCA9IDFcbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdCgrK3BvcylcbiAgd2hpbGUgKGNoID09PSAweDIzLyogIyAqLyAmJiBwb3MgPCBtYXggJiYgbGV2ZWwgPD0gNikge1xuICAgIGxldmVsKytcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKVxuICB9XG5cbiAgaWYgKGxldmVsID4gNiB8fCAocG9zIDwgbWF4ICYmICFpc1NwYWNlKGNoKSkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlIH1cblxuICAvLyBMZXQncyBjdXQgdGFpbHMgbGlrZSAnICAgICMjIyAgJyBmcm9tIHRoZSBlbmQgb2Ygc3RyaW5nXG5cbiAgbWF4ID0gc3RhdGUuc2tpcFNwYWNlc0JhY2sobWF4LCBwb3MpXG4gIGNvbnN0IHRtcCA9IHN0YXRlLnNraXBDaGFyc0JhY2sobWF4LCAweDIzLCBwb3MpIC8vICNcbiAgaWYgKHRtcCA+IHBvcyAmJiBpc1NwYWNlKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHRtcCAtIDEpKSkge1xuICAgIG1heCA9IHRtcFxuICB9XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIDFcblxuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnaGVhZGluZ19vcGVuJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgMSlcbiAgdG9rZW5fby5tYXJrdXAgPSAnIyMjIyMjIyMnLnNsaWNlKDAsIGxldmVsKVxuICB0b2tlbl9vLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG5cbiAgY29uc3QgdG9rZW5faSA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKVxuICB0b2tlbl9pLmNvbnRlbnQgPSBhc2NpaVRyaW0oc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KSlcbiAgdG9rZW5faS5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXVxuICB0b2tlbl9pLmNoaWxkcmVuID0gW11cblxuICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnaGVhZGluZ19jbG9zZScsICdoJyArIFN0cmluZyhsZXZlbCksIC0xKVxuICB0b2tlbl9jLm1hcmt1cCA9ICcjIyMjIyMjIycuc2xpY2UoMCwgbGV2ZWwpXG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBsaGVhZGluZyAoLS0tLCA9PT0pXG5cbmltcG9ydCB7IGFzY2lpVHJpbSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxoZWFkaW5nIChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLyosIHNpbGVudCAqLykge1xuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncGFyYWdyYXBoJylcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGNvbnN0IG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlXG4gIHN0YXRlLnBhcmVudFR5cGUgPSAncGFyYWdyYXBoJyAvLyB1c2UgcGFyYWdyYXBoIHRvIG1hdGNoIHRlcm1pbmF0b3JSdWxlc1xuXG4gIC8vIGp1bXAgbGluZS1ieS1saW5lIHVudGlsIGVtcHR5IG9uZSBvciBFT0ZcbiAgbGV0IGxldmVsID0gMFxuICBsZXQgbWFya2VyXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcblxuICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKTsgbmV4dExpbmUrKykge1xuICAgIC8vIHRoaXMgd291bGQgYmUgYSBjb2RlIGJsb2NrIG5vcm1hbGx5LCBidXQgYWZ0ZXIgcGFyYWdyYXBoXG4gICAgLy8gaXQncyBjb25zaWRlcmVkIGEgbGF6eSBjb250aW51YXRpb24gcmVnYXJkbGVzcyBvZiB3aGF0J3MgdGhlcmVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgY29udGludWUgfVxuXG4gICAgLy9cbiAgICAvLyBDaGVjayBmb3IgdW5kZXJsaW5lIGluIHNldGV4dCBoZWFkZXJcbiAgICAvL1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdID49IHN0YXRlLmJsa0luZGVudCkge1xuICAgICAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdXG4gICAgICBjb25zdCBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdXG5cbiAgICAgIGlmIChwb3MgPCBtYXgpIHtcbiAgICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgICAgIGlmIChtYXJrZXIgPT09IDB4MkQvKiAtICovIHx8IG1hcmtlciA9PT0gMHgzRC8qID0gKi8pIHtcbiAgICAgICAgICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpXG4gICAgICAgICAgcG9zID0gc3RhdGUuc2tpcFNwYWNlcyhwb3MpXG5cbiAgICAgICAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgICAgICAgbGV2ZWwgPSAobWFya2VyID09PSAweDNELyogPSAqLyA/IDEgOiAyKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBjb250aW51ZSB9XG5cbiAgICAvLyBTb21lIHRhZ3MgY2FuIHRlcm1pbmF0ZSBwYXJhZ3JhcGggd2l0aG91dCBlbXB0eSBsaW5lLlxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhayB9XG4gIH1cblxuICBpZiAoIWxldmVsKSB7XG4gICAgLy8gRGlkbid0IGZpbmQgdmFsaWQgdW5kZXJsaW5lXG4gICAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGVcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBhc2NpaVRyaW0oc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCBmYWxzZSkpXG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lICsgMVxuXG4gIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdoZWFkaW5nX29wZW4nLCAnaCcgKyBTdHJpbmcobGV2ZWwpLCAxKVxuICB0b2tlbl9vLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKVxuICB0b2tlbl9vLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG5cbiAgY29uc3QgdG9rZW5faSA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKVxuICB0b2tlbl9pLmNvbnRlbnQgPSBjb250ZW50XG4gIHRva2VuX2kubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZSAtIDFdXG4gIHRva2VuX2kuY2hpbGRyZW4gPSBbXVxuXG4gIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS5wdXNoKCdoZWFkaW5nX2Nsb3NlJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgLTEpXG4gIHRva2VuX2MubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpXG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGVcblxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIFBhcmFncmFwaFxuXG5pbXBvcnQgeyBhc2NpaVRyaW0gfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJhZ3JhcGggKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUpIHtcbiAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3BhcmFncmFwaCcpXG4gIGNvbnN0IG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdwYXJhZ3JhcGgnXG5cbiAgLy8ganVtcCBsaW5lLWJ5LWxpbmUgdW50aWwgZW1wdHkgb25lIG9yIEVPRlxuICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKTsgbmV4dExpbmUrKykge1xuICAgIC8vIHRoaXMgd291bGQgYmUgYSBjb2RlIGJsb2NrIG5vcm1hbGx5LCBidXQgYWZ0ZXIgcGFyYWdyYXBoXG4gICAgLy8gaXQncyBjb25zaWRlcmVkIGEgbGF6eSBjb250aW51YXRpb24gcmVnYXJkbGVzcyBvZiB3aGF0J3MgdGhlcmVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgY29udGludWUgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHsgY29udGludWUgfVxuXG4gICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICBsZXQgdGVybWluYXRlID0gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWsgfVxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGFzY2lpVHJpbShzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKSlcblxuICBzdGF0ZS5saW5lID0gbmV4dExpbmVcblxuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgncGFyYWdyYXBoX29wZW4nLCAncCcsIDEpXG4gIHRva2VuX28ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV1cblxuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApXG4gIHRva2VuX2kuY29udGVudCA9IGNvbnRlbnRcbiAgdG9rZW5faS5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXVxuICB0b2tlbl9pLmNoaWxkcmVuID0gW11cblxuICBzdGF0ZS5wdXNoKCdwYXJhZ3JhcGhfY2xvc2UnLCAncCcsIC0xKVxuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlXG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvKiogaW50ZXJuYWxcbiAqIGNsYXNzIFBhcnNlckJsb2NrXG4gKlxuICogQmxvY2stbGV2ZWwgdG9rZW5pemVyLlxuICoqL1xuXG5pbXBvcnQgUnVsZXIgZnJvbSAnLi9ydWxlci5tanMnXG5pbXBvcnQgU3RhdGVCbG9jayBmcm9tICcuL3J1bGVzX2Jsb2NrL3N0YXRlX2Jsb2NrLm1qcydcblxuaW1wb3J0IHJfdGFibGUgZnJvbSAnLi9ydWxlc19ibG9jay90YWJsZS5tanMnXG5pbXBvcnQgcl9jb2RlIGZyb20gJy4vcnVsZXNfYmxvY2svY29kZS5tanMnXG5pbXBvcnQgcl9mZW5jZSBmcm9tICcuL3J1bGVzX2Jsb2NrL2ZlbmNlLm1qcydcbmltcG9ydCByX2Jsb2NrcXVvdGUgZnJvbSAnLi9ydWxlc19ibG9jay9ibG9ja3F1b3RlLm1qcydcbmltcG9ydCByX2hyIGZyb20gJy4vcnVsZXNfYmxvY2svaHIubWpzJ1xuaW1wb3J0IHJfbGlzdCBmcm9tICcuL3J1bGVzX2Jsb2NrL2xpc3QubWpzJ1xuaW1wb3J0IHJfcmVmZXJlbmNlIGZyb20gJy4vcnVsZXNfYmxvY2svcmVmZXJlbmNlLm1qcydcbmltcG9ydCByX2h0bWxfYmxvY2sgZnJvbSAnLi9ydWxlc19ibG9jay9odG1sX2Jsb2NrLm1qcydcbmltcG9ydCByX2hlYWRpbmcgZnJvbSAnLi9ydWxlc19ibG9jay9oZWFkaW5nLm1qcydcbmltcG9ydCByX2xoZWFkaW5nIGZyb20gJy4vcnVsZXNfYmxvY2svbGhlYWRpbmcubWpzJ1xuaW1wb3J0IHJfcGFyYWdyYXBoIGZyb20gJy4vcnVsZXNfYmxvY2svcGFyYWdyYXBoLm1qcydcblxuY29uc3QgX3J1bGVzID0gW1xuICAvLyBGaXJzdCAyIHBhcmFtcyAtIHJ1bGUgbmFtZSAmIHNvdXJjZS4gU2Vjb25kYXJ5IGFycmF5IC0gbGlzdCBvZiBydWxlcyxcbiAgLy8gd2hpY2ggY2FuIGJlIHRlcm1pbmF0ZWQgYnkgdGhpcyBvbmUuXG4gIFsndGFibGUnLCByX3RhYmxlLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnXV0sXG4gIFsnY29kZScsIHJfY29kZV0sXG4gIFsnZmVuY2UnLCByX2ZlbmNlLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0J11dLFxuICBbJ2Jsb2NrcXVvdGUnLCByX2Jsb2NrcXVvdGUsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnXV0sXG4gIFsnaHInLCByX2hyLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0J11dLFxuICBbJ2xpc3QnLCByX2xpc3QsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJ11dLFxuICBbJ3JlZmVyZW5jZScsIHJfcmVmZXJlbmNlXSxcbiAgWydodG1sX2Jsb2NrJywgcl9odG1sX2Jsb2NrLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZSddXSxcbiAgWydoZWFkaW5nJywgcl9oZWFkaW5nLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZSddXSxcbiAgWydsaGVhZGluZycsIHJfbGhlYWRpbmddLFxuICBbJ3BhcmFncmFwaCcsIHJfcGFyYWdyYXBoXVxuXVxuXG4vKipcbiAqIG5ldyBQYXJzZXJCbG9jaygpXG4gKiovXG5mdW5jdGlvbiBQYXJzZXJCbG9jayAoKSB7XG4gIC8qKlxuICAgKiBQYXJzZXJCbG9jayNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBibG9jayBydWxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVyID0gbmV3IFJ1bGVyKClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSwgeyBhbHQ6IChfcnVsZXNbaV1bMl0gfHwgW10pLnNsaWNlKCkgfSlcbiAgfVxufVxuXG4vLyBHZW5lcmF0ZSB0b2tlbnMgZm9yIGlucHV0IHJhbmdlXG4vL1xuUGFyc2VyQmxvY2sucHJvdG90eXBlLnRva2VuaXplID0gZnVuY3Rpb24gKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUpIHtcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKVxuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGhcbiAgY29uc3QgbWF4TmVzdGluZyA9IHN0YXRlLm1kLm9wdGlvbnMubWF4TmVzdGluZ1xuICBsZXQgbGluZSA9IHN0YXJ0TGluZVxuICBsZXQgaGFzRW1wdHlMaW5lcyA9IGZhbHNlXG5cbiAgd2hpbGUgKGxpbmUgPCBlbmRMaW5lKSB7XG4gICAgc3RhdGUubGluZSA9IGxpbmUgPSBzdGF0ZS5za2lwRW1wdHlMaW5lcyhsaW5lKVxuICAgIGlmIChsaW5lID49IGVuZExpbmUpIHsgYnJlYWsgfVxuXG4gICAgLy8gVGVybWluYXRpb24gY29uZGl0aW9uIGZvciBuZXN0ZWQgY2FsbHMuXG4gICAgLy8gTmVzdGVkIGNhbGxzIGN1cnJlbnRseSB1c2VkIGZvciBibG9ja3F1b3RlcyAmIGxpc3RzXG4gICAgaWYgKHN0YXRlLnNDb3VudFtsaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhayB9XG5cbiAgICAvLyBJZiBuZXN0aW5nIGxldmVsIGV4Y2VlZGVkIC0gc2tpcCB0YWlsIHRvIHRoZSBlbmQuIFRoYXQncyBub3Qgb3JkaW5hcnlcbiAgICAvLyBzaXR1YXRpb24gYW5kIHdlIHNob3VsZCBub3QgY2FyZSBhYm91dCBjb250ZW50LlxuICAgIGlmIChzdGF0ZS5sZXZlbCA+PSBtYXhOZXN0aW5nKSB7XG4gICAgICBzdGF0ZS5saW5lID0gZW5kTGluZVxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICAvLyBUcnkgYWxsIHBvc3NpYmxlIHJ1bGVzLlxuICAgIC8vIE9uIHN1Y2Nlc3MsIHJ1bGUgc2hvdWxkOlxuICAgIC8vXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLmxpbmVgXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnRva2Vuc2BcbiAgICAvLyAtIHJldHVybiB0cnVlXG4gICAgY29uc3QgcHJldkxpbmUgPSBzdGF0ZS5saW5lXG4gICAgbGV0IG9rID0gZmFsc2VcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIGxpbmUsIGVuZExpbmUsIGZhbHNlKVxuICAgICAgaWYgKG9rKSB7XG4gICAgICAgIGlmIChwcmV2TGluZSA+PSBzdGF0ZS5saW5lKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYmxvY2sgcnVsZSBkaWRuJ3QgaW5jcmVtZW50IHN0YXRlLmxpbmVcIilcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRoaXMgY2FuIG9ubHkgaGFwcGVuIGlmIHVzZXIgZGlzYWJsZXMgcGFyYWdyYXBoIHJ1bGVcbiAgICBpZiAoIW9rKSB0aHJvdyBuZXcgRXJyb3IoJ25vbmUgb2YgdGhlIGJsb2NrIHJ1bGVzIG1hdGNoZWQnKVxuXG4gICAgLy8gc2V0IHN0YXRlLnRpZ2h0IGlmIHdlIGhhZCBhbiBlbXB0eSBsaW5lIGJlZm9yZSBjdXJyZW50IHRhZ1xuICAgIC8vIGkuZS4gbGF0ZXN0IGVtcHR5IGxpbmUgc2hvdWxkIG5vdCBjb3VudFxuICAgIHN0YXRlLnRpZ2h0ID0gIWhhc0VtcHR5TGluZXNcblxuICAgIC8vIHBhcmFncmFwaCBtaWdodCBcImVhdFwiIG9uZSBuZXdsaW5lIGFmdGVyIGl0IGluIG5lc3RlZCBsaXN0c1xuICAgIGlmIChzdGF0ZS5pc0VtcHR5KHN0YXRlLmxpbmUgLSAxKSkge1xuICAgICAgaGFzRW1wdHlMaW5lcyA9IHRydWVcbiAgICB9XG5cbiAgICBsaW5lID0gc3RhdGUubGluZVxuXG4gICAgaWYgKGxpbmUgPCBlbmRMaW5lICYmIHN0YXRlLmlzRW1wdHkobGluZSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlXG4gICAgICBsaW5lKytcbiAgICAgIHN0YXRlLmxpbmUgPSBsaW5lXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUGFyc2VyQmxvY2sucGFyc2Uoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpXG4gKlxuICogUHJvY2VzcyBpbnB1dCBzdHJpbmcgYW5kIHB1c2ggYmxvY2sgdG9rZW5zIGludG8gYG91dFRva2Vuc2BcbiAqKi9cblBhcnNlckJsb2NrLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzcmMsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICBpZiAoIXNyYykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHN0YXRlID0gbmV3IHRoaXMuU3RhdGUoc3JjLCBtZCwgZW52LCBvdXRUb2tlbnMpXG5cbiAgdGhpcy50b2tlbml6ZShzdGF0ZSwgc3RhdGUubGluZSwgc3RhdGUubGluZU1heClcbn1cblxuUGFyc2VyQmxvY2sucHJvdG90eXBlLlN0YXRlID0gU3RhdGVCbG9ja1xuXG5leHBvcnQgZGVmYXVsdCBQYXJzZXJCbG9ja1xuIiwgIi8vIElubGluZSBwYXJzZXIgc3RhdGVcblxuaW1wb3J0IFRva2VuIGZyb20gJy4uL3Rva2VuLm1qcydcbmltcG9ydCB7IGlzV2hpdGVTcGFjZSwgaXNQdW5jdENoYXJDb2RlLCBpc01kQXNjaWlQdW5jdCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmZ1bmN0aW9uIFN0YXRlSW5saW5lIChzcmMsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB0aGlzLnNyYyA9IHNyY1xuICB0aGlzLmVudiA9IGVudlxuICB0aGlzLm1kID0gbWRcbiAgdGhpcy50b2tlbnMgPSBvdXRUb2tlbnNcbiAgdGhpcy50b2tlbnNfbWV0YSA9IEFycmF5KG91dFRva2Vucy5sZW5ndGgpXG5cbiAgdGhpcy5wb3MgPSAwXG4gIHRoaXMucG9zTWF4ID0gdGhpcy5zcmMubGVuZ3RoXG4gIHRoaXMubGV2ZWwgPSAwXG4gIHRoaXMucGVuZGluZyA9ICcnXG4gIHRoaXMucGVuZGluZ0xldmVsID0gMFxuXG4gIC8vIFN0b3JlcyB7IHN0YXJ0OiBlbmQgfSBwYWlycy4gVXNlZnVsIGZvciBiYWNrdHJhY2tcbiAgLy8gb3B0aW1pemF0aW9uIG9mIHBhaXJzIHBhcnNlIChlbXBoYXNpcywgc3RyaWtlcykuXG4gIHRoaXMuY2FjaGUgPSB7fVxuXG4gIC8vIExpc3Qgb2YgZW1waGFzaXMtbGlrZSBkZWxpbWl0ZXJzIGZvciBjdXJyZW50IHRhZ1xuICB0aGlzLmRlbGltaXRlcnMgPSBbXVxuXG4gIC8vIFN0YWNrIG9mIGRlbGltaXRlciBsaXN0cyBmb3IgdXBwZXIgbGV2ZWwgdGFnc1xuICB0aGlzLl9wcmV2X2RlbGltaXRlcnMgPSBbXVxuXG4gIC8vIGJhY2t0aWNrIGxlbmd0aCA9PiBsYXN0IHNlZW4gcG9zaXRpb25cbiAgdGhpcy5iYWNrdGlja3MgPSB7fVxuICB0aGlzLmJhY2t0aWNrc1NjYW5uZWQgPSBmYWxzZVxuXG4gIC8vIENvdW50ZXIgdXNlZCB0byBkaXNhYmxlIGlubGluZSBsaW5raWZ5LWl0IGV4ZWN1dGlvblxuICAvLyBpbnNpZGUgPGE+IGFuZCBtYXJrZG93biBsaW5rc1xuICB0aGlzLmxpbmtMZXZlbCA9IDBcbn1cblxuLy8gRmx1c2ggcGVuZGluZyB0ZXh0XG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnB1c2hQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCB0b2tlbiA9IG5ldyBUb2tlbigndGV4dCcsICcnLCAwKVxuICB0b2tlbi5jb250ZW50ID0gdGhpcy5wZW5kaW5nXG4gIHRva2VuLmxldmVsID0gdGhpcy5wZW5kaW5nTGV2ZWxcbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbilcbiAgdGhpcy5wZW5kaW5nID0gJydcbiAgcmV0dXJuIHRva2VuXG59XG5cbi8vIFB1c2ggbmV3IHRva2VuIHRvIFwic3RyZWFtXCIuXG4vLyBJZiBwZW5kaW5nIHRleHQgZXhpc3RzIC0gZmx1c2ggaXQgYXMgdGV4dCB0b2tlblxuLy9cblN0YXRlSW5saW5lLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHR5cGUsIHRhZywgbmVzdGluZykge1xuICBpZiAodGhpcy5wZW5kaW5nKSB7XG4gICAgdGhpcy5wdXNoUGVuZGluZygpXG4gIH1cblxuICBjb25zdCB0b2tlbiA9IG5ldyBUb2tlbih0eXBlLCB0YWcsIG5lc3RpbmcpXG4gIGxldCB0b2tlbl9tZXRhID0gbnVsbFxuXG4gIGlmIChuZXN0aW5nIDwgMCkge1xuICAgIC8vIGNsb3NpbmcgdGFnXG4gICAgdGhpcy5sZXZlbC0tXG4gICAgdGhpcy5kZWxpbWl0ZXJzID0gdGhpcy5fcHJldl9kZWxpbWl0ZXJzLnBvcCgpXG4gIH1cblxuICB0b2tlbi5sZXZlbCA9IHRoaXMubGV2ZWxcblxuICBpZiAobmVzdGluZyA+IDApIHtcbiAgICAvLyBvcGVuaW5nIHRhZ1xuICAgIHRoaXMubGV2ZWwrK1xuICAgIHRoaXMuX3ByZXZfZGVsaW1pdGVycy5wdXNoKHRoaXMuZGVsaW1pdGVycylcbiAgICB0aGlzLmRlbGltaXRlcnMgPSBbXVxuICAgIHRva2VuX21ldGEgPSB7IGRlbGltaXRlcnM6IHRoaXMuZGVsaW1pdGVycyB9XG4gIH1cblxuICB0aGlzLnBlbmRpbmdMZXZlbCA9IHRoaXMubGV2ZWxcbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbilcbiAgdGhpcy50b2tlbnNfbWV0YS5wdXNoKHRva2VuX21ldGEpXG4gIHJldHVybiB0b2tlblxufVxuXG4vLyBTY2FuIGEgc2VxdWVuY2Ugb2YgZW1waGFzaXMtbGlrZSBtYXJrZXJzLCBhbmQgZGV0ZXJtaW5lIHdoZXRoZXJcbi8vIGl0IGNhbiBzdGFydCBhbiBlbXBoYXNpcyBzZXF1ZW5jZSBvciBlbmQgYW4gZW1waGFzaXMgc2VxdWVuY2UuXG4vL1xuLy8gIC0gc3RhcnQgLSBwb3NpdGlvbiB0byBzY2FuIGZyb20gKGl0IHNob3VsZCBwb2ludCBhdCBhIHZhbGlkIG1hcmtlcik7XG4vLyAgLSBjYW5TcGxpdFdvcmQgLSBkZXRlcm1pbmUgaWYgdGhlc2UgbWFya2VycyBjYW4gYmUgZm91bmQgaW5zaWRlIGEgd29yZFxuLy9cblN0YXRlSW5saW5lLnByb3RvdHlwZS5zY2FuRGVsaW1zID0gZnVuY3Rpb24gKHN0YXJ0LCBjYW5TcGxpdFdvcmQpIHtcbiAgY29uc3QgbWF4ID0gdGhpcy5wb3NNYXhcbiAgY29uc3QgbWFya2VyID0gdGhpcy5zcmMuY2hhckNvZGVBdChzdGFydClcblxuICAvLyBBc3RyYWwgY2hhcmFjdGVycyBiZWxvdyBhcmUgY29tYmluZWQgbWFudWFsbHksIGJlY2F1c2UgLmNvZGVQb2ludEF0KClcbiAgLy8gZG9lcyBub3QgZ3VhcmFudGVlIG51bWVyaWMgdHlwZSBvdXRwdXQuIEFuZCB3ZSBkb24ndCB3aXNoIEpJVCBjYWNoZSBpc3N1ZXMuXG4gIC8vIFRoZSBicm9rZW4gc3Vycm9nYXRlIHBhaXJzIGFyZSBldmFsdWF0ZWQgYXMgVStGRkZEIHRvIHByZXZlbnQgcG9zc2libGVcbiAgLy8gY3Jhc2hlcy5cblxuICBsZXQgbGFzdENoYXJcbiAgaWYgKHN0YXJ0ID09PSAwKSB7XG4gICAgLy8gdHJlYXQgYmVnaW5uaW5nIG9mIHRoZSBsaW5lIGFzIGEgd2hpdGVzcGFjZVxuICAgIGxhc3RDaGFyID0gMHgyMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID09PSAxKSB7XG4gICAgbGFzdENoYXIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KDApXG4gICAgaWYgKChsYXN0Q2hhciAmIDB4RjgwMCkgPT09IDB4RDgwMCkgeyBsYXN0Q2hhciA9IDB4RkZGRCB9XG4gIH0gZWxzZSB7XG4gICAgbGFzdENoYXIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHN0YXJ0IC0gMSlcbiAgICBpZiAoKGxhc3RDaGFyICYgMHhGQzAwKSA9PT0gMHhEQzAwKSB7XG4gICAgICAvLyBsb3cgc3Vycm9nYXRlID0+IGFkZCBoaWdoIG9uZSwgcmVwbGFjZSBicm9rZW4gcGFpciB3aXRoIFUrRkZGRFxuICAgICAgY29uc3QgaGlnaFN1cnIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHN0YXJ0IC0gMilcbiAgICAgIGxhc3RDaGFyID0gKGhpZ2hTdXJyICYgMHhGQzAwKSA9PT0gMHhEODAwXG4gICAgICAgID8gMHgxMDAwMCArICgoaGlnaFN1cnIgLSAweEQ4MDApIDw8IDEwKSArIChsYXN0Q2hhciAtIDB4REMwMClcbiAgICAgICAgOiAweEZGRkRcbiAgICB9IGVsc2UgaWYgKChsYXN0Q2hhciAmIDB4RkMwMCkgPT09IDB4RDgwMCkge1xuICAgICAgbGFzdENoYXIgPSAweEZGRkRcbiAgICB9XG4gIH1cblxuICBsZXQgcG9zID0gc3RhcnRcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IG1hcmtlcikgeyBwb3MrKyB9XG5cbiAgY29uc3QgY291bnQgPSBwb3MgLSBzdGFydFxuXG4gIC8vIHRyZWF0IGVuZCBvZiB0aGUgbGluZSBhcyBhIHdoaXRlc3BhY2VcbiAgbGV0IG5leHRDaGFyID0gcG9zIDwgbWF4ID8gdGhpcy5zcmMuY2hhckNvZGVBdChwb3MpIDogMHgyMFxuICBpZiAoKG5leHRDaGFyICYgMHhGQzAwKSA9PT0gMHhEODAwKSB7XG4gICAgLy8gaGlnaCBzdXJyb2dhdGUgPT4gYWRkIGxvdyBvbmUsIHJlcGxhY2UgYnJva2VuIHBhaXIgd2l0aCBVK0ZGRkRcbiAgICBjb25zdCBsb3dTdXJyID0gdGhpcy5zcmMuY2hhckNvZGVBdChwb3MgKyAxKVxuICAgIG5leHRDaGFyID0gKGxvd1N1cnIgJiAweEZDMDApID09PSAweERDMDBcbiAgICAgID8gMHgxMDAwMCArICgobmV4dENoYXIgLSAweEQ4MDApIDw8IDEwKSArIChsb3dTdXJyIC0gMHhEQzAwKVxuICAgICAgOiAweEZGRkRcbiAgfSBlbHNlIGlmICgobmV4dENoYXIgJiAweEZDMDApID09PSAweERDMDApIHtcbiAgICBuZXh0Q2hhciA9IDB4RkZGRFxuICB9XG5cbiAgY29uc3QgaXNMYXN0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobGFzdENoYXIpIHx8IGlzUHVuY3RDaGFyQ29kZShsYXN0Q2hhcilcbiAgY29uc3QgaXNOZXh0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobmV4dENoYXIpIHx8IGlzUHVuY3RDaGFyQ29kZShuZXh0Q2hhcilcblxuICBjb25zdCBpc0xhc3RXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKGxhc3RDaGFyKVxuICBjb25zdCBpc05leHRXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKG5leHRDaGFyKVxuXG4gIGNvbnN0IGxlZnRfZmxhbmtpbmcgPVxuICAgICFpc05leHRXaGl0ZVNwYWNlICYmICghaXNOZXh0UHVuY3RDaGFyIHx8IGlzTGFzdFdoaXRlU3BhY2UgfHwgaXNMYXN0UHVuY3RDaGFyKVxuICBjb25zdCByaWdodF9mbGFua2luZyA9XG4gICAgIWlzTGFzdFdoaXRlU3BhY2UgJiYgKCFpc0xhc3RQdW5jdENoYXIgfHwgaXNOZXh0V2hpdGVTcGFjZSB8fCBpc05leHRQdW5jdENoYXIpXG5cbiAgY29uc3QgY2FuX29wZW4gPSBsZWZ0X2ZsYW5raW5nICYmIChjYW5TcGxpdFdvcmQgfHwgIXJpZ2h0X2ZsYW5raW5nIHx8IGlzTGFzdFB1bmN0Q2hhcilcbiAgY29uc3QgY2FuX2Nsb3NlID0gcmlnaHRfZmxhbmtpbmcgJiYgKGNhblNwbGl0V29yZCB8fCAhbGVmdF9mbGFua2luZyB8fCBpc05leHRQdW5jdENoYXIpXG5cbiAgcmV0dXJuIHsgY2FuX29wZW4sIGNhbl9jbG9zZSwgbGVuZ3RoOiBjb3VudCB9XG59XG5cbi8vIHJlLWV4cG9ydCBUb2tlbiBjbGFzcyB0byB1c2UgaW4gYmxvY2sgcnVsZXNcblN0YXRlSW5saW5lLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuXG5cbmV4cG9ydCBkZWZhdWx0IFN0YXRlSW5saW5lXG4iLCAiLy8gU2tpcCB0ZXh0IGNoYXJhY3RlcnMgZm9yIHRleHQgdG9rZW4sIHBsYWNlIHRob3NlIHRvIHBlbmRpbmcgYnVmZmVyXG4vLyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcG9zXG5cbi8vIFJ1bGUgdG8gc2tpcCBwdXJlIHRleHRcbi8vICd7fSQlQH4rPTonIHJlc2VydmVkIGZvciBleHRlbnRpb25zXG5cbi8vICEsIFwiLCAjLCAkLCAlLCAmLCAnLCAoLCApLCAqLCArLCAsLCAtLCAuLCAvLCA6LCA7LCA8LCA9LCA+LCA/LCBALCBbLCBcXCwgXSwgXiwgXywgYCwgeywgfCwgfSwgb3IgflxuXG4vLyAhISEhIERvbid0IGNvbmZ1c2Ugd2l0aCBcIk1hcmtkb3duIEFTQ0lJIFB1bmN0dWF0aW9uXCIgY2hhcnNcbi8vIGh0dHA6Ly9zcGVjLmNvbW1vbm1hcmsub3JnLzAuMTUvI2FzY2lpLXB1bmN0dWF0aW9uLWNoYXJhY3RlclxuZnVuY3Rpb24gaXNUZXJtaW5hdG9yQ2hhciAoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgwQS8qIFxcbiAqLzpcbiAgICBjYXNlIDB4MjEvKiAhICovOlxuICAgIGNhc2UgMHgyMy8qICMgKi86XG4gICAgY2FzZSAweDI0LyogJCAqLzpcbiAgICBjYXNlIDB4MjUvKiAlICovOlxuICAgIGNhc2UgMHgyNi8qICYgKi86XG4gICAgY2FzZSAweDJBLyogKiAqLzpcbiAgICBjYXNlIDB4MkIvKiArICovOlxuICAgIGNhc2UgMHgyRC8qIC0gKi86XG4gICAgY2FzZSAweDNBLyogOiAqLzpcbiAgICBjYXNlIDB4M0MvKiA8ICovOlxuICAgIGNhc2UgMHgzRC8qID0gKi86XG4gICAgY2FzZSAweDNFLyogPiAqLzpcbiAgICBjYXNlIDB4NDAvKiBAICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVDLyogXFwgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Ri8qIF8gKi86XG4gICAgY2FzZSAweDYwLyogYCAqLzpcbiAgICBjYXNlIDB4N0IvKiB7ICovOlxuICAgIGNhc2UgMHg3RC8qIH0gKi86XG4gICAgY2FzZSAweDdFLyogfiAqLzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRleHQgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvc1xuXG4gIHdoaWxlIChwb3MgPCBzdGF0ZS5wb3NNYXggJiYgIWlzVGVybWluYXRvckNoYXIoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSkpIHtcbiAgICBwb3MrK1xuICB9XG5cbiAgaWYgKHBvcyA9PT0gc3RhdGUucG9zKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhdGUucG9zLCBwb3MpIH1cblxuICBzdGF0ZS5wb3MgPSBwb3NcblxuICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBBbHRlcm5hdGl2ZSBpbXBsZW1lbnRhdGlvbiwgZm9yIG1lbW9yeS5cbi8vXG4vLyBJdCBjb3N0cyAxMCUgb2YgcGVyZm9ybWFuY2UsIGJ1dCBhbGxvd3MgZXh0ZW5kIHRlcm1pbmF0b3JzIGxpc3QsIGlmIHBsYWNlIGl0XG4vLyB0byBgUGFyc2VySW5saW5lYCBwcm9wZXJ0eS4gUHJvYmFibHksIHdpbGwgc3dpdGNoIHRvIGl0IHNvbWV0aW1lLCBzdWNoXG4vLyBmbGV4aWJpbGl0eSByZXF1aXJlZC5cblxuLypcbnZhciBURVJNSU5BVE9SX1JFID0gL1tcXG4hIyQlJiorXFwtOjw9PkBbXFxcXFxcXV5fYHt9fl0vO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRleHQoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG9zID0gc3RhdGUucG9zLFxuICAgICAgaWR4ID0gc3RhdGUuc3JjLnNsaWNlKHBvcykuc2VhcmNoKFRFUk1JTkFUT1JfUkUpO1xuXG4gIC8vIGZpcnN0IGNoYXIgaXMgdGVybWluYXRvciAtPiBlbXB0eSB0ZXh0XG4gIGlmIChpZHggPT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gbm8gdGVybWluYXRvciAtPiB0ZXh0IHRpbGwgZW5kIG9mIHN0cmluZ1xuICBpZiAoaWR4IDwgMCkge1xuICAgIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHBvcyk7IH1cbiAgICBzdGF0ZS5wb3MgPSBzdGF0ZS5zcmMubGVuZ3RoO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBwb3MgKyBpZHgpOyB9XG5cbiAgc3RhdGUucG9zICs9IGlkeDtcblxuICByZXR1cm4gdHJ1ZTtcbn07ICovXG4iLCAiLy8gUHJvY2VzcyBsaW5rcyBsaWtlIGh0dHBzOi8vZXhhbXBsZS5vcmcvXG5cbi8vIFJGQzM5ODY6IHNjaGVtZSA9IEFMUEhBICooIEFMUEhBIC8gRElHSVQgLyBcIitcIiAvIFwiLVwiIC8gXCIuXCIgKVxuY29uc3QgU0NIRU1FX1JFID0gLyg/Ol58W15hLXowLTkuKy1dKShbYS16XVthLXowLTkuKy1dKikkL2lcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGlua2lmeSAoc3RhdGUsIHNpbGVudCkge1xuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMubGlua2lmeSkgcmV0dXJuIGZhbHNlXG4gIGlmIChzdGF0ZS5saW5rTGV2ZWwgPiAwKSByZXR1cm4gZmFsc2VcblxuICBjb25zdCBwb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgaWYgKHBvcyArIDMgPiBtYXgpIHJldHVybiBmYWxzZVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQS8qIDogKi8pIHJldHVybiBmYWxzZVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSkgIT09IDB4MkYvKiAvICovKSByZXR1cm4gZmFsc2VcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDIpICE9PSAweDJGLyogLyAqLykgcmV0dXJuIGZhbHNlXG5cbiAgY29uc3QgbWF0Y2ggPSBzdGF0ZS5wZW5kaW5nLm1hdGNoKFNDSEVNRV9SRSlcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIGZhbHNlXG5cbiAgY29uc3QgcHJvdG8gPSBtYXRjaFsxXVxuXG4gIGNvbnN0IGxpbmsgPSBzdGF0ZS5tZC5saW5raWZ5Lm1hdGNoQXRTdGFydChzdGF0ZS5zcmMuc2xpY2UocG9zIC0gcHJvdG8ubGVuZ3RoKSlcbiAgaWYgKCFsaW5rKSByZXR1cm4gZmFsc2VcblxuICBsZXQgdXJsID0gbGluay51cmxcblxuICAvLyBpbnZhbGlkIGxpbmssIGJ1dCBzdGlsbCBkZXRlY3RlZCBieSBsaW5raWZ5IHNvbWVob3c7XG4gIC8vIG5lZWQgdG8gY2hlY2sgdG8gcHJldmVudCBpbmZpbml0ZSBsb29wIGJlbG93XG4gIGlmICh1cmwubGVuZ3RoIDw9IHByb3RvLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgLy8gZGlzYWxsb3cgJyonIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmsgKGNvbmZsaWN0cyB3aXRoIGVtcGhhc2lzKVxuICAvLyBkbyBtYW51YWwgYmFja3NlYXJjaCB0byBhdm9pZCBwZXJmIGlzc3VlcyB3aXRoIHJlZ2V4IC9cXCorJC8gb24gXCIqKioqLi4uKioqKmFcIi5cbiAgbGV0IHVybEVuZCA9IHVybC5sZW5ndGhcbiAgd2hpbGUgKHVybEVuZCA+IDAgJiYgdXJsLmNoYXJDb2RlQXQodXJsRW5kIC0gMSkgPT09IDB4MkEvKiAqICovKSB7XG4gICAgdXJsRW5kLS1cbiAgfVxuICBpZiAodXJsRW5kICE9PSB1cmwubGVuZ3RoKSB7XG4gICAgdXJsID0gdXJsLnNsaWNlKDAsIHVybEVuZClcbiAgfVxuXG4gIGNvbnN0IGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHVybClcbiAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHJldHVybiBmYWxzZVxuXG4gIGlmICghc2lsZW50KSB7XG4gICAgc3RhdGUucGVuZGluZyA9IHN0YXRlLnBlbmRpbmcuc2xpY2UoMCwgLXByb3RvLmxlbmd0aClcblxuICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpXG4gICAgdG9rZW5fby5hdHRycyA9IFtbJ2hyZWYnLCBmdWxsVXJsXV1cbiAgICB0b2tlbl9vLm1hcmt1cCA9ICdsaW5raWZ5J1xuICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJ1xuXG4gICAgY29uc3QgdG9rZW5fdCA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICB0b2tlbl90LmNvbnRlbnQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCh1cmwpXG5cbiAgICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpXG4gICAgdG9rZW5fYy5tYXJrdXAgPSAnbGlua2lmeSdcbiAgICB0b2tlbl9jLmluZm8gPSAnYXV0bydcbiAgfVxuXG4gIHN0YXRlLnBvcyArPSB1cmwubGVuZ3RoIC0gcHJvdG8ubGVuZ3RoXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gUHJvY2Vlc3MgJ1xcbidcblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG5ld2xpbmUgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvc1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDBBLyogXFxuICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3QgcG1heCA9IHN0YXRlLnBlbmRpbmcubGVuZ3RoIC0gMVxuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICAvLyAnICBcXG4nIC0+IGhhcmRicmVha1xuICAvLyBMb29rdXAgaW4gcGVuZGluZyBjaGFycyBpcyBiYWQgcHJhY3RpY2UhIERvbid0IGNvcHkgdG8gb3RoZXIgcnVsZXMhXG4gIC8vIFBlbmRpbmcgc3RyaW5nIGlzIHN0b3JlZCBpbiBjb25jYXQgbW9kZSwgaW5kZXhlZCBsb29rdXBzIHdpbGwgY2F1c2VcbiAgLy8gY29udmVydGlvbiB0byBmbGF0IG1vZGUuXG4gIGlmICghc2lsZW50KSB7XG4gICAgaWYgKHBtYXggPj0gMCAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCkgPT09IDB4MjApIHtcbiAgICAgIGlmIChwbWF4ID49IDEgJiYgc3RhdGUucGVuZGluZy5jaGFyQ29kZUF0KHBtYXggLSAxKSA9PT0gMHgyMCkge1xuICAgICAgICAvLyBGaW5kIHdoaXRlc3BhY2VzIHRhaWwgb2YgcGVuZGluZyBjaGFycy5cbiAgICAgICAgbGV0IHdzID0gcG1heCAtIDFcbiAgICAgICAgd2hpbGUgKHdzID49IDEgJiYgc3RhdGUucGVuZGluZy5jaGFyQ29kZUF0KHdzIC0gMSkgPT09IDB4MjApIHdzLS1cblxuICAgICAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5zbGljZSgwLCB3cylcbiAgICAgICAgc3RhdGUucHVzaCgnaGFyZGJyZWFrJywgJ2JyJywgMClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnBlbmRpbmcgPSBzdGF0ZS5wZW5kaW5nLnNsaWNlKDAsIC0xKVxuICAgICAgICBzdGF0ZS5wdXNoKCdzb2Z0YnJlYWsnLCAnYnInLCAwKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wdXNoKCdzb2Z0YnJlYWsnLCAnYnInLCAwKVxuICAgIH1cbiAgfVxuXG4gIHBvcysrXG5cbiAgLy8gc2tpcCBoZWFkaW5nIHNwYWNlcyBmb3IgbmV4dCBsaW5lXG4gIHdoaWxlIChwb3MgPCBtYXggJiYgaXNTcGFjZShzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpKSkgeyBwb3MrKyB9XG5cbiAgc3RhdGUucG9zID0gcG9zXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gUHJvY2VzcyBlc2NhcGVkIGNoYXJzIGFuZCBoYXJkYnJlYWtzXG5cbmltcG9ydCB7IGlzU3BhY2UgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5jb25zdCBFU0NBUEVEID0gW11cblxuZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykgeyBFU0NBUEVELnB1c2goMCkgfVxuXG4nXFxcXCFcIiMkJSZcXCcoKSorLC4vOjs8PT4/QFtdXl9ge3x9fi0nXG4gIC5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAoY2gpIHsgRVNDQVBFRFtjaC5jaGFyQ29kZUF0KDApXSA9IDEgfSlcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXNjYXBlIChzdGF0ZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4NUMvKiBcXCAqLykgcmV0dXJuIGZhbHNlXG4gIHBvcysrXG5cbiAgLy8gJ1xcJyBhdCB0aGUgZW5kIG9mIHRoZSBpbmxpbmUgYmxvY2tcbiAgaWYgKHBvcyA+PSBtYXgpIHJldHVybiBmYWxzZVxuXG4gIGxldCBjaDEgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgaWYgKGNoMSA9PT0gMHgwQSkge1xuICAgIGlmICghc2lsZW50KSB7XG4gICAgICBzdGF0ZS5wdXNoKCdoYXJkYnJlYWsnLCAnYnInLCAwKVxuICAgIH1cblxuICAgIHBvcysrXG4gICAgLy8gc2tpcCBsZWFkaW5nIHdoaXRlc3BhY2VzIGZyb20gbmV4dCBsaW5lXG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY2gxID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuICAgICAgaWYgKCFpc1NwYWNlKGNoMSkpIGJyZWFrXG4gICAgICBwb3MrK1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyA9IHBvc1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICAvLyAnXFwnIGJlZm9yZSBhIHNwYWNlIGlzIGEgbGl0ZXJhbCBiYWNrc2xhc2guIERvbid0IGNvbnN1bWUgdGhlIHNwYWNlLCBzbyBhXG4gIC8vIHRyYWlsaW5nIHR3by1zcGFjZSBoYXJkIGxpbmUgYnJlYWsgaXMgc3RpbGwgZGV0ZWN0ZWQgYnkgdGhlIG5ld2xpbmUgcnVsZS5cbiAgaWYgKGNoMSA9PT0gMHgyMCkge1xuICAgIGlmICghc2lsZW50KSB7XG4gICAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHRfc3BlY2lhbCcsICcnLCAwKVxuICAgICAgdG9rZW4uY29udGVudCA9ICdcXFxcJ1xuICAgICAgdG9rZW4ubWFya3VwID0gJ1xcXFwnXG4gICAgICB0b2tlbi5pbmZvID0gJ2VzY2FwZSdcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgPSBwb3NcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgbGV0IGVzY2FwZWRTdHIgPSBzdGF0ZS5zcmNbcG9zXVxuXG4gIGlmIChjaDEgPj0gMHhEODAwICYmIGNoMSA8PSAweERCRkYgJiYgcG9zICsgMSA8IG1heCkge1xuICAgIGNvbnN0IGNoMiA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpXG5cbiAgICBpZiAoY2gyID49IDB4REMwMCAmJiBjaDIgPD0gMHhERkZGKSB7XG4gICAgICBlc2NhcGVkU3RyICs9IHN0YXRlLnNyY1twb3MgKyAxXVxuICAgICAgcG9zKytcbiAgICB9XG4gIH1cblxuICBjb25zdCBvcmlnU3RyID0gJ1xcXFwnICsgZXNjYXBlZFN0clxuXG4gIGlmICghc2lsZW50KSB7XG4gICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0ZXh0X3NwZWNpYWwnLCAnJywgMClcblxuICAgIGlmIChjaDEgPCAyNTYgJiYgRVNDQVBFRFtjaDFdICE9PSAwKSB7XG4gICAgICB0b2tlbi5jb250ZW50ID0gZXNjYXBlZFN0clxuICAgIH0gZWxzZSB7XG4gICAgICB0b2tlbi5jb250ZW50ID0gb3JpZ1N0clxuICAgIH1cblxuICAgIHRva2VuLm1hcmt1cCA9IG9yaWdTdHJcbiAgICB0b2tlbi5pbmZvID0gJ2VzY2FwZSdcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvcyArIDFcbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBQYXJzZSBiYWNrdGlja3NcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYmFja3RpY2sgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICBpZiAoY2ggIT09IDB4NjAvKiBgICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3Qgc3RhcnQgPSBwb3NcbiAgcG9zKytcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgLy8gc2NhbiBtYXJrZXIgbGVuZ3RoXG4gIHdoaWxlIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg2MC8qIGAgKi8pIHsgcG9zKysgfVxuXG4gIGNvbnN0IG1hcmtlciA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKVxuICBjb25zdCBvcGVuZXJMZW5ndGggPSBtYXJrZXIubGVuZ3RoXG5cbiAgaWYgKHN0YXRlLmJhY2t0aWNrc1NjYW5uZWQgJiYgKHN0YXRlLmJhY2t0aWNrc1tvcGVuZXJMZW5ndGhdIHx8IDApIDw9IHN0YXJ0KSB7XG4gICAgaWYgKCFzaWxlbnQpIHN0YXRlLnBlbmRpbmcgKz0gbWFya2VyXG4gICAgc3RhdGUucG9zICs9IG9wZW5lckxlbmd0aFxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBsZXQgbWF0Y2hFbmQgPSBwb3NcbiAgbGV0IG1hdGNoU3RhcnRcblxuICAvLyBOb3RoaW5nIGZvdW5kIGluIHRoZSBjYWNoZSwgc2NhbiB1bnRpbCB0aGUgZW5kIG9mIHRoZSBsaW5lIChvciB1bnRpbCBtYXJrZXIgaXMgZm91bmQpXG4gIHdoaWxlICgobWF0Y2hTdGFydCA9IHN0YXRlLnNyYy5pbmRleE9mKCdgJywgbWF0Y2hFbmQpKSAhPT0gLTEpIHtcbiAgICBtYXRjaEVuZCA9IG1hdGNoU3RhcnQgKyAxXG5cbiAgICAvLyBzY2FuIG1hcmtlciBsZW5ndGhcbiAgICB3aGlsZSAobWF0Y2hFbmQgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQobWF0Y2hFbmQpID09PSAweDYwLyogYCAqLykgeyBtYXRjaEVuZCsrIH1cblxuICAgIGNvbnN0IGNsb3Nlckxlbmd0aCA9IG1hdGNoRW5kIC0gbWF0Y2hTdGFydFxuXG4gICAgaWYgKGNsb3Nlckxlbmd0aCA9PT0gb3BlbmVyTGVuZ3RoKSB7XG4gICAgICAvLyBGb3VuZCBtYXRjaGluZyBjbG9zZXIgbGVuZ3RoLlxuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdjb2RlX2lubGluZScsICdjb2RlJywgMClcbiAgICAgICAgdG9rZW4ubWFya3VwID0gbWFya2VyXG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXRjaFN0YXJ0KVxuICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgJyAnKVxuICAgICAgICAgIC5yZXBsYWNlKC9eICguKykgJC8sICckMScpXG4gICAgICB9XG4gICAgICBzdGF0ZS5wb3MgPSBtYXRjaEVuZFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBTb21lIGRpZmZlcmVudCBsZW5ndGggZm91bmQsIHB1dCBpdCBpbiBjYWNoZSBhcyB1cHBlciBsaW1pdCBvZiB3aGVyZSBjbG9zZXIgY2FuIGJlIGZvdW5kXG4gICAgc3RhdGUuYmFja3RpY2tzW2Nsb3Nlckxlbmd0aF0gPSBtYXRjaFN0YXJ0XG4gIH1cblxuICAvLyBTY2FubmVkIHRocm91Z2ggdGhlIGVuZCwgZGlkbid0IGZpbmQgYW55dGhpbmdcbiAgc3RhdGUuYmFja3RpY2tzU2Nhbm5lZCA9IHRydWVcblxuICBpZiAoIXNpbGVudCkgc3RhdGUucGVuZGluZyArPSBtYXJrZXJcbiAgc3RhdGUucG9zICs9IG9wZW5lckxlbmd0aFxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIH5+c3RyaWtlIHRocm91Z2h+flxuLy9cblxuLy8gSW5zZXJ0IGVhY2ggbWFya2VyIGFzIGEgc2VwYXJhdGUgdGV4dCB0b2tlbiwgYW5kIGFkZCBpdCB0byBkZWxpbWl0ZXIgbGlzdFxuLy9cbmZ1bmN0aW9uIHN0cmlrZXRocm91Z2hfdG9rZW5pemUgKHN0YXRlLCBzaWxlbnQpIHtcbiAgY29uc3Qgc3RhcnQgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpXG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChtYXJrZXIgIT09IDB4N0UvKiB+ICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3Qgc2Nhbm5lZCA9IHN0YXRlLnNjYW5EZWxpbXMoc3RhdGUucG9zLCB0cnVlKVxuICBsZXQgbGVuID0gc2Nhbm5lZC5sZW5ndGhcbiAgY29uc3QgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcilcblxuICBpZiAobGVuIDwgMikgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCB0b2tlblxuXG4gIGlmIChsZW4gJSAyKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0ZXh0JywgJycsIDApXG4gICAgdG9rZW4uY29udGVudCA9IGNoXG4gICAgbGVuLS1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICB0b2tlbi5jb250ZW50ID0gY2ggKyBjaFxuXG4gICAgc3RhdGUuZGVsaW1pdGVycy5wdXNoKHtcbiAgICAgIG1hcmtlcixcbiAgICAgIGxlbmd0aDogMCwgICAgIC8vIGRpc2FibGUgXCJydWxlIG9mIDNcIiBsZW5ndGggY2hlY2tzIG1lYW50IGZvciBlbXBoYXNpc1xuICAgICAgdG9rZW46IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxLFxuICAgICAgZW5kOiAtMSxcbiAgICAgIG9wZW46IHNjYW5uZWQuY2FuX29wZW4sXG4gICAgICBjbG9zZTogc2Nhbm5lZC5jYW5fY2xvc2VcbiAgICB9KVxuICB9XG5cbiAgc3RhdGUucG9zICs9IHNjYW5uZWQubGVuZ3RoXG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gcG9zdFByb2Nlc3MgKHN0YXRlLCBkZWxpbWl0ZXJzKSB7XG4gIGxldCB0b2tlblxuICBjb25zdCBsb25lTWFya2VycyA9IFtdXG4gIGNvbnN0IG1heCA9IGRlbGltaXRlcnMubGVuZ3RoXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXg7IGkrKykge1xuICAgIGNvbnN0IHN0YXJ0RGVsaW0gPSBkZWxpbWl0ZXJzW2ldXG5cbiAgICBpZiAoc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4N0UvKiB+ICovKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChzdGFydERlbGltLmVuZCA9PT0gLTEpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgY29uc3QgZW5kRGVsaW0gPSBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kXVxuXG4gICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbc3RhcnREZWxpbS50b2tlbl1cbiAgICB0b2tlbi50eXBlID0gJ3Nfb3BlbidcbiAgICB0b2tlbi50YWcgPSAncydcbiAgICB0b2tlbi5uZXN0aW5nID0gMVxuICAgIHRva2VuLm1hcmt1cCA9ICd+fidcbiAgICB0b2tlbi5jb250ZW50ID0gJydcblxuICAgIHRva2VuID0gc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuXVxuICAgIHRva2VuLnR5cGUgPSAnc19jbG9zZSdcbiAgICB0b2tlbi50YWcgPSAncydcbiAgICB0b2tlbi5uZXN0aW5nID0gLTFcbiAgICB0b2tlbi5tYXJrdXAgPSAnfn4nXG4gICAgdG9rZW4uY29udGVudCA9ICcnXG5cbiAgICBpZiAoc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuIC0gMV0udHlwZSA9PT0gJ3RleHQnICYmXG4gICAgICAgIHN0YXRlLnRva2Vuc1tlbmREZWxpbS50b2tlbiAtIDFdLmNvbnRlbnQgPT09ICd+Jykge1xuICAgICAgbG9uZU1hcmtlcnMucHVzaChlbmREZWxpbS50b2tlbiAtIDEpXG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYSBtYXJrZXIgc2VxdWVuY2UgaGFzIGFuIG9kZCBudW1iZXIgb2YgY2hhcmFjdGVycywgaXQncyBzcGxpdHRlZFxuICAvLyBsaWtlIHRoaXM6IGB+fn5+fmAgLT4gYH5gICsgYH5+YCArIGB+fmAsIGxlYXZpbmcgb25lIG1hcmtlciBhdCB0aGVcbiAgLy8gc3RhcnQgb2YgdGhlIHNlcXVlbmNlLlxuICAvL1xuICAvLyBTbywgd2UgaGF2ZSB0byBtb3ZlIGFsbCB0aG9zZSBtYXJrZXJzIGFmdGVyIHN1YnNlcXVlbnQgc19jbG9zZSB0YWdzLlxuICAvL1xuICB3aGlsZSAobG9uZU1hcmtlcnMubGVuZ3RoKSB7XG4gICAgY29uc3QgaSA9IGxvbmVNYXJrZXJzLnBvcCgpXG4gICAgbGV0IGogPSBpICsgMVxuXG4gICAgd2hpbGUgKGogPCBzdGF0ZS50b2tlbnMubGVuZ3RoICYmIHN0YXRlLnRva2Vuc1tqXS50eXBlID09PSAnc19jbG9zZScpIHtcbiAgICAgIGorK1xuICAgIH1cblxuICAgIGotLVxuXG4gICAgaWYgKGkgIT09IGopIHtcbiAgICAgIHRva2VuID0gc3RhdGUudG9rZW5zW2pdXG4gICAgICBzdGF0ZS50b2tlbnNbal0gPSBzdGF0ZS50b2tlbnNbaV1cbiAgICAgIHN0YXRlLnRva2Vuc1tpXSA9IHRva2VuXG4gICAgfVxuICB9XG59XG5cbi8vIFdhbGsgdGhyb3VnaCBkZWxpbWl0ZXIgbGlzdCBhbmQgcmVwbGFjZSB0ZXh0IHRva2VucyB3aXRoIHRhZ3Ncbi8vXG5mdW5jdGlvbiBzdHJpa2V0aHJvdWdoX3Bvc3RQcm9jZXNzIChzdGF0ZSkge1xuICBjb25zdCB0b2tlbnNfbWV0YSA9IHN0YXRlLnRva2Vuc19tZXRhXG4gIGNvbnN0IG1heCA9IHN0YXRlLnRva2Vuc19tZXRhLmxlbmd0aFxuXG4gIHBvc3RQcm9jZXNzKHN0YXRlLCBzdGF0ZS5kZWxpbWl0ZXJzKVxuXG4gIGZvciAobGV0IGN1cnIgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICBpZiAodG9rZW5zX21ldGFbY3Vycl0gJiYgdG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycykge1xuICAgICAgcG9zdFByb2Nlc3Moc3RhdGUsIHRva2Vuc19tZXRhW2N1cnJdLmRlbGltaXRlcnMpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdG9rZW5pemU6IHN0cmlrZXRocm91Z2hfdG9rZW5pemUsXG4gIHBvc3RQcm9jZXNzOiBzdHJpa2V0aHJvdWdoX3Bvc3RQcm9jZXNzXG59XG4iLCAiLy8gUHJvY2VzcyAqdGhpcyogYW5kIF90aGF0X1xuLy9cblxuLy8gSW5zZXJ0IGVhY2ggbWFya2VyIGFzIGEgc2VwYXJhdGUgdGV4dCB0b2tlbiwgYW5kIGFkZCBpdCB0byBkZWxpbWl0ZXIgbGlzdFxuLy9cbmZ1bmN0aW9uIGVtcGhhc2lzX3Rva2VuaXplIChzdGF0ZSwgc2lsZW50KSB7XG4gIGNvbnN0IHN0YXJ0ID0gc3RhdGUucG9zXG4gIGNvbnN0IG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KVxuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAobWFya2VyICE9PSAweDVGIC8qIF8gKi8gJiYgbWFya2VyICE9PSAweDJBIC8qICogKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBzY2FubmVkID0gc3RhdGUuc2NhbkRlbGltcyhzdGF0ZS5wb3MsIG1hcmtlciA9PT0gMHgyQSlcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNjYW5uZWQubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICB0b2tlbi5jb250ZW50ID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpXG5cbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgLy8gQ2hhciBjb2RlIG9mIHRoZSBzdGFydGluZyBtYXJrZXIgKG51bWJlcikuXG4gICAgICAvL1xuICAgICAgbWFya2VyLFxuXG4gICAgICAvLyBUb3RhbCBsZW5ndGggb2YgdGhlc2Ugc2VyaWVzIG9mIGRlbGltaXRlcnMuXG4gICAgICAvL1xuICAgICAgbGVuZ3RoOiBzY2FubmVkLmxlbmd0aCxcblxuICAgICAgLy8gQSBwb3NpdGlvbiBvZiB0aGUgdG9rZW4gdGhpcyBkZWxpbWl0ZXIgY29ycmVzcG9uZHMgdG8uXG4gICAgICAvL1xuICAgICAgdG9rZW46IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxLFxuXG4gICAgICAvLyBJZiB0aGlzIGRlbGltaXRlciBpcyBtYXRjaGVkIGFzIGEgdmFsaWQgb3BlbmVyLCBgZW5kYCB3aWxsIGJlXG4gICAgICAvLyBlcXVhbCB0byBpdHMgcG9zaXRpb24sIG90aGVyd2lzZSBpdCdzIGAtMWAuXG4gICAgICAvL1xuICAgICAgZW5kOiAtMSxcblxuICAgICAgLy8gQm9vbGVhbiBmbGFncyB0aGF0IGRldGVybWluZSBpZiB0aGlzIGRlbGltaXRlciBjb3VsZCBvcGVuIG9yIGNsb3NlXG4gICAgICAvLyBhbiBlbXBoYXNpcy5cbiAgICAgIC8vXG4gICAgICBvcGVuOiBzY2FubmVkLmNhbl9vcGVuLFxuICAgICAgY2xvc2U6IHNjYW5uZWQuY2FuX2Nsb3NlXG4gICAgfSlcbiAgfVxuXG4gIHN0YXRlLnBvcyArPSBzY2FubmVkLmxlbmd0aFxuXG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzIChzdGF0ZSwgZGVsaW1pdGVycykge1xuICBjb25zdCBtYXggPSBkZWxpbWl0ZXJzLmxlbmd0aFxuXG4gIGZvciAobGV0IGkgPSBtYXggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHN0YXJ0RGVsaW0gPSBkZWxpbWl0ZXJzW2ldXG5cbiAgICBpZiAoc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4NUYvKiBfICovICYmIHN0YXJ0RGVsaW0ubWFya2VyICE9PSAweDJBLyogKiAqLykge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIG9ubHkgb3BlbmluZyBtYXJrZXJzXG4gICAgaWYgKHN0YXJ0RGVsaW0uZW5kID09PSAtMSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBjb25zdCBlbmREZWxpbSA9IGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmRdXG5cbiAgICAvLyBJZiB0aGUgcHJldmlvdXMgZGVsaW1pdGVyIGhhcyB0aGUgc2FtZSBtYXJrZXIgYW5kIGlzIGFkamFjZW50IHRvIHRoaXMgb25lLFxuICAgIC8vIG1lcmdlIHRob3NlIGludG8gb25lIHN0cm9uZyBkZWxpbWl0ZXIuXG4gICAgLy9cbiAgICAvLyBgPGVtPjxlbT53aGF0ZXZlcjwvZW0+PC9lbT5gIC0+IGA8c3Ryb25nPndoYXRldmVyPC9zdHJvbmc+YFxuICAgIC8vXG4gICAgY29uc3QgaXNTdHJvbmcgPSBpID4gMCAmJlxuICAgICAgICAgICAgICAgZGVsaW1pdGVyc1tpIC0gMV0uZW5kID09PSBzdGFydERlbGltLmVuZCArIDEgJiZcbiAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoYXQgZmlyc3QgdHdvIG1hcmtlcnMgbWF0Y2ggYW5kIGFkamFjZW50XG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW2kgLSAxXS5tYXJrZXIgPT09IHN0YXJ0RGVsaW0ubWFya2VyICYmXG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW2kgLSAxXS50b2tlbiA9PT0gc3RhcnREZWxpbS50b2tlbiAtIDEgJiZcbiAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoYXQgbGFzdCB0d28gbWFya2VycyBhcmUgYWRqYWNlbnQgKHdlIGNhbiBzYWZlbHkgYXNzdW1lIHRoZXkgbWF0Y2gpXG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kICsgMV0udG9rZW4gPT09IGVuZERlbGltLnRva2VuICsgMVxuXG4gICAgY29uc3QgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHN0YXJ0RGVsaW0ubWFya2VyKVxuXG4gICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnRva2Vuc1tzdGFydERlbGltLnRva2VuXVxuICAgIHRva2VuX28udHlwZSA9IGlzU3Ryb25nID8gJ3N0cm9uZ19vcGVuJyA6ICdlbV9vcGVuJ1xuICAgIHRva2VuX28udGFnID0gaXNTdHJvbmcgPyAnc3Ryb25nJyA6ICdlbSdcbiAgICB0b2tlbl9vLm5lc3RpbmcgPSAxXG4gICAgdG9rZW5fby5tYXJrdXAgPSBpc1N0cm9uZyA/IGNoICsgY2ggOiBjaFxuICAgIHRva2VuX28uY29udGVudCA9ICcnXG5cbiAgICBjb25zdCB0b2tlbl9jID0gc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuXVxuICAgIHRva2VuX2MudHlwZSA9IGlzU3Ryb25nID8gJ3N0cm9uZ19jbG9zZScgOiAnZW1fY2xvc2UnXG4gICAgdG9rZW5fYy50YWcgPSBpc1N0cm9uZyA/ICdzdHJvbmcnIDogJ2VtJ1xuICAgIHRva2VuX2MubmVzdGluZyA9IC0xXG4gICAgdG9rZW5fYy5tYXJrdXAgPSBpc1N0cm9uZyA/IGNoICsgY2ggOiBjaFxuICAgIHRva2VuX2MuY29udGVudCA9ICcnXG5cbiAgICBpZiAoaXNTdHJvbmcpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tkZWxpbWl0ZXJzW2kgLSAxXS50b2tlbl0uY29udGVudCA9ICcnXG4gICAgICBzdGF0ZS50b2tlbnNbZGVsaW1pdGVyc1tzdGFydERlbGltLmVuZCArIDFdLnRva2VuXS5jb250ZW50ID0gJydcbiAgICAgIGktLVxuICAgIH1cbiAgfVxufVxuXG4vLyBXYWxrIHRocm91Z2ggZGVsaW1pdGVyIGxpc3QgYW5kIHJlcGxhY2UgdGV4dCB0b2tlbnMgd2l0aCB0YWdzXG4vL1xuZnVuY3Rpb24gZW1waGFzaXNfcG9zdF9wcm9jZXNzIChzdGF0ZSkge1xuICBjb25zdCB0b2tlbnNfbWV0YSA9IHN0YXRlLnRva2Vuc19tZXRhXG4gIGNvbnN0IG1heCA9IHN0YXRlLnRva2Vuc19tZXRhLmxlbmd0aFxuXG4gIHBvc3RQcm9jZXNzKHN0YXRlLCBzdGF0ZS5kZWxpbWl0ZXJzKVxuXG4gIGZvciAobGV0IGN1cnIgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICBpZiAodG9rZW5zX21ldGFbY3Vycl0gJiYgdG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycykge1xuICAgICAgcG9zdFByb2Nlc3Moc3RhdGUsIHRva2Vuc19tZXRhW2N1cnJdLmRlbGltaXRlcnMpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdG9rZW5pemU6IGVtcGhhc2lzX3Rva2VuaXplLFxuICBwb3N0UHJvY2VzczogZW1waGFzaXNfcG9zdF9wcm9jZXNzXG59XG4iLCAiLy8gUHJvY2VzcyBbbGlua10oPHRvPiBcInN0dWZmXCIpXG5cbmltcG9ydCB7IG5vcm1hbGl6ZVJlZmVyZW5jZSwgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxpbmsgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IGNvZGUsIGxhYmVsLCByZXMsIHJlZlxuICBsZXQgaHJlZiA9ICcnXG4gIGxldCB0aXRsZSA9ICcnXG4gIGxldCBzdGFydCA9IHN0YXRlLnBvc1xuICBsZXQgcGFyc2VSZWZlcmVuY2UgPSB0cnVlXG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgIT09IDB4NUIvKiBbICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3Qgb2xkUG9zID0gc3RhdGUucG9zXG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heFxuICBjb25zdCBsYWJlbFN0YXJ0ID0gc3RhdGUucG9zICsgMVxuICBjb25zdCBsYWJlbEVuZCA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXRlLnBvcywgdHJ1ZSlcblxuICAvLyBwYXJzZXIgZmFpbGVkIHRvIGZpbmQgJ10nLCBzbyBpdCdzIG5vdCBhIHZhbGlkIGxpbmtcbiAgaWYgKGxhYmVsRW5kIDwgMCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCBwb3MgPSBsYWJlbEVuZCArIDFcbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDI4LyogKCAqLykge1xuICAgIC8vXG4gICAgLy8gSW5saW5lIGxpbmtcbiAgICAvL1xuXG4gICAgLy8gbWlnaHQgaGF2ZSBmb3VuZCBhIHZhbGlkIHNob3J0Y3V0IGxpbmssIGRpc2FibGUgcmVmZXJlbmNlIHBhcnNpbmdcbiAgICBwYXJzZVJlZmVyZW5jZSA9IGZhbHNlXG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICBwb3MrK1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWsgfVxuICAgIH1cbiAgICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICBeXl5eXl4gcGFyc2luZyBsaW5rIGRlc3RpbmF0aW9uXG4gICAgc3RhcnQgPSBwb3NcbiAgICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0YXRlLnNyYywgcG9zLCBzdGF0ZS5wb3NNYXgpXG4gICAgaWYgKHJlcy5vaykge1xuICAgICAgaHJlZiA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsocmVzLnN0cilcbiAgICAgIGlmIChzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHtcbiAgICAgICAgcG9zID0gcmVzLnBvc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaHJlZiA9ICcnXG4gICAgICB9XG5cbiAgICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgICAvLyAgICAgICAgICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICAgIHN0YXJ0ID0gcG9zXG4gICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuICAgICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgICB9XG5cbiAgICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgICAvLyAgICAgICAgICAgICAgICAgIF5eXl5eXl4gcGFyc2luZyBsaW5rIHRpdGxlXG4gICAgICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua1RpdGxlKHN0YXRlLnNyYywgcG9zLCBzdGF0ZS5wb3NNYXgpXG4gICAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXJ0ICE9PSBwb3MgJiYgcmVzLm9rKSB7XG4gICAgICAgIHRpdGxlID0gcmVzLnN0clxuICAgICAgICBwb3MgPSByZXMucG9zXG5cbiAgICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcbiAgICAgICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zID49IG1heCB8fCBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI5LyogKSAqLykge1xuICAgICAgLy8gcGFyc2luZyBhIHZhbGlkIHNob3J0Y3V0IGxpbmsgZmFpbGVkLCBmYWxsYmFjayB0byByZWZlcmVuY2VcbiAgICAgIHBhcnNlUmVmZXJlbmNlID0gdHJ1ZVxuICAgIH1cbiAgICBwb3MrK1xuICB9XG5cbiAgaWYgKHBhcnNlUmVmZXJlbmNlKSB7XG4gICAgLy9cbiAgICAvLyBMaW5rIHJlZmVyZW5jZVxuICAgIC8vXG4gICAgaWYgKHR5cGVvZiBzdGF0ZS5lbnYucmVmZXJlbmNlcyA9PT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1Qi8qIFsgKi8pIHtcbiAgICAgIHN0YXJ0ID0gcG9zICsgMVxuICAgICAgcG9zID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgcG9zKVxuICAgICAgaWYgKHBvcyA+PSAwKSB7XG4gICAgICAgIGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MrKylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxhYmVsRW5kICsgMVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwb3MgPSBsYWJlbEVuZCArIDFcbiAgICB9XG5cbiAgICAvLyBjb3ZlcnMgbGFiZWwgPT09ICcnIGFuZCBsYWJlbCA9PT0gdW5kZWZpbmVkXG4gICAgLy8gKGNvbGxhcHNlZCByZWZlcmVuY2UgbGluayBhbmQgc2hvcnRjdXQgcmVmZXJlbmNlIGxpbmsgcmVzcGVjdGl2ZWx5KVxuICAgIGlmICghbGFiZWwpIHsgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2UobGFiZWxTdGFydCwgbGFiZWxFbmQpIH1cblxuICAgIHJlZiA9IHN0YXRlLmVudi5yZWZlcmVuY2VzW25vcm1hbGl6ZVJlZmVyZW5jZShsYWJlbCldXG4gICAgaWYgKCFyZWYpIHtcbiAgICAgIHN0YXRlLnBvcyA9IG9sZFBvc1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGhyZWYgPSByZWYuaHJlZlxuICAgIHRpdGxlID0gcmVmLnRpdGxlXG4gIH1cblxuICAvL1xuICAvLyBXZSBmb3VuZCB0aGUgZW5kIG9mIHRoZSBsaW5rLCBhbmQga25vdyBmb3IgYSBmYWN0IGl0J3MgYSB2YWxpZCBsaW5rO1xuICAvLyBzbyBhbGwgdGhhdCdzIGxlZnQgdG8gZG8gaXMgdG8gY2FsbCB0b2tlbml6ZXIuXG4gIC8vXG4gIGlmICghc2lsZW50KSB7XG4gICAgc3RhdGUucG9zID0gbGFiZWxTdGFydFxuICAgIHN0YXRlLnBvc01heCA9IGxhYmVsRW5kXG5cbiAgICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnbGlua19vcGVuJywgJ2EnLCAxKVxuICAgIGNvbnN0IGF0dHJzID0gW1snaHJlZicsIGhyZWZdXVxuICAgIHRva2VuX28uYXR0cnMgPSBhdHRyc1xuICAgIGlmICh0aXRsZSkge1xuICAgICAgYXR0cnMucHVzaChbJ3RpdGxlJywgdGl0bGVdKVxuICAgIH1cblxuICAgIHN0YXRlLmxpbmtMZXZlbCsrXG4gICAgc3RhdGUubWQuaW5saW5lLnRva2VuaXplKHN0YXRlKVxuICAgIHN0YXRlLmxpbmtMZXZlbC0tXG5cbiAgICBzdGF0ZS5wdXNoKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSlcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvc1xuICBzdGF0ZS5wb3NNYXggPSBtYXhcbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBQcm9jZXNzICFbaW1hZ2VdKDxzcmM+IFwidGl0bGVcIilcblxuaW1wb3J0IHsgbm9ybWFsaXplUmVmZXJlbmNlLCBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW1hZ2UgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IGNvZGUsIGNvbnRlbnQsIGxhYmVsLCBwb3MsIHJlZiwgcmVzLCB0aXRsZSwgc3RhcnRcbiAgbGV0IGhyZWYgPSAnJ1xuICBjb25zdCBvbGRQb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgIT09IDB4MjEvKiAhICovKSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MgKyAxKSAhPT0gMHg1Qi8qIFsgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBsYWJlbFN0YXJ0ID0gc3RhdGUucG9zICsgMlxuICBjb25zdCBsYWJlbEVuZCA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXRlLnBvcyArIDEsIGZhbHNlKVxuXG4gIC8vIHBhcnNlciBmYWlsZWQgdG8gZmluZCAnXScsIHNvIGl0J3Mgbm90IGEgdmFsaWQgbGlua1xuICBpZiAobGFiZWxFbmQgPCAwKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcG9zID0gbGFiZWxFbmQgKyAxXG4gIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyOC8qICggKi8pIHtcbiAgICAvL1xuICAgIC8vIElubGluZSBsaW5rXG4gICAgLy9cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHBvcysrXG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgIF5eXl5eXiBwYXJzaW5nIGxpbmsgZGVzdGluYXRpb25cbiAgICBzdGFydCA9IHBvc1xuICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heClcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKVxuICAgICAgaWYgKHN0YXRlLm1kLnZhbGlkYXRlTGluayhocmVmKSkge1xuICAgICAgICBwb3MgPSByZXMucG9zXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBocmVmID0gJydcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHN0YXJ0ID0gcG9zXG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICAgICAgICAgIF5eXl5eXl4gcGFyc2luZyBsaW5rIHRpdGxlXG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KVxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiByZXMub2spIHtcbiAgICAgIHRpdGxlID0gcmVzLnN0clxuICAgICAgcG9zID0gcmVzLnBvc1xuXG4gICAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuICAgICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpdGxlID0gJydcbiAgICB9XG5cbiAgICBpZiAocG9zID49IG1heCB8fCBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI5LyogKSAqLykge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcG9zKytcbiAgfSBlbHNlIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDVCLyogWyAqLykge1xuICAgICAgc3RhcnQgPSBwb3MgKyAxXG4gICAgICBwb3MgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBwb3MpXG4gICAgICBpZiAocG9zID49IDApIHtcbiAgICAgICAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcysrKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbGFiZWxFbmQgKyAxXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvcyA9IGxhYmVsRW5kICsgMVxuICAgIH1cblxuICAgIC8vIGNvdmVycyBsYWJlbCA9PT0gJycgYW5kIGxhYmVsID09PSB1bmRlZmluZWRcbiAgICAvLyAoY29sbGFwc2VkIHJlZmVyZW5jZSBsaW5rIGFuZCBzaG9ydGN1dCByZWZlcmVuY2UgbGluayByZXNwZWN0aXZlbHkpXG4gICAgaWYgKCFsYWJlbCkgeyBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCkgfVxuXG4gICAgcmVmID0gc3RhdGUuZW52LnJlZmVyZW5jZXNbbm9ybWFsaXplUmVmZXJlbmNlKGxhYmVsKV1cbiAgICBpZiAoIXJlZikge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaHJlZiA9IHJlZi5ocmVmXG4gICAgdGl0bGUgPSByZWYudGl0bGVcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBjb250ZW50ID0gc3RhdGUuc3JjLnNsaWNlKGxhYmVsU3RhcnQsIGxhYmVsRW5kKVxuXG4gICAgY29uc3QgdG9rZW5zID0gW11cbiAgICBzdGF0ZS5tZC5pbmxpbmUucGFyc2UoXG4gICAgICBjb250ZW50LFxuICAgICAgc3RhdGUubWQsXG4gICAgICBzdGF0ZS5lbnYsXG4gICAgICB0b2tlbnNcbiAgICApXG5cbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2ltYWdlJywgJ2ltZycsIDApXG4gICAgY29uc3QgYXR0cnMgPSBbWydzcmMnLCBocmVmXSwgWydhbHQnLCAnJ11dXG4gICAgdG9rZW4uYXR0cnMgPSBhdHRyc1xuICAgIHRva2VuLmNoaWxkcmVuID0gdG9rZW5zXG4gICAgdG9rZW4uY29udGVudCA9IGNvbnRlbnRcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgYXR0cnMucHVzaChbJ3RpdGxlJywgdGl0bGVdKVxuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvc1xuICBzdGF0ZS5wb3NNYXggPSBtYXhcbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBQcm9jZXNzIGF1dG9saW5rcyAnPHByb3RvY29sOi4uLj4nXG5cbi8qIGVzbGludCBtYXgtbGVuOjAgKi9cbmNvbnN0IEVNQUlMX1JFID0gL14oW2EtekEtWjAtOS4hIyQlJicqKy89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSopJC9cbi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4ICovXG5jb25zdCBBVVRPTElOS19SRSA9IC9eKFthLXpBLVpdW2EtekEtWjAtOSsuLV17MSwzMX0pOihbXjw+XFx4MDAtXFx4MjBdKikkL1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhdXRvbGluayAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zXG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3Qgc3RhcnQgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgZm9yICg7Oykge1xuICAgIGlmICgrK3BvcyA+PSBtYXgpIHJldHVybiBmYWxzZVxuXG4gICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgICBpZiAoY2ggPT09IDB4M0MgLyogPCAqLykgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGNoID09PSAweDNFIC8qID4gKi8pIGJyZWFrXG4gIH1cblxuICBjb25zdCB1cmwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQgKyAxLCBwb3MpXG5cbiAgaWYgKEFVVE9MSU5LX1JFLnRlc3QodXJsKSkge1xuICAgIGNvbnN0IGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHVybClcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpXG4gICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXVxuICAgICAgdG9rZW5fby5tYXJrdXAgPSAnYXV0b2xpbmsnXG4gICAgICB0b2tlbl9vLmluZm8gPSAnYXV0bydcblxuICAgICAgY29uc3QgdG9rZW5fdCA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICAgIHRva2VuX3QuY29udGVudCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KHVybClcblxuICAgICAgY29uc3QgdG9rZW5fYyA9IHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKVxuICAgICAgdG9rZW5fYy5tYXJrdXAgPSAnYXV0b2xpbmsnXG4gICAgICB0b2tlbl9jLmluZm8gPSAnYXV0bydcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgKz0gdXJsLmxlbmd0aCArIDJcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgaWYgKEVNQUlMX1JFLnRlc3QodXJsKSkge1xuICAgIGNvbnN0IGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKCdtYWlsdG86JyArIHVybClcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpXG4gICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXVxuICAgICAgdG9rZW5fby5tYXJrdXAgPSAnYXV0b2xpbmsnXG4gICAgICB0b2tlbl9vLmluZm8gPSAnYXV0bydcblxuICAgICAgY29uc3QgdG9rZW5fdCA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICAgIHRva2VuX3QuY29udGVudCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KHVybClcblxuICAgICAgY29uc3QgdG9rZW5fYyA9IHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKVxuICAgICAgdG9rZW5fYy5tYXJrdXAgPSAnYXV0b2xpbmsnXG4gICAgICB0b2tlbl9jLmluZm8gPSAnYXV0bydcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgKz0gdXJsLmxlbmd0aCArIDJcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG4iLCAiLy8gUHJvY2VzcyBodG1sIHRhZ3NcblxuaW1wb3J0IHsgSFRNTF9UQUdfUkUgfSBmcm9tICcuLi9jb21tb24vaHRtbF9yZS5tanMnXG5cbmZ1bmN0aW9uIGlzTGlua09wZW4gKHN0cikge1xuICByZXR1cm4gL148YVs+XFxzXS9pLnRlc3Qoc3RyKVxufVxuZnVuY3Rpb24gaXNMaW5rQ2xvc2UgKHN0cikge1xuICByZXR1cm4gL148XFwvYVxccyo+L2kudGVzdChzdHIpXG59XG5cbmZ1bmN0aW9uIGlzTGV0dGVyIChjaCkge1xuICAvKiBlc2xpbnQgbm8tYml0d2lzZTowICovXG4gIGNvbnN0IGxjID0gY2ggfCAweDIwIC8vIHRvIGxvd2VyIGNhc2VcbiAgcmV0dXJuIChsYyA+PSAweDYxLyogYSAqLykgJiYgKGxjIDw9IDB4N2EvKiB6ICovKVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBodG1sX2lubGluZSAoc3RhdGUsIHNpbGVudCkge1xuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMuaHRtbCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIENoZWNrIHN0YXJ0XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heFxuICBjb25zdCBwb3MgPSBzdGF0ZS5wb3NcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovIHx8XG4gICAgICBwb3MgKyAyID49IG1heCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gUXVpY2sgZmFpbCBvbiBzZWNvbmQgY2hhclxuICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpXG4gIGlmIChjaCAhPT0gMHgyMS8qICEgKi8gJiZcbiAgICAgIGNoICE9PSAweDNGLyogPyAqLyAmJlxuICAgICAgY2ggIT09IDB4MkYvKiAvICovICYmXG4gICAgICAhaXNMZXR0ZXIoY2gpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBjb25zdCBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKEhUTUxfVEFHX1JFKVxuICBpZiAoIW1hdGNoKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2h0bWxfaW5saW5lJywgJycsIDApXG4gICAgdG9rZW4uY29udGVudCA9IG1hdGNoWzBdXG5cbiAgICBpZiAoaXNMaW5rT3Blbih0b2tlbi5jb250ZW50KSkgc3RhdGUubGlua0xldmVsKytcbiAgICBpZiAoaXNMaW5rQ2xvc2UodG9rZW4uY29udGVudCkpIHN0YXRlLmxpbmtMZXZlbC0tXG4gIH1cbiAgc3RhdGUucG9zICs9IG1hdGNoWzBdLmxlbmd0aFxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIFByb2Nlc3MgaHRtbCBlbnRpdHkgLSAmIzEyMzssICYjeEFGOywgJnF1b3Q7LCAuLi5cblxuaW1wb3J0IHsgZGVjb2RlSFRNTFN0cmljdCB9IGZyb20gJ2VudGl0aWVzJ1xuaW1wb3J0IHsgaXNWYWxpZEVudGl0eUNvZGUsIGZyb21Db2RlUG9pbnQgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5jb25zdCBESUdJVEFMX1JFID0gL14mIygoPzp4W2EtZjAtOV17MSw2fXxbMC05XXsxLDd9KSk7L2lcbmNvbnN0IE5BTUVEX1JFID0gL14mKFthLXpdW2EtejAtOV17MSwzMX0pOy9pXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGVudGl0eSAoc3RhdGUsIHNpbGVudCkge1xuICBjb25zdCBwb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MjYvKiAmICovKSByZXR1cm4gZmFsc2VcblxuICBpZiAocG9zICsgMSA+PSBtYXgpIHJldHVybiBmYWxzZVxuXG4gIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSlcblxuICBpZiAoY2ggPT09IDB4MjMgLyogIyAqLykge1xuICAgIGNvbnN0IG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcykubWF0Y2goRElHSVRBTF9SRSlcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBtYXRjaFsxXVswXS50b0xvd2VyQ2FzZSgpID09PSAneCcgPyBwYXJzZUludChtYXRjaFsxXS5zbGljZSgxKSwgMTYpIDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKVxuXG4gICAgICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgndGV4dF9zcGVjaWFsJywgJycsIDApXG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSBpc1ZhbGlkRW50aXR5Q29kZShjb2RlKSA/IGZyb21Db2RlUG9pbnQoY29kZSkgOiBmcm9tQ29kZVBvaW50KDB4RkZGRClcbiAgICAgICAgdG9rZW4ubWFya3VwID0gbWF0Y2hbMF1cbiAgICAgICAgdG9rZW4uaW5mbyA9ICdlbnRpdHknXG4gICAgICB9XG4gICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKE5BTUVEX1JFKVxuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgZGVjb2RlZCA9IGRlY29kZUhUTUxTdHJpY3QobWF0Y2hbMF0pXG4gICAgICBpZiAoZGVjb2RlZCAhPT0gbWF0Y2hbMF0pIHtcbiAgICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHRfc3BlY2lhbCcsICcnLCAwKVxuICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSBkZWNvZGVkXG4gICAgICAgICAgdG9rZW4ubWFya3VwID0gbWF0Y2hbMF1cbiAgICAgICAgICB0b2tlbi5pbmZvID0gJ2VudGl0eSdcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG4iLCAiLy8gRm9yIGVhY2ggb3BlbmluZyBlbXBoYXNpcy1saWtlIG1hcmtlciBmaW5kIGEgbWF0Y2hpbmcgY2xvc2luZyBvbmVcbi8vXG5cbmZ1bmN0aW9uIHByb2Nlc3NEZWxpbWl0ZXJzIChkZWxpbWl0ZXJzKSB7XG4gIGNvbnN0IG9wZW5lcnNCb3R0b20gPSB7fVxuICBjb25zdCBtYXggPSBkZWxpbWl0ZXJzLmxlbmd0aFxuXG4gIGlmICghbWF4KSByZXR1cm5cblxuICAvLyBoZWFkZXJJZHggaXMgdGhlIGZpcnN0IGRlbGltaXRlciBvZiB0aGUgY3VycmVudCAod2hlcmUgY2xvc2VyIGlzKSBkZWxpbWl0ZXIgcnVuXG4gIGxldCBoZWFkZXJJZHggPSAwXG4gIGxldCBsYXN0VG9rZW5JZHggPSAtMiAvLyBuZWVkcyBhbnkgdmFsdWUgbG93ZXIgdGhhbiAtMVxuICBjb25zdCBqdW1wcyA9IFtdXG5cbiAgZm9yIChsZXQgY2xvc2VySWR4ID0gMDsgY2xvc2VySWR4IDwgbWF4OyBjbG9zZXJJZHgrKykge1xuICAgIGNvbnN0IGNsb3NlciA9IGRlbGltaXRlcnNbY2xvc2VySWR4XVxuXG4gICAganVtcHMucHVzaCgwKVxuXG4gICAgLy8gbWFya2VycyBiZWxvbmcgdG8gc2FtZSBkZWxpbWl0ZXIgcnVuIGlmOlxuICAgIC8vICAtIHRoZXkgaGF2ZSBhZGphY2VudCB0b2tlbnNcbiAgICAvLyAgLSBBTkQgbWFya2VycyBhcmUgdGhlIHNhbWVcbiAgICAvL1xuICAgIGlmIChkZWxpbWl0ZXJzW2hlYWRlcklkeF0ubWFya2VyICE9PSBjbG9zZXIubWFya2VyIHx8IGxhc3RUb2tlbklkeCAhPT0gY2xvc2VyLnRva2VuIC0gMSkge1xuICAgICAgaGVhZGVySWR4ID0gY2xvc2VySWR4XG4gICAgfVxuXG4gICAgbGFzdFRva2VuSWR4ID0gY2xvc2VyLnRva2VuXG5cbiAgICAvLyBMZW5ndGggaXMgb25seSB1c2VkIGZvciBlbXBoYXNpcy1zcGVjaWZpYyBcInJ1bGUgb2YgM1wiLFxuICAgIC8vIGlmIGl0J3Mgbm90IGRlZmluZWQgKGluIHN0cmlrZXRocm91Z2ggb3IgM3JkIHBhcnR5IHBsdWdpbnMpLFxuICAgIC8vIHdlIGNhbiBkZWZhdWx0IGl0IHRvIDAgdG8gZGlzYWJsZSB0aG9zZSBjaGVja3MuXG4gICAgLy9cbiAgICBjbG9zZXIubGVuZ3RoID0gY2xvc2VyLmxlbmd0aCB8fCAwXG5cbiAgICBpZiAoIWNsb3Nlci5jbG9zZSkgY29udGludWVcblxuICAgIC8vIFByZXZpb3VzbHkgY2FsY3VsYXRlZCBsb3dlciBib3VuZHMgKHByZXZpb3VzIGZhaWxzKVxuICAgIC8vIGZvciBlYWNoIG1hcmtlciwgZWFjaCBkZWxpbWl0ZXIgbGVuZ3RoIG1vZHVsbyAzLFxuICAgIC8vIGFuZCBmb3Igd2hldGhlciB0aGlzIGNsb3NlciBjYW4gYmUgYW4gb3BlbmVyO1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jb21tb25tYXJrL2NtYXJrL2NvbW1pdC8zNDI1MGUxMmNjZWJkYzYzNzJiOGI0OWM0NGZhYjU3YzcyNDQzNDYwXG4gICAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGlucyAqL1xuICAgIGlmICghb3BlbmVyc0JvdHRvbS5oYXNPd25Qcm9wZXJ0eShjbG9zZXIubWFya2VyKSkge1xuICAgICAgb3BlbmVyc0JvdHRvbVtjbG9zZXIubWFya2VyXSA9IFstMSwgLTEsIC0xLCAtMSwgLTEsIC0xXVxuICAgIH1cblxuICAgIGNvbnN0IG1pbk9wZW5lcklkeCA9IG9wZW5lcnNCb3R0b21bY2xvc2VyLm1hcmtlcl1bKGNsb3Nlci5vcGVuID8gMyA6IDApICsgKGNsb3Nlci5sZW5ndGggJSAzKV1cblxuICAgIGxldCBvcGVuZXJJZHggPSBoZWFkZXJJZHggLSBqdW1wc1toZWFkZXJJZHhdIC0gMVxuXG4gICAgbGV0IG5ld01pbk9wZW5lcklkeCA9IG9wZW5lcklkeFxuXG4gICAgZm9yICg7IG9wZW5lcklkeCA+IG1pbk9wZW5lcklkeDsgb3BlbmVySWR4IC09IGp1bXBzW29wZW5lcklkeF0gKyAxKSB7XG4gICAgICBjb25zdCBvcGVuZXIgPSBkZWxpbWl0ZXJzW29wZW5lcklkeF1cblxuICAgICAgaWYgKG9wZW5lci5tYXJrZXIgIT09IGNsb3Nlci5tYXJrZXIpIGNvbnRpbnVlXG5cbiAgICAgIGlmIChvcGVuZXIub3BlbiAmJiBvcGVuZXIuZW5kIDwgMCkge1xuICAgICAgICBsZXQgaXNPZGRNYXRjaCA9IGZhbHNlXG5cbiAgICAgICAgLy8gZnJvbSBzcGVjOlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiBvbmUgb2YgdGhlIGRlbGltaXRlcnMgY2FuIGJvdGggb3BlbiBhbmQgY2xvc2UgZW1waGFzaXMsIHRoZW4gdGhlXG4gICAgICAgIC8vIHN1bSBvZiB0aGUgbGVuZ3RocyBvZiB0aGUgZGVsaW1pdGVyIHJ1bnMgY29udGFpbmluZyB0aGUgb3BlbmluZyBhbmRcbiAgICAgICAgLy8gY2xvc2luZyBkZWxpbWl0ZXJzIG11c3Qgbm90IGJlIGEgbXVsdGlwbGUgb2YgMyB1bmxlc3MgYm90aCBsZW5ndGhzXG4gICAgICAgIC8vIGFyZSBtdWx0aXBsZXMgb2YgMy5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKG9wZW5lci5jbG9zZSB8fCBjbG9zZXIub3Blbikge1xuICAgICAgICAgIGlmICgob3BlbmVyLmxlbmd0aCArIGNsb3Nlci5sZW5ndGgpICUgMyA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKG9wZW5lci5sZW5ndGggJSAzICE9PSAwIHx8IGNsb3Nlci5sZW5ndGggJSAzICE9PSAwKSB7XG4gICAgICAgICAgICAgIGlzT2RkTWF0Y2ggPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc09kZE1hdGNoKSB7XG4gICAgICAgICAgLy8gSWYgcHJldmlvdXMgZGVsaW1pdGVyIGNhbm5vdCBiZSBhbiBvcGVuZXIsIHdlIGNhbiBzYWZlbHkgc2tpcFxuICAgICAgICAgIC8vIHRoZSBlbnRpcmUgc2VxdWVuY2UgaW4gZnV0dXJlIGNoZWNrcy4gVGhpcyBpcyByZXF1aXJlZCB0byBtYWtlXG4gICAgICAgICAgLy8gc3VyZSBhbGdvcml0aG0gaGFzIGxpbmVhciBjb21wbGV4aXR5IChzZWUgKl8qXypfKl8qXy4uLiBjYXNlKS5cbiAgICAgICAgICAvL1xuICAgICAgICAgIGNvbnN0IGxhc3RKdW1wID0gb3BlbmVySWR4ID4gMCAmJiAhZGVsaW1pdGVyc1tvcGVuZXJJZHggLSAxXS5vcGVuXG4gICAgICAgICAgICA/IGp1bXBzW29wZW5lcklkeCAtIDFdICsgMVxuICAgICAgICAgICAgOiAwXG5cbiAgICAgICAgICBqdW1wc1tjbG9zZXJJZHhdID0gY2xvc2VySWR4IC0gb3BlbmVySWR4ICsgbGFzdEp1bXBcbiAgICAgICAgICBqdW1wc1tvcGVuZXJJZHhdID0gbGFzdEp1bXBcblxuICAgICAgICAgIGNsb3Nlci5vcGVuID0gZmFsc2VcbiAgICAgICAgICBvcGVuZXIuZW5kID0gY2xvc2VySWR4XG4gICAgICAgICAgb3BlbmVyLmNsb3NlID0gZmFsc2VcbiAgICAgICAgICBuZXdNaW5PcGVuZXJJZHggPSAtMVxuICAgICAgICAgIC8vIHRyZWF0IG5leHQgdG9rZW4gYXMgc3RhcnQgb2YgcnVuLFxuICAgICAgICAgIC8vIGl0IG9wdGltaXplcyBza2lwcyBpbiAqKjwuLi4+KiphKio8Li4uPioqIHBhdGhvbG9naWNhbCBjYXNlXG4gICAgICAgICAgbGFzdFRva2VuSWR4ID0gLTJcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5ld01pbk9wZW5lcklkeCAhPT0gLTEpIHtcbiAgICAgIC8vIElmIG1hdGNoIGZvciB0aGlzIGRlbGltaXRlciBydW4gZmFpbGVkLCB3ZSB3YW50IHRvIHNldCBsb3dlciBib3VuZCBmb3JcbiAgICAgIC8vIGZ1dHVyZSBsb29rdXBzLiBUaGlzIGlzIHJlcXVpcmVkIHRvIG1ha2Ugc3VyZSBhbGdvcml0aG0gaGFzIGxpbmVhclxuICAgICAgLy8gY29tcGxleGl0eS5cbiAgICAgIC8vXG4gICAgICAvLyBTZWUgZGV0YWlscyBoZXJlOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvbW1vbm1hcmsvY21hcmsvaXNzdWVzLzE3OCNpc3N1ZWNvbW1lbnQtMjcwNDE3NDQyXG4gICAgICAvL1xuICAgICAgb3BlbmVyc0JvdHRvbVtjbG9zZXIubWFya2VyXVsoY2xvc2VyLm9wZW4gPyAzIDogMCkgKyAoKGNsb3Nlci5sZW5ndGggfHwgMCkgJSAzKV0gPSBuZXdNaW5PcGVuZXJJZHhcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGlua19wYWlycyAoc3RhdGUpIHtcbiAgY29uc3QgdG9rZW5zX21ldGEgPSBzdGF0ZS50b2tlbnNfbWV0YVxuICBjb25zdCBtYXggPSBzdGF0ZS50b2tlbnNfbWV0YS5sZW5ndGhcblxuICBwcm9jZXNzRGVsaW1pdGVycyhzdGF0ZS5kZWxpbWl0ZXJzKVxuXG4gIGZvciAobGV0IGN1cnIgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICBpZiAodG9rZW5zX21ldGFbY3Vycl0gJiYgdG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycykge1xuICAgICAgcHJvY2Vzc0RlbGltaXRlcnModG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycylcbiAgICB9XG4gIH1cbn1cbiIsICIvLyBDbGVhbiB1cCB0b2tlbnMgYWZ0ZXIgZW1waGFzaXMgYW5kIHN0cmlrZXRocm91Z2ggcG9zdHByb2Nlc3Npbmc6XG4vLyBtZXJnZSBhZGphY2VudCB0ZXh0IG5vZGVzIGludG8gb25lIGFuZCByZS1jYWxjdWxhdGUgYWxsIHRva2VuIGxldmVsc1xuLy9cbi8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgaW5pdGlhbGx5IGVtcGhhc2lzIGRlbGltaXRlciBtYXJrZXJzICgqLCBfLCB+KVxuLy8gYXJlIHRyZWF0ZWQgYXMgdGhlaXIgb3duIHNlcGFyYXRlIHRleHQgdG9rZW5zLiBUaGVuIGVtcGhhc2lzIHJ1bGUgZWl0aGVyXG4vLyBsZWF2ZXMgdGhlbSBhcyB0ZXh0IChuZWVkZWQgdG8gbWVyZ2Ugd2l0aCBhZGphY2VudCB0ZXh0KSBvciB0dXJucyB0aGVtXG4vLyBpbnRvIG9wZW5pbmcvY2xvc2luZyB0YWdzICh3aGljaCBtZXNzZXMgdXAgbGV2ZWxzIGluc2lkZSkuXG4vL1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmcmFnbWVudHNfam9pbiAoc3RhdGUpIHtcbiAgbGV0IGN1cnIsIGxhc3RcbiAgbGV0IGxldmVsID0gMFxuICBjb25zdCB0b2tlbnMgPSBzdGF0ZS50b2tlbnNcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zLmxlbmd0aFxuXG4gIGZvciAoY3VyciA9IGxhc3QgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICAvLyByZS1jYWxjdWxhdGUgbGV2ZWxzIGFmdGVyIGVtcGhhc2lzL3N0cmlrZXRocm91Z2ggdHVybnMgc29tZSB0ZXh0IG5vZGVzXG4gICAgLy8gaW50byBvcGVuaW5nL2Nsb3NpbmcgdGFnc1xuICAgIGlmICh0b2tlbnNbY3Vycl0ubmVzdGluZyA8IDApIGxldmVsLS0gLy8gY2xvc2luZyB0YWdcbiAgICB0b2tlbnNbY3Vycl0ubGV2ZWwgPSBsZXZlbFxuICAgIGlmICh0b2tlbnNbY3Vycl0ubmVzdGluZyA+IDApIGxldmVsKysgLy8gb3BlbmluZyB0YWdcblxuICAgIGlmICh0b2tlbnNbY3Vycl0udHlwZSA9PT0gJ3RleHQnICYmXG4gICAgICAgIGN1cnIgKyAxIDwgbWF4ICYmXG4gICAgICAgIHRva2Vuc1tjdXJyICsgMV0udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAvLyBjb2xsYXBzZSB0d28gYWRqYWNlbnQgdGV4dCBub2Rlc1xuICAgICAgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50ID0gdG9rZW5zW2N1cnJdLmNvbnRlbnQgKyB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnRcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGN1cnIgIT09IGxhc3QpIHsgdG9rZW5zW2xhc3RdID0gdG9rZW5zW2N1cnJdIH1cblxuICAgICAgbGFzdCsrXG4gICAgfVxuICB9XG5cbiAgaWYgKGN1cnIgIT09IGxhc3QpIHtcbiAgICB0b2tlbnMubGVuZ3RoID0gbGFzdFxuICB9XG59XG4iLCAiLyoqIGludGVybmFsXG4gKiBjbGFzcyBQYXJzZXJJbmxpbmVcbiAqXG4gKiBUb2tlbml6ZXMgcGFyYWdyYXBoIGNvbnRlbnQuXG4gKiovXG5cbmltcG9ydCBSdWxlciBmcm9tICcuL3J1bGVyLm1qcydcbmltcG9ydCBTdGF0ZUlubGluZSBmcm9tICcuL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUubWpzJ1xuXG5pbXBvcnQgcl90ZXh0IGZyb20gJy4vcnVsZXNfaW5saW5lL3RleHQubWpzJ1xuaW1wb3J0IHJfbGlua2lmeSBmcm9tICcuL3J1bGVzX2lubGluZS9saW5raWZ5Lm1qcydcbmltcG9ydCByX25ld2xpbmUgZnJvbSAnLi9ydWxlc19pbmxpbmUvbmV3bGluZS5tanMnXG5pbXBvcnQgcl9lc2NhcGUgZnJvbSAnLi9ydWxlc19pbmxpbmUvZXNjYXBlLm1qcydcbmltcG9ydCByX2JhY2t0aWNrcyBmcm9tICcuL3J1bGVzX2lubGluZS9iYWNrdGlja3MubWpzJ1xuaW1wb3J0IHJfc3RyaWtldGhyb3VnaCBmcm9tICcuL3J1bGVzX2lubGluZS9zdHJpa2V0aHJvdWdoLm1qcydcbmltcG9ydCByX2VtcGhhc2lzIGZyb20gJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzLm1qcydcbmltcG9ydCByX2xpbmsgZnJvbSAnLi9ydWxlc19pbmxpbmUvbGluay5tanMnXG5pbXBvcnQgcl9pbWFnZSBmcm9tICcuL3J1bGVzX2lubGluZS9pbWFnZS5tanMnXG5pbXBvcnQgcl9hdXRvbGluayBmcm9tICcuL3J1bGVzX2lubGluZS9hdXRvbGluay5tanMnXG5pbXBvcnQgcl9odG1sX2lubGluZSBmcm9tICcuL3J1bGVzX2lubGluZS9odG1sX2lubGluZS5tanMnXG5pbXBvcnQgcl9lbnRpdHkgZnJvbSAnLi9ydWxlc19pbmxpbmUvZW50aXR5Lm1qcydcblxuaW1wb3J0IHJfYmFsYW5jZV9wYWlycyBmcm9tICcuL3J1bGVzX2lubGluZS9iYWxhbmNlX3BhaXJzLm1qcydcbmltcG9ydCByX2ZyYWdtZW50c19qb2luIGZyb20gJy4vcnVsZXNfaW5saW5lL2ZyYWdtZW50c19qb2luLm1qcydcblxuLy8gUGFyc2VyIHJ1bGVzXG5cbmNvbnN0IF9ydWxlcyA9IFtcbiAgWyd0ZXh0Jywgcl90ZXh0XSxcbiAgWydsaW5raWZ5Jywgcl9saW5raWZ5XSxcbiAgWyduZXdsaW5lJywgcl9uZXdsaW5lXSxcbiAgWydlc2NhcGUnLCByX2VzY2FwZV0sXG4gIFsnYmFja3RpY2tzJywgcl9iYWNrdGlja3NdLFxuICBbJ3N0cmlrZXRocm91Z2gnLCByX3N0cmlrZXRocm91Z2gudG9rZW5pemVdLFxuICBbJ2VtcGhhc2lzJywgcl9lbXBoYXNpcy50b2tlbml6ZV0sXG4gIFsnbGluaycsIHJfbGlua10sXG4gIFsnaW1hZ2UnLCByX2ltYWdlXSxcbiAgWydhdXRvbGluaycsIHJfYXV0b2xpbmtdLFxuICBbJ2h0bWxfaW5saW5lJywgcl9odG1sX2lubGluZV0sXG4gIFsnZW50aXR5Jywgcl9lbnRpdHldXG5dXG5cbi8vIGBydWxlMmAgcnVsZXNldCB3YXMgY3JlYXRlZCBzcGVjaWZpY2FsbHkgZm9yIGVtcGhhc2lzL3N0cmlrZXRocm91Z2hcbi8vIHBvc3QtcHJvY2Vzc2luZyBhbmQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbi8vXG4vLyBEb24ndCB1c2UgdGhpcyBmb3IgYW55dGhpbmcgZXhjZXB0IHBhaXJzIChwbHVnaW5zIHdvcmtpbmcgd2l0aCBgYmFsYW5jZV9wYWlyc2ApLlxuLy9cbmNvbnN0IF9ydWxlczIgPSBbXG4gIFsnYmFsYW5jZV9wYWlycycsIHJfYmFsYW5jZV9wYWlyc10sXG4gIFsnc3RyaWtldGhyb3VnaCcsIHJfc3RyaWtldGhyb3VnaC5wb3N0UHJvY2Vzc10sXG4gIFsnZW1waGFzaXMnLCByX2VtcGhhc2lzLnBvc3RQcm9jZXNzXSxcbiAgLy8gcnVsZXMgZm9yIHBhaXJzIHNlcGFyYXRlICcqKicgaW50byBpdHMgb3duIHRleHQgdG9rZW5zLCB3aGljaCBtYXkgYmUgbGVmdCB1bnVzZWQsXG4gIC8vIHJ1bGUgYmVsb3cgbWVyZ2VzIHVudXNlZCBzZWdtZW50cyBiYWNrIHdpdGggdGhlIHJlc3Qgb2YgdGhlIHRleHRcbiAgWydmcmFnbWVudHNfam9pbicsIHJfZnJhZ21lbnRzX2pvaW5dXG5dXG5cbi8qKlxuICogbmV3IFBhcnNlcklubGluZSgpXG4gKiovXG5mdW5jdGlvbiBQYXJzZXJJbmxpbmUgKCkge1xuICAvKipcbiAgICogUGFyc2VySW5saW5lI3J1bGVyIC0+IFJ1bGVyXG4gICAqXG4gICAqIFtbUnVsZXJdXSBpbnN0YW5jZS4gS2VlcCBjb25maWd1cmF0aW9uIG9mIGlubGluZSBydWxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVyID0gbmV3IFJ1bGVyKClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSlcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZXJJbmxpbmUjcnVsZXIyIC0+IFJ1bGVyXG4gICAqXG4gICAqIFtbUnVsZXJdXSBpbnN0YW5jZS4gU2Vjb25kIHJ1bGVyIHVzZWQgZm9yIHBvc3QtcHJvY2Vzc2luZ1xuICAgKiAoZS5nLiBpbiBlbXBoYXNpcy1saWtlIHJ1bGVzKS5cbiAgICoqL1xuICB0aGlzLnJ1bGVyMiA9IG5ldyBSdWxlcigpXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBfcnVsZXMyLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlcjIucHVzaChfcnVsZXMyW2ldWzBdLCBfcnVsZXMyW2ldWzFdKVxuICB9XG59XG5cbi8vIFNraXAgc2luZ2xlIHRva2VuIGJ5IHJ1bm5pbmcgYWxsIHJ1bGVzIGluIHZhbGlkYXRpb24gbW9kZTtcbi8vIHJldHVybnMgYHRydWVgIGlmIGFueSBydWxlIHJlcG9ydGVkIHN1Y2Nlc3Ncbi8vXG5QYXJzZXJJbmxpbmUucHJvdG90eXBlLnNraXBUb2tlbiA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICBjb25zdCBwb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKVxuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGhcbiAgY29uc3QgbWF4TmVzdGluZyA9IHN0YXRlLm1kLm9wdGlvbnMubWF4TmVzdGluZ1xuICBjb25zdCBjYWNoZSA9IHN0YXRlLmNhY2hlXG5cbiAgaWYgKHR5cGVvZiBjYWNoZVtwb3NdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLnBvcyA9IGNhY2hlW3Bvc11cbiAgICByZXR1cm5cbiAgfVxuXG4gIGxldCBvayA9IGZhbHNlXG5cbiAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIC8vIEluY3JlbWVudCBzdGF0ZS5sZXZlbCBhbmQgZGVjcmVtZW50IGl0IGxhdGVyIHRvIGxpbWl0IHJlY3Vyc2lvbi5cbiAgICAgIC8vIEl0J3MgaGFybWxlc3MgdG8gZG8gaGVyZSwgYmVjYXVzZSBubyB0b2tlbnMgYXJlIGNyZWF0ZWQuIEJ1dCBpZGVhbGx5LFxuICAgICAgLy8gd2UnZCBuZWVkIGEgc2VwYXJhdGUgcHJpdmF0ZSBzdGF0ZSB2YXJpYWJsZSBmb3IgdGhpcyBwdXJwb3NlLlxuICAgICAgLy9cbiAgICAgIHN0YXRlLmxldmVsKytcbiAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIHRydWUpXG4gICAgICBzdGF0ZS5sZXZlbC0tXG5cbiAgICAgIGlmIChvaykge1xuICAgICAgICBpZiAocG9zID49IHN0YXRlLnBvcykgeyB0aHJvdyBuZXcgRXJyb3IoXCJpbmxpbmUgcnVsZSBkaWRuJ3QgaW5jcmVtZW50IHN0YXRlLnBvc1wiKSB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRvbyBtdWNoIG5lc3RpbmcsIGp1c3Qgc2tpcCB1bnRpbCB0aGUgZW5kIG9mIHRoZSBwYXJhZ3JhcGguXG4gICAgLy9cbiAgICAvLyBOT1RFOiB0aGlzIHdpbGwgY2F1c2UgbGlua3MgdG8gYmVoYXZlIGluY29ycmVjdGx5IGluIHRoZSBmb2xsb3dpbmcgY2FzZSxcbiAgICAvLyAgICAgICB3aGVuIGFuIGFtb3VudCBvZiBgW2AgaXMgZXhhY3RseSBlcXVhbCB0byBgbWF4TmVzdGluZyArIDFgOlxuICAgIC8vXG4gICAgLy8gICAgICAgW1tbW1tbW1tbW1tbW1tbW1tbW1tbZm9vXSgpXG4gICAgLy9cbiAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gQ00gc3RhbmRhcmQgd2lsbCBhbGxvdyBuZXN0ZWQgbGlua3NcbiAgICAvLyAgICAgICAod2UgY2FuIHJlcGxhY2UgaXQgYnkgcHJldmVudGluZyBsaW5rcyBmcm9tIGJlaW5nIHBhcnNlZCBpblxuICAgIC8vICAgICAgIHZhbGlkYXRpb24gbW9kZSlcbiAgICAvL1xuICAgIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heFxuICB9XG5cbiAgaWYgKCFvaykgeyBzdGF0ZS5wb3MrKyB9XG4gIGNhY2hlW3Bvc10gPSBzdGF0ZS5wb3Ncbn1cblxuLy8gR2VuZXJhdGUgdG9rZW5zIGZvciBpbnB1dCByYW5nZVxuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKVxuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGhcbiAgY29uc3QgZW5kID0gc3RhdGUucG9zTWF4XG4gIGNvbnN0IG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3RpbmdcblxuICB3aGlsZSAoc3RhdGUucG9zIDwgZW5kKSB7XG4gICAgLy8gVHJ5IGFsbCBwb3NzaWJsZSBydWxlcy5cbiAgICAvLyBPbiBzdWNjZXNzLCBydWxlIHNob3VsZDpcbiAgICAvL1xuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS5wb3NgXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnRva2Vuc2BcbiAgICAvLyAtIHJldHVybiB0cnVlXG4gICAgY29uc3QgcHJldlBvcyA9IHN0YXRlLnBvc1xuICAgIGxldCBvayA9IGZhbHNlXG5cbiAgICBpZiAoc3RhdGUubGV2ZWwgPCBtYXhOZXN0aW5nKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIGZhbHNlKVxuICAgICAgICBpZiAob2spIHtcbiAgICAgICAgICBpZiAocHJldlBvcyA+PSBzdGF0ZS5wb3MpIHsgdGhyb3cgbmV3IEVycm9yKFwiaW5saW5lIHJ1bGUgZGlkbid0IGluY3JlbWVudCBzdGF0ZS5wb3NcIikgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob2spIHtcbiAgICAgIGlmIChzdGF0ZS5wb3MgPj0gZW5kKSB7IGJyZWFrIH1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmNbc3RhdGUucG9zKytdXG4gIH1cblxuICBpZiAoc3RhdGUucGVuZGluZykge1xuICAgIHN0YXRlLnB1c2hQZW5kaW5nKClcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlcklubGluZS5wYXJzZShzdHIsIG1kLCBlbnYsIG91dFRva2VucylcbiAqXG4gKiBQcm9jZXNzIGlucHV0IHN0cmluZyBhbmQgcHVzaCBpbmxpbmUgdG9rZW5zIGludG8gYG91dFRva2Vuc2BcbiAqKi9cblBhcnNlcklubGluZS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpIHtcbiAgY29uc3Qgc3RhdGUgPSBuZXcgdGhpcy5TdGF0ZShzdHIsIG1kLCBlbnYsIG91dFRva2VucylcblxuICB0aGlzLnRva2VuaXplKHN0YXRlKVxuXG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlcjIuZ2V0UnVsZXMoJycpXG4gIGNvbnN0IGxlbiA9IHJ1bGVzLmxlbmd0aFxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBydWxlc1tpXShzdGF0ZSlcbiAgfVxufVxuXG5QYXJzZXJJbmxpbmUucHJvdG90eXBlLlN0YXRlID0gU3RhdGVJbmxpbmVcblxuZXhwb3J0IGRlZmF1bHQgUGFyc2VySW5saW5lXG4iLCAiLy8gbWFya2Rvd24taXQgZGVmYXVsdCBvcHRpb25zXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgb3B0aW9uczoge1xuICAgIC8vIEVuYWJsZSBIVE1MIHRhZ3MgaW4gc291cmNlXG4gICAgaHRtbDogZmFsc2UsXG5cbiAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgeGh0bWxPdXQ6IGZhbHNlLFxuXG4gICAgLy8gQ29udmVydCAnXFxuJyBpbiBwYXJhZ3JhcGhzIGludG8gPGJyPlxuICAgIGJyZWFrczogZmFsc2UsXG5cbiAgICAvLyBDU1MgbGFuZ3VhZ2UgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzXG4gICAgbGFuZ1ByZWZpeDogJ2xhbmd1YWdlLScsXG5cbiAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuICAgIGxpbmtpZnk6IGZhbHNlLFxuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogZmFsc2UsXG5cbiAgICAvLyBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50IHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQsXG4gICAgLy8gYW5kIHNtYXJ0cXVvdGVzIG9uLiBDb3VsZCBiZSBlaXRoZXIgYSBTdHJpbmcgb3IgYW4gQXJyYXkuXG4gICAgLy9cbiAgICAvLyBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgJ8KrwrvigJ7igJwnIGZvciBSdXNzaWFuLCAn4oCe4oCc4oCa4oCYJyBmb3IgR2VybWFuLFxuICAgIC8vIGFuZCBbJ8KrXFx4QTAnLCAnXFx4QTDCuycsICfigLlcXHhBMCcsICdcXHhBMOKAuiddIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAgICBxdW90ZXM6ICdcXHUyMDFjXFx1MjAxZFxcdTIwMThcXHUyMDE5JywgLyog4oCc4oCd4oCY4oCZICovXG5cbiAgICAvLyBIaWdobGlnaHRlciBmdW5jdGlvbi4gU2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwsXG4gICAgLy8gb3IgJycgaWYgdGhlIHNvdXJjZSBzdHJpbmcgaXMgbm90IGNoYW5nZWQgYW5kIHNob3VsZCBiZSBlc2NhcGVkIGV4dGVybmFseS5cbiAgICAvLyBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiAoLypzdHIsIGxhbmcqLykgeyByZXR1cm4gJyc7IH1cbiAgICAvL1xuICAgIGhpZ2hsaWdodDogbnVsbCxcblxuICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICAgIG1heE5lc3Rpbmc6IDEwMFxuICB9LFxuXG4gIGNvbXBvbmVudHM6IHtcbiAgICBjb3JlOiB7fSxcbiAgICBibG9jazoge30sXG4gICAgaW5saW5lOiB7fVxuICB9XG59XG4iLCAiLy8gXCJaZXJvXCIgcHJlc2V0LCB3aXRoIG5vdGhpbmcgZW5hYmxlZC4gVXNlZnVsIGZvciBtYW51YWwgY29uZmlndXJpbmcgb2Ygc2ltcGxlXG4vLyBtb2Rlcy4gRm9yIGV4YW1wbGUsIHRvIHBhcnNlIGJvbGQvaXRhbGljIG9ubHkuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgb3B0aW9uczoge1xuICAgIC8vIEVuYWJsZSBIVE1MIHRhZ3MgaW4gc291cmNlXG4gICAgaHRtbDogZmFsc2UsXG5cbiAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgeGh0bWxPdXQ6IGZhbHNlLFxuXG4gICAgLy8gQ29udmVydCAnXFxuJyBpbiBwYXJhZ3JhcGhzIGludG8gPGJyPlxuICAgIGJyZWFrczogZmFsc2UsXG5cbiAgICAvLyBDU1MgbGFuZ3VhZ2UgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzXG4gICAgbGFuZ1ByZWZpeDogJ2xhbmd1YWdlLScsXG5cbiAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuICAgIGxpbmtpZnk6IGZhbHNlLFxuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogZmFsc2UsXG5cbiAgICAvLyBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50IHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQsXG4gICAgLy8gYW5kIHNtYXJ0cXVvdGVzIG9uLiBDb3VsZCBiZSBlaXRoZXIgYSBTdHJpbmcgb3IgYW4gQXJyYXkuXG4gICAgLy9cbiAgICAvLyBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgJ8KrwrvigJ7igJwnIGZvciBSdXNzaWFuLCAn4oCe4oCc4oCa4oCYJyBmb3IgR2VybWFuLFxuICAgIC8vIGFuZCBbJ8KrXFx4QTAnLCAnXFx4QTDCuycsICfigLlcXHhBMCcsICdcXHhBMOKAuiddIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAgICBxdW90ZXM6ICdcXHUyMDFjXFx1MjAxZFxcdTIwMThcXHUyMDE5JywgLyog4oCc4oCd4oCY4oCZICovXG5cbiAgICAvLyBIaWdobGlnaHRlciBmdW5jdGlvbi4gU2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwsXG4gICAgLy8gb3IgJycgaWYgdGhlIHNvdXJjZSBzdHJpbmcgaXMgbm90IGNoYW5nZWQgYW5kIHNob3VsZCBiZSBlc2NhcGVkIGV4dGVybmFseS5cbiAgICAvLyBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiAoLypzdHIsIGxhbmcqLykgeyByZXR1cm4gJyc7IH1cbiAgICAvL1xuICAgIGhpZ2hsaWdodDogbnVsbCxcblxuICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICAgIG1heE5lc3Rpbmc6IDIwXG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnLFxuICAgICAgICAndGV4dF9qb2luJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ3BhcmFncmFwaCdcbiAgICAgIF1cbiAgICB9LFxuXG4gICAgaW5saW5lOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAndGV4dCdcbiAgICAgIF0sXG4gICAgICBydWxlczI6IFtcbiAgICAgICAgJ2JhbGFuY2VfcGFpcnMnLFxuICAgICAgICAnZnJhZ21lbnRzX2pvaW4nXG4gICAgICBdXG4gICAgfVxuICB9XG59XG4iLCAiLy8gQ29tbW9ubWFyayBkZWZhdWx0IG9wdGlvbnNcblxuZXhwb3J0IGRlZmF1bHQge1xuICBvcHRpb25zOiB7XG4gICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICBodG1sOiB0cnVlLFxuXG4gICAgLy8gVXNlICcvJyB0byBjbG9zZSBzaW5nbGUgdGFncyAoPGJyIC8+KVxuICAgIHhodG1sT3V0OiB0cnVlLFxuXG4gICAgLy8gQ29udmVydCAnXFxuJyBpbiBwYXJhZ3JhcGhzIGludG8gPGJyPlxuICAgIGJyZWFrczogZmFsc2UsXG5cbiAgICAvLyBDU1MgbGFuZ3VhZ2UgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzXG4gICAgbGFuZ1ByZWZpeDogJ2xhbmd1YWdlLScsXG5cbiAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuICAgIGxpbmtpZnk6IGZhbHNlLFxuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogZmFsc2UsXG5cbiAgICAvLyBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50IHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQsXG4gICAgLy8gYW5kIHNtYXJ0cXVvdGVzIG9uLiBDb3VsZCBiZSBlaXRoZXIgYSBTdHJpbmcgb3IgYW4gQXJyYXkuXG4gICAgLy9cbiAgICAvLyBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgJ8KrwrvigJ7igJwnIGZvciBSdXNzaWFuLCAn4oCe4oCc4oCa4oCYJyBmb3IgR2VybWFuLFxuICAgIC8vIGFuZCBbJ8KrXFx4QTAnLCAnXFx4QTDCuycsICfigLlcXHhBMCcsICdcXHhBMOKAuiddIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAgICBxdW90ZXM6ICdcXHUyMDFjXFx1MjAxZFxcdTIwMThcXHUyMDE5JywgLyog4oCc4oCd4oCY4oCZICovXG5cbiAgICAvLyBIaWdobGlnaHRlciBmdW5jdGlvbi4gU2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwsXG4gICAgLy8gb3IgJycgaWYgdGhlIHNvdXJjZSBzdHJpbmcgaXMgbm90IGNoYW5nZWQgYW5kIHNob3VsZCBiZSBlc2NhcGVkIGV4dGVybmFseS5cbiAgICAvLyBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiAoLypzdHIsIGxhbmcqLykgeyByZXR1cm4gJyc7IH1cbiAgICAvL1xuICAgIGhpZ2hsaWdodDogbnVsbCxcblxuICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICAgIG1heE5lc3Rpbmc6IDIwXG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnLFxuICAgICAgICAndGV4dF9qb2luJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2Jsb2NrcXVvdGUnLFxuICAgICAgICAnY29kZScsXG4gICAgICAgICdmZW5jZScsXG4gICAgICAgICdoZWFkaW5nJyxcbiAgICAgICAgJ2hyJyxcbiAgICAgICAgJ2h0bWxfYmxvY2snLFxuICAgICAgICAnbGhlYWRpbmcnLFxuICAgICAgICAnbGlzdCcsXG4gICAgICAgICdyZWZlcmVuY2UnLFxuICAgICAgICAncGFyYWdyYXBoJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBpbmxpbmU6IHtcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgICdhdXRvbGluaycsXG4gICAgICAgICdiYWNrdGlja3MnLFxuICAgICAgICAnZW1waGFzaXMnLFxuICAgICAgICAnZW50aXR5JyxcbiAgICAgICAgJ2VzY2FwZScsXG4gICAgICAgICdodG1sX2lubGluZScsXG4gICAgICAgICdpbWFnZScsXG4gICAgICAgICdsaW5rJyxcbiAgICAgICAgJ25ld2xpbmUnLFxuICAgICAgICAndGV4dCdcbiAgICAgIF0sXG4gICAgICBydWxlczI6IFtcbiAgICAgICAgJ2JhbGFuY2VfcGFpcnMnLFxuICAgICAgICAnZW1waGFzaXMnLFxuICAgICAgICAnZnJhZ21lbnRzX2pvaW4nXG4gICAgICBdXG4gICAgfVxuICB9XG59XG4iLCAiLy8gTWFpbiBwYXJzZXIgY2xhc3NcblxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi9jb21tb24vdXRpbHMubWpzJ1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMvaW5kZXgubWpzJ1xuaW1wb3J0IFJlbmRlcmVyIGZyb20gJy4vcmVuZGVyZXIubWpzJ1xuaW1wb3J0IFBhcnNlckNvcmUgZnJvbSAnLi9wYXJzZXJfY29yZS5tanMnXG5pbXBvcnQgUGFyc2VyQmxvY2sgZnJvbSAnLi9wYXJzZXJfYmxvY2subWpzJ1xuaW1wb3J0IFBhcnNlcklubGluZSBmcm9tICcuL3BhcnNlcl9pbmxpbmUubWpzJ1xuaW1wb3J0IExpbmtpZnlJdCBmcm9tICdsaW5raWZ5LWl0J1xuaW1wb3J0ICogYXMgbWR1cmwgZnJvbSAnbWR1cmwnXG5pbXBvcnQgcHVueWNvZGUgZnJvbSAncHVueWNvZGUuanMnXG5cbmltcG9ydCBjZmdfZGVmYXVsdCBmcm9tICcuL3ByZXNldHMvZGVmYXVsdC5tanMnXG5pbXBvcnQgY2ZnX3plcm8gZnJvbSAnLi9wcmVzZXRzL3plcm8ubWpzJ1xuaW1wb3J0IGNmZ19jb21tb25tYXJrIGZyb20gJy4vcHJlc2V0cy9jb21tb25tYXJrLm1qcydcblxuY29uc3QgY29uZmlnID0ge1xuICBkZWZhdWx0OiBjZmdfZGVmYXVsdCxcbiAgemVybzogY2ZnX3plcm8sXG4gIGNvbW1vbm1hcms6IGNmZ19jb21tb25tYXJrXG59XG5cbi8vXG4vLyBUaGlzIHZhbGlkYXRvciBjYW4gcHJvaGliaXQgbW9yZSB0aGFuIHJlYWxseSBuZWVkZWQgdG8gcHJldmVudCBYU1MuIEl0J3MgYVxuLy8gdHJhZGVvZmYgdG8ga2VlcCBjb2RlIHNpbXBsZSBhbmQgdG8gYmUgc2VjdXJlIGJ5IGRlZmF1bHQuXG4vL1xuLy8gSWYgeW91IG5lZWQgZGlmZmVyZW50IHNldHVwIC0gb3ZlcnJpZGUgdmFsaWRhdG9yIG1ldGhvZCBhcyB5b3Ugd2lzaC4gT3Jcbi8vIHJlcGxhY2UgaXQgd2l0aCBkdW1teSBmdW5jdGlvbiBhbmQgdXNlIGV4dGVybmFsIHNhbml0aXplci5cbi8vXG5cbmNvbnN0IEJBRF9QUk9UT19SRSA9IC9eKHZic2NyaXB0fGphdmFzY3JpcHR8ZmlsZXxkYXRhKTovXG5jb25zdCBHT09EX0RBVEFfUkUgPSAvXmRhdGE6aW1hZ2VcXC8oZ2lmfHBuZ3xqcGVnfHdlYnApOy9cblxuZnVuY3Rpb24gdmFsaWRhdGVMaW5rICh1cmwpIHtcbiAgLy8gdXJsIHNob3VsZCBiZSBub3JtYWxpemVkIGF0IHRoaXMgcG9pbnQsIGFuZCBleGlzdGluZyBlbnRpdGllcyBhcmUgZGVjb2RlZFxuICBjb25zdCBzdHIgPSB1cmwudHJpbSgpLnRvTG93ZXJDYXNlKClcblxuICByZXR1cm4gQkFEX1BST1RPX1JFLnRlc3Qoc3RyKSA/IEdPT0RfREFUQV9SRS50ZXN0KHN0cikgOiB0cnVlXG59XG5cbmNvbnN0IFJFQ09ERV9IT1NUTkFNRV9GT1IgPSBbJ2h0dHA6JywgJ2h0dHBzOicsICdtYWlsdG86J11cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluayAodXJsKSB7XG4gIGNvbnN0IHBhcnNlZCA9IG1kdXJsLnBhcnNlKHVybCwgdHJ1ZSlcblxuICBpZiAocGFyc2VkLmhvc3RuYW1lKSB7XG4gICAgLy8gRW5jb2RlIGhvc3RuYW1lcyBpbiB1cmxzIGxpa2U6XG4gICAgLy8gYGh0dHA6Ly9ob3N0L2AsIGBodHRwczovL2hvc3QvYCwgYG1haWx0bzp1c2VyQGhvc3RgLCBgLy9ob3N0L2BcbiAgICAvL1xuICAgIC8vIFdlIGRvbid0IGVuY29kZSB1bmtub3duIHNjaGVtYXMsIGJlY2F1c2UgaXQncyBsaWtlbHkgdGhhdCB3ZSBlbmNvZGVcbiAgICAvLyBzb21ldGhpbmcgd2Ugc2hvdWxkbid0IChlLmcuIGBza3lwZTpuYW1lYCB0cmVhdGVkIGFzIGBza3lwZTpob3N0YClcbiAgICAvL1xuICAgIGlmICghcGFyc2VkLnByb3RvY29sIHx8IFJFQ09ERV9IT1NUTkFNRV9GT1IuaW5kZXhPZihwYXJzZWQucHJvdG9jb2wpID49IDApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhcnNlZC5ob3N0bmFtZSA9IHB1bnljb2RlLnRvQVNDSUkocGFyc2VkLmhvc3RuYW1lKVxuICAgICAgfSBjYXRjaCAoZXIpIHsgLyoqLyB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1kdXJsLmVuY29kZShtZHVybC5mb3JtYXQocGFyc2VkKSlcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGlua1RleHQgKHVybCkge1xuICBjb25zdCBwYXJzZWQgPSBtZHVybC5wYXJzZSh1cmwsIHRydWUpXG5cbiAgaWYgKHBhcnNlZC5ob3N0bmFtZSkge1xuICAgIC8vIEVuY29kZSBob3N0bmFtZXMgaW4gdXJscyBsaWtlOlxuICAgIC8vIGBodHRwOi8vaG9zdC9gLCBgaHR0cHM6Ly9ob3N0L2AsIGBtYWlsdG86dXNlckBob3N0YCwgYC8vaG9zdC9gXG4gICAgLy9cbiAgICAvLyBXZSBkb24ndCBlbmNvZGUgdW5rbm93biBzY2hlbWFzLCBiZWNhdXNlIGl0J3MgbGlrZWx5IHRoYXQgd2UgZW5jb2RlXG4gICAgLy8gc29tZXRoaW5nIHdlIHNob3VsZG4ndCAoZS5nLiBgc2t5cGU6bmFtZWAgdHJlYXRlZCBhcyBgc2t5cGU6aG9zdGApXG4gICAgLy9cbiAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCB8fCBSRUNPREVfSE9TVE5BTUVfRk9SLmluZGV4T2YocGFyc2VkLnByb3RvY29sKSA+PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBwYXJzZWQuaG9zdG5hbWUgPSBwdW55Y29kZS50b1VuaWNvZGUocGFyc2VkLmhvc3RuYW1lKVxuICAgICAgfSBjYXRjaCAoZXIpIHsgLyoqLyB9XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkICclJyB0byBleGNsdWRlIGxpc3QgYmVjYXVzZSBvZiBodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvaXNzdWVzLzcyMFxuICByZXR1cm4gbWR1cmwuZGVjb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpLCBtZHVybC5kZWNvZGUuZGVmYXVsdENoYXJzICsgJyUnKVxufVxuXG4vKipcbiAqIGNsYXNzIE1hcmtkb3duSXRcbiAqXG4gKiBNYWluIHBhcnNlci9yZW5kZXJlciBjbGFzcy5cbiAqXG4gKiAjIyMjIyBVc2FnZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIG5vZGUuanMsIFwiY2xhc3NpY1wiIHdheTpcbiAqIHZhciBNYXJrZG93bkl0ID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSxcbiAqICAgICBtZCA9IG5ldyBNYXJrZG93bkl0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBub2RlLmpzLCB0aGUgc2FtZSwgYnV0IHdpdGggc3VnYXI6XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBicm93c2VyIHdpdGhvdXQgQU1ELCBhZGRlZCB0byBcIndpbmRvd1wiIG9uIHNjcmlwdCBsb2FkXG4gKiAvLyBOb3RlLCB0aGVyZSBhcmUgbm8gZGFzaC5cbiAqIHZhciBtZCA9IHdpbmRvdy5tYXJrZG93bml0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqIGBgYFxuICpcbiAqIFNpbmdsZSBsaW5lIHJlbmRlcmluZywgd2l0aG91dCBwYXJhZ3JhcGggd3JhcDpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVySW5saW5lKCdfX21hcmtkb3duLWl0X18gcnVsZXp6IScpO1xuICogYGBgXG4gKiovXG5cbi8qKlxuICogbmV3IE1hcmtkb3duSXQoW3ByZXNldE5hbWUsIG9wdGlvbnNdKVxuICogLSBwcmVzZXROYW1lIChTdHJpbmcpOiBvcHRpb25hbCwgYGNvbW1vbm1hcmtgIC8gYHplcm9gXG4gKiAtIG9wdGlvbnMgKE9iamVjdClcbiAqXG4gKiBDcmVhdGVzIHBhcnNlciBpbnN0YW5zZSB3aXRoIGdpdmVuIGNvbmZpZy4gQ2FuIGJlIGNhbGxlZCB3aXRob3V0IGBuZXdgLlxuICpcbiAqICMjIyMjIHByZXNldE5hbWVcbiAqXG4gKiBNYXJrZG93bkl0IHByb3ZpZGVzIG5hbWVkIHByZXNldHMgYXMgYSBjb252ZW5pZW5jZSB0byBxdWlja2x5XG4gKiBlbmFibGUvZGlzYWJsZSBhY3RpdmUgc3ludGF4IHJ1bGVzIGFuZCBvcHRpb25zIGZvciBjb21tb24gdXNlIGNhc2VzLlxuICpcbiAqIC0gW1wiY29tbW9ubWFya1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvY29tbW9ubWFyay5tanMpIC1cbiAqICAgY29uZmlndXJlcyBwYXJzZXIgdG8gc3RyaWN0IFtDb21tb25NYXJrXShodHRwOi8vY29tbW9ubWFyay5vcmcvKSBtb2RlLlxuICogLSBbZGVmYXVsdF0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9wcmVzZXRzL2RlZmF1bHQubWpzKSAtXG4gKiAgIHNpbWlsYXIgdG8gR0ZNLCB1c2VkIHdoZW4gbm8gcHJlc2V0IG5hbWUgZ2l2ZW4uIEVuYWJsZXMgYWxsIGF2YWlsYWJsZSBydWxlcyxcbiAqICAgYnV0IHN0aWxsIHdpdGhvdXQgaHRtbCwgdHlwb2dyYXBoZXIgJiBhdXRvbGlua2VyLlxuICogLSBbXCJ6ZXJvXCJdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcHJlc2V0cy96ZXJvLm1qcykgLVxuICogICBhbGwgcnVsZXMgZGlzYWJsZWQuIFVzZWZ1bCB0byBxdWlja2x5IHNldHVwIHlvdXIgY29uZmlnIHZpYSBgLmVuYWJsZSgpYC5cbiAqICAgRm9yIGV4YW1wbGUsIHdoZW4geW91IG5lZWQgb25seSBgYm9sZGAgYW5kIGBpdGFsaWNgIG1hcmt1cCBhbmQgbm90aGluZyBlbHNlLlxuICpcbiAqICMjIyMjIG9wdGlvbnM6XG4gKlxuICogLSBfX2h0bWxfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gZW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2UuIEJlIGNhcmVmdWwhXG4gKiAgIFRoYXQncyBub3Qgc2FmZSEgWW91IG1heSBuZWVkIGV4dGVybmFsIHNhbml0aXplciB0byBwcm90ZWN0IG91dHB1dCBmcm9tIFhTUy5cbiAqICAgSXQncyBiZXR0ZXIgdG8gZXh0ZW5kIGZlYXR1cmVzIHZpYSBwbHVnaW5zLCBpbnN0ZWFkIG9mIGVuYWJsaW5nIEhUTUwuXG4gKiAtIF9feGh0bWxPdXRfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gYWRkICcvJyB3aGVuIGNsb3Npbmcgc2luZ2xlIHRhZ3NcbiAqICAgKGA8YnIgLz5gKS4gVGhpcyBpcyBuZWVkZWQgb25seSBmb3IgZnVsbCBDb21tb25NYXJrIGNvbXBhdGliaWxpdHkuIEluIHJlYWxcbiAqICAgd29ybGQgeW91IHdpbGwgbmVlZCBIVE1MIG91dHB1dC5cbiAqIC0gX19icmVha3NfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gY29udmVydCBgXFxuYCBpbiBwYXJhZ3JhcGhzIGludG8gYDxicj5gLlxuICogLSBfX2xhbmdQcmVmaXhfXyAtIGBsYW5ndWFnZS1gLiBDU1MgbGFuZ3VhZ2UgY2xhc3MgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzLlxuICogICBDYW4gYmUgdXNlZnVsIGZvciBleHRlcm5hbCBoaWdobGlnaHRlcnMuXG4gKiAtIF9fbGlua2lmeV9fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0IHRvIGxpbmtzLlxuICogLSBfX3R5cG9ncmFwaGVyX18gIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBlbmFibGUgW3NvbWUgbGFuZ3VhZ2UtbmV1dHJhbFxuICogICByZXBsYWNlbWVudF0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5tanMpICtcbiAqICAgcXVvdGVzIGJlYXV0aWZpY2F0aW9uIChzbWFydHF1b3RlcykuXG4gKiAtIF9fcXVvdGVzX18gLSBg4oCc4oCd4oCY4oCZYCwgU3RyaW5nIG9yIEFycmF5LiBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50XG4gKiAgIHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQgYW5kIHNtYXJ0cXVvdGVzIG9uLiBGb3IgZXhhbXBsZSwgeW91IGNhblxuICogICB1c2UgYCfCq8K74oCe4oCcJ2AgZm9yIFJ1c3NpYW4sIGAn4oCe4oCc4oCa4oCYJ2AgZm9yIEdlcm1hbiwgYW5kXG4gKiAgIGBbJ8KrXFx4QTAnLCAnXFx4QTDCuycsICfigLlcXHhBMCcsICdcXHhBMOKAuiddYCBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gKiAtIF9faGlnaGxpZ2h0X18gLSBgbnVsbGAuIEhpZ2hsaWdodGVyIGZ1bmN0aW9uIGZvciBmZW5jZWQgY29kZSBibG9ja3MuXG4gKiAgIEhpZ2hsaWdodGVyIGBmdW5jdGlvbiAoc3RyLCBsYW5nKWAgc2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwuIEl0IGNhbiBhbHNvXG4gKiAgIHJldHVybiBlbXB0eSBzdHJpbmcgaWYgdGhlIHNvdXJjZSB3YXMgbm90IGNoYW5nZWQgYW5kIHNob3VsZCBiZSBlc2NhcGVkXG4gKiAgIGV4dGVybmFseS4gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiAvLyBjb21tb25tYXJrIG1vZGVcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoJ2NvbW1vbm1hcmsnKTtcbiAqXG4gKiAvLyBkZWZhdWx0IG1vZGVcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiAvLyBlbmFibGUgZXZlcnl0aGluZ1xuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSh7XG4gKiAgIGh0bWw6IHRydWUsXG4gKiAgIGxpbmtpZnk6IHRydWUsXG4gKiAgIHR5cG9ncmFwaGVyOiB0cnVlXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqICMjIyMjIFN5bnRheCBoaWdobGlnaHRpbmdcbiAqXG4gKiBgYGBqc1xuICogdmFyIGhsanMgPSByZXF1aXJlKCdoaWdobGlnaHQuanMnKSAvLyBodHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiAqXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaGlnaGxpZ2h0OiBmdW5jdGlvbiAoc3RyLCBsYW5nKSB7XG4gKiAgICAgaWYgKGxhbmcgJiYgaGxqcy5nZXRMYW5ndWFnZShsYW5nKSkge1xuICogICAgICAgdHJ5IHtcbiAqICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0KHN0ciwgeyBsYW5ndWFnZTogbGFuZywgaWdub3JlSWxsZWdhbHM6IHRydWUgfSkudmFsdWU7XG4gKiAgICAgICB9IGNhdGNoIChfXykge31cbiAqICAgICB9XG4gKlxuICogICAgIHJldHVybiAnJzsgLy8gdXNlIGV4dGVybmFsIGRlZmF1bHQgZXNjYXBpbmdcbiAqICAgfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBPciB3aXRoIGZ1bGwgd3JhcHBlciBvdmVycmlkZSAoaWYgeW91IG5lZWQgYXNzaWduIGNsYXNzIHRvIGA8cHJlPmAgb3IgYDxjb2RlPmApOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBobGpzID0gcmVxdWlyZSgnaGlnaGxpZ2h0LmpzJykgLy8gaHR0cHM6Ly9oaWdobGlnaHRqcy5vcmcvXG4gKlxuICogLy8gQWN0dWFsIGRlZmF1bHQgdmFsdWVzXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaGlnaGxpZ2h0OiBmdW5jdGlvbiAoc3RyLCBsYW5nKSB7XG4gKiAgICAgaWYgKGxhbmcgJiYgaGxqcy5nZXRMYW5ndWFnZShsYW5nKSkge1xuICogICAgICAgdHJ5IHtcbiAqICAgICAgICAgcmV0dXJuICc8cHJlPjxjb2RlIGNsYXNzPVwiaGxqc1wiPicgK1xuICogICAgICAgICAgICAgICAgaGxqcy5oaWdobGlnaHQoc3RyLCB7IGxhbmd1YWdlOiBsYW5nLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KS52YWx1ZSArXG4gKiAgICAgICAgICAgICAgICAnPC9jb2RlPjwvcHJlPic7XG4gKiAgICAgICB9IGNhdGNoIChfXykge31cbiAqICAgICB9XG4gKlxuICogICAgIHJldHVybiAnPHByZT48Y29kZSBjbGFzcz1cImhsanNcIj4nICsgbWQudXRpbHMuZXNjYXBlSHRtbChzdHIpICsgJzwvY29kZT48L3ByZT4nO1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqKi9cbmZ1bmN0aW9uIE1hcmtkb3duSXQgKHByZXNldE5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1hcmtkb3duSXQpKSB7XG4gICAgcmV0dXJuIG5ldyBNYXJrZG93bkl0KHByZXNldE5hbWUsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBpZiAoIXV0aWxzLmlzU3RyaW5nKHByZXNldE5hbWUpKSB7XG4gICAgICBvcHRpb25zID0gcHJlc2V0TmFtZSB8fCB7fVxuICAgICAgcHJlc2V0TmFtZSA9ICdkZWZhdWx0J1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2lubGluZSAtPiBQYXJzZXJJbmxpbmVcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tQYXJzZXJJbmxpbmVdXS4gWW91IG1heSBuZWVkIGl0IHRvIGFkZCBuZXcgcnVsZXMgd2hlblxuICAgKiB3cml0aW5nIHBsdWdpbnMuIEZvciBzaW1wbGUgcnVsZXMgY29udHJvbCB1c2UgW1tNYXJrZG93bkl0LmRpc2FibGVdXSBhbmRcbiAgICogW1tNYXJrZG93bkl0LmVuYWJsZV1dLlxuICAgKiovXG4gIHRoaXMuaW5saW5lID0gbmV3IFBhcnNlcklubGluZSgpXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjYmxvY2sgLT4gUGFyc2VyQmxvY2tcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tQYXJzZXJCbG9ja11dLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5ibG9jayA9IG5ldyBQYXJzZXJCbG9jaygpXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjY29yZSAtPiBDb3JlXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbQ29yZV1dIGNoYWluIGV4ZWN1dG9yLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5jb3JlID0gbmV3IFBhcnNlckNvcmUoKVxuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I3JlbmRlcmVyIC0+IFJlbmRlcmVyXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbUmVuZGVyZXJdXS4gVXNlIGl0IHRvIG1vZGlmeSBvdXRwdXQgbG9vay4gT3IgdG8gYWRkIHJlbmRlcmluZ1xuICAgKiBydWxlcyBmb3IgbmV3IHRva2VuIHR5cGVzLCBnZW5lcmF0ZWQgYnkgcGx1Z2lucy5cbiAgICpcbiAgICogIyMjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICpcbiAgICogZnVuY3Rpb24gbXlUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzZWxmKSB7XG4gICAqICAgLy8uLi5cbiAgICogICByZXR1cm4gcmVzdWx0O1xuICAgKiB9O1xuICAgKlxuICAgKiBtZC5yZW5kZXJlci5ydWxlc1snbXlfdG9rZW4nXSA9IG15VG9rZW5cbiAgICogYGBgXG4gICAqXG4gICAqIFNlZSBbW1JlbmRlcmVyXV0gZG9jcyBhbmQgW3NvdXJjZSBjb2RlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3JlbmRlcmVyLm1qcykuXG4gICAqKi9cbiAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjbGlua2lmeSAtPiBMaW5raWZ5SXRcbiAgICpcbiAgICogW2xpbmtpZnktaXRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9saW5raWZ5LWl0KSBpbnN0YW5jZS5cbiAgICogVXNlZCBieSBbbGlua2lmeV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9ydWxlc19jb3JlL2xpbmtpZnkubWpzKVxuICAgKiBydWxlLlxuICAgKiovXG4gIHRoaXMubGlua2lmeSA9IG5ldyBMaW5raWZ5SXQoKVxuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I3ZhbGlkYXRlTGluayh1cmwpIC0+IEJvb2xlYW5cbiAgICpcbiAgICogTGluayB2YWxpZGF0aW9uIGZ1bmN0aW9uLiBDb21tb25NYXJrIGFsbG93cyB0b28gbXVjaCBpbiBsaW5rcy4gQnkgZGVmYXVsdFxuICAgKiB3ZSBkaXNhYmxlIGBqYXZhc2NyaXB0OmAsIGB2YnNjcmlwdDpgLCBgZmlsZTpgIHNjaGVtYXMsIGFuZCBhbG1vc3QgYWxsIGBkYXRhOi4uLmAgc2NoZW1hc1xuICAgKiBleGNlcHQgc29tZSBlbWJlZGRlZCBpbWFnZSB0eXBlcy5cbiAgICpcbiAgICogWW91IGNhbiBjaGFuZ2UgdGhpcyBiZWhhdmlvdXI6XG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICAgKiAvLyBlbmFibGUgZXZlcnl0aGluZ1xuICAgKiBtZC52YWxpZGF0ZUxpbmsgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlOyB9XG4gICAqIGBgYFxuICAgKiovXG4gIHRoaXMudmFsaWRhdGVMaW5rID0gdmFsaWRhdGVMaW5rXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjbm9ybWFsaXplTGluayh1cmwpIC0+IFN0cmluZ1xuICAgKlxuICAgKiBGdW5jdGlvbiB1c2VkIHRvIGVuY29kZSBsaW5rIHVybCB0byBhIG1hY2hpbmUtcmVhZGFibGUgZm9ybWF0LFxuICAgKiB3aGljaCBpbmNsdWRlcyB1cmwtZW5jb2RpbmcsIHB1bnljb2RlLCBldGMuXG4gICAqKi9cbiAgdGhpcy5ub3JtYWxpemVMaW5rID0gbm9ybWFsaXplTGlua1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I25vcm1hbGl6ZUxpbmtUZXh0KHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZGVjb2RlIGxpbmsgdXJsIHRvIGEgaHVtYW4tcmVhZGFibGUgZm9ybWF0YFxuICAgKiovXG4gIHRoaXMubm9ybWFsaXplTGlua1RleHQgPSBub3JtYWxpemVMaW5rVGV4dFxuXG4gIC8vIEV4cG9zZSB1dGlscyAmIGhlbHBlcnMgZm9yIGVhc3kgYWNjZXMgZnJvbSBwbHVnaW5zXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjdXRpbHMgLT4gdXRpbHNcbiAgICpcbiAgICogQXNzb3J0ZWQgdXRpbGl0eSBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9jb21tb24vdXRpbHMubWpzKS5cbiAgICoqL1xuICB0aGlzLnV0aWxzID0gdXRpbHNcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNoZWxwZXJzIC0+IGhlbHBlcnNcbiAgICpcbiAgICogTGluayBjb21wb25lbnRzIHBhcnNlciBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9oZWxwZXJzKS5cbiAgICoqL1xuICB0aGlzLmhlbHBlcnMgPSB1dGlscy5hc3NpZ24oe30sIGhlbHBlcnMpXG5cbiAgdGhpcy5vcHRpb25zID0ge31cbiAgdGhpcy5jb25maWd1cmUocHJlc2V0TmFtZSlcblxuICBpZiAob3B0aW9ucykgeyB0aGlzLnNldChvcHRpb25zKSB9XG59XG5cbi8qKiBjaGFpbmFibGVcbiAqIE1hcmtkb3duSXQuc2V0KG9wdGlvbnMpXG4gKlxuICogU2V0IHBhcnNlciBvcHRpb25zIChpbiB0aGUgc2FtZSBmb3JtYXQgYXMgaW4gY29uc3RydWN0b3IpLiBQcm9iYWJseSwgeW91XG4gKiB3aWxsIG5ldmVyIG5lZWQgaXQsIGJ1dCB5b3UgY2FuIGNoYW5nZSBvcHRpb25zIGFmdGVyIGNvbnN0cnVjdG9yIGNhbGwuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKVxuICogICAgICAgICAgICAgLnNldCh7IGh0bWw6IHRydWUsIGJyZWFrczogdHJ1ZSB9KVxuICogICAgICAgICAgICAgLnNldCh7IHR5cG9ncmFwaGVyOiB0cnVlIH0pO1xuICogYGBgXG4gKlxuICogX19Ob3RlOl9fIFRvIGFjaGlldmUgdGhlIGJlc3QgcG9zc2libGUgcGVyZm9ybWFuY2UsIGRvbid0IG1vZGlmeSBhXG4gKiBgbWFya2Rvd24taXRgIGluc3RhbmNlIG9wdGlvbnMgb24gdGhlIGZseS4gSWYgeW91IG5lZWQgbXVsdGlwbGUgY29uZmlndXJhdGlvbnNcbiAqIGl0J3MgYmVzdCB0byBjcmVhdGUgbXVsdGlwbGUgaW5zdGFuY2VzIGFuZCBpbml0aWFsaXplIGVhY2ggd2l0aCBzZXBhcmF0ZVxuICogY29uZmlnLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgdXRpbHMuYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucylcbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqIGNoYWluYWJsZSwgaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQuY29uZmlndXJlKHByZXNldHMpXG4gKlxuICogQmF0Y2ggbG9hZCBvZiBhbGwgb3B0aW9ucyBhbmQgY29tcGVuZW50IHNldHRpbmdzLiBUaGlzIGlzIGludGVybmFsIG1ldGhvZCxcbiAqIGFuZCB5b3UgcHJvYmFibHkgd2lsbCBub3QgbmVlZCBpdC4gQnV0IGlmIHlvdSB3aWxsIC0gc2VlIGF2YWlsYWJsZSBwcmVzZXRzXG4gKiBhbmQgZGF0YSBzdHJ1Y3R1cmUgW2hlcmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC90cmVlL21hc3Rlci9saWIvcHJlc2V0cylcbiAqXG4gKiBXZSBzdHJvbmdseSByZWNvbW1lbmQgdG8gdXNlIHByZXNldHMgaW5zdGVhZCBvZiBkaXJlY3QgY29uZmlnIGxvYWRzLiBUaGF0XG4gKiB3aWxsIGdpdmUgYmV0dGVyIGNvbXBhdGliaWxpdHkgd2l0aCBuZXh0IHZlcnNpb25zLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24gKHByZXNldHMpIHtcbiAgY29uc3Qgc2VsZiA9IHRoaXNcblxuICBpZiAodXRpbHMuaXNTdHJpbmcocHJlc2V0cykpIHtcbiAgICBjb25zdCBwcmVzZXROYW1lID0gcHJlc2V0c1xuICAgIHByZXNldHMgPSBjb25maWdbcHJlc2V0TmFtZV1cbiAgICBpZiAoIXByZXNldHMpIHsgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBgbWFya2Rvd24taXRgIHByZXNldCBcIicgKyBwcmVzZXROYW1lICsgJ1wiLCBjaGVjayBuYW1lJykgfVxuICB9XG5cbiAgaWYgKCFwcmVzZXRzKSB7IHRocm93IG5ldyBFcnJvcignV3JvbmcgYG1hcmtkb3duLWl0YCBwcmVzZXQsIGNhblxcJ3QgYmUgZW1wdHknKSB9XG5cbiAgaWYgKHByZXNldHMub3B0aW9ucykgeyBzZWxmLnNldChwcmVzZXRzLm9wdGlvbnMpIH1cblxuICBpZiAocHJlc2V0cy5jb21wb25lbnRzKSB7XG4gICAgT2JqZWN0LmtleXMocHJlc2V0cy5jb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICBpZiAocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzKSB7XG4gICAgICAgIHNlbGZbbmFtZV0ucnVsZXIuZW5hYmxlT25seShwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpXG4gICAgICB9XG4gICAgICBpZiAocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzMikge1xuICAgICAgICBzZWxmW25hbWVdLnJ1bGVyMi5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlczIpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LmVuYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBydWxlIG5hbWUgb3IgbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZVxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIGxpc3Qgb3IgcnVsZXMuIEl0IHdpbGwgYXV0b21hdGljYWxseSBmaW5kIGFwcHJvcHJpYXRlIGNvbXBvbmVudHMsXG4gKiBjb250YWluaW5nIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIHJ1bGUgbm90IGZvdW5kLCBhbmQgYGlnbm9yZUludmFsaWRgXG4gKiBub3Qgc2V0IC0gdGhyb3dzIGV4Y2VwdGlvbi5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuZW5hYmxlKFsnc3ViJywgJ3N1cCddKVxuICogICAgICAgICAgICAgLmRpc2FibGUoJ3NtYXJ0cXVvdGVzJyk7XG4gKiBgYGBcbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIGxldCByZXN1bHQgPSBbXVxuXG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkgeyBsaXN0ID0gW2xpc3RdIH1cblxuICBbJ2NvcmUnLCAnYmxvY2snLCAnaW5saW5lJ10uZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXNbY2hhaW5dLnJ1bGVyLmVuYWJsZShsaXN0LCB0cnVlKSlcbiAgfSwgdGhpcylcblxuICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXMuaW5saW5lLnJ1bGVyMi5lbmFibGUobGlzdCwgdHJ1ZSkpXG5cbiAgY29uc3QgbWlzc2VkID0gbGlzdC5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHJlc3VsdC5pbmRleE9mKG5hbWUpIDwgMCB9KVxuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZW5hYmxlIHVua25vd24gcnVsZShzKTogJyArIG1pc3NlZClcbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKiBjaGFpbmFibGVcbiAqIE1hcmtkb3duSXQuZGlzYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBydWxlIG5hbWUgb3IgbGlzdCBvZiBydWxlIG5hbWVzIHRvIGRpc2FibGUuXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBUaGUgc2FtZSBhcyBbW01hcmtkb3duSXQuZW5hYmxlXV0sIGJ1dCB0dXJuIHNwZWNpZmllZCBydWxlcyBvZmYuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgbGV0IHJlc3VsdCA9IFtdXG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbbGlzdF0gfVxuXG4gIFsnY29yZScsICdibG9jaycsICdpbmxpbmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFpbikge1xuICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpc1tjaGFpbl0ucnVsZXIuZGlzYWJsZShsaXN0LCB0cnVlKSlcbiAgfSwgdGhpcylcblxuICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXMuaW5saW5lLnJ1bGVyMi5kaXNhYmxlKGxpc3QsIHRydWUpKVxuXG4gIGNvbnN0IG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiByZXN1bHQuaW5kZXhPZihuYW1lKSA8IDAgfSlcblxuICBpZiAobWlzc2VkLmxlbmd0aCAmJiAhaWdub3JlSW52YWxpZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWFya2Rvd25JdC4gRmFpbGVkIHRvIGRpc2FibGUgdW5rbm93biBydWxlKHMpOiAnICsgbWlzc2VkKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKiBjaGFpbmFibGVcbiAqIE1hcmtkb3duSXQudXNlKHBsdWdpbiwgcGFyYW1zKVxuICpcbiAqIExvYWQgc3BlY2lmaWVkIHBsdWdpbiB3aXRoIGdpdmVuIHBhcmFtcyBpbnRvIGN1cnJlbnQgcGFyc2VyIGluc3RhbmNlLlxuICogSXQncyBqdXN0IGEgc3VnYXIgdG8gY2FsbCBgcGx1Z2luKG1kLCBwYXJhbXMpYCB3aXRoIGN1cnJpbmcuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBpdGVyYXRvciA9IHJlcXVpcmUoJ21hcmtkb3duLWl0LWZvci1pbmxpbmUnKTtcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKVxuICogICAgICAgICAgICAgLnVzZShpdGVyYXRvciwgJ2Zvb19yZXBsYWNlJywgJ3RleHQnLCBmdW5jdGlvbiAodG9rZW5zLCBpZHgpIHtcbiAqICAgICAgICAgICAgICAgdG9rZW5zW2lkeF0uY29udGVudCA9IHRva2Vuc1tpZHhdLmNvbnRlbnQucmVwbGFjZSgvZm9vL2csICdiYXInKTtcbiAqICAgICAgICAgICAgIH0pO1xuICogYGBgXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbiAocGx1Z2luIC8qLCBwYXJhbXMsIC4uLiAqLykge1xuICBjb25zdCBhcmdzID0gW3RoaXNdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxuICBwbHVnaW4uYXBwbHkocGx1Z2luLCBhcmdzKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2Uoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBQYXJzZSBpbnB1dCBzdHJpbmcgYW5kIHJldHVybiBsaXN0IG9mIGJsb2NrIHRva2VucyAoc3BlY2lhbCB0b2tlbiB0eXBlXG4gKiBcImlubGluZVwiIHdpbGwgY29udGFpbiBsaXN0IG9mIGlubGluZSB0b2tlbnMpLiBZb3Ugc2hvdWxkIG5vdCBjYWxsIHRoaXNcbiAqIG1ldGhvZCBkaXJlY3RseSwgdW50aWwgeW91IHdyaXRlIGN1c3RvbSByZW5kZXJlciAoZm9yIGV4YW1wbGUsIHRvIHByb2R1Y2VcbiAqIEFTVCkuXG4gKlxuICogYGVudmAgaXMgdXNlZCB0byBwYXNzIGRhdGEgYmV0d2VlbiBcImRpc3RyaWJ1dGVkXCIgcnVsZXMgYW5kIHJldHVybiBhZGRpdGlvbmFsXG4gKiBtZXRhZGF0YSBsaWtlIHJlZmVyZW5jZSBpbmZvLCBuZWVkZWQgZm9yIHRoZSByZW5kZXJlci4gSXQgYWxzbyBjYW4gYmUgdXNlZCB0b1xuICogaW5qZWN0IGRhdGEgaW4gc3BlY2lmaWMgY2FzZXMuIFVzdWFsbHksIHlvdSB3aWxsIGJlIG9rIHRvIHBhc3MgYHt9YCxcbiAqIGFuZCB0aGVuIHBhc3MgdXBkYXRlZCBvYmplY3QgdG8gcmVuZGVyZXIuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBpZiAodHlwZW9mIHNyYyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0lucHV0IGRhdGEgc2hvdWxkIGJlIGEgU3RyaW5nJylcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gbmV3IHRoaXMuY29yZS5TdGF0ZShzcmMsIHRoaXMsIGVudilcblxuICB0aGlzLmNvcmUucHJvY2VzcyhzdGF0ZSlcblxuICByZXR1cm4gc3RhdGUudG9rZW5zXG59XG5cbi8qKlxuICogTWFya2Rvd25JdC5yZW5kZXIoc3JjIFssIGVudl0pIC0+IFN0cmluZ1xuICogLSBzcmMgKFN0cmluZyk6IHNvdXJjZSBzdHJpbmdcbiAqIC0gZW52IChPYmplY3QpOiBlbnZpcm9ubWVudCBzYW5kYm94XG4gKlxuICogUmVuZGVyIG1hcmtkb3duIHN0cmluZyBpbnRvIGh0bWwuIEl0IGRvZXMgYWxsIG1hZ2ljIGZvciB5b3UgOikuXG4gKlxuICogYGVudmAgY2FuIGJlIHVzZWQgdG8gaW5qZWN0IGFkZGl0aW9uYWwgbWV0YWRhdGEgKGB7fWAgYnkgZGVmYXVsdCkuXG4gKiBCdXQgeW91IHdpbGwgbm90IG5lZWQgaXQgd2l0aCBoaWdoIHByb2JhYmlsaXR5LiBTZWUgYWxzbyBjb21tZW50XG4gKiBpbiBbW01hcmtkb3duSXQucGFyc2VdXS5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBlbnYgPSBlbnYgfHwge31cblxuICByZXR1cm4gdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5wYXJzZShzcmMsIGVudiksIHRoaXMub3B0aW9ucywgZW52KVxufVxuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2VJbmxpbmUoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW01hcmtkb3duSXQucGFyc2VdXSBidXQgc2tpcCBhbGwgYmxvY2sgcnVsZXMuIEl0IHJldHVybnMgdGhlXG4gKiBibG9jayB0b2tlbnMgbGlzdCB3aXRoIHRoZSBzaW5nbGUgYGlubGluZWAgZWxlbWVudCwgY29udGFpbmluZyBwYXJzZWQgaW5saW5lXG4gKiB0b2tlbnMgaW4gYGNoaWxkcmVuYCBwcm9wZXJ0eS4gQWxzbyB1cGRhdGVzIGBlbnZgIG9iamVjdC5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGNvbnN0IHN0YXRlID0gbmV3IHRoaXMuY29yZS5TdGF0ZShzcmMsIHRoaXMsIGVudilcblxuICBzdGF0ZS5pbmxpbmVNb2RlID0gdHJ1ZVxuICB0aGlzLmNvcmUucHJvY2VzcyhzdGF0ZSlcblxuICByZXR1cm4gc3RhdGUudG9rZW5zXG59XG5cbi8qKlxuICogTWFya2Rvd25JdC5yZW5kZXJJbmxpbmUoc3JjIFssIGVudl0pIC0+IFN0cmluZ1xuICogLSBzcmMgKFN0cmluZyk6IHNvdXJjZSBzdHJpbmdcbiAqIC0gZW52IChPYmplY3QpOiBlbnZpcm9ubWVudCBzYW5kYm94XG4gKlxuICogU2ltaWxhciB0byBbW01hcmtkb3duSXQucmVuZGVyXV0gYnV0IGZvciBzaW5nbGUgcGFyYWdyYXBoIGNvbnRlbnQuIFJlc3VsdFxuICogd2lsbCBOT1QgYmUgd3JhcHBlZCBpbnRvIGA8cD5gIHRhZ3MuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5yZW5kZXJJbmxpbmUgPSBmdW5jdGlvbiAoc3JjLCBlbnYpIHtcbiAgZW52ID0gZW52IHx8IHt9XG5cbiAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VJbmxpbmUoc3JjLCBlbnYpLCB0aGlzLm9wdGlvbnMsIGVudilcbn1cblxuZXhwb3J0IGRlZmF1bHQgTWFya2Rvd25JdFxuIiwgIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFZpYmV4IHNpZGViYXIgd2Vidmlldy5cbiAqXG4gKiBERVNJR04gUlVMRSBcdTIwMTQgdGhpcyByZW5kZXJlciBkcmF3cyBOT1RISU5HIG9mIGl0cyBvd24uIEl0IHJlcHJvZHVjZXMgdGhlIERPTVxuICogY2xhc3Mgc3RydWN0dXJlIG9mIFZTIENvZGUncyBuYXRpdmUgY2hhdCB3aWRnZXQgKGAuaW50ZXJhY3RpdmUtc2Vzc2lvbmAsXG4gKiBgLmludGVyYWN0aXZlLWl0ZW0tY29udGFpbmVyYCwgYC5jaGF0LWlucHV0LWNvbnRhaW5lcmAsIFx1MjAyNikgZXhhY3RseSBhcyB0aGVcbiAqIHdvcmtiZW5jaCByZW5kZXJlciBidWlsZHMgaXQsIHNvIHRoYXQgdGhlIHZlcmJhdGltLWV4dHJhY3RlZCBzdHlsZXNoZWV0IGluXG4gKiBtZWRpYS9uYXRpdmUtY2hhdC5jc3Mgc3R5bGVzIGl0IGlkZW50aWNhbGx5IHRvIHRoZSByZWFsIHRoaW5nLiBJZiBhIHBpZWNlIG9mXG4gKiBVSSBsb29rcyBkaWZmZXJlbnQgZnJvbSBuYXRpdmUgVlMgQ29kZSBjaGF0LCB0aGUgZml4IGlzIHRvIGNvcnJlY3QgdGhlIERPTVxuICogc3RydWN0dXJlIG9yIHJlLWV4dHJhY3QgdGhlIENTUyBcdTIwMTQgbmV2ZXIgdG8gaGFuZC10dW5lIHN0eWxlcy5cbiAqL1xuXG5jb25zdCBNYXJrZG93bkl0ID0gcmVxdWlyZShcIm1hcmtkb3duLWl0XCIpO1xuXG5jb25zdCB2c2NvZGUgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XG5jb25zdCBtZCA9IG5ldyBNYXJrZG93bkl0KHsgaHRtbDogZmFsc2UsIGxpbmtpZnk6IHRydWUsIGJyZWFrczogZmFsc2UgfSk7XG5cbmNvbnN0IHN0YXRlID0ge1xuICBhZ2VudHM6IFtdLFxuICBwcm9qZWN0czogW10sXG4gIGNvbnZlcnNhdGlvbnM6IFtdLFxuICBzZWxlY3RlZENvbnZlcnNhdGlvbklkOiBudWxsLFxuICBzZWxlY3RlZFByb2plY3RJZDogbnVsbCxcbiAgdGFza3M6IFtdLFxuICBoZWFsdGg6IG51bGwsXG4gIG9wdGlvbnM6IHsgbW9kZWxJZDogbnVsbCwgZWZmb3J0OiBcIlwiLCBhcHByb3ZhbE1vZGU6IFwiZGVmYXVsdFwiIH0sXG4gIGJ1c3k6IGZhbHNlLFxuICBjb25uZWN0aW9uRXJyb3I6IG51bGwsXG4gIC8vIENvbXBvc2VyIGAvYCBhbmQgYEBgIGFzc2lzdCBwb3B1cC5cbiAgYXNzaXN0SXRlbXM6IFtdLFxuICBhc3Npc3RJbmRleDogMCxcbiAgYXNzaXN0UmFuZ2U6IG51bGwsXG4gIG1lbnRpb25SZXF1ZXN0SWQ6IG51bGwsXG4gIG1lbnRpb25GaWxlczogW10sXG59O1xuXG5jb25zdCBBQ1RJVkVfU1RBVFVTRVMgPSBuZXcgU2V0KFtcbiAgXCJxdWV1ZWRcIiwgXCJpbnRlcnByZXRpbmdcIiwgXCJhd2FpdGluZ19jb25maXJtYXRpb25cIixcbiAgXCJyZXNvbHZpbmdfc2Vzc2lvblwiLCBcInJ1bm5pbmdfYWdlbnRcIiwgXCJ0ZXN0aW5nXCIsXG5dKTtcblxuY29uc3QgU1RBVFVTX01FU1NBR0VTID0ge1xuICBxdWV1ZWQ6IFwiXHVCMzAwXHVBRTMwIFx1QzkxMVx1Qzc4NVx1QjJDOFx1QjJFNC5cIixcbiAgaW50ZXJwcmV0aW5nOiBcIlx1QzY5NFx1Q0NBRFx1Qzc0NCBcdUQ1NzRcdUMxMURcdUQ1NThcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxuICBhd2FpdGluZ19jb25maXJtYXRpb246IFwiXHVENjU1XHVDNzc4XHVDNzQ0IFx1QUUzMFx1QjJFNFx1QjlBQ1x1QUNFMCBcdUM3ODhcdUMyQjVcdUIyQzhcdUIyRTQuXCIsXG4gIHJlc29sdmluZ19zZXNzaW9uOiBcIlx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOCBcdUMxMzhcdUMxNThcdUM3NDQgXHVDQzNFXHVBQ0UwIFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIixcbiAgcnVubmluZ19hZ2VudDogXCJcdUM2OTRcdUNDQURcdUM3NDQgXHVDQzk4XHVCOUFDXHVENTU4XHVBQ0UwIFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIixcbiAgdGVzdGluZzogXCJcdUQxNENcdUMyQTRcdUQyQjhcdUI5N0MgXHVDMkU0XHVENTg5XHVENTU4XHVBQ0UwIFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIixcbn07XG5cbmNvbnN0IEFHRU5UX05BTUVTID0geyBcImNsYXVkZS1jb2RlXCI6IFwiQ2xhdWRlIENvZGVcIiwgXCJjb2RleC1jbGlcIjogXCJDb2RleFwiLCBcImdlbWluaS1jbGlcIjogXCJHZW1pbmlcIiB9O1xuXG4vKipcbiAqIFNsYXNoIGNvbW1hbmRzIG9mZmVyZWQgYnkgdGhlIGNvbXBvc2VyLlxuICpcbiAqIFRoZSBicmlkZ2UgZXhwb3NlcyBubyBjb21tYW5kIEFQSSwgc28gdGhlc2UgYXJlIHByb21wdCBzaG9ydGN1dHMgZXhwYW5kZWRcbiAqIGxvY2FsbHk6IGBwcm9tcHRgIHJlcGxhY2VzIHRoZSB0eXBlZCB0b2tlbiwgYGFjdGlvbmAgcnVucyBpbiB0aGUgd2Vidmlldy5cbiAqL1xuY29uc3QgU0xBU0hfQ09NTUFORFMgPSBbXG4gIHsgdmFsdWU6IFwiL2NsZWFyXCIsIGRlc2NyaXB0aW9uOiBcIlx1Qzc4NVx1QjgyNSBcdUJFNDRcdUM2QjBcdUFFMzBcIiwgYWN0aW9uOiBcImNsZWFyXCIgfSxcbiAgeyB2YWx1ZTogXCIvZXhwbGFpblwiLCBkZXNjcmlwdGlvbjogXCJcdUMxMjBcdUQwRERcdUQ1NUMgXHVDRjU0XHVCNERDXHVCMDk4IFx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOCBcdUMxMjRcdUJBODVcIiwgcHJvbXB0OiBcIlx1QjJFNFx1Qzc0Q1x1Qzc0NCBcdUM3NzRcdUQ1NzRcdUQ1NThcdUFFMzAgXHVDMjdEXHVBQzhDIFx1QzEyNFx1QkE4NVx1RDU3NFx1QzkxODogXCIgfSxcbiAgeyB2YWx1ZTogXCIvZml4XCIsIGRlc2NyaXB0aW9uOiBcIlx1QkIzOFx1QzgxQ1x1Qjk3QyBcdUM4NzBcdUMwQUNcdUQ1NThcdUFDRTAgXHVDMjE4XHVDODE1XCIsIHByb21wdDogXCJcdUIyRTRcdUM3NEMgXHVCQjM4XHVDODFDXHVDNzU4IFx1QzZEMFx1Qzc3OFx1Qzc0NCBcdUM4NzBcdUMwQUNcdUQ1NThcdUFDRTAgXHVDMjE4XHVDODE1XHVENTc0XHVDOTE4OiBcIiB9LFxuICB7IHZhbHVlOiBcIi90ZXN0XCIsIGRlc2NyaXB0aW9uOiBcIlx1QUQwMFx1QjgyOCBcdUQxNENcdUMyQTRcdUQyQjggXHVDNzkxXHVDMTMxIFx1QjYxMFx1QjI5NCBcdUMyRTRcdUQ1ODlcIiwgcHJvbXB0OiBcIlx1QjJFNFx1Qzc0QyBcdUIzMDBcdUMwQzFcdUM3NTggXHVBRDAwXHVCODI4IFx1RDE0Q1x1QzJBNFx1RDJCOFx1Qjk3QyBcdUM3OTFcdUMxMzFcdUQ1NThcdUFDNzBcdUIwOTggXHVDMkU0XHVENTg5XHVENTc0XHVDOTE4OiBcIiB9LFxuICB7IHZhbHVlOiBcIi9yZXZpZXdcIiwgZGVzY3JpcHRpb246IFwiXHVENjA0XHVDN0FDIFx1QkNDMFx1QUNCRFx1QzBBQ1x1RDU2RCBcdUFDODBcdUQxQTBcIiwgcHJvbXB0OiBcIlx1RDYwNFx1QzdBQyBcdUQ1MDRcdUI4NUNcdUM4MURcdUQyQjhcdUM3NTggXHVCQ0MwXHVBQ0JEXHVDMEFDXHVENTZEXHVDNzQ0IFx1QUM4MFx1RDFBMFx1RDU3NFx1QzkxOC4gXCIgfSxcbl07XG5cbi8vICNyZWdpb24gRE9NIGhlbHBlcnNcblxuZnVuY3Rpb24gZWwodGFnLCBjbGFzc05hbWUsIHRleHQpIHtcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgbm9kZS5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIG5vZGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gbm9kZTtcbn1cblxuZnVuY3Rpb24gY29kaWNvbihuYW1lKSB7XG4gIHJldHVybiBlbChcInNwYW5cIiwgYGNvZGljb24gY29kaWNvbi0ke25hbWV9YCk7XG59XG5cbmZ1bmN0aW9uIHZpYmV4TWFyaygpIHtcbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICBpbWFnZS5jbGFzc05hbWUgPSBcInZpYmV4LXdlbGNvbWUtbG9nb1wiO1xuICBpbWFnZS5zcmMgPSBkb2N1bWVudC5ib2R5LmRhdGFzZXQudmliZXhJY29uIHx8IFwiXCI7XG4gIGltYWdlLmFsdCA9IFwiXCI7XG4gIGltYWdlLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgcmV0dXJuIGltYWdlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJNYXJrZG93bih0ZXh0KSB7XG4gIGNvbnN0IGhvc3QgPSBlbChcImRpdlwiLCBcInJlbmRlcmVkLW1hcmtkb3duXCIpO1xuICBob3N0LmlubmVySFRNTCA9IG1kLnJlbmRlcihTdHJpbmcodGV4dCB8fCBcIlwiKSk7XG4gIGZvciAoY29uc3QgYW5jaG9yIG9mIGhvc3QucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl1cIikpIHtcbiAgICBhbmNob3IuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHBvc3QoeyB0eXBlOiBcIm9wZW5MaW5rXCIsIGhyZWY6IGFuY2hvci5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpIH0pO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBob3N0O1xufVxuXG5mdW5jdGlvbiBwb3N0KG1lc3NhZ2UpIHtcbiAgdnNjb2RlLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTGF5b3V0IHNrZWxldG9uIChidWlsdCBvbmNlKVxuXG4vLyBUaGUgZXh0cmFjdGVkIHN0eWxlc2hlZXQgc2NvcGVzIG1vc3QgcnVsZXMgdW5kZXIgdGhlIHdvcmtiZW5jaCByb290XG4vLyAoYC5tb25hY28td29ya2JlbmNoIC5pbnRlcmFjdGl2ZS1zZXNzaW9uIFx1MjAyNmApIGFuZCB0aGVtZSBjbGFzc2VzIChgLnZzLWRhcmtgKS5cbi8vIFRoZSB3ZWJ2aWV3IGJvZHkgc3RhbmRzIGluIGZvciB0aGUgd29ya2JlbmNoIHJvb3QsIHNvIGl0IG11c3QgY2FycnkgdGhlXG4vLyBzYW1lIGNsYXNzZXM7IHRoZSB0aGVtZSBjbGFzcyBmb2xsb3dzIFZTIENvZGUncyBvd24gYm9keSBjbGFzcy5cbmZ1bmN0aW9uIHN5bmNXb3JrYmVuY2hDbGFzc2VzKCkge1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgY29uc3QgdGhlbWVNYXAgPSBbXG4gICAgW1widnNjb2RlLWhpZ2gtY29udHJhc3QtbGlnaHRcIiwgXCJoYy1saWdodFwiXSxcbiAgICBbXCJ2c2NvZGUtaGlnaC1jb250cmFzdFwiLCBcImhjLWJsYWNrXCJdLFxuICAgIFtcInZzY29kZS1saWdodFwiLCBcInZzXCJdLFxuICAgIFtcInZzY29kZS1kYXJrXCIsIFwidnMtZGFya1wiXSxcbiAgXTtcbiAgbGV0IGRlc2lyZWQgPSBcInZzLWRhcmtcIjtcbiAgZm9yIChjb25zdCBbd2Vidmlld0NsYXNzLCB3b3JrYmVuY2hDbGFzc10gb2YgdGhlbWVNYXApIHtcbiAgICBpZiAoYm9keS5jbGFzc0xpc3QuY29udGFpbnMod2Vidmlld0NsYXNzKSkge1xuICAgICAgZGVzaXJlZCA9IHdvcmtiZW5jaENsYXNzO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIC8vIE9ubHkgdG91Y2ggdGhlIGF0dHJpYnV0ZSB3aGVuIHNvbWV0aGluZyBhY3R1YWxseSBjaGFuZ2VzIFx1MjAxNCB0aGUgb2JzZXJ2ZXJcbiAgLy8gYmVsb3cgd2F0Y2hlcyBjbGFzcyBtdXRhdGlvbnMgYW5kIG11c3Qgbm90IGJlIHJlLXRyaWdnZXJlZCBieSB0aGlzIHN5bmMuXG4gIGlmIChib2R5LmNsYXNzTGlzdC5jb250YWlucyhcIm1vbmFjby13b3JrYmVuY2hcIikgJiYgYm9keS5jbGFzc0xpc3QuY29udGFpbnMoZGVzaXJlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgYm9keS5jbGFzc0xpc3QuYWRkKFwibW9uYWNvLXdvcmtiZW5jaFwiKTtcbiAgZm9yIChjb25zdCBbLCB3b3JrYmVuY2hDbGFzc10gb2YgdGhlbWVNYXApIHtcbiAgICBpZiAod29ya2JlbmNoQ2xhc3MgIT09IGRlc2lyZWQpIGJvZHkuY2xhc3NMaXN0LnJlbW92ZSh3b3JrYmVuY2hDbGFzcyk7XG4gIH1cbiAgYm9keS5jbGFzc0xpc3QuYWRkKGRlc2lyZWQpO1xufVxuc3luY1dvcmtiZW5jaENsYXNzZXMoKTtcbm5ldyBNdXRhdGlvbk9ic2VydmVyKHN5bmNXb3JrYmVuY2hDbGFzc2VzKS5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgYXR0cmlidXRlczogdHJ1ZSxcbiAgYXR0cmlidXRlRmlsdGVyOiBbXCJjbGFzc1wiXSxcbn0pO1xuXG5jb25zdCByb290ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1zZXNzaW9uXCIpO1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyb290KTtcblxuLy8gS2VlcCB0aGUgYWN0aXZlIGNvbnZlcnNhdGlvbiBuYW1lIHZpc2libGUgYWJvdmUgdGhlIHRyYW5zY3JpcHQsIGFzIGluIHRoZVxuLy8gbmF0aXZlIENoYXQvQ29kZXggcGFuZXMuIEdsb2JhbCBhY3Rpb25zIHJlbWFpbiBpbiBWUyBDb2RlJ3MgcGFuZSB0aXRsZSBiYXIuXG5jb25zdCBjb252ZXJzYXRpb25IZWFkZXIgPSBlbChcImRpdlwiLCBcInZpYmV4LWNvbnZlcnNhdGlvbi1oZWFkZXJcIik7XG5jb25zdCBjb252ZXJzYXRpb25UaXRsZSA9IGVsKFwiZGl2XCIsIFwidmliZXgtY29udmVyc2F0aW9uLXRpdGxlXCIsIFwiXHVDMEM4IFx1QjMwMFx1RDY1NFwiKTtcbmNvbnZlcnNhdGlvbkhlYWRlci5hcHBlbmQoY29udmVyc2F0aW9uVGl0bGUpO1xuXG5jb25zdCBsaXN0ID0gZWwoXCJkaXZcIiwgXCJ2aWJleC1saXN0XCIpO1xucm9vdC5hcHBlbmQoY29udmVyc2F0aW9uSGVhZGVyLCBsaXN0KTtcblxuLy8gQ29tcG9zZXIgXHUyMDE0IG1pcnJvcnMgdGhlIERPTSB0aGUgd29ya2JlbmNoIGJ1aWxkcyBhdCBydW50aW1lLCBjYXB0dXJlZCBmcm9tIGFcbi8vIGxpdmUgbmF0aXZlIGNoYXQgc2Vzc2lvbiBvdmVyIHRoZSBDaHJvbWUgRGV2VG9vbHMgUHJvdG9jb2xcbi8vIChzY3JhdGNocGFkL2RvbWR1bXAuanMpLiBEbyBub3QgcmVzdHJ1Y3R1cmUgYnkgaW50dWl0aW9uOiByZS1kdW1wIGFuZCBtYXRjaC5cbmZ1bmN0aW9uIHRvb2xiYXIoZXh0cmFDbGFzc2VzKSB7XG4gIGNvbnN0IGhvc3QgPSBlbChcImRpdlwiLCBgbW9uYWNvLXRvb2xiYXIgJHtleHRyYUNsYXNzZXN9YCk7XG4gIGNvbnN0IGJhciA9IGVsKFwiZGl2XCIsIFwibW9uYWNvLWFjdGlvbi1iYXJcIik7XG4gIGNvbnN0IGl0ZW1zID0gZWwoXCJ1bFwiLCBcImFjdGlvbnMtY29udGFpbmVyXCIpO1xuICBiYXIuYXBwZW5kKGl0ZW1zKTtcbiAgaG9zdC5hcHBlbmQoYmFyKTtcbiAgcmV0dXJuIHsgaG9zdCwgaXRlbXMgfTtcbn1cblxuY29uc3QgaW5wdXRQYXJ0ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1wYXJ0XCIpO1xuY29uc3QgaW5wdXRBbmRUb29sYmFyID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1hbmQtc2lkZS10b29sYmFyXCIpO1xuY29uc3QgaW5wdXRDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtaW5wdXQtY29udGFpbmVyXCIpO1xuY29uc3QgYXR0YWNobWVudHNDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtYXR0YWNobWVudHMtY29udGFpbmVyXCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBuYXRpdmUgaGlkZXMgaXQgd2hpbGUgZW1wdHlcbmNvbnN0IGF0dGFjaGVkQ29udGV4dCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1hdHRhY2hlZC1jb250ZXh0XCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuYXBwZW5kKGF0dGFjaGVkQ29udGV4dCk7XG5jb25zdCBlZGl0b3JDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtZWRpdG9yLWNvbnRhaW5lclwiKTtcbmNvbnN0IGVkaXRvckhvc3QgPSBlbChcImRpdlwiLCBcImludGVyYWN0aXZlLWlucHV0LWVkaXRvclwiKTtcbi8vIFx1QjEyNFx1Qzc3NFx1RDJGMFx1QkUwQyBcdUM3ODVcdUI4MjVcdUNDM0RcdUM3NDAgTW9uYWNvIFx1QjM3MFx1Q0Y1NFx1QjgwOFx1Qzc3NFx1QzE1OFx1QzczQ1x1Qjg1QyBgL1x1QkE4NVx1QjgzOWBcdTAwQjdgQFx1RDMwQ1x1Qzc3Q2AgXHVEMUEwXHVEMDcwXHVDNUQwIFx1QzBDOVx1Qzc0NCBcdUM3ODVcdUQ3OENcdUIyRTQuXG4vLyB0ZXh0YXJlYSBcdUIyOTQgXHVCRDgwXHVCRDg0IFx1QzJBNFx1RDBDMFx1Qzc3Q1x1Qzc3NCBcdUJEODhcdUFDMDBcdUIyQTVcdUQ1NThcdUJCQzBcdUI4NUMsIFx1QUMxOVx1Qzc0MCBcdUFFMDBcdUFGMzRcdTAwQjdcdUM5MDRcdUJDMTRcdUFGQzggXHVBRERDXHVDRTU5XHVDNzNDXHVCODVDIFx1RDE0RFx1QzJBNFx1RDJCOFx1Qjk3Q1xuLy8gXHVCMkU0XHVDMkRDIFx1QURGOFx1QjlBQ1x1QjI5NCBcdUJCRjhcdUI3RUNcdUI5N0MgXHVCNEE0XHVDNUQwIFx1QUU1NFx1QUNFMCB0ZXh0YXJlYSBcdUFFMDBcdUM3OTBcdUIyOTQgXHVEMjJDXHVCQTg1XHVENTU4XHVBQzhDIFx1QjQ1NFx1QjJFNChcdUNFOTBcdUI3RkZcdUI5Q0MgXHVCQ0Y0XHVDNzg0KS5cbmNvbnN0IGlucHV0TWlycm9yID0gZWwoXCJkaXZcIiwgXCJ2aWJleC1pbnB1dC1taXJyb3JcIik7XG5jb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbnRleHRhcmVhLmNsYXNzTmFtZSA9IFwidmliZXgtaW5wdXRcIjtcbnRleHRhcmVhLnJvd3MgPSAxO1xuZWRpdG9ySG9zdC5hcHBlbmQoaW5wdXRNaXJyb3IsIHRleHRhcmVhKTtcbmVkaXRvckNvbnRhaW5lci5hcHBlbmQoZWRpdG9ySG9zdCk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsICgpID0+IHtcbiAgaW5wdXRNaXJyb3Iuc2Nyb2xsVG9wID0gdGV4dGFyZWEuc2Nyb2xsVG9wO1xufSk7XG5cbmNvbnN0IHRvb2xiYXJzID0gZWwoXCJkaXZcIiwgXCJjaGF0LWlucHV0LXRvb2xiYXJzXCIpO1xuY29uc3QgaW5wdXRUb29sYmFyID0gdG9vbGJhcihcInJlc3BvbnNpdmUgcmVzcG9uc2l2ZS1sYXN0IGNoYXQtaW5wdXQtdG9vbGJhclwiKTtcbmNvbnN0IGV4ZWN1dGVUb29sYmFyID0gdG9vbGJhcihcImNoYXQtZXhlY3V0ZS10b29sYmFyXCIpO1xuY29uc3QgZXhlY3V0ZUl0ZW1zID0gZXhlY3V0ZVRvb2xiYXIuaXRlbXM7XG50b29sYmFycy5hcHBlbmQoaW5wdXRUb29sYmFyLmhvc3QsIGV4ZWN1dGVUb29sYmFyLmhvc3QpO1xuaW5wdXRDb250YWluZXIuYXBwZW5kKGF0dGFjaG1lbnRzQ29udGFpbmVyLCBlZGl0b3JDb250YWluZXIsIHRvb2xiYXJzKTtcbmlucHV0QW5kVG9vbGJhci5hcHBlbmQoaW5wdXRDb250YWluZXIpO1xuaW5wdXRQYXJ0LmFwcGVuZChpbnB1dEFuZFRvb2xiYXIpO1xuXG4vLyBCZWxvdyB0aGUgYm94LCBpbiBuYXRpdmUgb3JkZXI6IGNvbnRleHQtdXNhZ2UgKGVtcHR5KSwgc3RhdHVzIChoaWRkZW4gd2hpbGVcbi8vIGVtcHR5KSwgdGhlbiB0aGUgc2Vjb25kYXJ5IGlucHV0IHRvb2xiYXIgY2FycnlpbmcgdGhlIHNlc3Npb24vb3B0aW9uIHBpbGxzLlxuY29uc3Qgc2Vjb25kYXJ5VG9vbGJhciA9IGVsKFwiZGl2XCIsIFwiY2hhdC1zZWNvbmRhcnktdG9vbGJhclwiKTtcbmNvbnN0IGNvbnRleHRVc2FnZSA9IGVsKFwiZGl2XCIsIFwiY2hhdC1jb250ZXh0LXVzYWdlLWNvbnRhaW5lclwiKTtcbmNvbnN0IHN0YXR1c0NvbnRhaW5lciA9IGVsKFwiZGl2XCIsIFwiY2hhdC1pbnB1dC1zdGF0dXMtY29udGFpbmVyIGhhcy1uby1hY3Rpb25zXCIpO1xuc3RhdHVzQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbmNvbnN0IHNlY29uZGFyeUlucHV0VG9vbGJhciA9IHRvb2xiYXIoXCJyZXNwb25zaXZlIHJlc3BvbnNpdmUtYWxsIGNoYXQtc2Vjb25kYXJ5LWlucHV0LXRvb2xiYXJcIik7XG5zZWNvbmRhcnlUb29sYmFyLmFwcGVuZChjb250ZXh0VXNhZ2UsIHN0YXR1c0NvbnRhaW5lciwgc2Vjb25kYXJ5SW5wdXRUb29sYmFyLmhvc3QpO1xuaW5wdXRQYXJ0LmFwcGVuZChzZWNvbmRhcnlUb29sYmFyKTtcbnJvb3QuYXBwZW5kKGlucHV0UGFydCk7XG5cbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCAoKSA9PiBpbnB1dENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwiZm9jdXNlZFwiKSk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiBpbnB1dENvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKFwiZm9jdXNlZFwiKSk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVuZGVySW5wdXREZWNvcmF0aW9ucyk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgYXV0b0dyb3cpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gIC8vIFRoZSBgL2AgYEBgIHBvcHVwIG93bnMgbmF2aWdhdGlvbiBhbmQgYWNjZXB0IGtleXMgd2hpbGUgaXQgaXMgb3Blbi5cbiAgaWYgKGhhbmRsZUFzc2lzdEtleShldmVudCkpIHJldHVybjtcbiAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSAmJiAhZXZlbnQuaXNDb21wb3NpbmcpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHN1Ym1pdCgpO1xuICB9XG59KTtcblxuLy8gI3JlZ2lvbiBJbnB1dCBkZWNvcmF0aW9ucyAoYC9cdUJBODVcdUI4MzlgXHUwMEI3YEBcdUQzMENcdUM3N0NgIFx1RDFBMFx1RDA3MCBcdUMwQzkgKyBcdUNDQThcdUJEODAgXHVDRTY5KVxuXG4vKiogXHVDNjQ0XHVDMTMxIFx1QzIxOFx1Qjc3RFx1MDBCN1x1QUM4MFx1QzBDOSBcdUFDQjBcdUFDRkNcdUI4NUMgXHVDMkU0XHVDODc0XHVDNzc0IFx1RDY1NVx1Qzc3OFx1QjQxQyBcdUQzMENcdUM3N0NcdUI0RTQuIFx1QUNCRFx1Qjg1QyBcdTIxOTIge25hbWUsIHJlbGF0aXZlUGF0aH0gKi9cbmNvbnN0IGtub3duRmlsZXMgPSBuZXcgTWFwKCk7XG5cbmZ1bmN0aW9uIHJlbWVtYmVyRmlsZShmaWxlKSB7XG4gIGlmIChmaWxlPy5yZWxhdGl2ZVBhdGgpIGtub3duRmlsZXMuc2V0KGZpbGUucmVsYXRpdmVQYXRoLCBmaWxlKTtcbn1cblxuLyoqIFx1RDYwNFx1QzdBQyBcdUM3ODVcdUI4MjVcdUM1RDBcdUMxMUMgXHVDMkU0XHVDODc0IFx1RDMwQ1x1Qzc3Q1x1QUNGQyBcdUI5RTRcdUNFNkRcdUI0MUMgQFx1RDFBMFx1RDA3MFx1QjRFNC4gKi9cbmZ1bmN0aW9uIG1lbnRpb25Ub2tlbnNJblRleHQoKSB7XG4gIGNvbnN0IGZvdW5kID0gW107XG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdGV4dGFyZWEudmFsdWUubWF0Y2hBbGwoLyhefFxccylAKFteXFxzXSspL2cpKSB7XG4gICAgY29uc3QgcGF0aCA9IG1hdGNoWzJdLnJlcGxhY2UoL1suLCE/OjtdKyQvLCBcIlwiKTtcbiAgICBpZiAoa25vd25GaWxlcy5oYXMocGF0aCkpIGZvdW5kLnB1c2gocGF0aCk7XG4gIH1cbiAgcmV0dXJuIFsuLi5uZXcgU2V0KGZvdW5kKV07XG59XG5cbi8qKiBcdUM3ODVcdUI4MjUgXHVEMTREXHVDMkE0XHVEMkI4XHVCOTdDIFx1QkJGOFx1QjdFQ1x1QzVEMCBcdUIyRTRcdUMyREMgXHVBREY4XHVCOUFDXHVCQTcwIFx1QzcyMFx1RDZBOCBcdUQxQTBcdUQwNzBcdUM1RDBcdUI5Q0MgXHVDMEM5XHVDNzQ0IFx1Qzc4NVx1RDc4Q1x1QjJFNC4gKi9cbmZ1bmN0aW9uIHJlbmRlcklucHV0RGVjb3JhdGlvbnMoKSB7XG4gIGNvbnN0IHZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG4gIGlucHV0TWlycm9yLnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gIC8vIFx1QkIzOFx1QzExQyBcdUMyRENcdUM3OTFcdUM3NTggXHVDMkFDXHVCNzk4XHVDMkRDIFx1QkE4NVx1QjgzOSBcdTIwMTQgXHVDMkU0XHVDODFDIFx1QjRGMVx1Qjg1RFx1QjQxQyBcdUJBODVcdUI4MzlcdUM3N0MgXHVCNTRDXHVCOUNDIFx1RDFBMFx1RDA3MFx1QzczQ1x1Qjg1QyBcdUNERThcdUFFMDkuXG4gIGxldCByZXN0ID0gdmFsdWU7XG4gIGNvbnN0IHNsYXNoID0gdmFsdWUubWF0Y2goL15cXC9bXFx3LV0rLyk7XG4gIGlmIChzbGFzaCAmJiBTTEFTSF9DT01NQU5EUy5zb21lKChjb21tYW5kKSA9PiBjb21tYW5kLnZhbHVlID09PSBzbGFzaFswXSkpIHtcbiAgICBpbnB1dE1pcnJvci5hcHBlbmQoZWwoXCJzcGFuXCIsIFwidmliZXgtdG9rZW5cIiwgc2xhc2hbMF0pKTtcbiAgICByZXN0ID0gdmFsdWUuc2xpY2Uoc2xhc2hbMF0ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIEBcdUQzMENcdUM3N0MgXHVEMUEwXHVEMDcwIFx1MjAxNCBrbm93bkZpbGVzIFx1QzVEMCBcdUM3ODhcdUIyOTQgXHVBQ0JEXHVCODVDXHVCOUNDIFx1QzBDOVx1Qzc0NCBcdUM3ODVcdUQ3OENcdUIyRTQuXG4gIGxldCBjdXJzb3IgPSAwO1xuICBmb3IgKGNvbnN0IG1hdGNoIG9mIHJlc3QubWF0Y2hBbGwoLyhefFxccylAKFteXFxzXSspL2cpKSB7XG4gICAgY29uc3QgY2xlYW4gPSBtYXRjaFsyXS5yZXBsYWNlKC9bLiwhPzo7XSskLywgXCJcIik7XG4gICAgaWYgKCFrbm93bkZpbGVzLmhhcyhjbGVhbikpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRva2VuU3RhcnQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzFdLmxlbmd0aDtcbiAgICBjb25zdCB0b2tlbkVuZCA9IHRva2VuU3RhcnQgKyAxICsgY2xlYW4ubGVuZ3RoOyAvLyAnQCcgKyBcdUFDQkRcdUI4NUNcbiAgICBpbnB1dE1pcnJvci5hcHBlbmQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocmVzdC5zbGljZShjdXJzb3IsIHRva2VuU3RhcnQpKSk7XG4gICAgaW5wdXRNaXJyb3IuYXBwZW5kKGVsKFwic3BhblwiLCBcInZpYmV4LXRva2VuXCIsIGBAJHtjbGVhbn1gKSk7XG4gICAgY3Vyc29yID0gdG9rZW5FbmQ7XG4gIH1cbiAgaW5wdXRNaXJyb3IuYXBwZW5kKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJlc3Quc2xpY2UoY3Vyc29yKSkpO1xuICBpbnB1dE1pcnJvci5zY3JvbGxUb3AgPSB0ZXh0YXJlYS5zY3JvbGxUb3A7XG4gIHJlbmRlckF0dGFjaG1lbnRQaWxscygpO1xufVxuXG4vKiogQFx1RDFBMFx1RDA3MFx1QUNGQyAxOjEgXHVCODVDIFx1QjMwMFx1Qzc1MVx1RDU1OFx1QjI5NCBcdUNDQThcdUJEODAgXHVDRTY5LiBcdUNFNjlcdUM3NTggXHUyNzE1IFx1QjI5NCBcdUJDRjhcdUJCMzggXHVEMUEwXHVEMDcwXHVCM0M0IFx1RDU2OFx1QUVEOCBcdUM5QzBcdUM2QjRcdUIyRTQuICovXG5mdW5jdGlvbiByZW5kZXJBdHRhY2htZW50UGlsbHMoKSB7XG4gIGNvbnN0IHRva2VucyA9IG1lbnRpb25Ub2tlbnNJblRleHQoKTtcbiAgYXR0YWNoZWRDb250ZXh0LnJlcGxhY2VDaGlsZHJlbigpO1xuICBhdHRhY2htZW50c0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gdG9rZW5zLmxlbmd0aCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgZm9yIChjb25zdCBwYXRoIG9mIHRva2Vucykge1xuICAgIGNvbnN0IGZpbGUgPSBrbm93bkZpbGVzLmdldChwYXRoKTtcbiAgICBjb25zdCBwaWxsID0gZWwoXCJkaXZcIiwgXCJjaGF0LWF0dGFjaGVkLWNvbnRleHQtYXR0YWNobWVudFwiKTtcbiAgICBjb25zdCBsYWJlbCA9IGVsKFwic3BhblwiLCBcIm1vbmFjby1pY29uLWxhYmVsXCIpO1xuICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwiZmlsZVwiKSwgZWwoXCJzcGFuXCIsIFwidmliZXgtcGlsbC1uYW1lXCIsIGZpbGUubmFtZSB8fCBwYXRoKSk7XG4gICAgY29uc3QgcmVtb3ZlID0gZWwoXCJhXCIsIFwidmliZXgtcGlsbC1yZW1vdmVcIik7XG4gICAgcmVtb3ZlLnRpdGxlID0gXCJcdUNDQThcdUJEODAgXHVENTc0XHVDODFDXCI7XG4gICAgcmVtb3ZlLmFwcGVuZChjb2RpY29uKFwiY2xvc2VcIikpO1xuICAgIHJlbW92ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgZXNjYXBlZCA9IHBhdGgucmVwbGFjZSgvWy4qKz9eXFwke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChgKF58XFxcXHMpQCR7ZXNjYXBlZH0oPz1cXFxcc3wkKVxcXFxzP2AsIFwiZ1wiKTtcbiAgICAgIHRleHRhcmVhLnZhbHVlID0gdGV4dGFyZWEudmFsdWUucmVwbGFjZShwYXR0ZXJuLCBcIiQxXCIpLnJlcGxhY2UoLyAgKy9nLCBcIiBcIikudHJpbVN0YXJ0KCk7XG4gICAgICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgICAgIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgfSk7XG4gICAgcGlsbC5hcHBlbmQobGFiZWwsIHJlbW92ZSk7XG4gICAgYXR0YWNoZWRDb250ZXh0LmFwcGVuZChwaWxsKTtcbiAgfVxufVxuXG4vKiogdGV4dGFyZWEudmFsdWUgXHVCOTdDIFx1Q0Y1NFx1QjREQ1x1Qjg1QyBcdUJDMTRcdUFGQkMgXHVCQUE4XHVCNEUwIFx1QzlDMFx1QzgxMFx1QzVEMFx1QzExQyBcdUQ2MzhcdUNEOUNcdUQ1NThcdUIyOTQgXHVCMkU4XHVDNzdDIFx1QUMzMVx1QzJFMFx1QzgxMC4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb3NlcigpIHtcbiAgYXV0b0dyb3coKTtcbiAgc3luY1NlbmRFbmFibGVkKCk7XG4gIHJlbmRlcklucHV0RGVjb3JhdGlvbnMoKTtcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG5mdW5jdGlvbiBhdXRvR3JvdygpIHtcbiAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRleHRhcmVhLnNjcm9sbEhlaWdodCwgMjQwKX1weGA7XG4gIC8vIFRoZSBwb3B1cCBmbG9hdHMgaW4gdmlld3BvcnQgc3BhY2UsIHNvIGl0IG11c3QgZm9sbG93IHRoZSBib3ggYXMgaXQgZ3Jvd3MuXG4gIGlmIChhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikgcG9zaXRpb25Bc3Npc3QoKTtcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIENvbXBvc2VyIGFzc2lzdCAoYC9gIGNvbW1hbmRzIGFuZCBgQGAgZmlsZSBtZW50aW9ucylcblxuLy8gQXBwZW5kZWQgdG8gPGJvZHk+LCBub3QgdG8gdGhlIGNvbXBvc2VyOiBldmVyeSBjb21wb3NlciBhbmNlc3RvciBzZXRzXG4vLyBgb3ZlcmZsb3c6IGhpZGRlbmAsIHNvIGEgcG9wdXAgcGFyZW50ZWQgdGhlcmUgaXMgY2xpcHBlZCBhd2F5IGFuZCBuZXZlclxuLy8gYmVjb21lcyB2aXNpYmxlLiBJdCBpcyBwb3NpdGlvbmVkIGFnYWluc3QgdGhlIGlucHV0IGJveCBpbiB2aWV3cG9ydCBzcGFjZVxuLy8gYnkgYHBvc2l0aW9uQXNzaXN0KClgIGluc3RlYWQuXG5jb25zdCBhc3Npc3RQb3B1cCA9IGVsKFwiZGl2XCIsIFwidmliZXgtbWVudSB2aWJleC1hc3Npc3RcIik7XG5hc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5kb2N1bWVudC5ib2R5LmFwcGVuZChhc3Npc3RQb3B1cCk7XG5cbi8qKiBQbGFjZXMgdGhlIHBvcHVwIGRpcmVjdGx5IGFib3ZlIHRoZSBpbnB1dCBib3gsIGZsaXBwaW5nIGJlbG93IGlmIG5lZWRlZC4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uQXNzaXN0KCkge1xuICBjb25zdCBhbmNob3IgPSBpbnB1dENvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgYXNzaXN0UG9wdXAuc3R5bGUubGVmdCA9IGAke2FuY2hvci5sZWZ0fXB4YDtcbiAgYXNzaXN0UG9wdXAuc3R5bGUud2lkdGggPSBgJHthbmNob3Iud2lkdGh9cHhgO1xuICBjb25zdCBoZWlnaHQgPSBhc3Npc3RQb3B1cC5vZmZzZXRIZWlnaHQ7XG4gIGNvbnN0IGFib3ZlID0gYW5jaG9yLnRvcCAtIGhlaWdodCAtIDQ7XG4gIGFzc2lzdFBvcHVwLnN0eWxlLnRvcCA9IGAke2Fib3ZlID49IDQgPyBhYm92ZSA6IGFuY2hvci5ib3R0b20gKyA0fXB4YDtcbn1cblxuLyoqIFRoZSBgL1x1MjAyNmAgb3IgYEBcdTIwMjZgIHRva2VuIHRoZSBjYXJldCBjdXJyZW50bHkgc2l0cyBpbiwgaWYgYW55LiAqL1xuZnVuY3Rpb24gYXNzaXN0VG9rZW5BdENhcmV0KCkge1xuICBjb25zdCBjYXJldCA9IHRleHRhcmVhLnNlbGVjdGlvblN0YXJ0ID8/IHRleHRhcmVhLnZhbHVlLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2ggPSB0ZXh0YXJlYS52YWx1ZS5zbGljZSgwLCBjYXJldCkubWF0Y2goLyhefFxccykoWy9AXVteXFxzXSopJC91KTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRva2VuID0gbWF0Y2hbMl07XG4gIHJldHVybiB7IHRva2VuLCBzdGFydDogY2FyZXQgLSB0b2tlbi5sZW5ndGgsIGVuZDogY2FyZXQgfTtcbn1cblxuZnVuY3Rpb24gY2xvc2VBc3Npc3QoKSB7XG4gIHN0YXRlLmFzc2lzdEl0ZW1zID0gW107XG4gIHN0YXRlLmFzc2lzdFJhbmdlID0gbnVsbDtcbiAgYXNzaXN0UG9wdXAuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBhc3Npc3RQb3B1cC5yZXBsYWNlQ2hpbGRyZW4oKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQXNzaXN0KCkge1xuICBjb25zdCByYW5nZSA9IGFzc2lzdFRva2VuQXRDYXJldCgpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgY2xvc2VBc3Npc3QoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgc3RhdGUuYXNzaXN0UmFuZ2UgPSByYW5nZTtcbiAgc3RhdGUuYXNzaXN0SW5kZXggPSAwO1xuXG4gIGlmIChyYW5nZS50b2tlbi5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gcmFuZ2UudG9rZW4udG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICBzdGF0ZS5hc3Npc3RJdGVtcyA9IFNMQVNIX0NPTU1BTkRTXG4gICAgICAuZmlsdGVyKChjb21tYW5kKSA9PiBjb21tYW5kLnZhbHVlLnN0YXJ0c1dpdGgocXVlcnkpKVxuICAgICAgLm1hcCgoY29tbWFuZCkgPT4gKHsga2luZDogXCJjb21tYW5kXCIsIGxhYmVsOiBjb21tYW5kLnZhbHVlLCAuLi5jb21tYW5kIH0pKTtcbiAgICByZW5kZXJBc3Npc3QoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBGaWxlcyBhcnJpdmUgYXN5bmNocm9ub3VzbHk7IHJlbmRlciB3aGF0IGlzIGFscmVhZHkgY2FjaGVkIHNvIHRoZSBwb3B1cFxuICAvLyBvcGVucyBvbiB0aGUgZmlyc3Qga2V5c3Ryb2tlIGluc3RlYWQgb2YgYWZ0ZXIgdGhlIHJvdW5kLXRyaXAuXG4gIHN0YXRlLmFzc2lzdEl0ZW1zID0gbWVudGlvbkl0ZW1zKHJhbmdlLnRva2VuLnNsaWNlKDEpKTtcbiAgcmVuZGVyQXNzaXN0KCk7XG4gIHN0YXRlLm1lbnRpb25SZXF1ZXN0SWQgPSBgbWVudGlvbi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMil9YDtcbiAgcG9zdCh7IHR5cGU6IFwic2VhcmNoTWVudGlvbnNcIiwgcmVxdWVzdElkOiBzdGF0ZS5tZW50aW9uUmVxdWVzdElkLCBxdWVyeTogcmFuZ2UudG9rZW4uc2xpY2UoMSkgfSk7XG59XG5cbi8qKiBDYWNoZWQgbWVudGlvbiBjYW5kaWRhdGVzIG5hcnJvd2VkIGJ5IHRoZSB0eXBlZCBwcmVmaXguICovXG5mdW5jdGlvbiBtZW50aW9uSXRlbXMocXVlcnkpIHtcbiAgY29uc3QgbmVlZGxlID0gU3RyaW5nKHF1ZXJ5IHx8IFwiXCIpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gIHJldHVybiBzdGF0ZS5tZW50aW9uRmlsZXNcbiAgICAuZmlsdGVyKChmaWxlKSA9PiAhbmVlZGxlIHx8IGZpbGUucmVsYXRpdmVQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuaW5jbHVkZXMobmVlZGxlKSlcbiAgICAubWFwKChmaWxlKSA9PiAoeyBraW5kOiBcImZpbGVcIiwgbGFiZWw6IGZpbGUubmFtZSwgZGVzY3JpcHRpb246IGZpbGUucmVsYXRpdmVQYXRoLCBmaWxlIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXNzaXN0KCkge1xuICBpZiAoIXN0YXRlLmFzc2lzdFJhbmdlIHx8ICFzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGgpIHtcbiAgICBhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgYXNzaXN0UG9wdXAucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdGF0ZS5hc3Npc3RJbmRleCA+PSBzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGgpIHN0YXRlLmFzc2lzdEluZGV4ID0gMDtcbiAgYXNzaXN0UG9wdXAucmVwbGFjZUNoaWxkcmVuKFxuICAgIC4uLnN0YXRlLmFzc2lzdEl0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IGVsKFwiZGl2XCIsIGB2aWJleC1tZW51LWl0ZW0ke2luZGV4ID09PSBzdGF0ZS5hc3Npc3RJbmRleCA/IFwiIGNoZWNrZWRcIiA6IFwiXCJ9YCk7XG4gICAgICByb3cuYXBwZW5kKFxuICAgICAgICBjb2RpY29uKGl0ZW0ua2luZCA9PT0gXCJmaWxlXCIgPyBcImZpbGVcIiA6IFwidGVybWluYWxcIiksXG4gICAgICAgIGVsKFwic3BhblwiLCBcInZpYmV4LWFzc2lzdC1sYWJlbFwiLCBpdGVtLmxhYmVsKSxcbiAgICAgICAgZWwoXCJzcGFuXCIsIFwidmliZXgtYXNzaXN0LWRlc2NyaXB0aW9uXCIsIGl0ZW0uZGVzY3JpcHRpb24gfHwgXCJcIiksXG4gICAgICApO1xuICAgICAgLy8gS2VlcCBmb2N1cyBpbiB0aGUgdGV4dGFyZWEgc28gdGhlIGNhcmV0IG9mZnNldHMgc3RheSB2YWxpZC5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGFwcGx5QXNzaXN0KGluZGV4KSk7XG4gICAgICByZXR1cm4gcm93O1xuICAgIH0pLFxuICApO1xuICBhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgcG9zaXRpb25Bc3Npc3QoKTtcbn1cblxuLyoqIFN3YXBzIHRoZSB0cmFja2VkIHRva2VuIGZvciBgcmVwbGFjZW1lbnRgIGFuZCBwdXRzIHRoZSBjYXJldCBhZnRlciBpdC4gKi9cbmZ1bmN0aW9uIHJlcGxhY2VBc3Npc3RUb2tlbihyZXBsYWNlbWVudCkge1xuICBjb25zdCByYW5nZSA9IHN0YXRlLmFzc2lzdFJhbmdlIHx8IGFzc2lzdFRva2VuQXRDYXJldCgpO1xuICBpZiAoIXJhbmdlKSByZXR1cm47XG4gIGNvbnN0IHZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG4gIHRleHRhcmVhLnZhbHVlID0gdmFsdWUuc2xpY2UoMCwgcmFuZ2Uuc3RhcnQpICsgcmVwbGFjZW1lbnQgKyB2YWx1ZS5zbGljZShyYW5nZS5lbmQpO1xuICBjb25zdCBjYXJldCA9IHJhbmdlLnN0YXJ0ICsgcmVwbGFjZW1lbnQubGVuZ3RoO1xuICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZShjYXJldCwgY2FyZXQpO1xuICBhdXRvR3JvdygpO1xuICBzeW5jU2VuZEVuYWJsZWQoKTtcbiAgcmVuZGVySW5wdXREZWNvcmF0aW9ucygpO1xufVxuXG5mdW5jdGlvbiBhcHBseUFzc2lzdChpbmRleCkge1xuICBjb25zdCBpdGVtID0gc3RhdGUuYXNzaXN0SXRlbXNbaW5kZXhdO1xuICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgaWYgKGl0ZW0ua2luZCA9PT0gXCJjb21tYW5kXCIgJiYgaXRlbS5hY3Rpb24gPT09IFwiY2xlYXJcIikge1xuICAgIHRleHRhcmVhLnZhbHVlID0gXCJcIjtcbiAgICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgfSBlbHNlIGlmIChpdGVtLmtpbmQgPT09IFwiY29tbWFuZFwiKSB7XG4gICAgcmVwbGFjZUFzc2lzdFRva2VuKGl0ZW0ucHJvbXB0IHx8IGAke2l0ZW0udmFsdWV9IGApO1xuICB9IGVsc2Uge1xuICAgIHJlbWVtYmVyRmlsZShpdGVtLmZpbGUpO1xuICAgIHJlcGxhY2VBc3Npc3RUb2tlbihgQCR7aXRlbS5maWxlLnJlbGF0aXZlUGF0aH0gYCk7XG4gIH1cbiAgY2xvc2VBc3Npc3QoKTtcbiAgdGV4dGFyZWEuZm9jdXMoKTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBwb3B1cCBjb25zdW1lZCB0aGUga2V5LiAqL1xuZnVuY3Rpb24gaGFuZGxlQXNzaXN0S2V5KGV2ZW50KSB7XG4gIGlmIChhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCAhc3RhdGUuYXNzaXN0SXRlbXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgfHwgZXZlbnQua2V5ID09PSBcIkFycm93VXBcIikge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgZGVsdGEgPSBldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgPyAxIDogLTE7XG4gICAgY29uc3QgY291bnQgPSBzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGg7XG4gICAgc3RhdGUuYXNzaXN0SW5kZXggPSAoc3RhdGUuYXNzaXN0SW5kZXggKyBkZWx0YSArIGNvdW50KSAlIGNvdW50O1xuICAgIHJlbmRlckFzc2lzdCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICgoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5ID09PSBcIlRhYlwiKSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmlzQ29tcG9zaW5nKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBhcHBseUFzc2lzdChzdGF0ZS5hc3Npc3RJbmRleCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2xvc2VBc3Npc3QoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB1cGRhdGVBc3Npc3QpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHVwZGF0ZUFzc2lzdCk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiBzZXRUaW1lb3V0KGNsb3NlQXNzaXN0LCAxMjApKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsICgpID0+IHtcbiAgaWYgKGFzc2lzdFBvcHVwLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSBwb3NpdGlvbkFzc2lzdCgpO1xufSk7XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBQaWNrZXJzIChtb2RlbCAvIGVmZm9ydCAvIGFwcHJvdmFsIC8gaGlzdG9yeSlcblxubGV0IG9wZW5NZW51ID0gbnVsbDtcblxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICBpZiAob3Blbk1lbnUpIHtcbiAgICBvcGVuTWVudS5yZW1vdmUoKTtcbiAgICBvcGVuTWVudSA9IG51bGw7XG4gIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICBpZiAob3Blbk1lbnUgJiYgIW9wZW5NZW51LmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIGNsb3NlTWVudSgpO1xufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGF0dGFjaE1lbnUoaG9zdCwgaXRlbXMsIG9uUGljaykge1xuICByZXR1cm4gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAob3Blbk1lbnUgJiYgb3Blbk1lbnUuZGF0YXNldC5vd25lciA9PT0gaG9zdC5kYXRhc2V0LnBpY2tlcklkKSB7XG4gICAgICBjbG9zZU1lbnUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2xvc2VNZW51KCk7XG4gICAgY29uc3QgbWVudSA9IGVsKFwiZGl2XCIsIFwidmliZXgtbWVudVwiKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMoKSkge1xuICAgICAgaWYgKGl0ZW0uZ3JvdXApIHtcbiAgICAgICAgbWVudS5hcHBlbmQoZWwoXCJkaXZcIiwgXCJ2aWJleC1tZW51LWdyb3VwXCIsIGl0ZW0uZ3JvdXApKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByb3cgPSBlbChcImRpdlwiLCBgdmliZXgtbWVudS1pdGVtJHtpdGVtLmNoZWNrZWQgPyBcIiBjaGVja2VkXCIgOiBcIlwifWApO1xuICAgICAgcm93LmFwcGVuZChpdGVtLmNoZWNrZWQgPyBjb2RpY29uKFwiY2hlY2tcIikgOiBlbChcInNwYW5cIiwgXCJjb2RpY29uXCIpKTtcbiAgICAgIHJvdy5hcHBlbmQoZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgaXRlbS5sYWJlbCkpO1xuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICBvblBpY2soaXRlbS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG1lbnUuYXBwZW5kKHJvdyk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGNvbXBvc2VyJ3MgYW5jZXN0b3JzIGFsbCBjbGlwIG92ZXJmbG93ICh0aGUgd29ya2JlbmNoIHJlbmRlcnMgaXRzXG4gICAgLy8gZHJvcGRvd25zIGluIGFuIG92ZXJsYXkgY29udGFpbmVyIGZvciB0aGUgc2FtZSByZWFzb24pLCBzbyB0aGUgbWVudSBpc1xuICAgIC8vIGFwcGVuZGVkIHRvIDxib2R5PiBhbmQgcG9zaXRpb25lZCBhZ2FpbnN0IHRoZSBhbmNob3IgaW4gdmlld3BvcnQgc3BhY2UuXG4gICAgaG9zdC5kYXRhc2V0LnBpY2tlcklkIHx8PSBgcGlja2VyLSR7KytwaWNrZXJJZFNlcX1gO1xuICAgIG1lbnUuZGF0YXNldC5vd25lciA9IGhvc3QuZGF0YXNldC5waWNrZXJJZDtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZChtZW51KTtcbiAgICBjb25zdCBhbmNob3IgPSBob3N0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGhlaWdodCA9IG1lbnUub2Zmc2V0SGVpZ2h0O1xuICAgIGNvbnN0IHRvcCA9IGFuY2hvci50b3AgLSBoZWlnaHQgLSA0O1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke01hdGgubWF4KDQsIE1hdGgubWluKGFuY2hvci5sZWZ0LCB3aW5kb3cuaW5uZXJXaWR0aCAtIG1lbnUub2Zmc2V0V2lkdGggLSA0KSl9cHhgO1xuICAgIC8vIEZsaXAgYmVsb3cgdGhlIGFuY2hvciB3aGVuIHRoZXJlIGlzIG5vdCBlbm91Z2ggcm9vbSBhYm92ZS5cbiAgICBtZW51LnN0eWxlLnRvcCA9IGAke3RvcCA+PSA0ID8gdG9wIDogYW5jaG9yLmJvdHRvbSArIDR9cHhgO1xuICAgIG9wZW5NZW51ID0gbWVudTtcbiAgfTtcbn1cbmxldCBwaWNrZXJJZFNlcSA9IDA7XG5cbi8qKlxuICogVGhlIG1vZGVsIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtaW5wdXQtcGlja2VyLWl0ZW0gPiBkaXYuYWN0aW9uLWxhYmVsLm1vZGVsLXBpY2tlci1zcGxpdCA+XG4gKiAgIGEubW9kZWwtcGlja2VyLXNlY3Rpb24ubW9kZWwtcGlja2VyLW5hbWUgPiBbY29kaWNvbiwgLmNoYXQtaW5wdXQtcGlja2VyLWxhYmVsXVxuICovXG5mdW5jdGlvbiBtb2RlbFBpY2tlclBpbGwoeyBpdGVtcywgb25QaWNrIH0pIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBjaGF0LWlucHV0LXBpY2tlci1pdGVtIHZpYmV4LXBpY2tlci1ob3N0XCIpO1xuICBjb25zdCBzcGxpdCA9IGVsKFwiZGl2XCIsIFwiYWN0aW9uLWxhYmVsIG1vZGVsLXBpY2tlci1zcGxpdFwiKTtcbiAgY29uc3Qgc2VjdGlvbiA9IGVsKFwiYVwiLCBcIm1vZGVsLXBpY2tlci1zZWN0aW9uIG1vZGVsLXBpY2tlci1uYW1lXCIpO1xuICBzZWN0aW9uLmFwcGVuZChjb2RpY29uKFwiY2hhdC1tb2RlbC1wcm92aWRlci1nZW5lcmljXCIpKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1pbnB1dC1waWNrZXItbGFiZWxcIiwgXCJcdUFFMzBcdUJDRjggXHVCQUE4XHVCMzc4XCIpO1xuICBzZWN0aW9uLmFwcGVuZChsYWJlbFNwYW4pO1xuICBzcGxpdC5hcHBlbmQoc2VjdGlvbik7XG4gIGhvc3QuYXBwZW5kKHNwbGl0KTtcbiAgc2VjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShob3N0LCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3QsIGxhYmVsU3BhbiB9O1xufVxuXG4vKipcbiAqIEEgc2Vjb25kYXJ5LXRvb2xiYXIgb3B0aW9uIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXIgPiBkaXYuYWN0aW9uLWl0ZW0uY2hhdC1zZXNzaW9uUGlja2VyLWl0ZW0gPlxuICogICBkaXYubW9uYWNvLWRyb3Bkb3duID4gZGl2LmRyb3Bkb3duLWxhYmVsID4gYS5hY3Rpb24tbGFiZWwuY2hhdC1zZXNzaW9uLW9wdGlvbi1waWNrZXIgPlxuICogICAgIHNwYW4uY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFxuICovXG5mdW5jdGlvbiBvcHRpb25QaWNrZXJQaWxsKHsgbGFiZWwsIGl0ZW1zLCBvblBpY2sgfSkge1xuICBjb25zdCBpdGVtID0gZWwoXCJkaXZcIiwgXCJhY3Rpb24taXRlbSBjaGF0LXNlc3Npb25QaWNrZXItaXRlbSB2aWJleC1waWNrZXItaG9zdFwiKTtcbiAgY29uc3QgZHJvcGRvd24gPSBlbChcImRpdlwiLCBcIm1vbmFjby1kcm9wZG93blwiKTtcbiAgY29uc3QgZHJvcGRvd25MYWJlbCA9IGVsKFwiZGl2XCIsIFwiZHJvcGRvd24tbGFiZWxcIik7XG4gIGNvbnN0IGFuY2hvciA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjaGF0LXNlc3Npb24tb3B0aW9uLXBpY2tlclwiKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFwiLCBsYWJlbCk7XG4gIGFuY2hvci5hcHBlbmQobGFiZWxTcGFuKTtcbiAgZHJvcGRvd25MYWJlbC5hcHBlbmQoYW5jaG9yKTtcbiAgZHJvcGRvd24uYXBwZW5kKGRyb3Bkb3duTGFiZWwpO1xuICBpdGVtLmFwcGVuZChkcm9wZG93bik7XG4gIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShpdGVtLCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3Q6IGl0ZW0sIGxhYmVsU3BhbiB9O1xufVxuXG5jb25zdCBtb2RlbFBpY2tlciA9IG1vZGVsUGlja2VyUGlsbCh7XG4gIGl0ZW1zOiBtb2RlbEl0ZW1zLFxuICBvblBpY2s6IChpZCkgPT4ge1xuICAgIHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9IGlkO1xuICAgIHBvc3QoeyB0eXBlOiBcInNldE9wdGlvblwiLCBpZDogXCJtb2RlbFwiLCB2YWx1ZTogaWQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGVmZm9ydFBpY2tlciA9IG9wdGlvblBpY2tlclBpbGwoe1xuICBsYWJlbDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCIsXG4gIGl0ZW1zOiBlZmZvcnRJdGVtcyxcbiAgb25QaWNrOiAoaWQpID0+IHtcbiAgICBzdGF0ZS5vcHRpb25zLmVmZm9ydCA9IGlkID09PSBcIl9fZGVmYXVsdF9fXCIgPyBcIlwiIDogaWQ7XG4gICAgcG9zdCh7IHR5cGU6IFwic2V0T3B0aW9uXCIsIGlkOiBcImVmZm9ydFwiLCB2YWx1ZTogc3RhdGUub3B0aW9ucy5lZmZvcnQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGFwcHJvdmFsUGlja2VyID0gb3B0aW9uUGlja2VyUGlsbCh7XG4gIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIixcbiAgaXRlbXM6IGFwcHJvdmFsSXRlbXMsXG4gIG9uUGljazogKGlkKSA9PiB7XG4gICAgc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUgPSBpZDtcbiAgICBwb3N0KHsgdHlwZTogXCJzZXRPcHRpb25cIiwgaWQ6IFwiYXBwcm92YWxNb2RlXCIsIHZhbHVlOiBpZCB9KTtcbiAgICByZW5kZXJQaWNrZXJzKCk7XG4gIH0sXG59KTtcblxuLy8gXCIrIFwiIGF0dGFjaCBhY3Rpb24gXHUyMDE0IGxpLmFjdGlvbi1pdGVtLm1lbnUtZW50cnkgPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYWRkLWNvbXBhY3RcbmNvbnN0IGF0dGFjaEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeVwiKTtcbmNvbnN0IGF0dGFjaEJ1dHRvbiA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjb2RpY29uIGNvZGljb24tYWRkLWNvbXBhY3RcIik7XG5hdHRhY2hCdXR0b24udGl0bGUgPSBcIlx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOCBcdUQzMENcdUM3N0MgXHVDQ0E4XHVCRDgwXCI7XG5hdHRhY2hJdGVtLmFwcGVuZChhdHRhY2hCdXR0b24pO1xuYXR0YWNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBwb3N0KHsgdHlwZTogXCJwaWNrQXR0YWNobWVudFwiIH0pKTtcbmlucHV0VG9vbGJhci5pdGVtcy5hcHBlbmQoYXR0YWNoSXRlbSwgbW9kZWxQaWNrZXIuaG9zdCk7XG5cbmNvbnN0IG9wdGlvbkNvbnRhaW5lciA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBjaGF0LXNlc3Npb25QaWNrZXItY29udGFpbmVyXCIpO1xub3B0aW9uQ29udGFpbmVyLmFwcGVuZChlZmZvcnRQaWNrZXIuaG9zdCwgYXBwcm92YWxQaWNrZXIuaG9zdCk7XG5zZWNvbmRhcnlJbnB1dFRvb2xiYXIuaXRlbXMuYXBwZW5kKG9wdGlvbkNvbnRhaW5lcik7XG5cbi8vIFN1Ym1pdCBcdTIwMTQgbGkuYWN0aW9uLWl0ZW0ubWVudS1lbnRyeS5jaGF0LXN1Ym1pdC1idXR0b24gPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYXJyb3ctdXAtY29tcGFjdFxuY29uc3Qgc2VuZEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeSBjaGF0LXN1Ym1pdC1idXR0b25cIik7XG5jb25zdCBzZW5kQnV0dG9uID0gZWwoXCJhXCIsIFwiYWN0aW9uLWxhYmVsIGNvZGljb24gY29kaWNvbi1hcnJvdy11cC1jb21wYWN0XCIpO1xuc2VuZEJ1dHRvbi50aXRsZSA9IFwiXHVCQ0Y0XHVCMEI0XHVBRTMwIChFbnRlcilcIjtcbnNlbmRJdGVtLmFwcGVuZChzZW5kQnV0dG9uKTtcbmV4ZWN1dGVJdGVtcy5hcHBlbmQoc2VuZEl0ZW0pO1xuc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0KTtcblxuLy8gU3RvcCBcdTIwMTQgdGhlIHdvcmtiZW5jaCBzd2FwcyB0aGUgc3VibWl0IGFjdGlvbiBmb3IgdGhpcyBvbmUgd2hpbGUgYSByZXNwb25zZSBpc1xuLy8gc3RyZWFtaW5nLCBzbyB0aGUgY29tcG9zZXIgY2FycmllcyBib3RoIGFuZCBzaG93cyBleGFjdGx5IG9uZSBhdCBhIHRpbWUuXG5jb25zdCBzdG9wSXRlbSA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBtZW51LWVudHJ5IGNoYXQtc3RvcC1idXR0b25cIik7XG5jb25zdCBzdG9wQnV0dG9uID0gZWwoXCJhXCIsIFwiYWN0aW9uLWxhYmVsIGNvZGljb24gY29kaWNvbi1zdG9wLWNpcmNsZVwiKTtcbnN0b3BCdXR0b24udGl0bGUgPSBcIlx1QzBERFx1QzEzMSBcdUM5MTFcdUM5QzBcIjtcbnN0b3BJdGVtLmFwcGVuZChzdG9wQnV0dG9uKTtcbmV4ZWN1dGVJdGVtcy5hcHBlbmQoc3RvcEl0ZW0pO1xuc3RvcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICBpZiAoIXN0YXRlLmJ1c3kpIHJldHVybjtcbiAgc3RvcEl0ZW0uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICBzdG9wQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgcG9zdCh7IHR5cGU6IFwiY2FuY2VsXCIgfSk7XG59KTtcblxuLy8gTmF0aXZlIHN1Ym1pdCBidXR0b24gZ3JleXMgb3V0IHdoaWxlIHRoZXJlIGlzIG5vdGhpbmcgdG8gc2VuZCBcdTIwMTQgdGhlXG4vLyB3b3JrYmVuY2ggcHV0cyAuZGlzYWJsZWQgb24gYm90aCB0aGUgaXRlbSBhbmQgdGhlIGxhYmVsLlxuZnVuY3Rpb24gc3luY1NlbmRFbmFibGVkKCkge1xuICBpbnB1dENvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwid29ya2luZ1wiLCBzdGF0ZS5idXN5KTtcbiAgc2VuZEl0ZW0uc3R5bGUuZGlzcGxheSA9IHN0YXRlLmJ1c3kgPyBcIm5vbmVcIiA6IFwiXCI7XG4gIHN0b3BJdGVtLnN0eWxlLmRpc3BsYXkgPSBzdGF0ZS5idXN5ID8gXCJcIiA6IFwibm9uZVwiO1xuICBpZiAoIXN0YXRlLmJ1c3kpIHtcbiAgICBzdG9wSXRlbS5jbGFzc0xpc3QucmVtb3ZlKFwiZGlzYWJsZWRcIik7XG4gICAgc3RvcEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiZGlzYWJsZWRcIik7XG4gIH1cbiAgY29uc3QgZGlzYWJsZWQgPSAhdGV4dGFyZWEudmFsdWUudHJpbSgpIHx8IHN0YXRlLmJ1c3k7XG4gIHNlbmRJdGVtLmNsYXNzTGlzdC50b2dnbGUoXCJkaXNhYmxlZFwiLCBkaXNhYmxlZCk7XG4gIHNlbmRCdXR0b24uY2xhc3NMaXN0LnRvZ2dsZShcImRpc2FibGVkXCIsIGRpc2FibGVkKTtcbn1cbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBzeW5jU2VuZEVuYWJsZWQpO1xuc3luY1NlbmRFbmFibGVkKCk7XG5cbmZ1bmN0aW9uIHNlbGVjdGVkQWdlbnQoKSB7XG4gIGNvbnN0IFthZ2VudElkXSA9IFN0cmluZyhzdGF0ZS5vcHRpb25zLm1vZGVsSWQgfHwgXCJcIikuc3BsaXQoXCI6OlwiKTtcbiAgcmV0dXJuIHN0YXRlLmFnZW50cy5maW5kKChhZ2VudCkgPT4gYWdlbnQuYWdlbnRJZCA9PT0gYWdlbnRJZCk7XG59XG5cbmZ1bmN0aW9uIG1vZGVsSXRlbXMoKSB7XG4gIGNvbnN0IGl0ZW1zID0gW107XG4gIGZvciAoY29uc3QgYWdlbnQgb2Ygc3RhdGUuYWdlbnRzKSB7XG4gICAgaWYgKCFhZ2VudC51c2FibGUpIGNvbnRpbnVlO1xuICAgIGl0ZW1zLnB1c2goeyBncm91cDogYWdlbnQuZGlzcGxheU5hbWUgfSk7XG4gICAgY29uc3QgbW9kZWxzID0gYWdlbnQubW9kZWxzPy5sZW5ndGggPyBhZ2VudC5tb2RlbHMgOiBbeyB2YWx1ZTogXCJcIiwgbGFiZWw6IGFnZW50LmRpc3BsYXlOYW1lIH1dO1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgICBjb25zdCBpZCA9IGAke2FnZW50LmFnZW50SWR9Ojoke21vZGVsLnZhbHVlIHx8IFwiXCJ9YDtcbiAgICAgIGl0ZW1zLnB1c2goeyBpZCwgbGFiZWw6IG1vZGVsLmxhYmVsLCBjaGVja2VkOiBzdGF0ZS5vcHRpb25zLm1vZGVsSWQgPT09IGlkIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXRlbXM7XG59XG5cbmZ1bmN0aW9uIGVmZm9ydEl0ZW1zKCkge1xuICBjb25zdCBhZ2VudCA9IHNlbGVjdGVkQWdlbnQoKTtcbiAgY29uc3QgaXRlbXMgPSBbeyBpZDogXCJfX2RlZmF1bHRfX1wiLCBsYWJlbDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCIsIGNoZWNrZWQ6ICFzdGF0ZS5vcHRpb25zLmVmZm9ydCB9XTtcbiAgZm9yIChjb25zdCBlZmZvcnQgb2YgYWdlbnQ/LmVmZm9ydHMgfHwgW10pIHtcbiAgICBpZiAoIWVmZm9ydC52YWx1ZSkgY29udGludWU7XG4gICAgaXRlbXMucHVzaCh7IGlkOiBlZmZvcnQudmFsdWUsIGxhYmVsOiBlZmZvcnQubGFiZWwsIGNoZWNrZWQ6IHN0YXRlLm9wdGlvbnMuZWZmb3J0ID09PSBlZmZvcnQudmFsdWUgfSk7XG4gIH1cbiAgcmV0dXJuIGl0ZW1zO1xufVxuXG5mdW5jdGlvbiBhcHByb3ZhbEl0ZW1zKCkge1xuICByZXR1cm4gW1xuICAgIHsgaWQ6IFwiZGVmYXVsdFwiLCBsYWJlbDogXCJcdUFFMzBcdUJDRjggXHVDMkI5XHVDNzc4XCIgfSxcbiAgICB7IGlkOiBcImJ5cGFzc1wiLCBsYWJlbDogXCJcdUMyQjlcdUM3NzggXHVDNUM2XHVDNzc0IFx1QzlDNFx1RDU4OVwiIH0sXG4gICAgeyBpZDogXCJhdXRvcGlsb3RcIiwgbGFiZWw6IFwiXHVDNjI0XHVEMUEwXHVEMzBDXHVDNzdDXHVCN0ZGXCIgfSxcbiAgXS5tYXAoKGl0ZW0pID0+ICh7IC4uLml0ZW0sIGNoZWNrZWQ6IHN0YXRlLm9wdGlvbnMuYXBwcm92YWxNb2RlID09PSBpdGVtLmlkIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyUGlja2VycygpIHtcbiAgY29uc3QgW2FnZW50SWQsIG1vZGVsXSA9IFN0cmluZyhzdGF0ZS5vcHRpb25zLm1vZGVsSWQgfHwgXCJcIikuc3BsaXQoXCI6OlwiKTtcbiAgY29uc3QgYWdlbnQgPSBzdGF0ZS5hZ2VudHMuZmluZCgoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUuYWdlbnRJZCA9PT0gYWdlbnRJZCk7XG4gIGNvbnN0IG1vZGVsTGFiZWwgPSBhZ2VudFxuICAgID8gKGFnZW50Lm1vZGVscy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS52YWx1ZSA9PT0gKG1vZGVsIHx8IFwiXCIpKT8ubGFiZWwgfHwgYWdlbnQuZGlzcGxheU5hbWUpXG4gICAgOiBcIlx1QUUzMFx1QkNGOCBcdUJBQThcdUIzNzhcIjtcbiAgbW9kZWxQaWNrZXIubGFiZWxTcGFuLnRleHRDb250ZW50ID0gbW9kZWxMYWJlbDtcbiAgY29uc3QgZWZmb3J0TGFiZWwgPSBzdGF0ZS5vcHRpb25zLmVmZm9ydFxuICAgID8gKHNlbGVjdGVkQWdlbnQoKT8uZWZmb3J0cy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS52YWx1ZSA9PT0gc3RhdGUub3B0aW9ucy5lZmZvcnQpPy5sYWJlbCB8fCBzdGF0ZS5vcHRpb25zLmVmZm9ydClcbiAgICA6IFwiXHVBRTMwXHVCQ0Y4IFx1Q0Q5NFx1Qjg2MFwiO1xuICBlZmZvcnRQaWNrZXIubGFiZWxTcGFuLnRleHRDb250ZW50ID0gZWZmb3J0TGFiZWw7XG4gIGFwcHJvdmFsUGlja2VyLmxhYmVsU3Bhbi50ZXh0Q29udGVudCA9XG4gICAgeyBkZWZhdWx0OiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIiwgYnlwYXNzOiBcIlx1QzJCOVx1Qzc3OCBcdUM1QzZcdUM3NzQgXHVDOUM0XHVENTg5XCIsIGF1dG9waWxvdDogXCJcdUM2MjRcdUQxQTBcdUQzMENcdUM3N0NcdUI3RkZcIiB9W3N0YXRlLm9wdGlvbnMuYXBwcm92YWxNb2RlXSB8fCBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIjtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29udmVyc2F0aW9uVGl0bGUoKSB7XG4gIGNvbnN0IHNlbGVjdGVkID0gc3RhdGUuY29udmVyc2F0aW9ucy5maW5kKFxuICAgIChjb252ZXJzYXRpb24pID0+IGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25JZCA9PT0gc3RhdGUuc2VsZWN0ZWRDb252ZXJzYXRpb25JZCxcbiAgKTtcbiAgY29uc3QgdGl0bGUgPSBTdHJpbmcoc2VsZWN0ZWQ/LnRpdGxlIHx8IFwiXHVDMEM4IFx1QjMwMFx1RDY1NFwiKS50cmltKCkgfHwgXCJcdUMwQzggXHVCMzAwXHVENjU0XCI7XG4gIGNvbnZlcnNhdGlvblRpdGxlLnRleHRDb250ZW50ID0gdGl0bGU7XG4gIGNvbnZlcnNhdGlvblRpdGxlLnRpdGxlID0gdGl0bGU7XG59XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBUcmFuc2NyaXB0IHJlbmRlcmluZ1xuXG5mdW5jdGlvbiBmb3JtYXRUb2tlbnMoY291bnQpIHtcbiAgY29uc3QgdmFsdWUgPSBOdW1iZXIoY291bnQpIHx8IDA7XG4gIGlmICh2YWx1ZSA+PSAxMDAwKSByZXR1cm4gYCR7KHZhbHVlIC8gMTAwMCkudG9GaXhlZCh2YWx1ZSA+PSAxMF8wMDAgPyAwIDogMSl9a2A7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBtZXRhTGluZSh0YXNrKSB7XG4gIGNvbnN0IHBhcnRzID0gW107XG4gIGNvbnN0IGFnZW50ID0gQUdFTlRfTkFNRVNbdGFzay5hZ2VudElkXSB8fCB0YXNrLmFnZW50SWQ7XG4gIGlmIChhZ2VudCkgcGFydHMucHVzaCh0YXNrLmFnZW50TW9kZWwgPyBgJHthZ2VudH0gXHUwMEI3ICR7dGFzay5hZ2VudE1vZGVsfWAgOiBhZ2VudCk7XG4gIGNvbnN0IHVzYWdlID0gdGFzay51c2FnZTtcbiAgaWYgKHVzYWdlICYmICh1c2FnZS5pbnB1dFRva2VucyB8fCB1c2FnZS5vdXRwdXRUb2tlbnMgfHwgdXNhZ2UudG90YWxUb2tlbnMpKSB7XG4gICAgY29uc3QgdG90YWwgPSB1c2FnZS50b3RhbFRva2VucyB8fCAodXNhZ2UuaW5wdXRUb2tlbnMgfHwgMCkgKyAodXNhZ2Uub3V0cHV0VG9rZW5zIHx8IDApO1xuICAgIHBhcnRzLnB1c2goYCR7Zm9ybWF0VG9rZW5zKHVzYWdlLmlucHV0VG9rZW5zKX1cdTIxOTEgJHtmb3JtYXRUb2tlbnModXNhZ2Uub3V0cHV0VG9rZW5zKX1cdTIxOTMgKFx1Q0QxRCAke2Zvcm1hdFRva2Vucyh0b3RhbCl9IFx1RDFBMFx1RDA3MClgKTtcbiAgfVxuICBpZiAodXNhZ2U/LmNvc3RVc2QgIT0gbnVsbCkgcGFydHMucHVzaChgJCR7TnVtYmVyKHVzYWdlLmNvc3RVc2QpLnRvRml4ZWQoNCl9YCk7XG4gIGNvbnN0IHRpbWUgPSB0YXNrLmNvbXBsZXRlZEF0IHx8IHRhc2sudXBkYXRlZEF0O1xuICBpZiAodGltZSkge1xuICAgIGNvbnN0IGF0ID0gbmV3IERhdGUodGltZSk7XG4gICAgaWYgKCFOdW1iZXIuaXNOYU4oYXQuZ2V0VGltZSgpKSkge1xuICAgICAgcGFydHMucHVzaChhdC50b0xvY2FsZVRpbWVTdHJpbmcoXCJrby1LUlwiLCB7IGhvdXI6IFwibnVtZXJpY1wiLCBtaW51dGU6IFwiMi1kaWdpdFwiIH0pKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhcnRzLmpvaW4oXCIgXHUwMEI3IFwiKTtcbn1cblxuZnVuY3Rpb24gYXR0YWNobWVudFNvdXJjZShhdHRhY2htZW50KSB7XG4gIHJldHVybiBTdHJpbmcoYXR0YWNobWVudD8uZGF0YVVybCB8fCBcIlwiKTtcbn1cblxuZnVuY3Rpb24gcmVxdWVzdFJvdyh0YXNrKSB7XG4gIGNvbnN0IHJvdyA9IGVsKFwiZGl2XCIsIFwiaW50ZXJhY3RpdmUtaXRlbS1jb250YWluZXIgaW50ZXJhY3RpdmUtcmVxdWVzdFwiKTtcbiAgY29uc3QgdmFsdWUgPSBlbChcImRpdlwiLCBcInZhbHVlXCIpO1xuICBjb25zdCBwcm9tcHQgPSBTdHJpbmcodGFzay5hZ2VudFByb21wdCB8fCB0YXNrLnVzZXJNZXNzYWdlIHx8IFwiXCIpLnRyaW0oKTtcbiAgaWYgKHByb21wdCkgdmFsdWUuYXBwZW5kKHJlbmRlck1hcmtkb3duKHByb21wdCkpO1xuICBjb25zdCBpbWFnZXMgPSAodGFzay5hdHRhY2htZW50cyB8fCBbXSkuZmlsdGVyKChhdHRhY2htZW50KSA9PiBhdHRhY2htZW50U291cmNlKGF0dGFjaG1lbnQpKTtcbiAgaWYgKGltYWdlcy5sZW5ndGgpIHtcbiAgICBjb25zdCBnYWxsZXJ5ID0gZWwoXCJkaXZcIiwgXCJ2aWJleC1yZXF1ZXN0LWltYWdlc1wiKTtcbiAgICBmb3IgKGNvbnN0IGF0dGFjaG1lbnQgb2YgaW1hZ2VzKSB7XG4gICAgICBjb25zdCBsaW5rID0gZWwoXCJidXR0b25cIiwgXCJ2aWJleC1yZXF1ZXN0LWltYWdlXCIpO1xuICAgICAgbGluay50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIGxpbmsudGl0bGUgPSBhdHRhY2htZW50Lm5hbWUgfHwgXCJcdUNDQThcdUJEODAgXHVDNzc0XHVCQkY4XHVDOUMwXCI7XG4gICAgICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICBpbWFnZS5zcmMgPSBhdHRhY2htZW50U291cmNlKGF0dGFjaG1lbnQpO1xuICAgICAgaW1hZ2UuYWx0ID0gYXR0YWNobWVudC5uYW1lIHx8IFwiXHVDQ0E4XHVCRDgwIFx1Qzc3NFx1QkJGOFx1QzlDMFwiO1xuICAgICAgbGluay5hcHBlbmQoaW1hZ2UpO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gd2luZG93Lm9wZW4oaW1hZ2Uuc3JjLCBcIl9ibGFua1wiKSk7XG4gICAgICBnYWxsZXJ5LmFwcGVuZChsaW5rKTtcbiAgICB9XG4gICAgdmFsdWUuYXBwZW5kKGdhbGxlcnkpO1xuICB9XG4gIHJvdy5hcHBlbmQodmFsdWUpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiBoaWRkZW5XYXJuaW5nKHRleHQpIHtcbiAgY29uc3QgdmFsdWUgPSBTdHJpbmcodGV4dCB8fCBcIlwiKTtcbiAgcmV0dXJuIC9cdUMyRTRcdUQ1ODkgXHVDODA0IFx1QkJGOFx1Q0VFNFx1QkMwQiBcdUJDQzBcdUFDQkRcdUMwQUNcdUQ1NkRcdUM3NzQgXFxkK1x1QUM3NCBcdUM3ODhcdUM1QzhcdUMyQjVcdUIyQzhcdUIyRTQvLnRlc3QodmFsdWUpXG4gICAgfHwgL1x1QUUzMFx1Qzg3NCBcdUJCRjhcdUNFRTRcdUJDMEIgKD86XHVEMzBDXHVDNzdDXHVBQ0ZDICk/XHVCQ0MwXHVBQ0JEXHVDMEFDXHVENTZEXHVDNzQwIFx1QURGOFx1QjMwMFx1Qjg1QyBcdUJDRjRcdUM4NzRcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTQvLnRlc3QodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoaWRkZW5Ta2lwcGVkVGVzdCh0ZXN0KSB7XG4gIHJldHVybiBTdHJpbmcodGVzdD8uc3RhdHVzIHx8IFwiXCIpID09PSBcInNraXBwZWRcIlxuICAgICYmIC9cdUMwQUNcdUM2QTlcdUM3OTBcdUFDMDAgXHVEMTRDXHVDMkE0XHVEMkI4KD86IFx1QzJFNFx1RDU4OSk/XHVDNzQ0IFx1RDVDOFx1QzZBOVx1RDU1OFx1QzlDMCBcdUM1NEFcdUM1NDQvLnRlc3QoU3RyaW5nKHRlc3Q/LnN1bW1hcnkgfHwgXCJcIikpO1xufVxuXG5mdW5jdGlvbiByZXNwb25zZVJvdyh0YXNrLCB7IGlzTGFzdCB9KSB7XG4gIGNvbnN0IHJvdyA9IGVsKFwiZGl2XCIsIFwiaW50ZXJhY3RpdmUtaXRlbS1jb250YWluZXIgaW50ZXJhY3RpdmUtcmVzcG9uc2VcIik7XG4gIGlmIChpc0xhc3QpIHJvdy5jbGFzc0xpc3QuYWRkKFwiY2hhdC1tb3N0LXJlY2VudC1yZXNwb25zZVwiKTtcbiAgY29uc3QgdmFsdWUgPSBlbChcImRpdlwiLCBcInZhbHVlXCIpO1xuICByb3cuYXBwZW5kKHZhbHVlKTtcblxuICBjb25zdCBhY3RpdmUgPSBBQ1RJVkVfU1RBVFVTRVMuaGFzKHRhc2suc3RhdHVzKTtcbiAgaWYgKGFjdGl2ZSkgcm93LmNsYXNzTGlzdC5hZGQoXCJjaGF0LXJlc3BvbnNlLWxvYWRpbmdcIik7XG5cbiAgLy8gUmVhc29uaW5nIFx1MjAxNCBuYXRpdmUgdGhpbmtpbmcgYm94IHN0cnVjdHVyZS5cbiAgY29uc3QgcmVhc29uaW5nID0gKHRhc2suYWN0aXZpdHlJdGVtcyB8fCBbXSkuZmlsdGVyKChpdGVtKSA9PiBpdGVtLnR5cGUgPT09IFwicmVhc29uaW5nXCIgJiYgKGl0ZW0udGV4dCB8fCBcIlwiKS50cmltKCkpO1xuICBpZiAocmVhc29uaW5nLmxlbmd0aCkge1xuICAgIGNvbnN0IGJveCA9IGVsKFwiZGl2XCIsIFwiY2hhdC10aGlua2luZy1ib3hcIik7XG4gICAgY29uc3QgbGlzdEhvc3QgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxpc3QgY2hhdC10aGlua2luZy1pdGVtc1wiKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmVhc29uaW5nKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IGVsKFwiZGl2XCIsIFwiY2hhdC10aGlua2luZy1pdGVtIG1hcmtkb3duLWNvbnRlbnRcIik7XG4gICAgICBlbnRyeS5hcHBlbmQocmVuZGVyTWFya2Rvd24oaXRlbS50ZXh0KSk7XG4gICAgICBsaXN0SG9zdC5hcHBlbmQoZW50cnkpO1xuICAgIH1cbiAgICBib3guYXBwZW5kKGxpc3RIb3N0KTtcbiAgICB2YWx1ZS5hcHBlbmQoYm94KTtcbiAgfVxuXG4gIC8vIE5vbi1yZWFzb25pbmcgYWN0aXZpdHkgXHUyMDE0IG9uZSBsYWJlbCByb3cgcGVyIGl0ZW0sIG5hdGl2ZSB1c2VkLWNvbnRleHQgbGFiZWwgc3R5bGluZy5cbiAgZm9yIChjb25zdCBpdGVtIG9mIHRhc2suYWN0aXZpdHlJdGVtcyB8fCBbXSkge1xuICAgIGlmIChpdGVtLnR5cGUgPT09IFwicmVhc29uaW5nXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGxhYmVsID0gZWwoXCJkaXZcIiwgXCJjaGF0LXVzZWQtY29udGV4dC1sYWJlbFwiKTtcbiAgICBjb25zdCBraW5kID0gaXRlbS50eXBlO1xuICAgIGxldCB0ZXh0ID0gXCJcIjtcbiAgICBpZiAoa2luZCA9PT0gXCJjb21tYW5kRXhlY3V0aW9uXCIgfHwga2luZCA9PT0gXCJjb21tYW5kXCIpIHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBBcnJheS5pc0FycmF5KGl0ZW0uZGF0YT8uY29tbWFuZCkgPyBpdGVtLmRhdGEuY29tbWFuZC5qb2luKFwiIFwiKSA6IGl0ZW0uZGF0YT8uY29tbWFuZDtcbiAgICAgIHRleHQgPSBjb21tYW5kID8gU3RyaW5nKGNvbW1hbmQpIDogXCJcdUJBODVcdUI4MzlcdUM3NDQgXHVDMkU0XHVENTg5XHVENTg4XHVDMkI1XHVCMkM4XHVCMkU0XCI7XG4gICAgICBsYWJlbC5hcHBlbmQoY29kaWNvbihcInRlcm1pbmFsXCIpKTtcbiAgICB9IGVsc2UgaWYgKGtpbmQgPT09IFwiZmlsZUNoYW5nZVwiKSB7XG4gICAgICBjb25zdCBwYXRocyA9IChpdGVtLmRhdGE/LmNoYW5nZXMgfHwgW10pLm1hcCgoY2hhbmdlKSA9PiBjaGFuZ2U/LnBhdGgpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIHRleHQgPSBwYXRocy5sZW5ndGggPT09IDEgPyBwYXRoc1swXSA6IGAke3BhdGhzLmxlbmd0aH1cdUFDMUMgXHVEMzBDXHVDNzdDXHVDNzQ0IFx1QzIxOFx1QzgxNVx1RDU4OFx1QzJCNVx1QjJDOFx1QjJFNGA7XG4gICAgICBsYWJlbC5hcHBlbmQoY29kaWNvbihcImVkaXRcIikpO1xuICAgIH0gZWxzZSBpZiAoa2luZCA9PT0gXCJ3ZWJTZWFyY2hcIikge1xuICAgICAgdGV4dCA9IGl0ZW0udGV4dCB8fCBcIlx1QzZGOVx1Qzc0NCBcdUFDODBcdUMwQzlcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTRcIjtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwic2VhcmNoXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGV4dCA9IGl0ZW0udGV4dCB8fCBpdGVtLmRhdGE/LnRvb2wgfHwgXCJcdUM3OTFcdUM1QzVcdUM3NDQgXHVDOUM0XHVENTg5XHVENTg4XHVDMkI1XHVCMkM4XHVCMkU0XCI7XG4gICAgICBsYWJlbC5hcHBlbmQoY29kaWNvbihcInRvb2xzXCIpKTtcbiAgICB9XG4gICAgY29uc3QgY29kZSA9IGVsKFwiY29kZVwiLCB1bmRlZmluZWQsIHRleHQpO1xuICAgIGxhYmVsLmFwcGVuZChjb2RlKTtcbiAgICB2YWx1ZS5hcHBlbmQobGFiZWwpO1xuICB9XG5cbiAgLy8gQ2xhcmlmaWNhdGlvbiB0dXJucyAocXVlc3Rpb24gXHUyMTkyIGFuc3dlcikgaW4gb3JpZ2luYWwgb3JkZXIuXG4gIGZvciAoY29uc3QgY2xhcmlmaWNhdGlvbiBvZiB0YXNrLmNsYXJpZmljYXRpb25UdXJucyB8fCBbXSkge1xuICAgIGNvbnN0IHJlcGx5ID0gKGNsYXJpZmljYXRpb24uYXNzaXN0YW50UmVwbHkgfHwgY2xhcmlmaWNhdGlvbi5xdWVzdGlvbj8udGV4dCB8fCBcIlwiKS50cmltKCk7XG4gICAgaWYgKHJlcGx5KSB2YWx1ZS5hcHBlbmQocmVuZGVyTWFya2Rvd24ocmVwbHkpKTtcbiAgICBjb25zdCBhbnN3ZXIgPSAoY2xhcmlmaWNhdGlvbi5hbnN3ZXIgfHwgXCJcIikudHJpbSgpO1xuICAgIGlmIChhbnN3ZXIpIHtcbiAgICAgIGNvbnN0IGFuc3dlclJvdyA9IGVsKFwiZGl2XCIsIFwiaW50ZXJhY3RpdmUtaXRlbS1jb250YWluZXIgaW50ZXJhY3RpdmUtcmVxdWVzdFwiKTtcbiAgICAgIGNvbnN0IGFuc3dlclZhbHVlID0gZWwoXCJkaXZcIiwgXCJ2YWx1ZVwiKTtcbiAgICAgIGFuc3dlclZhbHVlLmFwcGVuZChyZW5kZXJNYXJrZG93bihhbnN3ZXIpKTtcbiAgICAgIGFuc3dlclJvdy5hcHBlbmQoYW5zd2VyVmFsdWUpO1xuICAgICAgdmFsdWUuYXBwZW5kKGFuc3dlclJvdyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVwbHkgPSAodGFzay5hZ2VudFJlcGx5IHx8IFwiXCIpLnRyaW0oKTtcbiAgaWYgKHJlcGx5KSB2YWx1ZS5hcHBlbmQocmVuZGVyTWFya2Rvd24ocmVwbHkpKTtcblxuICBpZiAoYWN0aXZlKSB7XG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxhYmVsXCIpO1xuICAgIC8vIDAuOS43XHVDNzU4IFx1QUM4MFx1Qzk5RFx1QjQxQyBcdUIzQzVcdUI5QkQgQ1NTIFx1QjlDMS4gQ29kaWNvblx1Qzc1OCBzdGVwcygzMCkgXHVENjhDXHVDODA0IFx1QUREQ1x1Q0U1OVx1Qzc0NCBcdUQwQzBcdUM5QzAgXHVDNTRBXHVCMjk0XHVCMkU0LlxuICAgIGNvbnN0IHNwaW5uZXIgPSBlbChcInNwYW5cIiwgXCJ2aWJleC1yZXNwb25zZS1zcGlubmVyXCIpO1xuICAgIHNwaW5uZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICAgIHByb2dyZXNzLmFwcGVuZChzcGlubmVyKTtcbiAgICBwcm9ncmVzcy5hcHBlbmQoZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgYCAke1NUQVRVU19NRVNTQUdFU1t0YXNrLnN0YXR1c10gfHwgXCJcdUM5QzRcdUQ1ODkgXHVDOTExXHVDNzg1XHVCMkM4XHVCMkU0LlwifWApKTtcbiAgICB2YWx1ZS5hcHBlbmQocHJvZ3Jlc3MpO1xuICB9XG5cbiAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHRhc2sud2FybmluZ3MgfHwgW10pIHtcbiAgICBpZiAoaGlkZGVuV2FybmluZyh3YXJuaW5nKSkgY29udGludWU7XG4gICAgY29uc3Qgd2lkZ2V0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LW5vdGlmaWNhdGlvbi13aWRnZXRcIik7XG4gICAgd2lkZ2V0LmFwcGVuZChjb2RpY29uKFwid2FybmluZ1wiKSwgZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgU3RyaW5nKHdhcm5pbmcpKSk7XG4gICAgdmFsdWUuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRlc3Qgb2YgdGFzay50ZXN0UmVzdWx0cyB8fCBbXSkge1xuICAgIGlmIChoaWRkZW5Ta2lwcGVkVGVzdCh0ZXN0KSkgY29udGludWU7XG4gICAgY29uc3QgbGFiZWwgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxhYmVsXCIpO1xuICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKHRlc3Quc3RhdHVzID09PSBcInBhc3NlZFwiID8gXCJjaGVja1wiIDogdGVzdC5zdGF0dXMgPT09IFwiZmFpbGVkXCIgPyBcImVycm9yXCIgOiBcImNpcmNsZS1zbGFzaFwiKSk7XG4gICAgbGFiZWwuYXBwZW5kKGVsKFwiY29kZVwiLCB1bmRlZmluZWQsIGAgJHt0ZXN0LmNvbW1hbmR9JHt0ZXN0LnN1bW1hcnkgPyBgIFx1MjAxNCAke3Rlc3Quc3VtbWFyeX1gIDogXCJcIn1gKSk7XG4gICAgdmFsdWUuYXBwZW5kKGxhYmVsKTtcbiAgfVxuXG4gIGlmICh0YXNrLmVycm9yKSB7XG4gICAgY29uc3Qgd2lkZ2V0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LW5vdGlmaWNhdGlvbi13aWRnZXRcIik7XG4gICAgd2lkZ2V0LmFwcGVuZChjb2RpY29uKFwiZXJyb3JcIiksIGVsKFwic3BhblwiLCB1bmRlZmluZWQsIFN0cmluZyh0YXNrLmVycm9yKSkpO1xuICAgIHZhbHVlLmFwcGVuZCh3aWRnZXQpO1xuICB9XG5cbiAgaWYgKCFhY3RpdmUpIHtcbiAgICBjb25zdCBmb290ZXIgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxhYmVsIHZpYmV4LW1ldGFcIik7XG4gICAgY29uc3QgYWN0aW9ucyA9IFtdO1xuICAgIGlmICh0YXNrLnJldmlld0F2YWlsYWJsZSkge1xuICAgICAgY29uc3QgcmV2aWV3ID0gZWwoXCJhXCIsIHVuZGVmaW5lZCwgXCJcdUJDQzBcdUFDQkQgXHVDMEFDXHVENTZEIFx1QUM4MFx1RDFBMFwiKTtcbiAgICAgIHJldmlldy5ocmVmID0gXCIjXCI7XG4gICAgICByZXZpZXcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBwb3N0KHsgdHlwZTogXCJvcGVuUmV2aWV3XCIsIHRhc2tJZDogdGFzay50YXNrSWQgfSk7XG4gICAgICB9KTtcbiAgICAgIGFjdGlvbnMucHVzaChyZXZpZXcpO1xuICAgIH1cbiAgICBjb25zdCBtZXRhID0gbWV0YUxpbmUodGFzayk7XG4gICAgaWYgKG1ldGEpIGZvb3Rlci5hcHBlbmQoZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgbWV0YSkpO1xuICAgIGlmIChhY3Rpb25zLmxlbmd0aCAmJiBtZXRhKSBmb290ZXIuYXBwZW5kKGVsKFwic3BhblwiLCB1bmRlZmluZWQsIFwiIFx1MDBCNyBcIikpO1xuICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIGFjdGlvbnMpIGZvb3Rlci5hcHBlbmQoYWN0aW9uKTtcbiAgICBpZiAoZm9vdGVyLmNoaWxkTm9kZXMubGVuZ3RoKSB2YWx1ZS5hcHBlbmQoZm9vdGVyKTtcbiAgfVxuXG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHdlbGNvbWVWaWV3KCkge1xuICAvLyBNYXRjaCBWUyBDb2RlJ3MgbmF0aXZlIGJsYW5rIENoYXQgU2Vzc2lvbiBoaWVyYXJjaHkuIFRoZSBjb250YWluZXIgb3duc1xuICAvLyB0aGUgYXZhaWxhYmxlIHRyYW5zY3JpcHQgaGVpZ2h0IGFuZCBjZW50ZXJzIHRoZSB3ZWxjb21lIG1hcmsgYWJvdmUgdGhlXG4gIC8vIGNvbXBvc2VyOyB0aGUgaW5uZXIgdmlldyBzdXBwbGllcyB0aGUgbmF0aXZlIHRpdGxlL21lc3NhZ2Ugc3BhY2luZy5cbiAgY29uc3QgY29udGFpbmVyID0gZWwoXCJkaXZcIiwgXCJjaGF0LXdlbGNvbWUtdmlldy1jb250YWluZXJcIik7XG4gIGNvbnN0IGhvc3QgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3XCIpO1xuICBjb25zdCBpY29uSG9zdCA9IGVsKFwiZGl2XCIsIFwiY2hhdC13ZWxjb21lLXZpZXctaWNvbiBsYXJnZS1pY29uXCIpO1xuICBpY29uSG9zdC5hcHBlbmQodmliZXhNYXJrKCkpO1xuICBjb25zdCB0aXRsZUhvc3QgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3LXRpdGxlXCIsIFwiVmliZXhcIik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3LW1lc3NhZ2VcIik7XG4gIG1lc3NhZ2UuYXBwZW5kKHJlbmRlck1hcmtkb3duKFwiXHVDNUI4XHVDODFDIFx1QzVCNFx1QjUxNFx1QzExQ1x1QjRFMCBcdUM1NDRcdUM3NzRcdUI1MTRcdUM1QjRcdUI5N0MgXHVBRDZDXHVDMEMxXHVENTU4XHVBQ0UwIFx1QzJFNFx1RDYwNFx1RDU3NFx1QkNGNFx1QzEzOFx1QzY5NC5cIikpO1xuICBob3N0LmFwcGVuZChpY29uSG9zdCwgdGl0bGVIb3N0LCBtZXNzYWdlKTtcbiAgY29udGFpbmVyLmFwcGVuZChob3N0KTtcbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHJhbnNjcmlwdCgpIHtcbiAgY29uc3Qgc3RpY2tUb0JvdHRvbSA9XG4gICAgbGlzdC5zY3JvbGxIZWlnaHQgLSBsaXN0LnNjcm9sbFRvcCAtIGxpc3QuY2xpZW50SGVpZ2h0IDwgNjA7XG4gIGxpc3QucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgaWYgKHN0YXRlLmNvbm5lY3Rpb25FcnJvcikge1xuICAgIGNvbnN0IHdpZGdldCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1ub3RpZmljYXRpb24td2lkZ2V0XCIpO1xuICAgIHdpZGdldC5hcHBlbmQoY29kaWNvbihcImRlYnVnLWRpc2Nvbm5lY3RcIiksIGVsKFwic3BhblwiLCB1bmRlZmluZWQsIHN0YXRlLmNvbm5lY3Rpb25FcnJvcikpO1xuICAgIGxpc3QuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBpZiAoIXN0YXRlLnRhc2tzLmxlbmd0aCkge1xuICAgIGxpc3QuYXBwZW5kKHdlbGNvbWVWaWV3KCkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN0YXRlLnRhc2tzLmZvckVhY2goKHRhc2ssIGluZGV4KSA9PiB7XG4gICAgaWYgKHRhc2sudXNlck1lc3NhZ2UgfHwgdGFzay5hZ2VudFByb21wdCB8fCB0YXNrLmF0dGFjaG1lbnRzPy5sZW5ndGgpIGxpc3QuYXBwZW5kKHJlcXVlc3RSb3codGFzaykpO1xuICAgIGxpc3QuYXBwZW5kKHJlc3BvbnNlUm93KHRhc2ssIHsgaXNMYXN0OiBpbmRleCA9PT0gc3RhdGUudGFza3MubGVuZ3RoIC0gMSB9KSk7XG4gIH0pO1xuXG4gIGlmIChzdGlja1RvQm90dG9tKSBsaXN0LnNjcm9sbFRvcCA9IGxpc3Quc2Nyb2xsSGVpZ2h0O1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTWVzc2FnaW5nXG5cbmZ1bmN0aW9uIHN1Ym1pdCgpIHtcbiAgY29uc3QgdGV4dCA9IHRleHRhcmVhLnZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0ZXh0IHx8IHN0YXRlLmJ1c3kpIHJldHVybjtcbiAgY2xvc2VBc3Npc3QoKTtcbiAgdGV4dGFyZWEudmFsdWUgPSBcIlwiO1xuICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgcG9zdCh7XG4gICAgdHlwZTogXCJzZW5kXCIsXG4gICAgdGV4dCxcbiAgICBtb2RlbElkOiBzdGF0ZS5vcHRpb25zLm1vZGVsSWQsXG4gICAgZWZmb3J0OiBzdGF0ZS5vcHRpb25zLmVmZm9ydCxcbiAgICBhcHByb3ZhbE1vZGU6IHN0YXRlLm9wdGlvbnMuYXBwcm92YWxNb2RlLFxuICB9KTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICBjb25zdCBtZXNzYWdlID0gZXZlbnQuZGF0YTtcbiAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICBjYXNlIFwic3RhdGVcIjoge1xuICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwge1xuICAgICAgICBhZ2VudHM6IG1lc3NhZ2UuYWdlbnRzID8/IHN0YXRlLmFnZW50cyxcbiAgICAgICAgcHJvamVjdHM6IG1lc3NhZ2UucHJvamVjdHMgPz8gc3RhdGUucHJvamVjdHMsXG4gICAgICAgIGNvbnZlcnNhdGlvbnM6IG1lc3NhZ2UuY29udmVyc2F0aW9ucyA/PyBzdGF0ZS5jb252ZXJzYXRpb25zLFxuICAgICAgICBzZWxlY3RlZENvbnZlcnNhdGlvbklkOiBtZXNzYWdlLnNlbGVjdGVkQ29udmVyc2F0aW9uSWQgPz8gc3RhdGUuc2VsZWN0ZWRDb252ZXJzYXRpb25JZCxcbiAgICAgICAgc2VsZWN0ZWRQcm9qZWN0SWQ6IG1lc3NhZ2Uuc2VsZWN0ZWRQcm9qZWN0SWQgPz8gc3RhdGUuc2VsZWN0ZWRQcm9qZWN0SWQsXG4gICAgICAgIHRhc2tzOiBtZXNzYWdlLnRhc2tzID8/IHN0YXRlLnRhc2tzLFxuICAgICAgICBoZWFsdGg6IG1lc3NhZ2UuaGVhbHRoID8/IHN0YXRlLmhlYWx0aCxcbiAgICAgICAgYnVzeTogQm9vbGVhbihtZXNzYWdlLmJ1c3kpLFxuICAgICAgICBjb25uZWN0aW9uRXJyb3I6IG1lc3NhZ2UuY29ubmVjdGlvbkVycm9yID8/IG51bGwsXG4gICAgICB9KTtcbiAgICAgIGlmIChtZXNzYWdlLm9wdGlvbnMpIE9iamVjdC5hc3NpZ24oc3RhdGUub3B0aW9ucywgbWVzc2FnZS5vcHRpb25zKTtcbiAgICAgIGlmICghc3RhdGUub3B0aW9ucy5tb2RlbElkKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gc3RhdGUuYWdlbnRzLmZpbmQoKGFnZW50KSA9PiBhZ2VudC51c2FibGUpO1xuICAgICAgICBpZiAoZmlyc3QpIHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9IGAke2ZpcnN0LmFnZW50SWR9Ojoke2ZpcnN0Lm1vZGVscz8uWzBdPy52YWx1ZSB8fCBcIlwifWA7XG4gICAgICB9XG4gICAgICAvLyBcdUM1NDhcdUIwQjQgXHVCQjM4XHVBRDZDXHVCMjk0IFx1QjQ1MFx1QzlDMCBcdUM1NEFcdUIyOTRcdUIyRTQuIGAvYFx1MDBCN2BAYCBcdUIyOTQgXHVDNzg1XHVCODI1XHVENTU4XHVCMjk0IFx1QzIxQ1x1QUMwNCBcdUM3OTBcdUIzRDlcdUM2NDRcdUMxMzFcdUM3NzQgXHVCNzJDXHVCMkU0LlxuICAgICAgcmVuZGVyUGlja2VycygpO1xuICAgICAgcmVuZGVyQ29udmVyc2F0aW9uVGl0bGUoKTtcbiAgICAgIHJlbmRlclRyYW5zY3JpcHQoKTtcbiAgICAgIHN5bmNTZW5kRW5hYmxlZCgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJtZW50aW9uUmVzdWx0c1wiOiB7XG4gICAgICBpZiAobWVzc2FnZS5yZXF1ZXN0SWQgIT09IHN0YXRlLm1lbnRpb25SZXF1ZXN0SWQpIGJyZWFrOyAvLyBcdUIyQTZcdUFDOEMgXHVCM0M0XHVDQzI5XHVENTVDIFx1Qzc1MVx1QjJGNVxuICAgICAgc3RhdGUubWVudGlvbkZpbGVzID0gQXJyYXkuaXNBcnJheShtZXNzYWdlLmZpbGVzKSA/IG1lc3NhZ2UuZmlsZXMgOiBbXTtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBzdGF0ZS5tZW50aW9uRmlsZXMpIHJlbWVtYmVyRmlsZShmaWxlKTtcbiAgICAgIC8vIFJlLXJlbmRlciBmcm9tIHRoZSByZWZyZXNoZWQgY2FjaGUgb25seSBcdTIwMTQgZ29pbmcgdGhyb3VnaCB1cGRhdGVBc3Npc3QoKVxuICAgICAgLy8gaGVyZSB3b3VsZCBwb3N0IGFub3RoZXIgc2VhcmNoIGFuZCBsb29wLlxuICAgICAgY29uc3QgcmFuZ2UgPSBhc3Npc3RUb2tlbkF0Q2FyZXQoKTtcbiAgICAgIGlmICghcmFuZ2UgfHwgIXJhbmdlLnRva2VuLnN0YXJ0c1dpdGgoXCJAXCIpKSBicmVhaztcbiAgICAgIHN0YXRlLmFzc2lzdFJhbmdlID0gcmFuZ2U7XG4gICAgICBzdGF0ZS5hc3Npc3RJdGVtcyA9IG1lbnRpb25JdGVtcyhyYW5nZS50b2tlbi5zbGljZSgxKSk7XG4gICAgICByZW5kZXJBc3Npc3QoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwiaW5zZXJ0TWVudGlvblwiOiB7XG4gICAgICByZW1lbWJlckZpbGUoe1xuICAgICAgICByZWxhdGl2ZVBhdGg6IG1lc3NhZ2UucmVsYXRpdmVQYXRoLFxuICAgICAgICBuYW1lOiBtZXNzYWdlLnJlbGF0aXZlUGF0aC5zcGxpdChcIi9cIikucG9wKCksXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG1lbnRpb24gPSBgQCR7bWVzc2FnZS5yZWxhdGl2ZVBhdGh9IGA7XG4gICAgICBjb25zdCBhdCA9IHRleHRhcmVhLnNlbGVjdGlvblN0YXJ0ID8/IHRleHRhcmVhLnZhbHVlLmxlbmd0aDtcbiAgICAgIHRleHRhcmVhLnZhbHVlID0gdGV4dGFyZWEudmFsdWUuc2xpY2UoMCwgYXQpICsgbWVudGlvbiArIHRleHRhcmVhLnZhbHVlLnNsaWNlKGF0KTtcbiAgICAgIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwidGFza1VwZGF0ZVwiOiB7XG4gICAgICBjb25zdCBpbmRleCA9IHN0YXRlLnRhc2tzLmZpbmRJbmRleCgodGFzaykgPT4gdGFzay50YXNrSWQgPT09IG1lc3NhZ2UudGFzay50YXNrSWQpO1xuICAgICAgaWYgKGluZGV4ID49IDApIHN0YXRlLnRhc2tzW2luZGV4XSA9IG1lc3NhZ2UudGFzaztcbiAgICAgIGVsc2Ugc3RhdGUudGFza3MucHVzaChtZXNzYWdlLnRhc2spO1xuICAgICAgc3RhdGUuYnVzeSA9IEFDVElWRV9TVEFUVVNFUy5oYXMobWVzc2FnZS50YXNrLnN0YXR1cyk7XG4gICAgICByZW5kZXJUcmFuc2NyaXB0KCk7XG4gICAgICBzeW5jU2VuZEVuYWJsZWQoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufSk7XG5cbnBvc3QoeyB0eXBlOiBcInJlYWR5XCIgfSk7XG5cbi8vICNlbmRyZWdpb25cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBSUEsVUFBTSxjQUFjLENBQUM7QUFFckIsZUFBUyxlQUFnQixTQUFTO0FBQ2hDLFlBQUksUUFBUSxZQUFZLE9BQU87QUFDL0IsWUFBSSxPQUFPO0FBQUUsaUJBQU87QUFBQSxRQUFNO0FBRTFCLGdCQUFRLFlBQVksT0FBTyxJQUFJLENBQUM7QUFFaEMsaUJBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxLQUFLO0FBQzVCLGdCQUFNLEtBQUssT0FBTyxhQUFhLENBQUM7QUFDaEMsZ0JBQU0sS0FBSyxFQUFFO0FBQUEsUUFDZjtBQUVBLGlCQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ3ZDLGdCQUFNLEtBQUssUUFBUSxXQUFXLENBQUM7QUFDL0IsZ0JBQU0sRUFBRSxJQUFJLE9BQU8sTUFBTSxHQUFHLFNBQVMsRUFBRSxFQUFFLFlBQVksR0FBRyxNQUFNLEVBQUU7QUFBQSxRQUNsRTtBQUVBLGVBQU87QUFBQSxNQUNUO0FBSUEsZUFBUyxPQUFRLFFBQVEsU0FBUztBQUNoQyxZQUFJLE9BQU8sWUFBWSxVQUFVO0FBQy9CLG9CQUFVLE9BQU87QUFBQSxRQUNuQjtBQUVBLGNBQU0sUUFBUSxlQUFlLE9BQU87QUFFcEMsZUFBTyxPQUFPLFFBQVEscUJBQXFCLFNBQVUsS0FBSztBQUN4RCxjQUFJLFNBQVM7QUFFYixtQkFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLFFBQVEsSUFBSSxHQUFHLEtBQUssR0FBRztBQUM3QyxrQkFBTSxLQUFLLFNBQVMsSUFBSSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFO0FBRS9DLGdCQUFJLEtB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SSxJQUFJLFFBQVEsS0FBSztBQUNqQyxjQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUk7O0FBRWpDLGVBQU87TUFDWDtBQUdBLGNBQUEsVUFBZSxJQUFJLElBQTBDLDRCQUFZLENBQUMsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLElBQUcsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsTUFBSyxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsWUFBVyxHQUFFLE1BQUssR0FBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxNQUFLLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLElBQUcsU0FBUyxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxhQUFhLEdBQUUsQ0FBQyxLQUFJLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLE1BQUssUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsaUJBQWdCLEdBQUUsTUFBSyxHQUFFLGVBQWMsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLHdCQUF3QixHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsNEJBQTRCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGFBQVksR0FBRSxLQUFJLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsVUFBUyxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGVBQWMsR0FBRSxNQUFLLEdBQUUsWUFBVyxDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxNQUFLLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsTUFBSyxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsUUFBTyxHQUFFLEtBQUksR0FBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsT0FBTSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHFCQUFvQixDQUFDLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxNQUFLLEdBQUUsZ0JBQWUsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLG9CQUFtQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHNCQUFxQixDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLE9BQU0sR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHVCQUFzQixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHdCQUF1QixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSx5QkFBeUIsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSwwQkFBMEIsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHlCQUF5QixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxhQUFZLEdBQUUsS0FBSSxHQUFFLGFBQVksQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxLQUFJLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsV0FBVyxHQUFFLENBQUMsSUFBRyxjQUFjLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLElBQUcsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksWUFBWSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSx3QkFBd0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsS0FBSSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsSUFBRyxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSw0QkFBNEIsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxLQUFJLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsc0JBQXNCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUscUJBQW9CLEdBQUUsS0FBSSxHQUFFLHVCQUFzQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxzQkFBcUIsR0FBRSxLQUFJLEdBQUUsd0JBQXVCLENBQUMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsSUFBRyxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLEtBQUksR0FBRSxhQUFZLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsS0FBSSxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsY0FBYSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxjQUFhLEdBQUUsS0FBSSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsc0JBQXFCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLG9CQUFtQixHQUFFLEtBQUksR0FBRSw0QkFBMkIsQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxPQUFNLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsT0FBTSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxtQkFBa0IsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxNQUFLLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxPQUFNLEVBQUMsR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxPQUFNLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxH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QUFBLFVBQ1gsY0FBYyxRQUFRO0FBQUEsVUFDdEIsTUFBTSxRQUFRLGFBQWEsTUFBTSxHQUFHLEVBQUUsSUFBSTtBQUFBLFFBQzVDLENBQUM7QUFDRCxjQUFNLFVBQVUsSUFBSSxRQUFRLFlBQVk7QUFDeEMsY0FBTSxLQUFLLFNBQVMsa0JBQWtCLFNBQVMsTUFBTTtBQUNyRCxpQkFBUyxRQUFRLFNBQVMsTUFBTSxNQUFNLEdBQUcsRUFBRSxJQUFJLFVBQVUsU0FBUyxNQUFNLE1BQU0sRUFBRTtBQUNoRixpQkFBUyxNQUFNO0FBQ2Ysd0JBQWdCO0FBQ2hCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsS0FBSyxjQUFjO0FBQ2pCLGNBQU0sUUFBUSxNQUFNLE1BQU0sVUFBVSxDQUFDLFNBQVMsS0FBSyxXQUFXLFFBQVEsS0FBSyxNQUFNO0FBQ2pGLFlBQUksU0FBUyxFQUFHLE9BQU0sTUFBTSxLQUFLLElBQUksUUFBUTtBQUFBLFlBQ3hDLE9BQU0sTUFBTSxLQUFLLFFBQVEsSUFBSTtBQUNsQyxjQUFNLE9BQU8sZ0JBQWdCLElBQUksUUFBUSxLQUFLLE1BQU07QUFDcEQseUJBQWlCO0FBQ2pCLHdCQUFnQjtBQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBRUQsT0FBSyxFQUFFLE1BQU0sUUFBUSxDQUFDOyIsCiAgIm5hbWVzIjogWyJyZXF1aXJlX2luZGV4X2NqcyIsICJfYSIsICJDaGFyQ29kZXMiLCAiQmluVHJpZUZsYWdzIiwgIkVudGl0eURlY29kZXJTdGF0ZSIsICJEZWNvZGluZ01vZGUiLCAiRW50aXR5RGVjb2RlciIsICJFbnRpdHlMZXZlbCIsICJFbmNvZGluZ01vZGUiLCAicmVxdWlyZV9pbmRleF9janMiLCAibWF0Y2giLCAibGlzdCIsICJlbCIsICJjb2RlIiwgImVudGl0eSIsICJ1Y21pY3JvIiwgInN0YXRlIiwgImxpc3QiLCAibWQiLCAiaXNMaW5rT3BlbiIsICJpc0xpbmtDbG9zZSIsICJsaW5raWZ5IiwgInRleHQiLCAiX3J1bGVzIiwgInJfbm9ybWFsaXplIiwgInJfYmxvY2siLCAicl9pbmxpbmUiLCAicl9saW5raWZ5IiwgInJfcmVwbGFjZW1lbnRzIiwgInJfc21hcnRxdW90ZXMiLCAicl90ZXh0X2pvaW4iLCAibmV4dExpbmUiLCAicG9zIiwgIm1heCIsICJibG9ja19uYW1lcyIsICJyX3RhYmxlIiwgInJfY29kZSIsICJyX2ZlbmNlIiwgInJfYmxvY2txdW90ZSIsICJyX2hyIiwgInJfbGlzdCIsICJyX3JlZmVyZW5jZSIsICJyX2h0bWxfYmxvY2siLCAicl9oZWFkaW5nIiwgInJfbGhlYWRpbmciLCAicl9wYXJhZ3JhcGgiLCAibGluayIsICJwb3N0UHJvY2VzcyIsICJyX3RleHQiLCAicl9uZXdsaW5lIiwgInJfZXNjYXBlIiwgInJfYmFja3RpY2tzIiwgInJfc3RyaWtldGhyb3VnaCIsICJyX2VtcGhhc2lzIiwgInJfbGluayIsICJyX2ltYWdlIiwgInJfYXV0b2xpbmsiLCAicl9odG1sX2lubGluZSIsICJyX2VudGl0eSIsICJyX2JhbGFuY2VfcGFpcnMiLCAicl9mcmFnbWVudHNfam9pbiIsICJjZmdfZGVmYXVsdCIsICJjZmdfemVybyIsICJjZmdfY29tbW9ubWFyayIsICJwdW55Y29kZSIsICJNYXJrZG93bkl0IiwgInV0aWxzLmlzU3RyaW5nIiwgIlBhcnNlckNvcmUiLCAiTGlua2lmeUl0IiwgInV0aWxzIiwgInV0aWxzLmFzc2lnbiIsICJoZWxwZXJzIiwgInJlcGx5Il0KfQo=
