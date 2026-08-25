"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/mdurl/build/index.cjs.js
  var require_index_cjs = __commonJS({
    "node_modules/mdurl/build/index.cjs.js"(exports) {
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

  // node_modules/uc.micro/build/index.cjs.js
  var require_index_cjs2 = __commonJS({
    "node_modules/uc.micro/build/index.cjs.js"(exports) {
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

  // node_modules/entities/lib/generated/decode-data-html.js
  var require_decode_data_html = __commonJS({
    "node_modules/entities/lib/generated/decode-data-html.js"(exports) {
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

  // node_modules/entities/lib/generated/decode-data-xml.js
  var require_decode_data_xml = __commonJS({
    "node_modules/entities/lib/generated/decode-data-xml.js"(exports) {
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

  // node_modules/entities/lib/decode_codepoint.js
  var require_decode_codepoint = __commonJS({
    "node_modules/entities/lib/decode_codepoint.js"(exports) {
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

  // node_modules/entities/lib/decode.js
  var require_decode = __commonJS({
    "node_modules/entities/lib/decode.js"(exports) {
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

  // node_modules/entities/lib/generated/encode-html.js
  var require_encode_html = __commonJS({
    "node_modules/entities/lib/generated/encode-html.js"(exports) {
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

  // node_modules/entities/lib/escape.js
  var require_escape = __commonJS({
    "node_modules/entities/lib/escape.js"(exports) {
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

  // node_modules/entities/lib/encode.js
  var require_encode = __commonJS({
    "node_modules/entities/lib/encode.js"(exports) {
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

  // node_modules/entities/lib/index.js
  var require_lib = __commonJS({
    "node_modules/entities/lib/index.js"(exports) {
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

  // node_modules/linkify-it/build/index.cjs.js
  var require_index_cjs3 = __commonJS({
    "node_modules/linkify-it/build/index.cjs.js"(exports, module) {
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

  // node_modules/punycode.js/punycode.js
  var require_punycode = __commonJS({
    "node_modules/punycode.js/punycode.js"(exports, module) {
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

  // node_modules/markdown-it/dist/index.cjs.js
  var require_index_cjs4 = __commonJS({
    "node_modules/markdown-it/dist/index.cjs.js"(exports, module) {
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

  // webview/main.js
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
  var list = el("div", "vibex-list");
  root.append(list);
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
  var sessionPill = el("li", "action-item chat-input-picker-item chat-session-target-picker-item");
  var sessionDropdown = el("div", "monaco-dropdown");
  var sessionDropdownLabel = el("div", "dropdown-label");
  var sessionAnchor = el("a", "action-label compact");
  sessionAnchor.append(codicon("extensions"), el("span", "chat-input-picker-label", "VIBEX"));
  sessionDropdownLabel.append(sessionAnchor);
  sessionDropdown.append(sessionDropdownLabel);
  sessionPill.append(sessionDropdown);
  var optionContainer = el("li", "action-item chat-sessionPicker-container");
  optionContainer.append(effortPicker.host, approvalPicker.host);
  secondaryInputToolbar.items.append(sessionPill, optionContainer);
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
  function requestRow(text) {
    const row = el("div", "interactive-item-container interactive-request");
    const value = el("div", "value");
    value.append(renderMarkdown(text));
    row.append(value);
    return row;
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
      progress.append(codicon("loading codicon-modifier-spin"));
      progress.append(el("span", void 0, ` ${STATUS_MESSAGES[task.status] || "\uC9C4\uD589 \uC911\uC785\uB2C8\uB2E4."}`));
      value.append(progress);
    }
    for (const warning of task.warnings || []) {
      const widget = el("div", "chat-notification-widget");
      widget.append(codicon("warning"), el("span", void 0, String(warning)));
      value.append(widget);
    }
    for (const test of task.testResults || []) {
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
    const titleHost = el("div", "chat-welcome-view-title", "VIBEX");
    const message = el("div", "chat-welcome-view-message");
    message.append(renderMarkdown("iPad\uC640 VS Code\uAC00 \uAC19\uC740 \uB300\uD654\uB97C \uACF5\uC720\uD569\uB2C8\uB2E4. \uBAA8\uB378 \uC120\uD0DD\uAE30\uB85C Codex\uC640 Claude Code\uB97C turn\uB9C8\uB2E4 \uBC14\uAFD4 \uC4F8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
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
      if (task.userMessage) list.append(requestRow(task.userMessage));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbm9kZV9tb2R1bGVzL21kdXJsL2J1aWxkL2luZGV4LmNqcy5qcyIsICIuLi9ub2RlX21vZHVsZXMvdWMubWljcm8vYnVpbGQvaW5kZXguY2pzLmpzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2dlbmVyYXRlZC9kZWNvZGUtZGF0YS1odG1sLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2dlbmVyYXRlZC9kZWNvZGUtZGF0YS14bWwudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZGVjb2RlX2NvZGVwb2ludC50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9kZWNvZGUudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZ2VuZXJhdGVkL2VuY29kZS1odG1sLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2VzY2FwZS50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9lbmNvZGUudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvaW5kZXgudHMiLCAiLi4vbm9kZV9tb2R1bGVzL2xpbmtpZnktaXQvYnVpbGQvaW5kZXguY2pzLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9wdW55Y29kZS5qcy9wdW55Y29kZS5qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2NvbW1vbi91dGlscy5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfbGFiZWwubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaGVscGVycy9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2hlbHBlcnMvcGFyc2VfbGlua190aXRsZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL2luZGV4Lm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3JlbmRlcmVyLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVyLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3Rva2VuLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvc3RhdGVfY29yZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL25vcm1hbGl6ZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL2Jsb2NrLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvaW5saW5lLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvbGlua2lmeS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3NtYXJ0cXVvdGVzLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvdGV4dF9qb2luLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9jb3JlLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3N0YXRlX2Jsb2NrLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3RhYmxlLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2NvZGUubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svZmVuY2UubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svYmxvY2txdW90ZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oci5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9saXN0Lm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3JlZmVyZW5jZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vaHRtbF9ibG9ja3MubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvY29tbW9uL2h0bWxfcmUubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svaHRtbF9ibG9jay5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oZWFkaW5nLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2xoZWFkaW5nLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3BhcmFncmFwaC5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wYXJzZXJfYmxvY2subWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3N0YXRlX2lubGluZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvdGV4dC5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvbGlua2lmeS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvbmV3bGluZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvZXNjYXBlLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9iYWNrdGlja3MubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3N0cmlrZXRocm91Z2gubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2VtcGhhc2lzLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9saW5rLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9pbWFnZS5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvYXV0b2xpbmsubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2h0bWxfaW5saW5lLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9lbnRpdHkubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2JhbGFuY2VfcGFpcnMubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2ZyYWdtZW50c19qb2luLm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9pbmxpbmUubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcHJlc2V0cy9kZWZhdWx0Lm1qcyIsICIuLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvemVyby5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wcmVzZXRzL2NvbW1vbm1hcmsubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaW5kZXgubWpzIiwgIi4uL3dlYnZpZXcvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlICovXG5cbmNvbnN0IGRlY29kZUNhY2hlID0ge307XG5cbmZ1bmN0aW9uIGdldERlY29kZUNhY2hlIChleGNsdWRlKSB7XG4gIGxldCBjYWNoZSA9IGRlY29kZUNhY2hlW2V4Y2x1ZGVdO1xuICBpZiAoY2FjaGUpIHsgcmV0dXJuIGNhY2hlIH1cblxuICBjYWNoZSA9IGRlY29kZUNhY2hlW2V4Y2x1ZGVdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMjg7IGkrKykge1xuICAgIGNvbnN0IGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICBjYWNoZS5wdXNoKGNoKTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhjbHVkZS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoID0gZXhjbHVkZS5jaGFyQ29kZUF0KGkpO1xuICAgIGNhY2hlW2NoXSA9ICclJyArICgnMCcgKyBjaC50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSkuc2xpY2UoLTIpO1xuICB9XG5cbiAgcmV0dXJuIGNhY2hlXG59XG5cbi8vIERlY29kZSBwZXJjZW50LWVuY29kZWQgc3RyaW5nLlxuLy9cbmZ1bmN0aW9uIGRlY29kZSAoc3RyaW5nLCBleGNsdWRlKSB7XG4gIGlmICh0eXBlb2YgZXhjbHVkZSAhPT0gJ3N0cmluZycpIHtcbiAgICBleGNsdWRlID0gZGVjb2RlLmRlZmF1bHRDaGFycztcbiAgfVxuXG4gIGNvbnN0IGNhY2hlID0gZ2V0RGVjb2RlQ2FjaGUoZXhjbHVkZSk7XG5cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8oJVthLWYwLTldezJ9KSsvZ2ksIGZ1bmN0aW9uIChzZXEpIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHNlcS5sZW5ndGg7IGkgPCBsOyBpICs9IDMpIHtcbiAgICAgIGNvbnN0IGIxID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyAxLCBpICsgMyksIDE2KTtcblxuICAgICAgaWYgKGIxIDwgMHg4MCkge1xuICAgICAgICByZXN1bHQgKz0gY2FjaGVbYjFdO1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAoKGIxICYgMHhFMCkgPT09IDB4QzAgJiYgKGkgKyAzIDwgbCkpIHtcbiAgICAgICAgLy8gMTEweHh4eHggMTB4eHh4eHhcbiAgICAgICAgY29uc3QgYjIgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDQsIGkgKyA2KSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGNvbnN0IGNociA9ICgoYjEgPDwgNikgJiAweDdDMCkgfCAoYjIgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDgwKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDM7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGIxICYgMHhGMCkgPT09IDB4RTAgJiYgKGkgKyA2IDwgbCkpIHtcbiAgICAgICAgLy8gMTExMHh4eHggMTB4eHh4eHggMTB4eHh4eHhcbiAgICAgICAgY29uc3QgYjIgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDQsIGkgKyA2KSwgMTYpO1xuICAgICAgICBjb25zdCBiMyA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNywgaSArIDkpLCAxNik7XG5cbiAgICAgICAgaWYgKChiMiAmIDB4QzApID09PSAweDgwICYmIChiMyAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgY29uc3QgY2hyID0gKChiMSA8PCAxMikgJiAweEYwMDApIHwgKChiMiA8PCA2KSAmIDB4RkMwKSB8IChiMyAmIDB4M0YpO1xuXG4gICAgICAgICAgaWYgKGNociA8IDB4ODAwIHx8IChjaHIgPj0gMHhEODAwICYmIGNociA8PSAweERGRkYpKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcdWZmZmRcXHVmZmZkXFx1ZmZmZCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNocik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaSArPSA2O1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RjgpID09PSAweEYwICYmIChpICsgOSA8IGwpKSB7XG4gICAgICAgIC8vIDExMTExMHh4IDEweHh4eHh4IDEweHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGNvbnN0IGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcbiAgICAgICAgY29uc3QgYjMgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDcsIGkgKyA5KSwgMTYpO1xuICAgICAgICBjb25zdCBiNCA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgMTAsIGkgKyAxMiksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODAgJiYgKGIzICYgMHhDMCkgPT09IDB4ODAgJiYgKGI0ICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBsZXQgY2hyID0gKChiMSA8PCAxOCkgJiAweDFDMDAwMCkgfCAoKGIyIDw8IDEyKSAmIDB4M0YwMDApIHwgKChiMyA8PCA2KSAmIDB4RkMwKSB8IChiNCAmIDB4M0YpO1xuXG4gICAgICAgICAgaWYgKGNociA8IDB4MTAwMDAgfHwgY2hyID4gMHgxMEZGRkYpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZFxcdWZmZmRcXHVmZmZkXFx1ZmZmZCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNociAtPSAweDEwMDAwO1xuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMHhEODAwICsgKGNociA+PiAxMCksIDB4REMwMCArIChjaHIgJiAweDNGRikpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGkgKz0gOTtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9KVxufVxuXG5kZWNvZGUuZGVmYXVsdENoYXJzID0gJzsvPzpAJj0rJCwjJztcbmRlY29kZS5jb21wb25lbnRDaGFycyA9ICcnO1xuXG5jb25zdCBlbmNvZGVDYWNoZSA9IHt9O1xuXG4vLyBDcmVhdGUgYSBsb29rdXAgYXJyYXkgd2hlcmUgYW55dGhpbmcgYnV0IGNoYXJhY3RlcnMgaW4gYGNoYXJzYCBzdHJpbmdcbi8vIGFuZCBhbHBoYW51bWVyaWMgY2hhcnMgaXMgcGVyY2VudC1lbmNvZGVkLlxuLy9cbmZ1bmN0aW9uIGdldEVuY29kZUNhY2hlIChleGNsdWRlKSB7XG4gIGxldCBjYWNoZSA9IGVuY29kZUNhY2hlW2V4Y2x1ZGVdO1xuICBpZiAoY2FjaGUpIHsgcmV0dXJuIGNhY2hlIH1cblxuICBjYWNoZSA9IGVuY29kZUNhY2hlW2V4Y2x1ZGVdID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMjg7IGkrKykge1xuICAgIGNvbnN0IGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcblxuICAgIGlmICgvXlswLTlhLXpdJC9pLnRlc3QoY2gpKSB7XG4gICAgICAvLyBhbHdheXMgYWxsb3cgdW5lbmNvZGVkIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzXG4gICAgICBjYWNoZS5wdXNoKGNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FjaGUucHVzaCgnJScgKyAoJzAnICsgaS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSkuc2xpY2UoLTIpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4Y2x1ZGUubGVuZ3RoOyBpKyspIHtcbiAgICBjYWNoZVtleGNsdWRlLmNoYXJDb2RlQXQoaSldID0gZXhjbHVkZVtpXTtcbiAgfVxuXG4gIHJldHVybiBjYWNoZVxufVxuXG4vLyBFbmNvZGUgdW5zYWZlIGNoYXJhY3RlcnMgd2l0aCBwZXJjZW50LWVuY29kaW5nLCBza2lwcGluZyBhbHJlYWR5XG4vLyBlbmNvZGVkIHNlcXVlbmNlcy5cbi8vXG4vLyAgLSBzdHJpbmcgICAgICAgLSBzdHJpbmcgdG8gZW5jb2RlXG4vLyAgLSBleGNsdWRlICAgICAgLSBsaXN0IG9mIGNoYXJhY3RlcnMgdG8gaWdub3JlIChpbiBhZGRpdGlvbiB0byBhLXpBLVowLTkpXG4vLyAgLSBrZWVwRXNjYXBlZCAgLSBkb24ndCBlbmNvZGUgJyUnIGluIGEgY29ycmVjdCBlc2NhcGUgc2VxdWVuY2UgKGRlZmF1bHQ6IHRydWUpXG4vL1xuZnVuY3Rpb24gZW5jb2RlIChzdHJpbmcsIGV4Y2x1ZGUsIGtlZXBFc2NhcGVkKSB7XG4gIGlmICh0eXBlb2YgZXhjbHVkZSAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyBlbmNvZGUoc3RyaW5nLCBrZWVwRXNjYXBlZClcbiAgICBrZWVwRXNjYXBlZCA9IGV4Y2x1ZGU7XG4gICAgZXhjbHVkZSA9IGVuY29kZS5kZWZhdWx0Q2hhcnM7XG4gIH1cblxuICBpZiAodHlwZW9mIGtlZXBFc2NhcGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGtlZXBFc2NhcGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IGNhY2hlID0gZ2V0RW5jb2RlQ2FjaGUoZXhjbHVkZSk7XG4gIGxldCByZXN1bHQgPSAnJztcblxuICBmb3IgKGxldCBpID0gMCwgbCA9IHN0cmluZy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjb2RlID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cbiAgICBpZiAoa2VlcEVzY2FwZWQgJiYgY29kZSA9PT0gMHgyNSAvKiAlICovICYmIGkgKyAyIDwgbCkge1xuICAgICAgaWYgKC9eWzAtOWEtZl17Mn0kL2kudGVzdChzdHJpbmcuc2xpY2UoaSArIDEsIGkgKyAzKSkpIHtcbiAgICAgICAgcmVzdWx0ICs9IHN0cmluZy5zbGljZShpLCBpICsgMyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZSA8IDEyOCkge1xuICAgICAgcmVzdWx0ICs9IGNhY2hlW2NvZGVdO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoY29kZSA+PSAweEQ4MDAgJiYgY29kZSA8PSAweERGRkYpIHtcbiAgICAgIGlmIChjb2RlID49IDB4RDgwMCAmJiBjb2RlIDw9IDB4REJGRiAmJiBpICsgMSA8IGwpIHtcbiAgICAgICAgY29uc3QgbmV4dENvZGUgPSBzdHJpbmcuY2hhckNvZGVBdChpICsgMSk7XG4gICAgICAgIGlmIChuZXh0Q29kZSA+PSAweERDMDAgJiYgbmV4dENvZGUgPD0gMHhERkZGKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdbaV0gKyBzdHJpbmdbaSArIDFdKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0ICs9ICclRUYlQkYlQkQnO1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ1tpXSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbmVuY29kZS5kZWZhdWx0Q2hhcnMgPSBcIjsvPzpAJj0rJCwtXy4hfionKCkjXCI7XG5lbmNvZGUuY29tcG9uZW50Q2hhcnMgPSBcIi1fLiF+KicoKVwiO1xuXG5mdW5jdGlvbiBmb3JtYXQgKHVybCkge1xuICBsZXQgcmVzdWx0ID0gJyc7XG5cbiAgcmVzdWx0ICs9IHVybC5wcm90b2NvbCB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5zbGFzaGVzID8gJy8vJyA6ICcnO1xuICByZXN1bHQgKz0gdXJsLmF1dGggPyB1cmwuYXV0aCArICdAJyA6ICcnO1xuXG4gIGlmICh1cmwuaG9zdG5hbWUgJiYgdXJsLmhvc3RuYW1lLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAvLyBpcHY2IGFkZHJlc3NcbiAgICByZXN1bHQgKz0gJ1snICsgdXJsLmhvc3RuYW1lICsgJ10nO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCArPSB1cmwuaG9zdG5hbWUgfHwgJyc7XG4gIH1cblxuICByZXN1bHQgKz0gdXJsLnBvcnQgPyAnOicgKyB1cmwucG9ydCA6ICcnO1xuICByZXN1bHQgKz0gdXJsLnBhdGhuYW1lIHx8ICcnO1xuICByZXN1bHQgKz0gdXJsLnNlYXJjaCB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5oYXNoIHx8ICcnO1xuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vXG4vLyBDaGFuZ2VzIGZyb20gam95ZW50L25vZGU6XG4vL1xuLy8gMS4gTm8gbGVhZGluZyBzbGFzaCBpbiBwYXRocyxcbi8vICAgIGUuZy4gaW4gYHVybC5wYXJzZSgnaHR0cDovL2Zvbz9iYXInKWAgcGF0aG5hbWUgaXMgYGAsIG5vdCBgL2Bcbi8vXG4vLyAyLiBCYWNrc2xhc2hlcyBhcmUgbm90IHJlcGxhY2VkIHdpdGggc2xhc2hlcyxcbi8vICAgIHNvIGBodHRwOlxcXFxleGFtcGxlLm9yZ1xcYCBpcyB0cmVhdGVkIGxpa2UgYSByZWxhdGl2ZSBwYXRoXG4vL1xuLy8gMy4gVHJhaWxpbmcgY29sb24gaXMgdHJlYXRlZCBsaWtlIGEgcGFydCBvZiB0aGUgcGF0aCxcbi8vICAgIGkuZS4gaW4gYGh0dHA6Ly9leGFtcGxlLm9yZzpmb29gIHBhdGhuYW1lIGlzIGA6Zm9vYFxuLy9cbi8vIDQuIE5vdGhpbmcgaXMgVVJMLWVuY29kZWQgaW4gdGhlIHJlc3VsdGluZyBvYmplY3QsXG4vLyAgICAoaW4gam95ZW50L25vZGUgc29tZSBjaGFycyBpbiBhdXRoIGFuZCBwYXRocyBhcmUgZW5jb2RlZClcbi8vXG4vLyA1LiBgdXJsLnBhcnNlKClgIGRvZXMgbm90IGhhdmUgYHBhcnNlUXVlcnlTdHJpbmdgIGFyZ3VtZW50XG4vL1xuLy8gNi4gUmVtb3ZlZCBleHRyYW5lb3VzIHJlc3VsdCBwcm9wZXJ0aWVzOiBgaG9zdGAsIGBwYXRoYCwgYHF1ZXJ5YCwgZXRjLixcbi8vICAgIHdoaWNoIGNhbiBiZSBjb25zdHJ1Y3RlZCB1c2luZyBvdGhlciBwYXJ0cyBvZiB0aGUgdXJsLlxuLy9cblxuZnVuY3Rpb24gVXJsICgpIHtcbiAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gIHRoaXMuc2xhc2hlcyA9IG51bGw7XG4gIHRoaXMuYXV0aCA9IG51bGw7XG4gIHRoaXMucG9ydCA9IG51bGw7XG4gIHRoaXMuaG9zdG5hbWUgPSBudWxsO1xuICB0aGlzLmhhc2ggPSBudWxsO1xuICB0aGlzLnNlYXJjaCA9IG51bGw7XG4gIHRoaXMucGF0aG5hbWUgPSBudWxsO1xufVxuXG4vLyBSZWZlcmVuY2U6IFJGQyAzOTg2LCBSRkMgMTgwOCwgUkZDIDIzOTZcblxuLy8gZGVmaW5lIHRoZXNlIGhlcmUgc28gYXQgbGVhc3QgdGhleSBvbmx5IGhhdmUgdG8gYmVcbi8vIGNvbXBpbGVkIG9uY2Ugb24gdGhlIGZpcnN0IG1vZHVsZSBsb2FkLlxuY29uc3QgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaTtcbmNvbnN0IHBvcnRQYXR0ZXJuID0gLzpbMC05XSokLztcblxuLy8gU3BlY2lhbCBjYXNlIGZvciBhIHNpbXBsZSBwYXRoIFVSTFxuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtZXNjYXBlICovXG5jb25zdCBzaW1wbGVQYXRoUGF0dGVybiA9IC9eKFxcL1xcLz8oPyFcXC8pW15cXD9cXHNdKikoXFw/W15cXHNdKik/JC87XG5cbi8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIHJlc2VydmVkIGZvciBkZWxpbWl0aW5nIFVSTHMuXG4vLyBXZSBhY3R1YWxseSBqdXN0IGF1dG8tZXNjYXBlIHRoZXNlLlxuY29uc3QgZGVsaW1zID0gWyc8JywgJz4nLCAnXCInLCAnYCcsICcgJywgJ1xccicsICdcXG4nLCAnXFx0J107XG5cbi8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG5jb25zdCB1bndpc2UgPSBbJ3snLCAnfScsICd8JywgJ1xcXFwnLCAnXicsICdgJ10uY29uY2F0KGRlbGltcyk7XG5cbi8vIEFsbG93ZWQgYnkgUkZDcywgYnV0IGNhdXNlIG9mIFhTUyBhdHRhY2tzLiAgQWx3YXlzIGVzY2FwZSB0aGVzZS5cbmNvbnN0IGF1dG9Fc2NhcGUgPSBbJ1xcJyddLmNvbmNhdCh1bndpc2UpO1xuLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbi8vIE5vdGUgdGhhdCBhbnkgaW52YWxpZCBjaGFycyBhcmUgYWxzbyBoYW5kbGVkLCBidXQgdGhlc2Vcbi8vIGFyZSB0aGUgb25lcyB0aGF0IGFyZSAqZXhwZWN0ZWQqIHRvIGJlIHNlZW4sIHNvIHdlIGZhc3QtcGF0aFxuLy8gdGhlbS5cbmNvbnN0IG5vbkhvc3RDaGFycyA9IFsnJScsICcvJywgJz8nLCAnOycsICcjJ10uY29uY2F0KGF1dG9Fc2NhcGUpO1xuY29uc3QgaG9zdEVuZGluZ0NoYXJzID0gWycvJywgJz8nLCAnIyddO1xuY29uc3QgaG9zdG5hbWVNYXhMZW4gPSAyNTU7XG5jb25zdCBob3N0bmFtZVBhcnRQYXR0ZXJuID0gL15bK2EtejAtOUEtWl8tXXswLDYzfSQvO1xuY29uc3QgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbK2EtejAtOUEtWl8tXXswLDYzfSkoLiopJC87XG4vLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbi8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbmNvbnN0IGhvc3RsZXNzUHJvdG9jb2wgPSB7XG4gIGphdmFzY3JpcHQ6IHRydWUsXG4gICdqYXZhc2NyaXB0Oic6IHRydWVcbn07XG4vLyBwcm90b2NvbHMgdGhhdCBhbHdheXMgY29udGFpbiBhIC8vIGJpdC5cbmNvbnN0IHNsYXNoZWRQcm90b2NvbCA9IHtcbiAgaHR0cDogdHJ1ZSxcbiAgaHR0cHM6IHRydWUsXG4gIGZ0cDogdHJ1ZSxcbiAgZ29waGVyOiB0cnVlLFxuICBmaWxlOiB0cnVlLFxuICAnaHR0cDonOiB0cnVlLFxuICAnaHR0cHM6JzogdHJ1ZSxcbiAgJ2Z0cDonOiB0cnVlLFxuICAnZ29waGVyOic6IHRydWUsXG4gICdmaWxlOic6IHRydWVcbn07XG5cbmZ1bmN0aW9uIHVybFBhcnNlICh1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgdXJsIGluc3RhbmNlb2YgVXJsKSByZXR1cm4gdXJsXG5cbiAgY29uc3QgdSA9IG5ldyBVcmwoKTtcbiAgdS5wYXJzZSh1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KTtcbiAgcmV0dXJuIHVcbn1cblxuVXJsLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICh1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGxldCBsb3dlclByb3RvLCBoZWMsIHNsYXNoZXM7XG4gIGxldCByZXN0ID0gdXJsO1xuXG4gIC8vIHRyaW0gYmVmb3JlIHByb2NlZWRpbmcuXG4gIC8vIFRoaXMgaXMgdG8gc3VwcG9ydCBwYXJzZSBzdHVmZiBsaWtlIFwiICBodHRwOi8vZm9vLmNvbSAgXFxuXCJcbiAgcmVzdCA9IHJlc3QudHJpbSgpO1xuXG4gIGlmICghc2xhc2hlc0Rlbm90ZUhvc3QgJiYgdXJsLnNwbGl0KCcjJykubGVuZ3RoID09PSAxKSB7XG4gICAgLy8gVHJ5IGZhc3QgcGF0aCByZWdleHBcbiAgICBjb25zdCBzaW1wbGVQYXRoID0gc2ltcGxlUGF0aFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgICBpZiAoc2ltcGxlUGF0aCkge1xuICAgICAgdGhpcy5wYXRobmFtZSA9IHNpbXBsZVBhdGhbMV07XG4gICAgICBpZiAoc2ltcGxlUGF0aFsyXSkge1xuICAgICAgICB0aGlzLnNlYXJjaCA9IHNpbXBsZVBhdGhbMl07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgfVxuXG4gIGxldCBwcm90byA9IHByb3RvY29sUGF0dGVybi5leGVjKHJlc3QpO1xuICBpZiAocHJvdG8pIHtcbiAgICBwcm90byA9IHByb3RvWzBdO1xuICAgIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBwcm90bztcbiAgICByZXN0ID0gcmVzdC5zdWJzdHIocHJvdG8ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIGZpZ3VyZSBvdXQgaWYgaXQncyBnb3QgYSBob3N0XG4gIC8vIHVzZXJAc2VydmVyIGlzICphbHdheXMqIGludGVycHJldGVkIGFzIGEgaG9zdG5hbWUsIGFuZCB1cmxcbiAgLy8gcmVzb2x1dGlvbiB3aWxsIHRyZWF0IC8vZm9vL2JhciBhcyBob3N0PWZvbyxwYXRoPWJhciBiZWNhdXNlIHRoYXQnc1xuICAvLyBob3cgdGhlIGJyb3dzZXIgcmVzb2x2ZXMgcmVsYXRpdmUgVVJMcy5cbiAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtZXNjYXBlICovXG4gIGlmIChzbGFzaGVzRGVub3RlSG9zdCB8fCBwcm90byB8fCByZXN0Lm1hdGNoKC9eXFwvXFwvW15AXFwvXStAW15AXFwvXSsvKSkge1xuICAgIHNsYXNoZXMgPSByZXN0LnN1YnN0cigwLCAyKSA9PT0gJy8vJztcbiAgICBpZiAoc2xhc2hlcyAmJiAhKHByb3RvICYmIGhvc3RsZXNzUHJvdG9jb2xbcHJvdG9dKSkge1xuICAgICAgcmVzdCA9IHJlc3Quc3Vic3RyKDIpO1xuICAgICAgdGhpcy5zbGFzaGVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhvc3RsZXNzUHJvdG9jb2xbcHJvdG9dICYmXG4gICAgICAoc2xhc2hlcyB8fCAocHJvdG8gJiYgIXNsYXNoZWRQcm90b2NvbFtwcm90b10pKSkge1xuICAgIC8vIHRoZXJlJ3MgYSBob3N0bmFtZS5cbiAgICAvLyB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgLywgPywgOywgb3IgIyBlbmRzIHRoZSBob3N0LlxuICAgIC8vXG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gQCBpbiB0aGUgaG9zdG5hbWUsIHRoZW4gbm9uLWhvc3QgY2hhcnMgKmFyZSogYWxsb3dlZFxuICAgIC8vIHRvIHRoZSBsZWZ0IG9mIHRoZSBsYXN0IEAgc2lnbiwgdW5sZXNzIHNvbWUgaG9zdC1lbmRpbmcgY2hhcmFjdGVyXG4gICAgLy8gY29tZXMgKmJlZm9yZSogdGhlIEAtc2lnbi5cbiAgICAvLyBVUkxzIGFyZSBvYm5veGlvdXMuXG4gICAgLy9cbiAgICAvLyBleDpcbiAgICAvLyBodHRwOi8vYUBiQGMvID0+IHVzZXI6YUBiIGhvc3Q6Y1xuICAgIC8vIGh0dHA6Ly9hQGI/QGMgPT4gdXNlcjphIGhvc3Q6YyBwYXRoOi8/QGNcblxuICAgIC8vIHYwLjEyIFRPRE8oaXNhYWNzKTogVGhpcyBpcyBub3QgcXVpdGUgaG93IENocm9tZSBkb2VzIHRoaW5ncy5cbiAgICAvLyBSZXZpZXcgb3VyIHRlc3QgY2FzZSBhZ2FpbnN0IGJyb3dzZXJzIG1vcmUgY29tcHJlaGVuc2l2ZWx5LlxuXG4gICAgLy8gZmluZCB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgYW55IGhvc3RFbmRpbmdDaGFyc1xuICAgIGxldCBob3N0RW5kID0gLTE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0RW5kaW5nQ2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhlYyA9IHJlc3QuaW5kZXhPZihob3N0RW5kaW5nQ2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKSB7XG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgbGV0IGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICB9XG5cbiAgICAvLyB0aGUgaG9zdCBpcyB0aGUgcmVtYWluaW5nIHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBub24taG9zdCBjaGFyXG4gICAgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9uSG9zdENoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSkge1xuICAgICAgICBob3N0RW5kID0gaGVjO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBpZiB3ZSBzdGlsbCBoYXZlIG5vdCBoaXQgaXQsIHRoZW4gdGhlIGVudGlyZSB0aGluZyBpcyBhIGhvc3QuXG4gICAgaWYgKGhvc3RFbmQgPT09IC0xKSB7XG4gICAgICBob3N0RW5kID0gcmVzdC5sZW5ndGg7XG4gICAgfVxuXG4gICAgaWYgKHJlc3RbaG9zdEVuZCAtIDFdID09PSAnOicpIHsgaG9zdEVuZC0tOyB9XG4gICAgY29uc3QgaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KGhvc3QpO1xuXG4gICAgLy8gd2UndmUgaW5kaWNhdGVkIHRoYXQgdGhlcmUgaXMgYSBob3N0bmFtZSxcbiAgICAvLyBzbyBldmVuIGlmIGl0J3MgZW1wdHksIGl0IGhhcyB0byBiZSBwcmVzZW50LlxuICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuXG4gICAgLy8gaWYgaG9zdG5hbWUgYmVnaW5zIHdpdGggWyBhbmQgZW5kcyB3aXRoIF1cbiAgICAvLyBhc3N1bWUgdGhhdCBpdCdzIGFuIElQdjYgYWRkcmVzcy5cbiAgICBjb25zdCBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgY29uc3QgaG9zdHBhcnRzID0gdGhpcy5ob3N0bmFtZS5zcGxpdCgvXFwuLyk7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGhvc3RwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IGhvc3RwYXJ0c1tpXTtcbiAgICAgICAgaWYgKCFwYXJ0KSB7IGNvbnRpbnVlIH1cbiAgICAgICAgaWYgKCFwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgbGV0IG5ld3BhcnQgPSAnJztcbiAgICAgICAgICBmb3IgKGxldCBqID0gMCwgayA9IHBhcnQubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydC5jaGFyQ29kZUF0KGopID4gMTI3KSB7XG4gICAgICAgICAgICAgIC8vIHdlIHJlcGxhY2Ugbm9uLUFTQ0lJIGNoYXIgd2l0aCBhIHRlbXBvcmFyeSBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRoaXMgdG8gbWFrZSBzdXJlIHNpemUgb2YgaG9zdG5hbWUgaXMgbm90XG4gICAgICAgICAgICAgIC8vIGJyb2tlbiBieSByZXBsYWNpbmcgbm9uLUFTQ0lJIGJ5IG5vdGhpbmdcbiAgICAgICAgICAgICAgbmV3cGFydCArPSAneCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9IHBhcnRbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHdlIHRlc3QgYWdhaW4gd2l0aCBBU0NJSSBjaGFyIG9ubHlcbiAgICAgICAgICBpZiAoIW5ld3BhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICBjb25zdCBub3RIb3N0ID0gaG9zdHBhcnRzLnNsaWNlKGkgKyAxKTtcbiAgICAgICAgICAgIGNvbnN0IGJpdCA9IHBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0U3RhcnQpO1xuICAgICAgICAgICAgaWYgKGJpdCkge1xuICAgICAgICAgICAgICB2YWxpZFBhcnRzLnB1c2goYml0WzFdKTtcbiAgICAgICAgICAgICAgbm90SG9zdC51bnNoaWZ0KGJpdFsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm90SG9zdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmVzdCA9IG5vdEhvc3Quam9pbignLicpICsgcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaG9zdG5hbWUgPSB2YWxpZFBhcnRzLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICB9XG4gIH1cblxuICAvLyBjaG9wIG9mZiBmcm9tIHRoZSB0YWlsIGZpcnN0LlxuICBjb25zdCBoYXNoID0gcmVzdC5pbmRleE9mKCcjJyk7XG4gIGlmIChoYXNoICE9PSAtMSkge1xuICAgIC8vIGdvdCBhIGZyYWdtZW50IHN0cmluZy5cbiAgICB0aGlzLmhhc2ggPSByZXN0LnN1YnN0cihoYXNoKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBoYXNoKTtcbiAgfVxuICBjb25zdCBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9XG4gIGlmIChyZXN0KSB7IHRoaXMucGF0aG5hbWUgPSByZXN0OyB9XG4gIGlmIChzbGFzaGVkUHJvdG9jb2xbbG93ZXJQcm90b10gJiZcbiAgICAgIHRoaXMuaG9zdG5hbWUgJiYgIXRoaXMucGF0aG5hbWUpIHtcbiAgICB0aGlzLnBhdGhuYW1lID0gJyc7XG4gIH1cblxuICByZXR1cm4gdGhpc1xufTtcblxuVXJsLnByb3RvdHlwZS5wYXJzZUhvc3QgPSBmdW5jdGlvbiAoaG9zdCkge1xuICBsZXQgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgeyB0aGlzLmhvc3RuYW1lID0gaG9zdDsgfVxufTtcblxuZXhwb3J0cy5kZWNvZGUgPSBkZWNvZGU7XG5leHBvcnRzLmVuY29kZSA9IGVuY29kZTtcbmV4cG9ydHMuZm9ybWF0ID0gZm9ybWF0O1xuZXhwb3J0cy5wYXJzZSA9IHVybFBhcnNlO1xuIiwgIid1c2Ugc3RyaWN0JztcblxudmFyIHJlZ2V4JDUgPSAvW1xcMC1cXHVEN0ZGXFx1RTAwMC1cXHVGRkZGXXxbXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdfFtcXHVEODAwLVxcdURCRkZdKD8hW1xcdURDMDAtXFx1REZGRl0pfCg/OlteXFx1RDgwMC1cXHVEQkZGXXxeKVtcXHVEQzAwLVxcdURGRkZdLztcblxudmFyIHJlZ2V4JDQgPSAvW1xcMC1cXHgxRlxceDdGLVxceDlGXS87XG5cbnZhciByZWdleCQzID0gL1tcXHhBRFxcdTA2MDAtXFx1MDYwNVxcdTA2MUNcXHUwNkREXFx1MDcwRlxcdTA4OTBcXHUwODkxXFx1MDhFMlxcdTE4MEVcXHUyMDBCLVxcdTIwMEZcXHUyMDJBLVxcdTIwMkVcXHUyMDYwLVxcdTIwNjRcXHUyMDY2LVxcdTIwNkZcXHVGRUZGXFx1RkZGOS1cXHVGRkZCXXxcXHVEODA0W1xcdURDQkRcXHVEQ0NEXXxcXHVEODBEW1xcdURDMzAtXFx1REMzRl18XFx1RDgyRltcXHVEQ0EwLVxcdURDQTNdfFxcdUQ4MzRbXFx1REQ3My1cXHVERDdBXXxcXHVEQjQwW1xcdURDMDFcXHVEQzIwLVxcdURDN0ZdLztcblxudmFyIHJlZ2V4JDIgPSAvWyEtIyUtXFwqLC1cXC86O1xcP0BcXFstXFxdX1xce1xcfVxceEExXFx4QTdcXHhBQlxceEI2XFx4QjdcXHhCQlxceEJGXFx1MDM3RVxcdTAzODdcXHUwNTVBLVxcdTA1NUZcXHUwNTg5XFx1MDU4QVxcdTA1QkVcXHUwNUMwXFx1MDVDM1xcdTA1QzZcXHUwNUYzXFx1MDVGNFxcdTA2MDlcXHUwNjBBXFx1MDYwQ1xcdTA2MERcXHUwNjFCXFx1MDYxRC1cXHUwNjFGXFx1MDY2QS1cXHUwNjZEXFx1MDZENFxcdTA3MDAtXFx1MDcwRFxcdTA3RjctXFx1MDdGOVxcdTA4MzAtXFx1MDgzRVxcdTA4NUVcXHUwOTY0XFx1MDk2NVxcdTA5NzBcXHUwOUZEXFx1MEE3NlxcdTBBRjBcXHUwQzc3XFx1MEM4NFxcdTBERjRcXHUwRTRGXFx1MEU1QVxcdTBFNUJcXHUwRjA0LVxcdTBGMTJcXHUwRjE0XFx1MEYzQS1cXHUwRjNEXFx1MEY4NVxcdTBGRDAtXFx1MEZENFxcdTBGRDlcXHUwRkRBXFx1MTA0QS1cXHUxMDRGXFx1MTBGQlxcdTEzNjAtXFx1MTM2OFxcdTE0MDBcXHUxNjZFXFx1MTY5QlxcdTE2OUNcXHUxNkVCLVxcdTE2RURcXHUxNzM1XFx1MTczNlxcdTE3RDQtXFx1MTdENlxcdTE3RDgtXFx1MTdEQVxcdTE4MDAtXFx1MTgwQVxcdTE5NDRcXHUxOTQ1XFx1MUExRVxcdTFBMUZcXHUxQUEwLVxcdTFBQTZcXHUxQUE4LVxcdTFBQURcXHUxQjVBLVxcdTFCNjBcXHUxQjdEXFx1MUI3RVxcdTFCRkMtXFx1MUJGRlxcdTFDM0ItXFx1MUMzRlxcdTFDN0VcXHUxQzdGXFx1MUNDMC1cXHUxQ0M3XFx1MUNEM1xcdTIwMTAtXFx1MjAyN1xcdTIwMzAtXFx1MjA0M1xcdTIwNDUtXFx1MjA1MVxcdTIwNTMtXFx1MjA1RVxcdTIwN0RcXHUyMDdFXFx1MjA4RFxcdTIwOEVcXHUyMzA4LVxcdTIzMEJcXHUyMzI5XFx1MjMyQVxcdTI3NjgtXFx1Mjc3NVxcdTI3QzVcXHUyN0M2XFx1MjdFNi1cXHUyN0VGXFx1Mjk4My1cXHUyOTk4XFx1MjlEOC1cXHUyOURCXFx1MjlGQ1xcdTI5RkRcXHUyQ0Y5LVxcdTJDRkNcXHUyQ0ZFXFx1MkNGRlxcdTJENzBcXHUyRTAwLVxcdTJFMkVcXHUyRTMwLVxcdTJFNEZcXHUyRTUyLVxcdTJFNURcXHUzMDAxLVxcdTMwMDNcXHUzMDA4LVxcdTMwMTFcXHUzMDE0LVxcdTMwMUZcXHUzMDMwXFx1MzAzRFxcdTMwQTBcXHUzMEZCXFx1QTRGRVxcdUE0RkZcXHVBNjBELVxcdUE2MEZcXHVBNjczXFx1QTY3RVxcdUE2RjItXFx1QTZGN1xcdUE4NzQtXFx1QTg3N1xcdUE4Q0VcXHVBOENGXFx1QThGOC1cXHVBOEZBXFx1QThGQ1xcdUE5MkVcXHVBOTJGXFx1QTk1RlxcdUE5QzEtXFx1QTlDRFxcdUE5REVcXHVBOURGXFx1QUE1Qy1cXHVBQTVGXFx1QUFERVxcdUFBREZcXHVBQUYwXFx1QUFGMVxcdUFCRUJcXHVGRDNFXFx1RkQzRlxcdUZFMTAtXFx1RkUxOVxcdUZFMzAtXFx1RkU1MlxcdUZFNTQtXFx1RkU2MVxcdUZFNjNcXHVGRTY4XFx1RkU2QVxcdUZFNkJcXHVGRjAxLVxcdUZGMDNcXHVGRjA1LVxcdUZGMEFcXHVGRjBDLVxcdUZGMEZcXHVGRjFBXFx1RkYxQlxcdUZGMUZcXHVGRjIwXFx1RkYzQi1cXHVGRjNEXFx1RkYzRlxcdUZGNUJcXHVGRjVEXFx1RkY1Ri1cXHVGRjY1XXxcXHVEODAwW1xcdUREMDAtXFx1REQwMlxcdURGOUZcXHVERkQwXXxcXHVEODAxXFx1REQ2RnxcXHVEODAyW1xcdURDNTdcXHVERDFGXFx1REQzRlxcdURFNTAtXFx1REU1OFxcdURFN0ZcXHVERUYwLVxcdURFRjZcXHVERjM5LVxcdURGM0ZcXHVERjk5LVxcdURGOUNdfFxcdUQ4MDNbXFx1REVBRFxcdURGNTUtXFx1REY1OVxcdURGODYtXFx1REY4OV18XFx1RDgwNFtcXHVEQzQ3LVxcdURDNERcXHVEQ0JCXFx1RENCQ1xcdURDQkUtXFx1RENDMVxcdURENDAtXFx1REQ0M1xcdURENzRcXHVERDc1XFx1RERDNS1cXHVEREM4XFx1RERDRFxcdUREREJcXHVERERELVxcdUREREZcXHVERTM4LVxcdURFM0RcXHVERUE5XXxcXHVEODA1W1xcdURDNEItXFx1REM0RlxcdURDNUFcXHVEQzVCXFx1REM1RFxcdURDQzZcXHVEREMxLVxcdURERDdcXHVERTQxLVxcdURFNDNcXHVERTYwLVxcdURFNkNcXHVERUI5XFx1REYzQy1cXHVERjNFXXxcXHVEODA2W1xcdURDM0JcXHVERDQ0LVxcdURENDZcXHVEREUyXFx1REUzRi1cXHVERTQ2XFx1REU5QS1cXHVERTlDXFx1REU5RS1cXHVERUEyXFx1REYwMC1cXHVERjA5XXxcXHVEODA3W1xcdURDNDEtXFx1REM0NVxcdURDNzBcXHVEQzcxXFx1REVGN1xcdURFRjhcXHVERjQzLVxcdURGNEZcXHVERkZGXXxcXHVEODA5W1xcdURDNzAtXFx1REM3NF18XFx1RDgwQltcXHVERkYxXFx1REZGMl18XFx1RDgxQVtcXHVERTZFXFx1REU2RlxcdURFRjVcXHVERjM3LVxcdURGM0JcXHVERjQ0XXxcXHVEODFCW1xcdURFOTctXFx1REU5QVxcdURGRTJdfFxcdUQ4MkZcXHVEQzlGfFxcdUQ4MzZbXFx1REU4Ny1cXHVERThCXXxcXHVEODNBW1xcdURENUVcXHVERDVGXS87XG5cbnZhciByZWdleCQxID0gL1tcXCRcXCs8LT5cXF5gXFx8flxceEEyLVxceEE2XFx4QThcXHhBOVxceEFDXFx4QUUtXFx4QjFcXHhCNFxceEI4XFx4RDdcXHhGN1xcdTAyQzItXFx1MDJDNVxcdTAyRDItXFx1MDJERlxcdTAyRTUtXFx1MDJFQlxcdTAyRURcXHUwMkVGLVxcdTAyRkZcXHUwMzc1XFx1MDM4NFxcdTAzODVcXHUwM0Y2XFx1MDQ4MlxcdTA1OEQtXFx1MDU4RlxcdTA2MDYtXFx1MDYwOFxcdTA2MEJcXHUwNjBFXFx1MDYwRlxcdTA2REVcXHUwNkU5XFx1MDZGRFxcdTA2RkVcXHUwN0Y2XFx1MDdGRVxcdTA3RkZcXHUwODg4XFx1MDlGMlxcdTA5RjNcXHUwOUZBXFx1MDlGQlxcdTBBRjFcXHUwQjcwXFx1MEJGMy1cXHUwQkZBXFx1MEM3RlxcdTBENEZcXHUwRDc5XFx1MEUzRlxcdTBGMDEtXFx1MEYwM1xcdTBGMTNcXHUwRjE1LVxcdTBGMTdcXHUwRjFBLVxcdTBGMUZcXHUwRjM0XFx1MEYzNlxcdTBGMzhcXHUwRkJFLVxcdTBGQzVcXHUwRkM3LVxcdTBGQ0NcXHUwRkNFXFx1MEZDRlxcdTBGRDUtXFx1MEZEOFxcdTEwOUVcXHUxMDlGXFx1MTM5MC1cXHUxMzk5XFx1MTY2RFxcdTE3REJcXHUxOTQwXFx1MTlERS1cXHUxOUZGXFx1MUI2MS1cXHUxQjZBXFx1MUI3NC1cXHUxQjdDXFx1MUZCRFxcdTFGQkYtXFx1MUZDMVxcdTFGQ0QtXFx1MUZDRlxcdTFGREQtXFx1MUZERlxcdTFGRUQtXFx1MUZFRlxcdTFGRkRcXHUxRkZFXFx1MjA0NFxcdTIwNTJcXHUyMDdBLVxcdTIwN0NcXHUyMDhBLVxcdTIwOENcXHUyMEEwLVxcdTIwQzBcXHUyMTAwXFx1MjEwMVxcdTIxMDMtXFx1MjEwNlxcdTIxMDhcXHUyMTA5XFx1MjExNFxcdTIxMTYtXFx1MjExOFxcdTIxMUUtXFx1MjEyM1xcdTIxMjVcXHUyMTI3XFx1MjEyOVxcdTIxMkVcXHUyMTNBXFx1MjEzQlxcdTIxNDAtXFx1MjE0NFxcdTIxNEEtXFx1MjE0RFxcdTIxNEZcXHUyMThBXFx1MjE4QlxcdTIxOTAtXFx1MjMwN1xcdTIzMEMtXFx1MjMyOFxcdTIzMkItXFx1MjQyNlxcdTI0NDAtXFx1MjQ0QVxcdTI0OUMtXFx1MjRFOVxcdTI1MDAtXFx1Mjc2N1xcdTI3OTQtXFx1MjdDNFxcdTI3QzctXFx1MjdFNVxcdTI3RjAtXFx1Mjk4MlxcdTI5OTktXFx1MjlEN1xcdTI5REMtXFx1MjlGQlxcdTI5RkUtXFx1MkI3M1xcdTJCNzYtXFx1MkI5NVxcdTJCOTctXFx1MkJGRlxcdTJDRTUtXFx1MkNFQVxcdTJFNTBcXHUyRTUxXFx1MkU4MC1cXHUyRTk5XFx1MkU5Qi1cXHUyRUYzXFx1MkYwMC1cXHUyRkQ1XFx1MkZGMC1cXHUyRkZGXFx1MzAwNFxcdTMwMTJcXHUzMDEzXFx1MzAyMFxcdTMwMzZcXHUzMDM3XFx1MzAzRVxcdTMwM0ZcXHUzMDlCXFx1MzA5Q1xcdTMxOTBcXHUzMTkxXFx1MzE5Ni1cXHUzMTlGXFx1MzFDMC1cXHUzMUUzXFx1MzFFRlxcdTMyMDAtXFx1MzIxRVxcdTMyMkEtXFx1MzI0N1xcdTMyNTBcXHUzMjYwLVxcdTMyN0ZcXHUzMjhBLVxcdTMyQjBcXHUzMkMwLVxcdTMzRkZcXHU0REMwLVxcdTRERkZcXHVBNDkwLVxcdUE0QzZcXHVBNzAwLVxcdUE3MTZcXHVBNzIwXFx1QTcyMVxcdUE3ODlcXHVBNzhBXFx1QTgyOC1cXHVBODJCXFx1QTgzNi1cXHVBODM5XFx1QUE3Ny1cXHVBQTc5XFx1QUI1QlxcdUFCNkFcXHVBQjZCXFx1RkIyOVxcdUZCQjItXFx1RkJDMlxcdUZENDAtXFx1RkQ0RlxcdUZEQ0ZcXHVGREZDLVxcdUZERkZcXHVGRTYyXFx1RkU2NC1cXHVGRTY2XFx1RkU2OVxcdUZGMDRcXHVGRjBCXFx1RkYxQy1cXHVGRjFFXFx1RkYzRVxcdUZGNDBcXHVGRjVDXFx1RkY1RVxcdUZGRTAtXFx1RkZFNlxcdUZGRTgtXFx1RkZFRVxcdUZGRkNcXHVGRkZEXXxcXHVEODAwW1xcdUREMzctXFx1REQzRlxcdURENzktXFx1REQ4OVxcdUREOEMtXFx1REQ4RVxcdUREOTAtXFx1REQ5Q1xcdUREQTBcXHVEREQwLVxcdURERkNdfFxcdUQ4MDJbXFx1REM3N1xcdURDNzhcXHVERUM4XXxcXHVEODA1XFx1REYzRnxcXHVEODA3W1xcdURGRDUtXFx1REZGMV18XFx1RDgxQVtcXHVERjNDLVxcdURGM0ZcXHVERjQ1XXxcXHVEODJGXFx1REM5Q3xcXHVEODMzW1xcdURGNTAtXFx1REZDM118XFx1RDgzNFtcXHVEQzAwLVxcdURDRjVcXHVERDAwLVxcdUREMjZcXHVERDI5LVxcdURENjRcXHVERDZBLVxcdURENkNcXHVERDgzXFx1REQ4NFxcdUREOEMtXFx1RERBOVxcdUREQUUtXFx1RERFQVxcdURFMDAtXFx1REU0MVxcdURFNDVcXHVERjAwLVxcdURGNTZdfFxcdUQ4MzVbXFx1REVDMVxcdURFREJcXHVERUZCXFx1REYxNVxcdURGMzVcXHVERjRGXFx1REY2RlxcdURGODlcXHVERkE5XFx1REZDM118XFx1RDgzNltcXHVEQzAwLVxcdURERkZcXHVERTM3LVxcdURFM0FcXHVERTZELVxcdURFNzRcXHVERTc2LVxcdURFODNcXHVERTg1XFx1REU4Nl18XFx1RDgzOFtcXHVERDRGXFx1REVGRl18XFx1RDgzQltcXHVEQ0FDXFx1RENCMFxcdUREMkVcXHVERUYwXFx1REVGMV18XFx1RDgzQ1tcXHVEQzAwLVxcdURDMkJcXHVEQzMwLVxcdURDOTNcXHVEQ0EwLVxcdURDQUVcXHVEQ0IxLVxcdURDQkZcXHVEQ0MxLVxcdURDQ0ZcXHVEQ0QxLVxcdURDRjVcXHVERDBELVxcdUREQURcXHVEREU2LVxcdURFMDJcXHVERTEwLVxcdURFM0JcXHVERTQwLVxcdURFNDhcXHVERTUwXFx1REU1MVxcdURFNjAtXFx1REU2NVxcdURGMDAtXFx1REZGRl18XFx1RDgzRFtcXHVEQzAwLVxcdURFRDdcXHVERURDLVxcdURFRUNcXHVERUYwLVxcdURFRkNcXHVERjAwLVxcdURGNzZcXHVERjdCLVxcdURGRDlcXHVERkUwLVxcdURGRUJcXHVERkYwXXxcXHVEODNFW1xcdURDMDAtXFx1REMwQlxcdURDMTAtXFx1REM0N1xcdURDNTAtXFx1REM1OVxcdURDNjAtXFx1REM4N1xcdURDOTAtXFx1RENBRFxcdURDQjBcXHVEQ0IxXFx1REQwMC1cXHVERTUzXFx1REU2MC1cXHVERTZEXFx1REU3MC1cXHVERTdDXFx1REU4MC1cXHVERTg4XFx1REU5MC1cXHVERUJEXFx1REVCRi1cXHVERUM1XFx1REVDRS1cXHVERURCXFx1REVFMC1cXHVERUU4XFx1REVGMC1cXHVERUY4XFx1REYwMC1cXHVERjkyXFx1REY5NC1cXHVERkNBXS87XG5cbnZhciByZWdleCA9IC9bIFxceEEwXFx1MTY4MFxcdTIwMDAtXFx1MjAwQVxcdTIwMjhcXHUyMDI5XFx1MjAyRlxcdTIwNUZcXHUzMDAwXS87XG5cbmV4cG9ydHMuQW55ID0gcmVnZXgkNTtcbmV4cG9ydHMuQ2MgPSByZWdleCQ0O1xuZXhwb3J0cy5DZiA9IHJlZ2V4JDM7XG5leHBvcnRzLlAgPSByZWdleCQyO1xuZXhwb3J0cy5TID0gcmVnZXgkMTtcbmV4cG9ydHMuWiA9IHJlZ2V4O1xuIiwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgIid1c2Ugc3RyaWN0JztcblxudmFyIHVjX21pY3JvID0gcmVxdWlyZSgndWMubWljcm8nKTtcblxuZnVuY3Rpb24gcmVGYWN0b3J5IChvcHRzKSB7XG4gIGNvbnN0IHJlID0ge307XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gIHJlLnNyY19BbnkgPSB1Y19taWNyby5Bbnkuc291cmNlO1xuICByZS5zcmNfQ2MgPSB1Y19taWNyby5DYy5zb3VyY2U7XG4gIHJlLnNyY19aID0gdWNfbWljcm8uWi5zb3VyY2U7XG4gIHJlLnNyY19QID0gdWNfbWljcm8uUC5zb3VyY2U7XG5cbiAgLy8gXFxwe1xcWlxcUFxcQ2NcXENGfSAod2hpdGUgc3BhY2VzICsgY29udHJvbCArIGZvcm1hdCArIHB1bmN0dWF0aW9uKVxuICByZS5zcmNfWlBDYyA9IFtyZS5zcmNfWiwgcmUuc3JjX1AsIHJlLnNyY19DY10uam9pbignfCcpO1xuXG4gIC8vIFxccHtcXFpcXENjfSAod2hpdGUgc3BhY2VzICsgY29udHJvbClcbiAgcmUuc3JjX1pDYyA9IFtyZS5zcmNfWiwgcmUuc3JjX0NjXS5qb2luKCd8Jyk7XG5cbiAgLy8gRXhwZXJpbWVudGFsLiBMaXN0IG9mIGNoYXJzLCBjb21wbGV0ZWx5IHByb2hpYml0ZWQgaW4gbGlua3NcbiAgLy8gYmVjYXVzZSBjYW4gc2VwYXJhdGUgaXQgZnJvbSBvdGhlciBwYXJ0IG9mIHRleHRcbiAgY29uc3QgdGV4dF9zZXBhcmF0b3JzID0gJ1s+PFxcdWZmNWNdJztcblxuICAvLyBBbGwgcG9zc2libGUgd29yZCBjaGFyYWN0ZXJzIChldmVyeXRoaW5nIHdpdGhvdXQgcHVuY3R1YXRpb24sIHNwYWNlcyAmIGNvbnRyb2xzKVxuICAvLyBEZWZpbmVkIHZpYSBwdW5jdHVhdGlvbiAmIHNwYWNlcyB0byBzYXZlIHNwYWNlXG4gIC8vIFNob3VsZCBiZSBzb21ldGhpbmcgbGlrZSBcXHB7XFxMXFxOXFxTXFxNfSAoXFx3IGJ1dCB3aXRob3V0IGBfYClcbiAgcmUuc3JjX3BzZXVkb19sZXR0ZXIgPSBgKD86KD8hJHt0ZXh0X3NlcGFyYXRvcnN9fCR7cmUuc3JjX1pQQ2N9KSR7cmUuc3JjX0FueX0pYDtcbiAgLy8gVGhlIHNhbWUgYXMgYWJvdGhlIGJ1dCB3aXRob3V0IFswLTldXG4gIC8vIHZhciBzcmNfcHNldWRvX2xldHRlcl9ub25fZCA9ICcoPzooPyFbMC05XXwnICsgc3JjX1pQQ2MgKyAnKScgKyBzcmNfQW55ICsgJyknO1xuXG4gIHJlLnNyY19pcDQgPVxuXG4gICAgJyg/OigyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pXFxcXC4pezN9KDI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPyknO1xuXG4gIC8vIFByb2hpYml0IGFueSBvZiBcIkAvW10oKVwiIGluIHVzZXIvcGFzcyB0byBhdm9pZCB3cm9uZyBkb21haW4gZmV0Y2guXG4gIC8vIExlbmd0aCBpcyBjYXBwZWQgdG8gZXhjbHVkZSBwb3NzaWJsZSByZXNjYW5zIHRpbGwgdGhlIGVuZCBhbmQgYXZvaWQgTyhuXjIpXG4gIC8vIERvUy4gTm8gc3RhbmRhcmQgbGltaXQsIGp1c3QgdGFrZSBzb21ldGhpbmcgcmVhc29uYWJsZS5cbiAgcmUuc3JjX2F1dGggPSBgKD86KD86KD8hJHtyZS5zcmNfWkNjfXxbQC9cXFxcW1xcXFxdKCldKS4pezEsNTB9QCk/YDtcblxuICByZS5zcmNfcG9ydCA9XG5cbiAgICAnKD86Oig/OjYoPzpbMC00XVxcXFxkezN9fDUoPzpbMC00XVxcXFxkezJ9fDUoPzpbMC0yXVxcXFxkfDNbMC01XSkpKXxbMS01XT9cXFxcZHsxLDR9KSk/JztcblxuICByZS5zcmNfaG9zdF90ZXJtaW5hdG9yID1cblxuICAgIGAoPz0kfCR7dGV4dF9zZXBhcmF0b3JzfXwke3JlLnNyY19aUENjfSlgICtcbiAgICBgKD8hJHtvcHRzWyctLS0nXSA/ICctKD8hLS0pfCcgOiAnLXwnfV98OlxcXFxkfFxcXFwuLXxcXFxcLig/ISR8JHtyZS5zcmNfWlBDY30pKWA7XG5cbiAgcmUuc3JjX3BhdGggPVxuXG4gICAgJyg/OicgK1xuICAgICAgJ1svPyNdJyArXG4gICAgICAgICcoPzonICtcbiAgICAgICAgICBgKD8hJHtyZS5zcmNfWkNjfXwke3RleHRfc2VwYXJhdG9yc318WygpW1xcXFxde30uLFwiJz8hXFxcXC07XSkufGAgK1xuICAgICAgICAgIGBcXFxcWyg/Oig/ISR7cmUuc3JjX1pDY318XFxcXF0pLikqXFxcXF18YCArXG4gICAgICAgICAgYFxcXFwoKD86KD8hJHtyZS5zcmNfWkNjfXxbKV0pLikqXFxcXCl8YCArXG4gICAgICAgICAgYFxcXFx7KD86KD8hJHtyZS5zcmNfWkNjfXxbfV0pLikqXFxcXH18YCArXG4gICAgICAgICAgYFxcXFxcIig/Oig/ISR7cmUuc3JjX1pDY318W1wiXSkuKStcXFxcXCJ8YCArXG4gICAgICAgICAgYFxcXFwnKD86KD8hJHtyZS5zcmNfWkNjfXxbJ10pLikrXFxcXCd8YCArXG5cbiAgICAgICAgICAvLyBhbGxvdyBgSSdtX2tpbmdgIGlmIG5vIHBhaXIgZm91bmRcbiAgICAgICAgICBgXFxcXCcoPz0ke3JlLnNyY19wc2V1ZG9fbGV0dGVyfXxbLV0pfGAgK1xuXG4gICAgICAgICAgLy8gZ29vZ2xlIGhhcyBtYW55IGRvdHMgaW4gXCJnb29nbGUgc2VhcmNoXCIgbGlua3MgKCM2NiwgIzgxKS5cbiAgICAgICAgICAvLyBnaXRodWIgaGFzIC4uLiBpbiBjb21taXQgcmFuZ2UgbGlua3MsXG4gICAgICAgICAgLy8gUmVzdHJpY3QgdG9cbiAgICAgICAgICAvLyAtIGVuZ2xpc2hcbiAgICAgICAgICAvLyAtIHBlcmNlbnQtZW5jb2RlZFxuICAgICAgICAgIC8vIC0gcGFydHMgb2YgZmlsZSBwYXRoXG4gICAgICAgICAgLy8gLSBwYXJhbXMgc2VwYXJhdG9yXG4gICAgICAgICAgLy8gdW50aWwgbW9yZSBleGFtcGxlcyBmb3VuZC5cbiAgICAgICAgICAnXFxcXC57Mix9W2EtekEtWjAtOSUvJl18JyArXG5cbiAgICAgICAgICBgXFxcXC4oPyEke3JlLnNyY19aQ2N9fFsuXXwkKXxgICtcbiAgICAgICAgICAob3B0c1snLS0tJ11cbiAgICAgICAgICAgID8gJ1xcXFwtKD8hLS0oPzpbXi1dfCQpKSg/Oi0qKXwnIC8vIGAtLS1gID0+IGxvbmcgZGFzaCwgdGVybWluYXRlXG4gICAgICAgICAgICA6ICdcXFxcLSt8J1xuICAgICAgICAgICkgK1xuICAgICAgICAgIC8vIGFsbG93IGAsLCxgIGluIHBhdGhzXG4gICAgICAgICAgYCwoPyEke3JlLnNyY19aQ2N9fCQpfGAgK1xuXG4gICAgICAgICAgLy8gYWxsb3cgYDtgIGlmIG5vdCBmb2xsb3dlZCBieSBzcGFjZS1saWtlIGNoYXJcbiAgICAgICAgICBgOyg/ISR7cmUuc3JjX1pDY318JCl8YCArXG5cbiAgICAgICAgICAvLyBhbGxvdyBgISEhYCBpbiBwYXRocywgYnV0IG5vdCBhdCB0aGUgZW5kXG4gICAgICAgICAgYFxcXFwhKyg/ISR7cmUuc3JjX1pDY318WyFdfCQpfGAgK1xuXG4gICAgICAgICAgYFxcXFw/KD8hJHtyZS5zcmNfWkNjfXxbP118JClgICtcbiAgICAgICAgJykrJyArXG4gICAgICAnfFxcXFwvJyArXG4gICAgJyk/JztcblxuICAvLyBBbGxvdyBhbnl0aGluZyBpbiBtYXJrZG93biBzcGVjLCBmb3JiaWQgcXVvdGUgKFwiKSBhdCB0aGUgZmlyc3QgcG9zaXRpb25cbiAgLy8gYmVjYXVzZSBlbWFpbHMgZW5jbG9zZWQgaW4gcXVvdGVzIGFyZSBmYXIgbW9yZSBjb21tb25cbiAgLy8gTWF4IG5hbWUgbGVuZ3RoIGNhcHBlZCB0byA2NCBjaGFycyAoUkZDIDUzMjEpLiBUaGlzIGFsc28gcHJldmVudHMgTyhuXjIpXG4gIC8vIHJlc2NhbnMgdG8gdGhlIGVuZCBvbiBpbnB1dHMgbGlrZSBgbWFpbHRvOm1haWx0bzouLi5gXG4gIHJlLnNyY19lbWFpbF9uYW1lID1cblxuICAgICdbXFxcXC07OiY9XFxcXCtcXFxcJCxcXFxcLmEtekEtWjAtOV9dW1xcXFwtOzomPVxcXFwrXFxcXCQsXFxcXFwiXFxcXC5hLXpBLVowLTlfXXswLDYzfSc7XG5cbiAgcmUuc3JjX3huID1cblxuICAgICd4bi0tW2EtejAtOVxcXFwtXXsxLDU5fSc7XG5cbiAgLy8gTW9yZSB0byByZWFkIGFib3V0IGRvbWFpbiBuYW1lc1xuICAvLyBodHRwOi8vc2VydmVyZmF1bHQuY29tL3F1ZXN0aW9ucy82MzgyNjAvXG5cbiAgcmUuc3JjX2RvbWFpbl9yb290ID1cblxuICAgIC8vIEFsbG93IGxldHRlcnMgJiBkaWdpdHMgKGh0dHA6Ly90ZXN0MSlcbiAgICAnKD86JyArXG4gICAgICByZS5zcmNfeG4gK1xuICAgICAgJ3wnICtcbiAgICAgIGAke3JlLnNyY19wc2V1ZG9fbGV0dGVyfXsxLDYzfWAgK1xuICAgICcpJztcblxuICByZS5zcmNfZG9tYWluID1cblxuICAgICcoPzonICtcbiAgICAgIHJlLnNyY194biArXG4gICAgICAnfCcgK1xuICAgICAgYCg/OiR7cmUuc3JjX3BzZXVkb19sZXR0ZXJ9KWAgK1xuICAgICAgJ3wnICtcbiAgICAgIGAoPzoke3JlLnNyY19wc2V1ZG9fbGV0dGVyfSg/Oi18JHtyZS5zcmNfcHNldWRvX2xldHRlcn0pezAsNjF9JHtyZS5zcmNfcHNldWRvX2xldHRlcn0pYCArXG4gICAgJyknO1xuXG4gIHJlLnNyY19ob3N0ID1cblxuICAgICcoPzonICtcbiAgICAvLyBEb24ndCBuZWVkIElQIGNoZWNrLCBiZWNhdXNlIGRpZ2l0cyBhcmUgYWxyZWFkeSBhbGxvd2VkIGluIG5vcm1hbCBkb21haW4gbmFtZXNcbiAgICAvLyAgIHNyY19pcDQgK1xuICAgIC8vICd8JyArXG4gICAgICBgKD86KD86KD86JHtyZS5zcmNfZG9tYWlufSlcXFxcLikqJHtyZS5zcmNfZG9tYWlufSlgLyogX3Jvb3QgKi8gK1xuICAgICcpJztcblxuICByZS50cGxfaG9zdF9mdXp6eSA9XG5cbiAgICAnKD86JyArXG4gICAgICByZS5zcmNfaXA0ICtcbiAgICAnfCcgK1xuICAgICAgYCg/Oig/Oig/OiR7cmUuc3JjX2RvbWFpbn0pXFxcXC4pKyg/OiVUTERTJSkpYCArXG4gICAgJyknO1xuXG4gIHJlLnRwbF9ob3N0X25vX2lwX2Z1enp5ID1cblxuICAgIGAoPzooPzooPzoke3JlLnNyY19kb21haW59KVxcXFwuKSsoPzolVExEUyUpKWA7XG5cbiAgcmUuc3JjX2hvc3Rfc3RyaWN0ID1cblxuICAgIHJlLnNyY19ob3N0ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICByZS50cGxfaG9zdF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3RfZnV6enkgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnNyY19ob3N0X3BvcnRfc3RyaWN0ID1cblxuICAgIHJlLnNyY19ob3N0ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X3BvcnRfZnV6enlfc3RyaWN0ID1cblxuICAgIHJlLnRwbF9ob3N0X2Z1enp5ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X3BvcnRfbm9faXBfZnV6enlfc3RyaWN0ID1cblxuICAgIHJlLnRwbF9ob3N0X25vX2lwX2Z1enp5ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIC8vXG4gIC8vIE1haW4gcnVsZXNcbiAgLy9cblxuICAvLyBSdWRlIHRlc3QgZnV6enkgbGlua3MgYnkgaG9zdCwgZm9yIHF1aWNrIGRlbnlcbiAgcmUudHBsX2hvc3RfZnV6enlfdGVzdCA9XG5cbiAgICBgbG9jYWxob3N0fHd3d1xcXFwufFxcXFwuXFxcXGR7MSwzfVxcXFwufCg/OlxcXFwuKD86JVRMRFMlKSg/OiR7cmUuc3JjX1pQQ2N9fD58JCkpYDtcblxuICByZS50cGxfZW1haWxfZnV6enkgPVxuXG4gICAgICBgKF58JHt0ZXh0X3NlcGFyYXRvcnN9fFwifFxcXFwofCR7cmUuc3JjX1pDY30pYCArXG4gICAgICBgKCR7cmUuc3JjX2VtYWlsX25hbWV9QCR7cmUudHBsX2hvc3RfZnV6enlfc3RyaWN0fSlgO1xuXG4gIHJlLnRwbF9saW5rX2Z1enp5ID1cbiAgICAgIC8vIEZ1enp5IGxpbmsgY2FuJ3QgYmUgcHJlcGVuZGVkIHdpdGggLjovXFwtIGFuZCBub24gcHVuY3R1YXRpb24uXG4gICAgICAvLyBidXQgY2FuIHN0YXJ0IHdpdGggPiAobWFya2Rvd24gYmxvY2txdW90ZSlcbiAgICAgIGAoXnwoPyFbLjovXFxcXC1fQF0pKD86WyQrPD0+XlxcYHxcXHVmZjVjXXwke3JlLnNyY19aUENjfSkpYCArXG4gICAgICBgKCg/IVskKzw9Pl5cXGB8XFx1ZmY1Y10pJHtyZS50cGxfaG9zdF9wb3J0X2Z1enp5X3N0cmljdH0ke3JlLnNyY19wYXRofSlgO1xuXG4gIHJlLnRwbF9saW5rX25vX2lwX2Z1enp5ID1cbiAgICAgIC8vIEZ1enp5IGxpbmsgY2FuJ3QgYmUgcHJlcGVuZGVkIHdpdGggLjovXFwtIGFuZCBub24gcHVuY3R1YXRpb24uXG4gICAgICAvLyBidXQgY2FuIHN0YXJ0IHdpdGggPiAobWFya2Rvd24gYmxvY2txdW90ZSlcbiAgICAgIGAoXnwoPyFbLjovXFxcXC1fQF0pKD86WyQrPD0+XlxcYHxcXHVmZjVjXXwke3JlLnNyY19aUENjfSkpYCArXG4gICAgICBgKCg/IVskKzw9Pl5cXGB8XFx1ZmY1Y10pJHtyZS50cGxfaG9zdF9wb3J0X25vX2lwX2Z1enp5X3N0cmljdH0ke3JlLnNyY19wYXRofSlgO1xuXG4gIHJldHVybiByZVxufVxuXG4vL1xuLy8gSGVscGVyc1xuLy9cblxuLy8gTWVyZ2Ugb2JqZWN0c1xuLy9cbmZ1bmN0aW9uIGFzc2lnbiAob2JqIC8qIGZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiAqLykge1xuICBjb25zdCBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgIGlmICghc291cmNlKSB7IHJldHVybiB9XG5cbiAgICBPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgb2JqW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIG9ialxufVxuXG5mdW5jdGlvbiBfY2xhc3MgKG9iaikgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgfVxuZnVuY3Rpb24gaXNTdHJpbmcgKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nIH1cbmZ1bmN0aW9uIGlzT2JqZWN0IChvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBPYmplY3RdJyB9XG5mdW5jdGlvbiBpc1JlZ0V4cCAob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScgfVxuZnVuY3Rpb24gaXNGdW5jdGlvbiAob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyB9XG5cbmZ1bmN0aW9uIGVzY2FwZVJFIChzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKC9bLj8qK14kW1xcXVxcXFwoKXt9fC1dL2csICdcXFxcJCYnKSB9XG5cbi8vXG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICBmdXp6eUxpbms6IHRydWUsXG4gIGZ1enp5RW1haWw6IHRydWUsXG4gIGZ1enp5SVA6IGZhbHNlXG59O1xuXG5mdW5jdGlvbiBpc09wdGlvbnNPYmogKG9iaikge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqIHx8IHt9KS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgaykge1xuICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnMgKi9cbiAgICByZXR1cm4gYWNjIHx8IGRlZmF1bHRPcHRpb25zLmhhc093blByb3BlcnR5KGspXG4gIH0sIGZhbHNlKVxufVxuXG5jb25zdCBkZWZhdWx0U2NoZW1hcyA9IHtcbiAgJ2h0dHA6Jzoge1xuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAodGV4dCwgcG9zLCBzZWxmKSB7XG4gICAgICBjb25zdCB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgICBpZiAoIXNlbGYucmUuaHR0cCkge1xuICAgICAgICAvLyBjb21waWxlIGxhemlseSwgYmVjYXVzZSBcImhvc3RcIi1jb250YWluaW5nIHZhcmlhYmxlcyBjYW4gY2hhbmdlIG9uIHRsZHMgdXBkYXRlLlxuICAgICAgICBzZWxmLnJlLmh0dHAgPSBuZXcgUmVnRXhwKFxuICAgICAgICAgIGBeXFxcXC9cXFxcLyR7c2VsZi5yZS5zcmNfYXV0aH0ke3NlbGYucmUuc3JjX2hvc3RfcG9ydF9zdHJpY3R9JHtzZWxmLnJlLnNyY19wYXRofWAsICdpJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYucmUuaHR0cC50ZXN0KHRhaWwpKSB7XG4gICAgICAgIHJldHVybiB0YWlsLm1hdGNoKHNlbGYucmUuaHR0cClbMF0ubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgfSxcbiAgJ2h0dHBzOic6ICdodHRwOicsXG4gICdmdHA6JzogJ2h0dHA6JyxcbiAgJy8vJzoge1xuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAodGV4dCwgcG9zLCBzZWxmKSB7XG4gICAgICBjb25zdCB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgICBpZiAoIXNlbGYucmUubm9faHR0cCkge1xuICAgICAgLy8gY29tcGlsZSBsYXppbHksIGJlY2F1c2UgXCJob3N0XCItY29udGFpbmluZyB2YXJpYWJsZXMgY2FuIGNoYW5nZSBvbiB0bGRzIHVwZGF0ZS5cbiAgICAgICAgc2VsZi5yZS5ub19odHRwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXicgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX2F1dGggK1xuICAgICAgICAgIC8vIERvbid0IGFsbG93IHNpbmdsZS1sZXZlbCBkb21haW5zLCBiZWNhdXNlIG9mIGZhbHNlIHBvc2l0aXZlcyBsaWtlICcvL3Rlc3QnXG4gICAgICAgICAgLy8gd2l0aCBjb2RlIGNvbW1lbnRzXG4gICAgICAgICAgYCg/OmxvY2FsaG9zdHwoPzooPzoke3NlbGYucmUuc3JjX2RvbWFpbn0pXFxcXC4pKyR7c2VsZi5yZS5zcmNfZG9tYWluX3Jvb3R9KWAgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX3BvcnQgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX2hvc3RfdGVybWluYXRvciArXG4gICAgICAgICAgc2VsZi5yZS5zcmNfcGF0aCxcblxuICAgICAgICAgICdpJ1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZi5yZS5ub19odHRwLnRlc3QodGFpbCkpIHtcbiAgICAgICAgLy8gc2hvdWxkIG5vdCBiZSBgOi8vYCAmIGAvLy9gLCB0aGF0IHByb3RlY3RzIGZyb20gZXJyb3JzIGluIHByb3RvY29sIG5hbWVcbiAgICAgICAgaWYgKHBvcyA+PSAzICYmIHRleHRbcG9zIC0gM10gPT09ICc6JykgeyByZXR1cm4gMCB9XG4gICAgICAgIGlmIChwb3MgPj0gMyAmJiB0ZXh0W3BvcyAtIDNdID09PSAnLycpIHsgcmV0dXJuIDAgfVxuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLm5vX2h0dHApWzBdLmxlbmd0aFxuICAgICAgfVxuICAgICAgcmV0dXJuIDBcbiAgICB9XG4gIH0sXG4gICdtYWlsdG86Jzoge1xuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAodGV4dCwgcG9zLCBzZWxmKSB7XG4gICAgICBjb25zdCB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgICBpZiAoIXNlbGYucmUubWFpbHRvKSB7XG4gICAgICAgIHNlbGYucmUubWFpbHRvID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICBgXiR7c2VsZi5yZS5zcmNfZW1haWxfbmFtZX1AJHtzZWxmLnJlLnNyY19ob3N0X3N0cmljdH1gLCAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLnJlLm1haWx0by50ZXN0KHRhaWwpKSB7XG4gICAgICAgIHJldHVybiB0YWlsLm1hdGNoKHNlbGYucmUubWFpbHRvKVswXS5sZW5ndGhcbiAgICAgIH1cbiAgICAgIHJldHVybiAwXG4gICAgfVxuICB9XG59O1xuXG4vLyBSRSBwYXR0ZXJuIGZvciAyLWNoYXJhY3RlciB0bGRzIChhdXRvZ2VuZXJhdGVkIGJ5IC4vc3VwcG9ydC90bGRzXzJjaGFyX2dlbi5qcylcbmNvbnN0IHRsZHNfMmNoX3NyY19yZSA9ICdhW2NkZWZnaWxtbm9xcnN0dXd4el18YlthYmRlZmdoaWptbm9yc3R2d3l6XXxjW2FjZGZnaGlrbG1ub3J1dnd4eXpdfGRbZWprbW96XXxlW2NlZ3JzdHVdfGZbaWprbW9yXXxnW2FiZGVmZ2hpbG1ucHFyc3R1d3ldfGhba21ucnR1XXxpW2RlbG1ub3Fyc3RdfGpbZW1vcF18a1tlZ2hpbW5wcnd5el18bFthYmNpa3JzdHV2eV18bVthY2RlZ2hrbG1ub3BxcnN0dXZ3eHl6XXxuW2FjZWZnaWxvcHJ1el18b218cFthZWZnaGtsbW5yc3R3eV18cWF8cltlb3N1d118c1thYmNkZWdoaWprbG1ub3J0dXZ4eXpdfHRbY2RmZ2hqa2xtbm9ydHZ3el18dVthZ2tzeXpdfHZbYWNlZ2ludV18d1tmc118eVtldF18elthbXddJztcblxuLy8gRE9OJ1QgdHJ5IHRvIG1ha2UgUFJzIHdpdGggY2hhbmdlcy4gRXh0ZW5kIFRMRHMgd2l0aCBMaW5raWZ5SXQudGxkcygpIGluc3RlYWRcbmNvbnN0IHRsZHNfZGVmYXVsdCA9ICdiaXp8Y29tfGVkdXxnb3Z8bmV0fG9yZ3xwcm98d2VifHh4eHxhZXJvfGFzaWF8Y29vcHxpbmZvfG11c2V1bXxuYW1lfHNob3B8XHUwNDQwXHUwNDQ0Jy5zcGxpdCgnfCcpO1xuXG5mdW5jdGlvbiBjcmVhdGVWYWxpZGF0b3IgKHJlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGV4dCwgcG9zKSB7XG4gICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgIGlmIChyZS50ZXN0KHRhaWwpKSB7XG4gICAgICByZXR1cm4gdGFpbC5tYXRjaChyZSlbMF0ubGVuZ3RoXG4gICAgfVxuICAgIHJldHVybiAwXG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTm9ybWFsaXplciAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAobWF0Y2gsIHNlbGYpIHtcbiAgICBzZWxmLm5vcm1hbGl6ZShtYXRjaCk7XG4gIH1cbn1cblxuLy8gU2NoZW1hcyBjb21waWxlci4gQnVpbGQgcmVnZXhwcy5cbi8vXG5mdW5jdGlvbiBjb21waWxlIChzZWxmKSB7XG4gIC8vIExvYWQgJiBjbG9uZSBSRSBwYXR0ZXJucy5cbiAgY29uc3QgcmUgPSBzZWxmLnJlID0gcmVGYWN0b3J5KHNlbGYuX19vcHRzX18pO1xuXG4gIC8vIERlZmluZSBkeW5hbWljIHBhdHRlcm5zXG4gIGNvbnN0IHRsZHMgPSBzZWxmLl9fdGxkc19fLnNsaWNlKCk7XG5cbiAgc2VsZi5vbkNvbXBpbGUoKTtcblxuICBpZiAoIXNlbGYuX190bGRzX3JlcGxhY2VkX18pIHtcbiAgICB0bGRzLnB1c2godGxkc18yY2hfc3JjX3JlKTtcbiAgfVxuICB0bGRzLnB1c2gocmUuc3JjX3huKTtcblxuICByZS5zcmNfdGxkcyA9IHRsZHMuam9pbignfCcpO1xuXG4gIGZ1bmN0aW9uIHVudHBsICh0cGwpIHsgcmV0dXJuIHRwbC5yZXBsYWNlKCclVExEUyUnLCByZS5zcmNfdGxkcykgfVxuXG4gIHJlLmVtYWlsX2Z1enp5ID0gUmVnRXhwKHVudHBsKHJlLnRwbF9lbWFpbF9mdXp6eSksICdpJyk7XG4gIHJlLmVtYWlsX2Z1enp5X2dsb2JhbCA9IFJlZ0V4cCh1bnRwbChyZS50cGxfZW1haWxfZnV6enkpLCAnaWcnKTtcbiAgcmUubGlua19mdXp6eSA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19mdXp6eSksICdpJyk7XG4gIHJlLmxpbmtfZnV6enlfZ2xvYmFsID0gUmVnRXhwKHVudHBsKHJlLnRwbF9saW5rX2Z1enp5KSwgJ2lnJyk7XG4gIHJlLmxpbmtfbm9faXBfZnV6enkgPSBSZWdFeHAodW50cGwocmUudHBsX2xpbmtfbm9faXBfZnV6enkpLCAnaScpO1xuICByZS5saW5rX25vX2lwX2Z1enp5X2dsb2JhbCA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19ub19pcF9mdXp6eSksICdpZycpO1xuICByZS5ob3N0X2Z1enp5X3Rlc3QgPSBSZWdFeHAodW50cGwocmUudHBsX2hvc3RfZnV6enlfdGVzdCksICdpJyk7XG5cbiAgLy9cbiAgLy8gQ29tcGlsZSBlYWNoIHNjaGVtYVxuICAvL1xuXG4gIGNvbnN0IGFsaWFzZXMgPSBbXTtcblxuICBzZWxmLl9fY29tcGlsZWRfXyA9IHt9OyAvLyBSZXNldCBjb21waWxlZCBkYXRhXG5cbiAgZnVuY3Rpb24gc2NoZW1hRXJyb3IgKG5hbWUsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgKExpbmtpZnlJdCkgSW52YWxpZCBzY2hlbWEgXCIke25hbWV9XCI6ICR7dmFsfWApXG4gIH1cblxuICBPYmplY3Qua2V5cyhzZWxmLl9fc2NoZW1hc19fKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgY29uc3QgdmFsID0gc2VsZi5fX3NjaGVtYXNfX1tuYW1lXTtcblxuICAgIC8vIHNraXAgZGlzYWJsZWQgbWV0aG9kc1xuICAgIGlmICh2YWwgPT09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGNvbXBpbGVkID0geyB2YWxpZGF0ZTogbnVsbCwgbGluazogbnVsbCB9O1xuXG4gICAgc2VsZi5fX2NvbXBpbGVkX19bbmFtZV0gPSBjb21waWxlZDtcblxuICAgIGlmIChpc09iamVjdCh2YWwpKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsLnZhbGlkYXRlKSkge1xuICAgICAgICBjb21waWxlZC52YWxpZGF0ZSA9IGNyZWF0ZVZhbGlkYXRvcih2YWwudmFsaWRhdGUpO1xuICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHZhbC52YWxpZGF0ZSkpIHtcbiAgICAgICAgY29tcGlsZWQudmFsaWRhdGUgPSB2YWwudmFsaWRhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlbWFFcnJvcihuYW1lLCB2YWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNGdW5jdGlvbih2YWwubm9ybWFsaXplKSkge1xuICAgICAgICBjb21waWxlZC5ub3JtYWxpemUgPSB2YWwubm9ybWFsaXplO1xuICAgICAgfSBlbHNlIGlmICghdmFsLm5vcm1hbGl6ZSkge1xuICAgICAgICBjb21waWxlZC5ub3JtYWxpemUgPSBjcmVhdGVOb3JtYWxpemVyKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlbWFFcnJvcihuYW1lLCB2YWwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoaXNTdHJpbmcodmFsKSkge1xuICAgICAgYWxpYXNlcy5wdXNoKG5hbWUpO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgfSk7XG5cbiAgLy9cbiAgLy8gQ29tcGlsZSBwb3N0cG9uZWQgYWxpYXNlc1xuICAvL1xuXG4gIGFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICBpZiAoIXNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXSkge1xuICAgICAgLy8gU2lsZW50bHkgZmFpbCBvbiBtaXNzZWQgc2NoZW1hcyB0byBhdm9pZCBlcnJvbnMgb24gZGlzYWJsZS5cbiAgICAgIC8vIHNjaGVtYUVycm9yKGFsaWFzLCBzZWxmLl9fc2NoZW1hc19fW2FsaWFzXSk7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzZWxmLl9fY29tcGlsZWRfX1thbGlhc10udmFsaWRhdGUgPVxuICAgICAgc2VsZi5fX2NvbXBpbGVkX19bc2VsZi5fX3NjaGVtYXNfX1thbGlhc11dLnZhbGlkYXRlO1xuICAgIHNlbGYuX19jb21waWxlZF9fW2FsaWFzXS5ub3JtYWxpemUgPVxuICAgICAgc2VsZi5fX2NvbXBpbGVkX19bc2VsZi5fX3NjaGVtYXNfX1thbGlhc11dLm5vcm1hbGl6ZTtcbiAgfSk7XG5cbiAgLy9cbiAgLy8gRmFrZSByZWNvcmQgZm9yIGd1ZXNzZWQgbGlua3NcbiAgLy9cbiAgc2VsZi5fX2NvbXBpbGVkX19bJyddID0geyB2YWxpZGF0ZTogbnVsbCwgbm9ybWFsaXplOiBjcmVhdGVOb3JtYWxpemVyKCkgfTtcblxuICAvL1xuICAvLyBCdWlsZCBzY2hlbWEgY29uZGl0aW9uXG4gIC8vXG4gIGNvbnN0IHNsaXN0ID0gT2JqZWN0LmtleXMoc2VsZi5fX2NvbXBpbGVkX18pXG4gICAgLmZpbHRlcihmdW5jdGlvbiAobmFtZSkge1xuICAgICAgLy8gRmlsdGVyIGRpc2FibGVkICYgZmFrZSBzY2hlbWFzXG4gICAgICByZXR1cm4gbmFtZS5sZW5ndGggPiAwICYmIHNlbGYuX19jb21waWxlZF9fW25hbWVdXG4gICAgfSlcbiAgICAubWFwKGVzY2FwZVJFKVxuICAgIC5qb2luKCd8Jyk7XG4gIC8vICg/IV8pIGNhdXNlIDEuNXggc2xvd2Rvd25cbiAgc2VsZi5yZS5zY2hlbWFfdGVzdCA9IFJlZ0V4cChgKF58KD8hXykoPzpbPjxcXHVmZjVjXXwke3JlLnNyY19aUENjfSkpKCR7c2xpc3R9KWAsICdpJyk7XG4gIHNlbGYucmUuc2NoZW1hX3NlYXJjaCA9IFJlZ0V4cChgKF58KD8hXykoPzpbPjxcXHVmZjVjXXwke3JlLnNyY19aUENjfSkpKCR7c2xpc3R9KWAsICdpZycpO1xuICBzZWxmLnJlLnNjaGVtYV9hdF9zdGFydCA9IFJlZ0V4cChgXiR7c2VsZi5yZS5zY2hlbWFfc2VhcmNoLnNvdXJjZX1gLCAnaScpO1xuXG4gIHNlbGYucmUucHJldGVzdCA9IFJlZ0V4cChcbiAgICBgKCR7c2VsZi5yZS5zY2hlbWFfdGVzdC5zb3VyY2V9KXwoJHtzZWxmLnJlLmhvc3RfZnV6enlfdGVzdC5zb3VyY2V9KXxAYCxcbiAgICAnaSdcbiAgKTtcbn1cblxuLyoqXG4gKiBjbGFzcyBNYXRjaFxuICpcbiAqIE1hdGNoIHJlc3VsdC4gU2luZ2xlIGVsZW1lbnQgb2YgYXJyYXksIHJldHVybmVkIGJ5IFtbTGlua2lmeUl0I21hdGNoXV1cbiAqKi9cbmZ1bmN0aW9uIE1hdGNoICh0ZXh0LCBzY2hlbWEsIGluZGV4LCBsYXN0SW5kZXgpIHtcbiAgY29uc3QgcmF3ID0gdGV4dC5zbGljZShpbmRleCwgbGFzdEluZGV4KTtcblxuICAvKipcbiAgICogTWF0Y2gjc2NoZW1hIC0+IFN0cmluZ1xuICAgKlxuICAgKiBQcmVmaXggKHByb3RvY29sKSBmb3IgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5zY2hlbWEgPSBzY2hlbWEudG9Mb3dlckNhc2UoKTtcbiAgLyoqXG4gICAqIE1hdGNoI2luZGV4IC0+IE51bWJlclxuICAgKlxuICAgKiBGaXJzdCBwb3NpdGlvbiBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gIC8qKlxuICAgKiBNYXRjaCNsYXN0SW5kZXggLT4gTnVtYmVyXG4gICAqXG4gICAqIE5leHQgcG9zaXRpb24gYWZ0ZXIgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5sYXN0SW5kZXggPSBsYXN0SW5kZXg7XG4gIC8qKlxuICAgKiBNYXRjaCNyYXcgLT4gU3RyaW5nXG4gICAqXG4gICAqIE1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMucmF3ID0gcmF3O1xuICAvKipcbiAgICogTWF0Y2gjdGV4dCAtPiBTdHJpbmdcbiAgICpcbiAgICogTm90bWFsaXplZCB0ZXh0IG9mIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMudGV4dCA9IHJhdztcbiAgLyoqXG4gICAqIE1hdGNoI3VybCAtPiBTdHJpbmdcbiAgICpcbiAgICogTm9ybWFsaXplZCB1cmwgb2YgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy51cmwgPSByYXc7XG59XG5cbi8qKlxuICogY2xhc3MgTGlua2lmeUl0XG4gKiovXG5cbi8qKlxuICogbmV3IExpbmtpZnlJdChzY2hlbWFzLCBvcHRpb25zKVxuICogLSBzY2hlbWFzIChPYmplY3QpOiBPcHRpb25hbC4gQWRkaXRpb25hbCBzY2hlbWFzIHRvIHZhbGlkYXRlIChwcmVmaXgvdmFsaWRhdG9yKVxuICogLSBvcHRpb25zIChPYmplY3QpOiB7IGZ1enp5TGlua3xmdXp6eUVtYWlsfGZ1enp5SVA6IHRydWV8ZmFsc2UgfVxuICpcbiAqIENyZWF0ZXMgbmV3IGxpbmtpZmllciBpbnN0YW5jZSB3aXRoIG9wdGlvbmFsIGFkZGl0aW9uYWwgc2NoZW1hcy5cbiAqIENhbiBiZSBjYWxsZWQgd2l0aG91dCBgbmV3YCBrZXl3b3JkIGZvciBjb252ZW5pZW5jZS5cbiAqXG4gKiBCeSBkZWZhdWx0IHVuZGVyc3RhbmRzOlxuICpcbiAqIC0gYGh0dHAocyk6Ly8uLi5gICwgYGZ0cDovLy4uLmAsIGBtYWlsdG86Li4uYCAmIGAvLy4uLmAgbGlua3NcbiAqIC0gXCJmdXp6eVwiIGxpbmtzIGFuZCBlbWFpbHMgKGV4YW1wbGUuY29tLCBmb29AYmFyLmNvbSkuXG4gKlxuICogYHNjaGVtYXNgIGlzIGFuIG9iamVjdCwgd2hlcmUgZWFjaCBrZXkvdmFsdWUgZGVzY3JpYmVzIHByb3RvY29sL3J1bGU6XG4gKlxuICogLSBfX2tleV9fIC0gbGluayBwcmVmaXggKHVzdWFsbHksIHByb3RvY29sIG5hbWUgd2l0aCBgOmAgYXQgdGhlIGVuZCwgYHNreXBlOmBcbiAqICAgZm9yIGV4YW1wbGUpLiBgbGlua2lmeS1pdGAgbWFrZXMgc2h1cmUgdGhhdCBwcmVmaXggaXMgbm90IHByZWNlZWRlZCB3aXRoXG4gKiAgIGFscGhhbnVtZXJpYyBjaGFyIGFuZCBzeW1ib2xzLiBPbmx5IHdoaXRlc3BhY2VzIGFuZCBwdW5jdHVhdGlvbiBhbGxvd2VkLlxuICogLSBfX3ZhbHVlX18gLSBydWxlIHRvIGNoZWNrIHRhaWwgYWZ0ZXIgbGluayBwcmVmaXhcbiAqICAgLSBfU3RyaW5nXyAtIGp1c3QgYWxpYXMgdG8gZXhpc3RpbmcgcnVsZVxuICogICAtIF9PYmplY3RfXG4gKiAgICAgLSBfdmFsaWRhdGVfIC0gdmFsaWRhdG9yIGZ1bmN0aW9uIChzaG91bGQgcmV0dXJuIG1hdGNoZWQgbGVuZ3RoIG9uIHN1Y2Nlc3MpLFxuICogICAgICAgb3IgYFJlZ0V4cGAuXG4gKiAgICAgLSBfbm9ybWFsaXplXyAtIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIG5vcm1hbGl6ZSB0ZXh0ICYgdXJsIG9mIG1hdGNoZWQgcmVzdWx0XG4gKiAgICAgICAoZm9yIGV4YW1wbGUsIGZvciBAdHdpdHRlciBtZW50aW9ucykuXG4gKlxuICogYG9wdGlvbnNgOlxuICpcbiAqIC0gX19mdXp6eUxpbmtfXyAtIHJlY29nbmlnZSBVUkwtcyB3aXRob3V0IGBodHRwKHMpOmAgcHJlZml4LiBEZWZhdWx0IGB0cnVlYC5cbiAqIC0gX19mdXp6eUlQX18gLSBhbGxvdyBJUHMgaW4gZnV6enkgbGlua3MgYWJvdmUuIENhbiBjb25mbGljdCB3aXRoIHNvbWUgdGV4dHNcbiAqICAgbGlrZSB2ZXJzaW9uIG51bWJlcnMuIERlZmF1bHQgYGZhbHNlYC5cbiAqIC0gX19mdXp6eUVtYWlsX18gLSByZWNvZ25pemUgZW1haWxzIHdpdGhvdXQgYG1haWx0bzpgIHByZWZpeC5cbiAqXG4gKiovXG5mdW5jdGlvbiBMaW5raWZ5SXQgKHNjaGVtYXMsIG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIExpbmtpZnlJdCkpIHtcbiAgICByZXR1cm4gbmV3IExpbmtpZnlJdChzY2hlbWFzLCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgaWYgKGlzT3B0aW9uc09iaihzY2hlbWFzKSkge1xuICAgICAgb3B0aW9ucyA9IHNjaGVtYXM7XG4gICAgICBzY2hlbWFzID0ge307XG4gICAgfVxuICB9XG5cbiAgdGhpcy5fX29wdHNfXyA9IGFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIHRoaXMuX19zY2hlbWFzX18gPSBhc3NpZ24oe30sIGRlZmF1bHRTY2hlbWFzLCBzY2hlbWFzKTtcbiAgdGhpcy5fX2NvbXBpbGVkX18gPSB7fTtcblxuICB0aGlzLl9fdGxkc19fID0gdGxkc19kZWZhdWx0O1xuICB0aGlzLl9fdGxkc19yZXBsYWNlZF9fID0gZmFsc2U7XG5cbiAgdGhpcy5yZSA9IHt9O1xuXG4gIGNvbXBpbGUodGhpcyk7XG59XG5cbi8qKiBjaGFpbmFibGVcbiAqIExpbmtpZnlJdCNhZGQoc2NoZW1hLCBkZWZpbml0aW9uKVxuICogLSBzY2hlbWEgKFN0cmluZyk6IHJ1bGUgbmFtZSAoZml4ZWQgcGF0dGVybiBwcmVmaXgpXG4gKiAtIGRlZmluaXRpb24gKFN0cmluZ3xSZWdFeHB8T2JqZWN0KTogc2NoZW1hIGRlZmluaXRpb25cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgZGVmaW5pdGlvbi4gU2VlIGNvbnN0cnVjdG9yIGRlc2NyaXB0aW9uIGZvciBkZXRhaWxzLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKHNjaGVtYSwgZGVmaW5pdGlvbikge1xuICB0aGlzLl9fc2NoZW1hc19fW3NjaGVtYV0gPSBkZWZpbml0aW9uO1xuICBjb21waWxlKHRoaXMpO1xuICByZXR1cm4gdGhpc1xufTtcblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I3NldChvcHRpb25zKVxuICogLSBvcHRpb25zIChPYmplY3QpOiB7IGZ1enp5TGlua3xmdXp6eUVtYWlsfGZ1enp5SVA6IHRydWV8ZmFsc2UgfVxuICpcbiAqIFNldCByZWNvZ25pdGlvbiBvcHRpb25zIGZvciBsaW5rcyB3aXRob3V0IHNjaGVtYS5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0IChvcHRpb25zKSB7XG4gIHRoaXMuX19vcHRzX18gPSBhc3NpZ24odGhpcy5fX29wdHNfXywgb3B0aW9ucyk7XG4gIHJldHVybiB0aGlzXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCN0ZXN0KHRleHQpIC0+IEJvb2xlYW5cbiAqXG4gKiBTZWFyY2hlcyBsaW5raWZpYWJsZSBwYXR0ZXJuIGFuZCByZXR1cm5zIGB0cnVlYCBvbiBzdWNjZXNzIG9yIGBmYWxzZWAgb24gZmFpbC5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uIHRlc3QgKHRleHQpIHtcbiAgaWYgKCF0ZXh0Lmxlbmd0aCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCBtLCByZTtcblxuICAvLyB0cnkgdG8gc2NhbiBmb3IgbGluayB3aXRoIHNjaGVtYSAtIHRoYXQncyB0aGUgbW9zdCBzaW1wbGUgcnVsZVxuICBpZiAodGhpcy5yZS5zY2hlbWFfdGVzdC50ZXN0KHRleHQpKSB7XG4gICAgcmUgPSB0aGlzLnJlLnNjaGVtYV9zZWFyY2g7XG4gICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMudGVzdFNjaGVtYUF0KHRleHQsIG1bMl0sIHJlLmxhc3RJbmRleCkpIHsgcmV0dXJuIHRydWUgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9fb3B0c19fLmZ1enp5TGluayAmJiB0aGlzLl9fY29tcGlsZWRfX1snaHR0cDonXSkge1xuICAgIC8vIGd1ZXNzIHNjaGVtYWxlc3MgbGlua3NcbiAgICBpZiAodGV4dC5zZWFyY2godGhpcy5yZS5ob3N0X2Z1enp5X3Rlc3QpID49IDApIHtcbiAgICAgIGlmICh0ZXh0Lm1hdGNoKHRoaXMuX19vcHRzX18uZnV6enlJUCA/IHRoaXMucmUubGlua19mdXp6eSA6IHRoaXMucmUubGlua19ub19pcF9mdXp6eSkgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUVtYWlsICYmIHRoaXMuX19jb21waWxlZF9fWydtYWlsdG86J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGVtYWlsc1xuICAgIGlmICh0ZXh0LmluZGV4T2YoJ0AnKSA+PSAwKSB7XG4gICAgICAvLyBXZSBjYW4ndCBza2lwIHRoaXMgY2hlY2ssIGJlY2F1c2UgdGhpcyBjYXNlcyBhcmUgcG9zc2libGU6XG4gICAgICAvLyAxOTIuMTY4LjEuMUBnbWFpbC5jb20sIG15LmluQGV4YW1wbGUuY29tXG4gICAgICBpZiAodGV4dC5tYXRjaCh0aGlzLnJlLmVtYWlsX2Z1enp5KSAhPT0gbnVsbCkgeyByZXR1cm4gdHJ1ZSB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNwcmV0ZXN0KHRleHQpIC0+IEJvb2xlYW5cbiAqXG4gKiBWZXJ5IHF1aWNrIGNoZWNrLCB0aGF0IGNhbiBnaXZlIGZhbHNlIHBvc2l0aXZlcy4gUmV0dXJucyB0cnVlIGlmIGxpbmsgTUFZIEJFXG4gKiBjYW4gZXhpc3RzLiBDYW4gYmUgdXNlZCBmb3Igc3BlZWQgb3B0aW1pemF0aW9uLCB3aGVuIHlvdSBuZWVkIHRvIGNoZWNrIHRoYXRcbiAqIGxpbmsgTk9UIGV4aXN0cy5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUucHJldGVzdCA9IGZ1bmN0aW9uIHByZXRlc3QgKHRleHQpIHtcbiAgcmV0dXJuIHRoaXMucmUucHJldGVzdC50ZXN0KHRleHQpXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCN0ZXN0U2NoZW1hQXQodGV4dCwgbmFtZSwgcG9zaXRpb24pIC0+IE51bWJlclxuICogLSB0ZXh0IChTdHJpbmcpOiB0ZXh0IHRvIHNjYW5cbiAqIC0gbmFtZSAoU3RyaW5nKTogcnVsZSAoc2NoZW1hKSBuYW1lXG4gKiAtIHBvc2l0aW9uIChOdW1iZXIpOiB0ZXh0IG9mZnNldCB0byBjaGVjayBmcm9tXG4gKlxuICogU2ltaWxhciB0byBbW0xpbmtpZnlJdCN0ZXN0XV0gYnV0IGNoZWNrcyBvbmx5IHNwZWNpZmljIHByb3RvY29sIHRhaWwgZXhhY3RseVxuICogYXQgZ2l2ZW4gcG9zaXRpb24uIFJldHVybnMgbGVuZ3RoIG9mIGZvdW5kIHBhdHRlcm4gKDAgb24gZmFpbCkuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnRlc3RTY2hlbWFBdCA9IGZ1bmN0aW9uIHRlc3RTY2hlbWFBdCAodGV4dCwgc2NoZW1hLCBwb3MpIHtcbiAgLy8gSWYgbm90IHN1cHBvcnRlZCBzY2hlbWEgY2hlY2sgcmVxdWVzdGVkIC0gdGVybWluYXRlXG4gIGlmICghdGhpcy5fX2NvbXBpbGVkX19bc2NoZW1hLnRvTG93ZXJDYXNlKCldKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICByZXR1cm4gdGhpcy5fX2NvbXBpbGVkX19bc2NoZW1hLnRvTG93ZXJDYXNlKCldLnZhbGlkYXRlKHRleHQsIHBvcywgdGhpcylcbn07XG5cbi8qKlxuICogTGlua2lmeUl0I21hdGNoKHRleHQpIC0+IEFycmF5fG51bGxcbiAqXG4gKiBSZXR1cm5zIGFycmF5IG9mIGZvdW5kIGxpbmsgZGVzY3JpcHRpb25zIG9yIGBudWxsYCBvbiBmYWlsLiBXZSBzdHJvbmdseVxuICogcmVjb21tZW5kIHRvIHVzZSBbW0xpbmtpZnlJdCN0ZXN0XV0gZmlyc3QsIGZvciBiZXN0IHNwZWVkLlxuICpcbiAqICMjIyMjIFJlc3VsdCBtYXRjaCBkZXNjcmlwdGlvblxuICpcbiAqIC0gX19zY2hlbWFfXyAtIGxpbmsgc2NoZW1hLCBjYW4gYmUgZW1wdHkgZm9yIGZ1enp5IGxpbmtzLCBvciBgLy9gIGZvclxuICogICBwcm90b2NvbC1uZXV0cmFsICBsaW5rcy5cbiAqIC0gX19pbmRleF9fIC0gb2Zmc2V0IG9mIG1hdGNoZWQgdGV4dFxuICogLSBfX2xhc3RJbmRleF9fIC0gaW5kZXggb2YgbmV4dCBjaGFyIGFmdGVyIG1hdGhjaCBlbmRcbiAqIC0gX19yYXdfXyAtIG1hdGNoZWQgdGV4dFxuICogLSBfX3RleHRfXyAtIG5vcm1hbGl6ZWQgdGV4dFxuICogLSBfX3VybF9fIC0gbGluaywgZ2VuZXJhdGVkIGZyb20gbWF0Y2hlZCB0ZXh0XG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24gbWF0Y2ggKHRleHQpIHtcbiAgY29uc3QgcmVzdWx0ID0gW107XG4gIGNvbnN0IHR5cGVfc2NoZW1lZCA9IFtdO1xuICBjb25zdCB0eXBlX2Z1enp5X2xpbmsgPSBbXTtcbiAgY29uc3QgdHlwZV9mdXp6eV9lbWFpbCA9IFtdO1xuICBsZXQgbSwgbGVuLCByZTtcblxuICBmdW5jdGlvbiBjaG9vc2UgKGEsIGIpIHtcbiAgICBpZiAoIWEpIHsgcmV0dXJuIGIgfVxuICAgIGlmICghYikgeyByZXR1cm4gYSB9XG4gICAgaWYgKGEuaW5kZXggIT09IGIuaW5kZXgpIHsgcmV0dXJuIGEuaW5kZXggPCBiLmluZGV4ID8gYSA6IGIgfVxuICAgIHJldHVybiBhLmxhc3RJbmRleCA+PSBiLmxhc3RJbmRleCA/IGEgOiBiXG4gIH1cblxuICBpZiAoIXRleHQubGVuZ3RoKSB7IHJldHVybiBudWxsIH1cblxuICAvLyBzY2FuIGZvciBsaW5rcyB3aXRoIHNjaGVtYVxuICBpZiAodGhpcy5yZS5zY2hlbWFfdGVzdC50ZXN0KHRleHQpKSB7XG4gICAgcmUgPSB0aGlzLnJlLnNjaGVtYV9zZWFyY2g7XG4gICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgbGVuID0gdGhpcy50ZXN0U2NoZW1hQXQodGV4dCwgbVsyXSwgcmUubGFzdEluZGV4KTtcbiAgICAgIGlmIChsZW4pIHtcbiAgICAgICAgdHlwZV9zY2hlbWVkLnB1c2goe1xuICAgICAgICAgIHNjaGVtYTogbVsyXSxcbiAgICAgICAgICBpbmRleDogbS5pbmRleCArIG1bMV0ubGVuZ3RoLFxuICAgICAgICAgIGxhc3RJbmRleDogbS5pbmRleCArIG1bMF0ubGVuZ3RoICsgbGVuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9fb3B0c19fLmZ1enp5TGluayAmJiB0aGlzLl9fY29tcGlsZWRfX1snaHR0cDonXSkge1xuICAgIHJlID0gdGhpcy5fX29wdHNfXy5mdXp6eUlQID8gdGhpcy5yZS5saW5rX2Z1enp5X2dsb2JhbCA6IHRoaXMucmUubGlua19ub19pcF9mdXp6eV9nbG9iYWw7XG4gICAgcmUubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgdHlwZV9mdXp6eV9saW5rLnB1c2goe1xuICAgICAgICBzY2hlbWE6ICcnLFxuICAgICAgICBpbmRleDogbS5pbmRleCArIG1bMV0ubGVuZ3RoLFxuICAgICAgICBsYXN0SW5kZXg6IG0uaW5kZXggKyBtWzBdLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuX19vcHRzX18uZnV6enlFbWFpbCAmJiB0aGlzLl9fY29tcGlsZWRfX1snbWFpbHRvOiddKSB7XG4gICAgcmUgPSB0aGlzLnJlLmVtYWlsX2Z1enp5X2dsb2JhbDtcbiAgICByZS5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IHJlLmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgICB0eXBlX2Z1enp5X2VtYWlsLnB1c2goe1xuICAgICAgICBzY2hlbWE6ICdtYWlsdG86JyxcbiAgICAgICAgaW5kZXg6IG0uaW5kZXggKyBtWzFdLmxlbmd0aCxcbiAgICAgICAgbGFzdEluZGV4OiBtLmluZGV4ICsgbVswXS5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4ZXMgPSBbMCwgMCwgMF07XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuXG4gIGZvciAoOzspIHtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgICAgdHlwZV9zY2hlbWVkW2luZGV4ZXNbMF1dLFxuICAgICAgdHlwZV9mdXp6eV9lbWFpbFtpbmRleGVzWzFdXSxcbiAgICAgIHR5cGVfZnV6enlfbGlua1tpbmRleGVzWzJdXVxuICAgIF07XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjaG9vc2UoY2hvb3NlKGNhbmRpZGF0ZXNbMF0sIGNhbmRpZGF0ZXNbMV0pLCBjYW5kaWRhdGVzWzJdKTtcblxuICAgIGlmICghY2FuZGlkYXRlKSB7IGJyZWFrIH1cblxuICAgIGlmIChjYW5kaWRhdGUgPT09IGNhbmRpZGF0ZXNbMF0pIHtcbiAgICAgIGluZGV4ZXNbMF0rKztcbiAgICB9IGVsc2UgaWYgKGNhbmRpZGF0ZSA9PT0gY2FuZGlkYXRlc1sxXSkge1xuICAgICAgaW5kZXhlc1sxXSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRleGVzWzJdKys7XG4gICAgfVxuXG4gICAgaWYgKGNhbmRpZGF0ZS5pbmRleCA8IGxhc3RJbmRleCkgeyBjb250aW51ZSB9XG5cbiAgICBjb25zdCBtYXRjaCA9IG5ldyBNYXRjaCh0ZXh0LCBjYW5kaWRhdGUuc2NoZW1hLCBjYW5kaWRhdGUuaW5kZXgsIGNhbmRpZGF0ZS5sYXN0SW5kZXgpO1xuICAgIHRoaXMuX19jb21waWxlZF9fW21hdGNoLnNjaGVtYV0ubm9ybWFsaXplKG1hdGNoLCB0aGlzKTtcbiAgICByZXN1bHQucHVzaChtYXRjaCk7XG4gICAgbGFzdEluZGV4ID0gY2FuZGlkYXRlLmxhc3RJbmRleDtcbiAgfVxuXG4gIGlmIChyZXN1bHQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn07XG5cbi8qKlxuICogTGlua2lmeUl0I21hdGNoQXRTdGFydCh0ZXh0KSAtPiBNYXRjaHxudWxsXG4gKlxuICogUmV0dXJucyBmdWxseS1mb3JtZWQgKG5vdCBmdXp6eSkgbGluayBpZiBpdCBzdGFydHMgYXQgdGhlIGJlZ2lubmluZ1xuICogb2YgdGhlIHN0cmluZywgYW5kIG51bGwgb3RoZXJ3aXNlLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5tYXRjaEF0U3RhcnQgPSBmdW5jdGlvbiBtYXRjaEF0U3RhcnQgKHRleHQpIHtcbiAgaWYgKCF0ZXh0Lmxlbmd0aCkgcmV0dXJuIG51bGxcblxuICBjb25zdCBtID0gdGhpcy5yZS5zY2hlbWFfYXRfc3RhcnQuZXhlYyh0ZXh0KTtcbiAgaWYgKCFtKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IGxlbiA9IHRoaXMudGVzdFNjaGVtYUF0KHRleHQsIG1bMl0sIG1bMF0ubGVuZ3RoKTtcbiAgaWYgKCFsZW4pIHJldHVybiBudWxsXG5cbiAgY29uc3QgbWF0Y2ggPSBuZXcgTWF0Y2godGV4dCwgbVsyXSwgbS5pbmRleCArIG1bMV0ubGVuZ3RoLCBtLmluZGV4ICsgbVswXS5sZW5ndGggKyBsZW4pO1xuXG4gIHRoaXMuX19jb21waWxlZF9fW21hdGNoLnNjaGVtYV0ubm9ybWFsaXplKG1hdGNoLCB0aGlzKTtcbiAgcmV0dXJuIG1hdGNoXG59O1xuXG4vKiogY2hhaW5hYmxlXG4gKiBMaW5raWZ5SXQjdGxkcyhsaXN0IFssIGtlZXBPbGRdKSAtPiB0aGlzXG4gKiAtIGxpc3QgKEFycmF5KTogbGlzdCBvZiB0bGRzXG4gKiAtIGtlZXBPbGQgKEJvb2xlYW4pOiBtZXJnZSB3aXRoIGN1cnJlbnQgbGlzdCBpZiBgdHJ1ZWAgKGBmYWxzZWAgYnkgZGVmYXVsdClcbiAqXG4gKiBMb2FkIChvciBtZXJnZSkgbmV3IHRsZHMgbGlzdC4gVGhvc2UgYXJlIHVzZXIgZm9yIGZ1enp5IGxpbmtzICh3aXRob3V0IHByZWZpeClcbiAqIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlcy4gQnkgZGVmYXVsdCB0aGlzIGFsZ29yeXRobSB1c2VkOlxuICpcbiAqIC0gaG9zdG5hbWUgd2l0aCBhbnkgMi1sZXR0ZXIgcm9vdCB6b25lcyBhcmUgb2suXG4gKiAtIGJpenxjb218ZWR1fGdvdnxuZXR8b3JnfHByb3x3ZWJ8eHh4fGFlcm98YXNpYXxjb29wfGluZm98bXVzZXVtfG5hbWV8c2hvcHxcdTA0NDBcdTA0NDRcbiAqICAgYXJlIG9rLlxuICogLSBlbmNvZGVkIChgeG4tLS4uLmApIHJvb3Qgem9uZXMgYXJlIG9rLlxuICpcbiAqIElmIGxpc3QgaXMgcmVwbGFjZWQsIHRoZW4gZXhhY3QgbWF0Y2ggZm9yIDItY2hhcnMgcm9vdCB6b25lcyB3aWxsIGJlIGNoZWNrZWQuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnRsZHMgPSBmdW5jdGlvbiB0bGRzIChsaXN0LCBrZWVwT2xkKSB7XG4gIGxpc3QgPSBBcnJheS5pc0FycmF5KGxpc3QpID8gbGlzdCA6IFtsaXN0XTtcblxuICBpZiAoIWtlZXBPbGQpIHtcbiAgICB0aGlzLl9fdGxkc19fID0gbGlzdC5zbGljZSgpO1xuICAgIHRoaXMuX190bGRzX3JlcGxhY2VkX18gPSB0cnVlO1xuICAgIGNvbXBpbGUodGhpcyk7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHRoaXMuX190bGRzX18gPSB0aGlzLl9fdGxkc19fLmNvbmNhdChsaXN0KVxuICAgIC5zb3J0KClcbiAgICAuZmlsdGVyKGZ1bmN0aW9uIChlbCwgaWR4LCBhcnIpIHtcbiAgICAgIHJldHVybiBlbCAhPT0gYXJyW2lkeCAtIDFdXG4gICAgfSlcbiAgICAucmV2ZXJzZSgpO1xuXG4gIGNvbXBpbGUodGhpcyk7XG4gIHJldHVybiB0aGlzXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNub3JtYWxpemUobWF0Y2gpXG4gKlxuICogRGVmYXVsdCBub3JtYWxpemVyIChpZiBzY2hlbWEgZG9lcyBub3QgZGVmaW5lIGl0J3Mgb3duKS5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplIChtYXRjaCkge1xuICAvLyBEbyBtaW5pbWFsIHBvc3NpYmxlIGNoYW5nZXMgYnkgZGVmYXVsdC4gTmVlZCB0byBjb2xsZWN0IGZlZWRiYWNrIHByaW9yXG4gIC8vIHRvIG1vdmUgZm9yd2FyZCBodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbGlua2lmeS1pdC9pc3N1ZXMvMVxuXG4gIGlmICghbWF0Y2guc2NoZW1hKSB7IG1hdGNoLnVybCA9IGBodHRwOi8vJHttYXRjaC51cmx9YDsgfVxuXG4gIGlmIChtYXRjaC5zY2hlbWEgPT09ICdtYWlsdG86JyAmJiAhL15tYWlsdG86L2kudGVzdChtYXRjaC51cmwpKSB7XG4gICAgbWF0Y2gudXJsID0gYG1haWx0bzoke21hdGNoLnVybH1gO1xuICB9XG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNvbkNvbXBpbGUoKVxuICpcbiAqIE92ZXJyaWRlIHRvIG1vZGlmeSBiYXNpYyBSZWdFeHAtcy5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUub25Db21waWxlID0gZnVuY3Rpb24gb25Db21waWxlICgpIHtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGlua2lmeUl0O1xuIiwgIid1c2Ugc3RyaWN0JztcblxuLyoqIEhpZ2hlc3QgcG9zaXRpdmUgc2lnbmVkIDMyLWJpdCBmbG9hdCB2YWx1ZSAqL1xuY29uc3QgbWF4SW50ID0gMjE0NzQ4MzY0NzsgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG4vKiogQm9vdHN0cmluZyBwYXJhbWV0ZXJzICovXG5jb25zdCBiYXNlID0gMzY7XG5jb25zdCB0TWluID0gMTtcbmNvbnN0IHRNYXggPSAyNjtcbmNvbnN0IHNrZXcgPSAzODtcbmNvbnN0IGRhbXAgPSA3MDA7XG5jb25zdCBpbml0aWFsQmlhcyA9IDcyO1xuY29uc3QgaW5pdGlhbE4gPSAxMjg7IC8vIDB4ODBcbmNvbnN0IGRlbGltaXRlciA9ICctJzsgLy8gJ1xceDJEJ1xuXG4vKiogUmVndWxhciBleHByZXNzaW9ucyAqL1xuY29uc3QgcmVnZXhQdW55Y29kZSA9IC9eeG4tLS87XG5jb25zdCByZWdleE5vbkFTQ0lJID0gL1teXFwwLVxceDdGXS87IC8vIE5vdGU6IFUrMDA3RiBERUwgaXMgZXhjbHVkZWQgdG9vLlxuY29uc3QgcmVnZXhTZXBhcmF0b3JzID0gL1tcXHgyRVxcdTMwMDJcXHVGRjBFXFx1RkY2MV0vZzsgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG4vKiogRXJyb3IgbWVzc2FnZXMgKi9cbmNvbnN0IGVycm9ycyA9IHtcblx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0J25vdC1iYXNpYyc6ICdJbGxlZ2FsIGlucHV0ID49IDB4ODAgKG5vdCBhIGJhc2ljIGNvZGUgcG9pbnQpJyxcblx0J2ludmFsaWQtaW5wdXQnOiAnSW52YWxpZCBpbnB1dCdcbn07XG5cbi8qKiBDb252ZW5pZW5jZSBzaG9ydGN1dHMgKi9cbmNvbnN0IGJhc2VNaW51c1RNaW4gPSBiYXNlIC0gdE1pbjtcbmNvbnN0IGZsb29yID0gTWF0aC5mbG9vcjtcbmNvbnN0IHN0cmluZ0Zyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4vKipcbiAqIEEgZ2VuZXJpYyBlcnJvciB1dGlsaXR5IGZ1bmN0aW9uLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuICogQHJldHVybnMge0Vycm9yfSBUaHJvd3MgYSBgUmFuZ2VFcnJvcmAgd2l0aCB0aGUgYXBwbGljYWJsZSBlcnJvciBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdHRocm93IG5ldyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG59XG5cbi8qKlxuICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuICogaXRlbS5cbiAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWFwKGFycmF5LCBjYWxsYmFjaykge1xuXHRjb25zdCByZXN1bHQgPSBbXTtcblx0bGV0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0cmVzdWx0W2xlbmd0aF0gPSBjYWxsYmFjayhhcnJheVtsZW5ndGhdKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncyBvciBlbWFpbFxuICogYWRkcmVzc2VzLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnlcbiAqIGNoYXJhY3Rlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IEEgbmV3IHN0cmluZyBvZiBjaGFyYWN0ZXJzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFja1xuICogZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG1hcERvbWFpbihkb21haW4sIGNhbGxiYWNrKSB7XG5cdGNvbnN0IHBhcnRzID0gZG9tYWluLnNwbGl0KCdAJyk7XG5cdGxldCByZXN1bHQgPSAnJztcblx0aWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHQvLyBJbiBlbWFpbCBhZGRyZXNzZXMsIG9ubHkgdGhlIGRvbWFpbiBuYW1lIHNob3VsZCBiZSBwdW55Y29kZWQuIExlYXZlXG5cdFx0Ly8gdGhlIGxvY2FsIHBhcnQgKGkuZS4gZXZlcnl0aGluZyB1cCB0byBgQGApIGludGFjdC5cblx0XHRyZXN1bHQgPSBwYXJ0c1swXSArICdAJztcblx0XHRkb21haW4gPSBwYXJ0c1sxXTtcblx0fVxuXHQvLyBBdm9pZCBgc3BsaXQocmVnZXgpYCBmb3IgSUU4IGNvbXBhdGliaWxpdHkuIFNlZSAjMTcuXG5cdGRvbWFpbiA9IGRvbWFpbi5yZXBsYWNlKHJlZ2V4U2VwYXJhdG9ycywgJ1xceDJFJyk7XG5cdGNvbnN0IGxhYmVscyA9IGRvbWFpbi5zcGxpdCgnLicpO1xuXHRjb25zdCBlbmNvZGVkID0gbWFwKGxhYmVscywgY2FsbGJhY2spLmpvaW4oJy4nKTtcblx0cmV0dXJuIHJlc3VsdCArIGVuY29kZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuICogdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgYSBwYWlyIG9mIHN1cnJvZ2F0ZSBoYWx2ZXMgKGVhY2ggb2Ygd2hpY2hcbiAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuICogbWF0Y2hpbmcgVVRGLTE2LlxuICogQHNlZSBgcHVueWNvZGUudWNzMi5lbmNvZGVgXG4gKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cbiAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG4gKiBAbmFtZSBkZWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG4gKi9cbmZ1bmN0aW9uIHVjczJkZWNvZGUoc3RyaW5nKSB7XG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXHRsZXQgY291bnRlciA9IDA7XG5cdGNvbnN0IGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG5cdHdoaWxlIChjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0Y29uc3QgdmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdGlmICh2YWx1ZSA+PSAweEQ4MDAgJiYgdmFsdWUgPD0gMHhEQkZGICYmIGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdC8vIEl0J3MgYSBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXIuXG5cdFx0XHRjb25zdCBleHRyYSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gTG93IHN1cnJvZ2F0ZS5cblx0XHRcdFx0b3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEl0J3MgYW4gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlXG5cdFx0XHRcdC8vIG5leHQgY29kZSB1bml0IGlzIHRoZSBoaWdoIHN1cnJvZ2F0ZSBvZiBhIHN1cnJvZ2F0ZSBwYWlyLlxuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdGNvdW50ZXItLTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzdHJpbmcgYmFzZWQgb24gYW4gYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cbiAqIEBzZWUgYHB1bnljb2RlLnVjczIuZGVjb2RlYFxuICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcbiAqIEBuYW1lIGVuY29kZVxuICogQHBhcmFtIHtBcnJheX0gY29kZVBvaW50cyBUaGUgYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cbiAqL1xuY29uc3QgdWNzMmVuY29kZSA9IGNvZGVQb2ludHMgPT4gU3RyaW5nLmZyb21Db2RlUG9pbnQoLi4uY29kZVBvaW50cyk7XG5cbi8qKlxuICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuICogQHNlZSBgZGlnaXRUb0Jhc2ljKClgXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50IChmb3IgdXNlIGluXG4gKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGluIHRoZSByYW5nZSBgMGAgdG8gYGJhc2UgLSAxYCwgb3IgYGJhc2VgIGlmXG4gKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cbiAqL1xuY29uc3QgYmFzaWNUb0RpZ2l0ID0gZnVuY3Rpb24oY29kZVBvaW50KSB7XG5cdGlmIChjb2RlUG9pbnQgPj0gMHgzMCAmJiBjb2RlUG9pbnQgPCAweDNBKSB7XG5cdFx0cmV0dXJuIDI2ICsgKGNvZGVQb2ludCAtIDB4MzApO1xuXHR9XG5cdGlmIChjb2RlUG9pbnQgPj0gMHg0MSAmJiBjb2RlUG9pbnQgPCAweDVCKSB7XG5cdFx0cmV0dXJuIGNvZGVQb2ludCAtIDB4NDE7XG5cdH1cblx0aWYgKGNvZGVQb2ludCA+PSAweDYxICYmIGNvZGVQb2ludCA8IDB4N0IpIHtcblx0XHRyZXR1cm4gY29kZVBvaW50IC0gMHg2MTtcblx0fVxuXHRyZXR1cm4gYmFzZTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBkaWdpdC9pbnRlZ2VyIGludG8gYSBiYXNpYyBjb2RlIHBvaW50LlxuICogQHNlZSBgYmFzaWNUb0RpZ2l0KClgXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IGRpZ2l0IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludC5cbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBiYXNpYyBjb2RlIHBvaW50IHdob3NlIHZhbHVlICh3aGVuIHVzZWQgZm9yXG4gKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuICogYDBgIHRvIGBiYXNlIC0gMWAuIElmIGBmbGFnYCBpcyBub24temVybywgdGhlIHVwcGVyY2FzZSBmb3JtIGlzXG4gKiB1c2VkOyBlbHNlLCB0aGUgbG93ZXJjYXNlIGZvcm0gaXMgdXNlZC4gVGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZFxuICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cbiAqL1xuY29uc3QgZGlnaXRUb0Jhc2ljID0gZnVuY3Rpb24oZGlnaXQsIGZsYWcpIHtcblx0Ly8gIDAuLjI1IG1hcCB0byBBU0NJSSBhLi56IG9yIEEuLlpcblx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdHJldHVybiBkaWdpdCArIDIyICsgNzUgKiAoZGlnaXQgPCAyNikgLSAoKGZsYWcgIT0gMCkgPDwgNSk7XG59O1xuXG4vKipcbiAqIEJpYXMgYWRhcHRhdGlvbiBmdW5jdGlvbiBhcyBwZXIgc2VjdGlvbiAzLjQgb2YgUkZDIDM0OTIuXG4gKiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzQ5MiNzZWN0aW9uLTMuNFxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgYWRhcHQgPSBmdW5jdGlvbihkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0bGV0IGsgPSAwO1xuXHRkZWx0YSA9IGZpcnN0VGltZSA/IGZsb29yKGRlbHRhIC8gZGFtcCkgOiBkZWx0YSA+PiAxO1xuXHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdGZvciAoLyogbm8gaW5pdGlhbGl6YXRpb24gKi87IGRlbHRhID4gYmFzZU1pbnVzVE1pbiAqIHRNYXggPj4gMTsgayArPSBiYXNlKSB7XG5cdFx0ZGVsdGEgPSBmbG9vcihkZWx0YSAvIGJhc2VNaW51c1RNaW4pO1xuXHR9XG5cdHJldHVybiBmbG9vcihrICsgKGJhc2VNaW51c1RNaW4gKyAxKSAqIGRlbHRhIC8gKGRlbHRhICsgc2tldykpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMgdG8gYSBzdHJpbmcgb2YgVW5pY29kZVxuICogc3ltYm9scy5cbiAqIEBtZW1iZXJPZiBwdW55Y29kZVxuICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuICovXG5jb25zdCBkZWNvZGUgPSBmdW5jdGlvbihpbnB1dCkge1xuXHQvLyBEb24ndCB1c2UgVUNTLTIuXG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXHRjb25zdCBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblx0bGV0IGkgPSAwO1xuXHRsZXQgbiA9IGluaXRpYWxOO1xuXHRsZXQgYmlhcyA9IGluaXRpYWxCaWFzO1xuXG5cdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHQvLyBwb2ludHMgYmVmb3JlIHRoZSBsYXN0IGRlbGltaXRlciwgb3IgYDBgIGlmIHRoZXJlIGlzIG5vbmUsIHRoZW4gY29weVxuXHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRsZXQgYmFzaWMgPSBpbnB1dC5sYXN0SW5kZXhPZihkZWxpbWl0ZXIpO1xuXHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0YmFzaWMgPSAwO1xuXHR9XG5cblx0Zm9yIChsZXQgaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0Ly8gaWYgaXQncyBub3QgYSBiYXNpYyBjb2RlIHBvaW50XG5cdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdH1cblx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0fVxuXG5cdC8vIE1haW4gZGVjb2RpbmcgbG9vcDogc3RhcnQganVzdCBhZnRlciB0aGUgbGFzdCBkZWxpbWl0ZXIgaWYgYW55IGJhc2ljIGNvZGVcblx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRmb3IgKGxldCBpbmRleCA9IGJhc2ljID4gMCA/IGJhc2ljICsgMSA6IDA7IGluZGV4IDwgaW5wdXRMZW5ndGg7IC8qIG5vIGZpbmFsIGV4cHJlc3Npb24gKi8pIHtcblxuXHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0Ly8gd2hpY2ggZ2V0cyBhZGRlZCB0byBgaWAuIFRoZSBvdmVyZmxvdyBjaGVja2luZyBpcyBlYXNpZXJcblx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0Y29uc3Qgb2xkaSA9IGk7XG5cdFx0Zm9yIChsZXQgdyA9IDEsIGsgPSBiYXNlOyAvKiBubyBjb25kaXRpb24gKi87IGsgKz0gYmFzZSkge1xuXG5cdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdGlmIChkaWdpdCA+PSBiYXNlKSB7XG5cdFx0XHRcdGVycm9yKCdpbnZhbGlkLWlucHV0Jyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRjb25zdCB0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0aWYgKGRpZ2l0IDwgdCkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0fVxuXG5cdFx0Y29uc3Qgb3V0ID0gb3V0cHV0Lmxlbmd0aCArIDE7XG5cdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdC8vIGluY3JlbWVudGluZyBgbmAgZWFjaCB0aW1lLCBzbyB3ZSdsbCBmaXggdGhhdCBub3c6XG5cdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0fVxuXG5cdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRpICU9IG91dDtcblxuXHRcdC8vIEluc2VydCBgbmAgYXQgcG9zaXRpb24gYGlgIG9mIHRoZSBvdXRwdXQuXG5cdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdH1cblxuXHRyZXR1cm4gU3RyaW5nLmZyb21Db2RlUG9pbnQoLi4ub3V0cHV0KTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzIChlLmcuIGEgZG9tYWluIG5hbWUgbGFiZWwpIHRvIGFcbiAqIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cbiAqL1xuY29uc3QgZW5jb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0Y29uc3Qgb3V0cHV0ID0gW107XG5cblx0Ly8gQ29udmVydCB0aGUgaW5wdXQgaW4gVUNTLTIgdG8gYW4gYXJyYXkgb2YgVW5pY29kZSBjb2RlIHBvaW50cy5cblx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHQvLyBDYWNoZSB0aGUgbGVuZ3RoLlxuXHRjb25zdCBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHQvLyBJbml0aWFsaXplIHRoZSBzdGF0ZS5cblx0bGV0IG4gPSBpbml0aWFsTjtcblx0bGV0IGRlbHRhID0gMDtcblx0bGV0IGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzLlxuXHRmb3IgKGNvbnN0IGN1cnJlbnRWYWx1ZSBvZiBpbnB1dCkge1xuXHRcdGlmIChjdXJyZW50VmFsdWUgPCAweDgwKSB7XG5cdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXHRsZXQgaGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aDtcblxuXHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdC8vIEZpbmlzaCB0aGUgYmFzaWMgc3RyaW5nIHdpdGggYSBkZWxpbWl0ZXIgdW5sZXNzIGl0J3MgZW1wdHkuXG5cdGlmIChiYXNpY0xlbmd0aCkge1xuXHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdH1cblxuXHQvLyBNYWluIGVuY29kaW5nIGxvb3A6XG5cdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0Ly8gbGFyZ2VyIG9uZTpcblx0XHRsZXQgbSA9IG1heEludDtcblx0XHRmb3IgKGNvbnN0IGN1cnJlbnRWYWx1ZSBvZiBpbnB1dCkge1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0Ly8gYnV0IGd1YXJkIGFnYWluc3Qgb3ZlcmZsb3cuXG5cdFx0Y29uc3QgaGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdGlmIChtIC0gbiA+IGZsb29yKChtYXhJbnQgLSBkZWx0YSkgLyBoYW5kbGVkQ1BDb3VudFBsdXNPbmUpKSB7XG5cdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHR9XG5cblx0XHRkZWx0YSArPSAobSAtIG4pICogaGFuZGxlZENQQ291bnRQbHVzT25lO1xuXHRcdG4gPSBtO1xuXG5cdFx0Zm9yIChjb25zdCBjdXJyZW50VmFsdWUgb2YgaW5wdXQpIHtcblx0XHRcdGlmIChjdXJyZW50VmFsdWUgPCBuICYmICsrZGVsdGEgPiBtYXhJbnQpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlID09PSBuKSB7XG5cdFx0XHRcdC8vIFJlcHJlc2VudCBkZWx0YSBhcyBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyLlxuXHRcdFx0XHRsZXQgcSA9IGRlbHRhO1xuXHRcdFx0XHRmb3IgKGxldCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRjb25zdCB0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRpZiAocSA8IHQpIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdCBxTWludXNUID0gcSAtIHQ7XG5cdFx0XHRcdFx0Y29uc3QgYmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0c3RyaW5nRnJvbUNoYXJDb2RlKGRpZ2l0VG9CYXNpYyh0ICsgcU1pbnVzVCAlIGJhc2VNaW51c1QsIDApKVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09PSBiYXNpY0xlbmd0aCk7XG5cdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQrK2RlbHRhO1xuXHRcdCsrbjtcblxuXHR9XG5cdHJldHVybiBvdXRwdXQuam9pbignJyk7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIG9yIGFuIGVtYWlsIGFkZHJlc3NcbiAqIHRvIFVuaWNvZGUuIE9ubHkgdGhlIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgaW5wdXQgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS5cbiAqIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IG9uIGEgc3RyaW5nIHRoYXQgaGFzIGFscmVhZHkgYmVlblxuICogY29udmVydGVkIHRvIFVuaWNvZGUuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGVkIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG9cbiAqIGNvbnZlcnQgdG8gVW5pY29kZS5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuICogc3RyaW5nLlxuICovXG5jb25zdCB0b1VuaWNvZGUgPSBmdW5jdGlvbihpbnB1dCkge1xuXHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRyZXR1cm4gcmVnZXhQdW55Y29kZS50ZXN0KHN0cmluZylcblx0XHRcdD8gZGVjb2RlKHN0cmluZy5zbGljZSg0KS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0OiBzdHJpbmc7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIFVuaWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIG9yIGFuIGVtYWlsIGFkZHJlc3MgdG9cbiAqIFB1bnljb2RlLiBPbmx5IHRoZSBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLFxuICogaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZiB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQncyBhbHJlYWR5IGluXG4gKiBBU0NJSS5cbiAqIEBtZW1iZXJPZiBwdW55Y29kZVxuICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzIHRvIGNvbnZlcnQsIGFzIGFcbiAqIFVuaWNvZGUgc3RyaW5nLlxuICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZSBvclxuICogZW1haWwgYWRkcmVzcy5cbiAqL1xuY29uc3QgdG9BU0NJSSA9IGZ1bmN0aW9uKGlucHV0KSB7XG5cdHJldHVybiBtYXBEb21haW4oaW5wdXQsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdHJldHVybiByZWdleE5vbkFTQ0lJLnRlc3Qoc3RyaW5nKVxuXHRcdFx0PyAneG4tLScgKyBlbmNvZGUoc3RyaW5nKVxuXHRcdFx0OiBzdHJpbmc7XG5cdH0pO1xufTtcblxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbi8qKiBEZWZpbmUgdGhlIHB1YmxpYyBBUEkgKi9cbmNvbnN0IHB1bnljb2RlID0ge1xuXHQvKipcblx0ICogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IFB1bnljb2RlLmpzIHZlcnNpb24gbnVtYmVyLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHR5cGUgU3RyaW5nXG5cdCAqL1xuXHQndmVyc2lvbic6ICcyLjMuMScsXG5cdC8qKlxuXHQgKiBBbiBvYmplY3Qgb2YgbWV0aG9kcyB0byBjb252ZXJ0IGZyb20gSmF2YVNjcmlwdCdzIGludGVybmFsIGNoYXJhY3RlclxuXHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHQgKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0J3VjczInOiB7XG5cdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0fSxcblx0J2RlY29kZSc6IGRlY29kZSxcblx0J2VuY29kZSc6IGVuY29kZSxcblx0J3RvQVNDSUknOiB0b0FTQ0lJLFxuXHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuIiwgIi8vIFV0aWxpdGllc1xuLy9cblxuaW1wb3J0ICogYXMgbWR1cmwgZnJvbSAnbWR1cmwnXG5pbXBvcnQgKiBhcyB1Y21pY3JvIGZyb20gJ3VjLm1pY3JvJ1xuaW1wb3J0IHsgZGVjb2RlSFRNTCB9IGZyb20gJ2VudGl0aWVzJ1xuXG5mdW5jdGlvbiBfY2xhc3MgKG9iaikgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgfVxuXG5mdW5jdGlvbiBpc1N0cmluZyAob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXScgfVxuXG5jb25zdCBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhcyAob2JqZWN0LCBrZXkpIHtcbiAgcmV0dXJuIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KVxufVxuXG4vLyBNZXJnZSBvYmplY3RzXG4vL1xuZnVuY3Rpb24gYXNzaWduIChvYmogLyogZnJvbTEsIGZyb20yLCBmcm9tMywgLi4uICovKSB7XG4gIGNvbnN0IHNvdXJjZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG5cbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoIXNvdXJjZSkgeyByZXR1cm4gfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHNvdXJjZSArICdtdXN0IGJlIG9iamVjdCcpXG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV1cbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiBvYmpcbn1cblxuLy8gUmVtb3ZlIGVsZW1lbnQgZnJvbSBhcnJheSBhbmQgcHV0IGFub3RoZXIgYXJyYXkgYXQgdGhvc2UgcG9zaXRpb24uXG4vLyBVc2VmdWwgZm9yIHNvbWUgb3BlcmF0aW9ucyB3aXRoIHRva2Vuc1xuZnVuY3Rpb24gYXJyYXlSZXBsYWNlQXQgKHNyYywgcG9zLCBuZXdFbGVtZW50cykge1xuICByZXR1cm4gW10uY29uY2F0KHNyYy5zbGljZSgwLCBwb3MpLCBuZXdFbGVtZW50cywgc3JjLnNsaWNlKHBvcyArIDEpKVxufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRW50aXR5Q29kZSAoYykge1xuICAvLyBicm9rZW4gc2VxdWVuY2VcbiAgaWYgKGMgPj0gMHhEODAwICYmIGMgPD0gMHhERkZGKSB7IHJldHVybiBmYWxzZSB9XG4gIC8vIG5ldmVyIHVzZWRcbiAgaWYgKGMgPj0gMHhGREQwICYmIGMgPD0gMHhGREVGKSB7IHJldHVybiBmYWxzZSB9XG4gIGlmICgoYyAmIDB4RkZGRikgPT09IDB4RkZGRiB8fCAoYyAmIDB4RkZGRikgPT09IDB4RkZGRSkgeyByZXR1cm4gZmFsc2UgfVxuICAvLyBjb250cm9sIGNvZGVzXG4gIGlmIChjID49IDB4MDAgJiYgYyA8PSAweDA4KSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChjID09PSAweDBCKSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChjID49IDB4MEUgJiYgYyA8PSAweDFGKSB7IHJldHVybiBmYWxzZSB9XG4gIGlmIChjID49IDB4N0YgJiYgYyA8PSAweDlGKSB7IHJldHVybiBmYWxzZSB9XG4gIC8vIG91dCBvZiByYW5nZVxuICBpZiAoYyA+IDB4MTBGRkZGKSB7IHJldHVybiBmYWxzZSB9XG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGZyb21Db2RlUG9pbnQgKGMpIHtcbiAgLyogZXNsaW50IG5vLWJpdHdpc2U6MCAqL1xuICBpZiAoYyA+IDB4ZmZmZikge1xuICAgIGMgLT0gMHgxMDAwMFxuICAgIGNvbnN0IHN1cnJvZ2F0ZTEgPSAweGQ4MDAgKyAoYyA+PiAxMClcbiAgICBjb25zdCBzdXJyb2dhdGUyID0gMHhkYzAwICsgKGMgJiAweDNmZilcblxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHN1cnJvZ2F0ZTEsIHN1cnJvZ2F0ZTIpXG4gIH1cbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoYylcbn1cblxuY29uc3QgVU5FU0NBUEVfTURfUkUgPSAvXFxcXChbIVwiIyQlJicoKSorLFxcLS4vOjs8PT4/QFtcXFxcXFxdXl9ge3x9fl0pL2dcbmNvbnN0IEVOVElUWV9SRSA9IC8mKFthLXojXVthLXowLTldezEsMzF9KTsvZ2lcbmNvbnN0IFVORVNDQVBFX0FMTF9SRSA9IG5ldyBSZWdFeHAoVU5FU0NBUEVfTURfUkUuc291cmNlICsgJ3wnICsgRU5USVRZX1JFLnNvdXJjZSwgJ2dpJylcblxuY29uc3QgRElHSVRBTF9FTlRJVFlfVEVTVF9SRSA9IC9eIygoPzp4W2EtZjAtOV17MSw4fXxbMC05XXsxLDh9KSkkL2lcblxuZnVuY3Rpb24gcmVwbGFjZUVudGl0eVBhdHRlcm4gKG1hdGNoLCBuYW1lKSB7XG4gIGlmIChuYW1lLmNoYXJDb2RlQXQoMCkgPT09IDB4MjMvKiAjICovICYmIERJR0lUQUxfRU5USVRZX1RFU1RfUkUudGVzdChuYW1lKSkge1xuICAgIGNvbnN0IGNvZGUgPSBuYW1lWzFdLnRvTG93ZXJDYXNlKCkgPT09ICd4J1xuICAgICAgPyBwYXJzZUludChuYW1lLnNsaWNlKDIpLCAxNilcbiAgICAgIDogcGFyc2VJbnQobmFtZS5zbGljZSgxKSwgMTApXG5cbiAgICBpZiAoaXNWYWxpZEVudGl0eUNvZGUoY29kZSkpIHtcbiAgICAgIHJldHVybiBmcm9tQ29kZVBvaW50KGNvZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoXG4gIH1cblxuICBjb25zdCBkZWNvZGVkID0gZGVjb2RlSFRNTChtYXRjaClcbiAgaWYgKGRlY29kZWQgIT09IG1hdGNoKSB7XG4gICAgcmV0dXJuIGRlY29kZWRcbiAgfVxuXG4gIHJldHVybiBtYXRjaFxufVxuXG5mdW5jdGlvbiB1bmVzY2FwZU1kIChzdHIpIHtcbiAgaWYgKHN0ci5pbmRleE9mKCdcXFxcJykgPCAwKSB7IHJldHVybiBzdHIgfVxuICByZXR1cm4gc3RyLnJlcGxhY2UoVU5FU0NBUEVfTURfUkUsICckMScpXG59XG5cbmZ1bmN0aW9uIHVuZXNjYXBlQWxsIChzdHIpIHtcbiAgaWYgKHN0ci5pbmRleE9mKCdcXFxcJykgPCAwICYmIHN0ci5pbmRleE9mKCcmJykgPCAwKSB7IHJldHVybiBzdHIgfVxuXG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9BTExfUkUsIGZ1bmN0aW9uIChtYXRjaCwgZXNjYXBlZCwgZW50aXR5KSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgcmV0dXJuIGVzY2FwZWQgfVxuICAgIHJldHVybiByZXBsYWNlRW50aXR5UGF0dGVybihtYXRjaCwgZW50aXR5KVxuICB9KVxufVxuXG5jb25zdCBIVE1MX0VTQ0FQRV9URVNUX1JFID0gL1smPD5cIl0vXG5jb25zdCBIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFID0gL1smPD5cIl0vZ1xuY29uc3QgSFRNTF9SRVBMQUNFTUVOVFMgPSB7XG4gICcmJzogJyZhbXA7JyxcbiAgJzwnOiAnJmx0OycsXG4gICc+JzogJyZndDsnLFxuICAnXCInOiAnJnF1b3Q7J1xufVxuXG5mdW5jdGlvbiByZXBsYWNlVW5zYWZlQ2hhciAoY2gpIHtcbiAgcmV0dXJuIEhUTUxfUkVQTEFDRU1FTlRTW2NoXVxufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sIChzdHIpIHtcbiAgaWYgKEhUTUxfRVNDQVBFX1RFU1RfUkUudGVzdChzdHIpKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKEhUTUxfRVNDQVBFX1JFUExBQ0VfUkUsIHJlcGxhY2VVbnNhZmVDaGFyKVxuICB9XG4gIHJldHVybiBzdHJcbn1cblxuY29uc3QgUkVHRVhQX0VTQ0FQRV9SRSA9IC9bLj8qK14kW1xcXVxcXFwoKXt9fC1dL2dcblxuZnVuY3Rpb24gZXNjYXBlUkUgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoUkVHRVhQX0VTQ0FQRV9SRSwgJ1xcXFwkJicpXG59XG5cbmZ1bmN0aW9uIGlzU3BhY2UgKGNvZGUpIHtcbiAgc3dpdGNoIChjb2RlKSB7XG4gICAgY2FzZSAweDA5OlxuICAgIGNhc2UgMHgyMDpcbiAgICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIFpzICh1bmljb2RlIGNsYXNzKSB8fCBbXFx0XFxmXFx2XFxyXFxuXVxuZnVuY3Rpb24gaXNXaGl0ZVNwYWNlIChjb2RlKSB7XG4gIGlmIChjb2RlID49IDB4MjAwMCAmJiBjb2RlIDw9IDB4MjAwQSkgeyByZXR1cm4gdHJ1ZSB9XG4gIHN3aXRjaCAoY29kZSkge1xuICAgIGNhc2UgMHgwOTogLy8gXFx0XG4gICAgY2FzZSAweDBBOiAvLyBcXG5cbiAgICBjYXNlIDB4MEI6IC8vIFxcdlxuICAgIGNhc2UgMHgwQzogLy8gXFxmXG4gICAgY2FzZSAweDBEOiAvLyBcXHJcbiAgICBjYXNlIDB4MjA6XG4gICAgY2FzZSAweEEwOlxuICAgIGNhc2UgMHgxNjgwOlxuICAgIGNhc2UgMHgyMDJGOlxuICAgIGNhc2UgMHgyMDVGOlxuICAgIGNhc2UgMHgzMDAwOlxuICAgICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gQ3VycmVudGx5IHdpdGhvdXQgYXN0cmFsIGNoYXJhY3RlcnMgc3VwcG9ydC5cbmZ1bmN0aW9uIGlzUHVuY3RDaGFyIChjaCkge1xuICByZXR1cm4gdWNtaWNyby5QLnRlc3QoY2gpIHx8IHVjbWljcm8uUy50ZXN0KGNoKVxufVxuXG5mdW5jdGlvbiBpc1B1bmN0Q2hhckNvZGUgKGNvZGUpIHtcbiAgcmV0dXJuIGlzUHVuY3RDaGFyKGZyb21Db2RlUG9pbnQoY29kZSkpXG59XG5cbi8vIE1hcmtkb3duIEFTQ0lJIHB1bmN0dWF0aW9uIGNoYXJhY3RlcnMuXG4vL1xuLy8gISwgXCIsICMsICQsICUsICYsICcsICgsICksICosICssICwsIC0sIC4sIC8sIDosIDssIDwsID0sID4sID8sIEAsIFssIFxcLCBdLCBeLCBfLCBgLCB7LCB8LCB9LCBvciB+XG4vLyBodHRwOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjE1LyNhc2NpaS1wdW5jdHVhdGlvbi1jaGFyYWN0ZXJcbi8vXG4vLyBEb24ndCBjb25mdXNlIHdpdGggdW5pY29kZSBwdW5jdHVhdGlvbiAhISEgSXQgbGFja3Mgc29tZSBjaGFycyBpbiBhc2NpaSByYW5nZS5cbi8vXG5mdW5jdGlvbiBpc01kQXNjaWlQdW5jdCAoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgyMS8qICEgKi86XG4gICAgY2FzZSAweDIyLyogXCIgKi86XG4gICAgY2FzZSAweDIzLyogIyAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDI2LyogJiAqLzpcbiAgICBjYXNlIDB4MjcvKiAnICovOlxuICAgIGNhc2UgMHgyOC8qICggKi86XG4gICAgY2FzZSAweDI5LyogKSAqLzpcbiAgICBjYXNlIDB4MkEvKiAqICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDJDLyogLCAqLzpcbiAgICBjYXNlIDB4MkQvKiAtICovOlxuICAgIGNhc2UgMHgyRS8qIC4gKi86XG4gICAgY2FzZSAweDJGLyogLyAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgIGNhc2UgMHgzQi8qIDsgKi86XG4gICAgY2FzZSAweDNDLyogPCAqLzpcbiAgICBjYXNlIDB4M0QvKiA9ICovOlxuICAgIGNhc2UgMHgzRS8qID4gKi86XG4gICAgY2FzZSAweDNGLyogPyAqLzpcbiAgICBjYXNlIDB4NDAvKiBAICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVDLyogXFwgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Ri8qIF8gKi86XG4gICAgY2FzZSAweDYwLyogYCAqLzpcbiAgICBjYXNlIDB4N0IvKiB7ICovOlxuICAgIGNhc2UgMHg3Qy8qIHwgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLy8gSGVwbGVyIHRvIHVuaWZ5IFtyZWZlcmVuY2UgbGFiZWxzXS5cbi8vXG5mdW5jdGlvbiBub3JtYWxpemVSZWZlcmVuY2UgKHN0cikge1xuICAvLyBUcmltIGFuZCBjb2xsYXBzZSB3aGl0ZXNwYWNlXG4gIC8vXG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpXG5cbiAgLy8gSW4gbm9kZSB2MTAgJ+G6nicudG9Mb3dlckNhc2UoKSA9PT0gJ+G5vicsIHdoaWNoIGlzIHByZXN1bWVkIHRvIGJlIGEgYnVnXG4gIC8vIGZpeGVkIGluIHYxMiAoY291bGRuJ3QgZmluZCBhbnkgZGV0YWlscykuXG4gIC8vXG4gIC8vIFNvIHRyZWF0IHRoaXMgb25lIGFzIGEgc3BlY2lhbCBjYXNlXG4gIC8vIChyZW1vdmUgdGhpcyB3aGVuIG5vZGUgdjEwIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQpLlxuICAvL1xuICBpZiAoJ+G6nicudG9Mb3dlckNhc2UoKSA9PT0gJ+G5vicpIHtcbiAgICAvKiBjOCBpZ25vcmUgbmV4dCAyICovXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL+G6ni9nLCAnw58nKVxuICB9XG5cbiAgLy8gLnRvTG93ZXJDYXNlKCkudG9VcHBlckNhc2UoKSBzaG91bGQgZ2V0IHJpZCBvZiBhbGwgZGlmZmVyZW5jZXNcbiAgLy8gYmV0d2VlbiBsZXR0ZXIgdmFyaWFudHMuXG4gIC8vXG4gIC8vIFNpbXBsZSAudG9Mb3dlckNhc2UoKSBkb2Vzbid0IG5vcm1hbGl6ZSAxMjUgY29kZSBwb2ludHMgY29ycmVjdGx5LFxuICAvLyBhbmQgLnRvVXBwZXJDYXNlIGRvZXNuJ3Qgbm9ybWFsaXplIDYgb2YgdGhlbSAobGlzdCBvZiBleGNlcHRpb25zOlxuICAvLyDEsCwgz7QsIOG6niwg4oSmLCDihKosIOKEqyAtIHRob3NlIGFyZSBhbHJlYWR5IHVwcGVyY2FzZWQsIGJ1dCBoYXZlIGRpZmZlcmVudGx5XG4gIC8vIHVwcGVyY2FzZWQgdmVyc2lvbnMpLlxuICAvL1xuICAvLyBIZXJlJ3MgYW4gZXhhbXBsZSBzaG93aW5nIGhvdyBpdCBoYXBwZW5zLiBMZXRzIHRha2UgZ3JlZWsgbGV0dGVyIG9tZWdhOlxuICAvLyB1cHBlcmNhc2UgVSswMzk4ICjOmCksIFUrMDNmNCAoz7QpIGFuZCBsb3dlcmNhc2UgVSswM2I4ICjOuCksIFUrMDNkMSAoz5EpXG4gIC8vXG4gIC8vIFVuaWNvZGUgZW50cmllczpcbiAgLy8gMDM5ODtHUkVFSyBDQVBJVEFMIExFVFRFUiBUSEVUQTtMdTswO0w7Ozs7O047Ozs7MDNCODtcbiAgLy8gMDNCODtHUkVFSyBTTUFMTCBMRVRURVIgVEhFVEE7TGw7MDtMOzs7OztOOzs7MDM5ODs7MDM5OFxuICAvLyAwM0QxO0dSRUVLIFRIRVRBIFNZTUJPTDtMbDswO0w7PGNvbXBhdD4gMDNCODs7OztOO0dSRUVLIFNNQUxMIExFVFRFUiBTQ1JJUFQgVEhFVEE7OzAzOTg7OzAzOThcbiAgLy8gMDNGNDtHUkVFSyBDQVBJVEFMIFRIRVRBIFNZTUJPTDtMdTswO0w7PGNvbXBhdD4gMDM5ODs7OztOOzs7OzAzQjg7XG4gIC8vXG4gIC8vIENhc2UtaW5zZW5zaXRpdmUgY29tcGFyaXNvbiBzaG91bGQgdHJlYXQgYWxsIG9mIHRoZW0gYXMgZXF1aXZhbGVudC5cbiAgLy9cbiAgLy8gQnV0IC50b0xvd2VyQ2FzZSgpIGRvZXNuJ3QgY2hhbmdlIM+RIChpdCdzIGFscmVhZHkgbG93ZXJjYXNlKSxcbiAgLy8gYW5kIC50b1VwcGVyQ2FzZSgpIGRvZXNuJ3QgY2hhbmdlIM+0IChhbHJlYWR5IHVwcGVyY2FzZSkuXG4gIC8vXG4gIC8vIEFwcGx5aW5nIGZpcnN0IGxvd2VyIHRoZW4gdXBwZXIgY2FzZSBub3JtYWxpemVzIGFueSBjaGFyYWN0ZXI6XG4gIC8vICdcXHUwMzk4XFx1MDNmNFxcdTAzYjhcXHUwM2QxJy50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKCkgPT09ICdcXHUwMzk4XFx1MDM5OFxcdTAzOThcXHUwMzk4J1xuICAvL1xuICAvLyBOb3RlOiB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gdW5pY29kZSBjYXNlIGZvbGRpbmc7IHVuaWNvZGUgbm9ybWFsaXphdGlvblxuICAvLyBpcyBhIGRpZmZlcmVudCBzdGVwIHRoYXQgaXMgbm90IHJlcXVpcmVkIGhlcmUuXG4gIC8vXG4gIC8vIEZpbmFsIHJlc3VsdCBzaG91bGQgYmUgdXBwZXJjYXNlZCwgYmVjYXVzZSBpdCdzIGxhdGVyIHN0b3JlZCBpbiBhbiBvYmplY3RcbiAgLy8gKHRoaXMgYXZvaWQgYSBjb25mbGljdCB3aXRoIE9iamVjdC5wcm90b3R5cGUgbWVtYmVycyxcbiAgLy8gbW9zdCBub3RhYmx5LCBgX19wcm90b19fYClcbiAgLy9cbiAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKClcbn1cblxuZnVuY3Rpb24gaXNBc2NpaVRyaW1tYWJsZSAoYykge1xuICByZXR1cm4gYyA9PT0gMHgyMCB8fCBjID09PSAweDA5IHx8IGMgPT09IDB4MGEgfHwgYyA9PT0gMHgwZFxufVxuXG4vLyBcIkxpZ2h0XCIgLnRyaW0oKSBmb3IgYmxvY2tzIChoZWFkZXJzLCBwYXJhZ3JhcGhzKSwgd2hlcmUgdW5pY29kZSBzcGFjZXNcbi8vIHNob3VsZCBiZSBwcmVzZXJ2ZWQuXG5mdW5jdGlvbiBhc2NpaVRyaW0gKHN0cikge1xuICBsZXQgc3RhcnQgPSAwXG4gIGZvciAoOyBzdGFydCA8IHN0ci5sZW5ndGg7IHN0YXJ0KyspIHtcbiAgICBpZiAoIWlzQXNjaWlUcmltbWFibGUoc3RyLmNoYXJDb2RlQXQoc3RhcnQpKSkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgbGV0IGVuZCA9IHN0ci5sZW5ndGggLSAxXG4gIGZvciAoOyBlbmQgPj0gc3RhcnQ7IGVuZC0tKSB7XG4gICAgaWYgKCFpc0FzY2lpVHJpbW1hYmxlKHN0ci5jaGFyQ29kZUF0KGVuZCkpKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyLnNsaWNlKHN0YXJ0LCBlbmQgKyAxKVxufVxuXG4vLyBSZS1leHBvcnQgbGlicmFyaWVzIGNvbW1vbmx5IHVzZWQgaW4gYm90aCBtYXJrZG93bi1pdCBhbmQgaXRzIHBsdWdpbnMsXG4vLyBzbyBwbHVnaW5zIHdvbid0IGhhdmUgdG8gZGVwZW5kIG9uIHRoZW0gZXhwbGljaXRseSwgd2hpY2ggcmVkdWNlcyB0aGVpclxuLy8gYnVuZGxlZCBzaXplIChlLmcuIGEgYnJvd3NlciBidWlsZCkuXG4vL1xuY29uc3QgbGliID0geyBtZHVybCwgdWNtaWNybyB9XG5cbmV4cG9ydCB7XG4gIGxpYixcbiAgYXNzaWduLFxuICBpc1N0cmluZyxcbiAgaGFzLFxuICB1bmVzY2FwZU1kLFxuICB1bmVzY2FwZUFsbCxcbiAgaXNWYWxpZEVudGl0eUNvZGUsXG4gIGZyb21Db2RlUG9pbnQsXG4gIGVzY2FwZUh0bWwsXG4gIGFycmF5UmVwbGFjZUF0LFxuICBpc1NwYWNlLFxuICBpc1doaXRlU3BhY2UsXG4gIGlzTWRBc2NpaVB1bmN0LFxuICBpc1B1bmN0Q2hhcixcbiAgaXNQdW5jdENoYXJDb2RlLFxuICBlc2NhcGVSRSxcbiAgbm9ybWFsaXplUmVmZXJlbmNlLFxuICBhc2NpaVRyaW1cbn1cbiIsICIvLyBQYXJzZSBsaW5rIGxhYmVsXG4vL1xuLy8gdGhpcyBmdW5jdGlvbiBhc3N1bWVzIHRoYXQgZmlyc3QgY2hhcmFjdGVyIChcIltcIikgYWxyZWFkeSBtYXRjaGVzO1xuLy8gcmV0dXJucyB0aGUgZW5kIG9mIHRoZSBsYWJlbFxuLy9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VMaW5rTGFiZWwgKHN0YXRlLCBzdGFydCwgZGlzYWJsZU5lc3RlZCkge1xuICBsZXQgbGV2ZWwsIGZvdW5kLCBtYXJrZXIsIHByZXZQb3NcblxuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcbiAgY29uc3Qgb2xkUG9zID0gc3RhdGUucG9zXG5cbiAgc3RhdGUucG9zID0gc3RhcnQgKyAxXG4gIGxldmVsID0gMVxuXG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBtYXgpIHtcbiAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpXG4gICAgaWYgKG1hcmtlciA9PT0gMHg1RCAvKiBdICovKSB7XG4gICAgICBsZXZlbC0tXG4gICAgICBpZiAobGV2ZWwgPT09IDApIHtcbiAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJldlBvcyA9IHN0YXRlLnBvc1xuICAgIHN0YXRlLm1kLmlubGluZS5za2lwVG9rZW4oc3RhdGUpXG4gICAgaWYgKG1hcmtlciA9PT0gMHg1QiAvKiBbICovKSB7XG4gICAgICBpZiAocHJldlBvcyA9PT0gc3RhdGUucG9zIC0gMSkge1xuICAgICAgICAvLyBpbmNyZWFzZSBsZXZlbCBpZiB3ZSBmaW5kIHRleHQgYFtgLCB3aGljaCBpcyBub3QgYSBwYXJ0IG9mIGFueSB0b2tlblxuICAgICAgICBsZXZlbCsrXG4gICAgICB9IGVsc2UgaWYgKGRpc2FibGVOZXN0ZWQpIHtcbiAgICAgICAgc3RhdGUucG9zID0gb2xkUG9zXG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBsYWJlbEVuZCA9IC0xXG5cbiAgaWYgKGZvdW5kKSB7XG4gICAgbGFiZWxFbmQgPSBzdGF0ZS5wb3NcbiAgfVxuXG4gIC8vIHJlc3RvcmUgb2xkIHN0YXRlXG4gIHN0YXRlLnBvcyA9IG9sZFBvc1xuXG4gIHJldHVybiBsYWJlbEVuZFxufVxuIiwgIi8vIFBhcnNlIGxpbmsgZGVzdGluYXRpb25cbi8vXG5cbmltcG9ydCB7IHVuZXNjYXBlQWxsIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VMaW5rRGVzdGluYXRpb24gKHN0ciwgc3RhcnQsIG1heCkge1xuICBsZXQgY29kZVxuICBsZXQgcG9zID0gc3RhcnRcblxuICBjb25zdCByZXN1bHQgPSB7XG4gICAgb2s6IGZhbHNlLFxuICAgIHBvczogMCxcbiAgICBzdHI6ICcnXG4gIH1cblxuICBpZiAoc3RyLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgzQyAvKiA8ICovKSB7XG4gICAgcG9zKytcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgICAgaWYgKGNvZGUgPT09IDB4MEEgLyogXFxuICovKSB7IHJldHVybiByZXN1bHQgfVxuICAgICAgaWYgKGNvZGUgPT09IDB4M0MgLyogPCAqLykgeyByZXR1cm4gcmVzdWx0IH1cbiAgICAgIGlmIChjb2RlID09PSAweDNFIC8qID4gKi8pIHtcbiAgICAgICAgcmVzdWx0LnBvcyA9IHBvcyArIDFcbiAgICAgICAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCArIDEsIHBvcykpXG4gICAgICAgIHJlc3VsdC5vayA9IHRydWVcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgICBwb3MgKz0gMlxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBwb3MrK1xuICAgIH1cblxuICAgIC8vIG5vIGNsb3NpbmcgJz4nXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLy8gdGhpcyBzaG91bGQgYmUgLi4uIH0gZWxzZSB7IC4uLiBicmFuY2hcblxuICBsZXQgbGV2ZWwgPSAwXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgaWYgKGNvZGUgPT09IDB4MjApIHsgYnJlYWsgfVxuXG4gICAgLy8gYXNjaWkgY29udHJvbCBjaGFyYWN0ZXJzXG4gICAgaWYgKGNvZGUgPCAweDIwIHx8IGNvZGUgPT09IDB4N0YpIHsgYnJlYWsgfVxuXG4gICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgaWYgKHN0ci5jaGFyQ29kZUF0KHBvcyArIDEpID09PSAweDIwKSB7IGJyZWFrIH1cbiAgICAgIHBvcyArPSAyXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAweDI4IC8qICggKi8pIHtcbiAgICAgIGxldmVsKytcbiAgICAgIGlmIChsZXZlbCA+IDMyKSB7IHJldHVybiByZXN1bHQgfVxuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAweDI5IC8qICkgKi8pIHtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgeyBicmVhayB9XG4gICAgICBsZXZlbC0tXG4gICAgfVxuXG4gICAgcG9zKytcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gcG9zKSB7IHJldHVybiByZXN1bHQgfVxuICBpZiAobGV2ZWwgIT09IDApIHsgcmV0dXJuIHJlc3VsdCB9XG5cbiAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCwgcG9zKSlcbiAgcmVzdWx0LnBvcyA9IHBvc1xuICByZXN1bHQub2sgPSB0cnVlXG4gIHJldHVybiByZXN1bHRcbn1cbiIsICIvLyBQYXJzZSBsaW5rIHRpdGxlXG4vL1xuXG5pbXBvcnQgeyB1bmVzY2FwZUFsbCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbi8vIFBhcnNlIGxpbmsgdGl0bGUgd2l0aGluIGBzdHJgIGluIFtzdGFydCwgbWF4XSByYW5nZSxcbi8vIG9yIGNvbnRpbnVlIHByZXZpb3VzIHBhcnNpbmcgaWYgYHByZXZfc3RhdGVgIGlzIGRlZmluZWQgKGVxdWFsIHRvIHJlc3VsdCBvZiBsYXN0IGV4ZWN1dGlvbikuXG4vL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcGFyc2VMaW5rVGl0bGUgKHN0ciwgc3RhcnQsIG1heCwgcHJldl9zdGF0ZSkge1xuICBsZXQgY29kZVxuICBsZXQgcG9zID0gc3RhcnRcblxuICBjb25zdCBzdGF0ZSA9IHtcbiAgICAvLyBpZiBgdHJ1ZWAsIHRoaXMgaXMgYSB2YWxpZCBsaW5rIHRpdGxlXG4gICAgb2s6IGZhbHNlLFxuICAgIC8vIGlmIGB0cnVlYCwgdGhpcyBsaW5rIGNhbiBiZSBjb250aW51ZWQgb24gdGhlIG5leHQgbGluZVxuICAgIGNhbl9jb250aW51ZTogZmFsc2UsXG4gICAgLy8gaWYgYG9rYCwgaXQncyB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IGNoYXJhY3RlciBhZnRlciB0aGUgY2xvc2luZyBtYXJrZXJcbiAgICBwb3M6IDAsXG4gICAgLy8gaWYgYG9rYCwgaXQncyB0aGUgdW5lc2NhcGVkIHRpdGxlXG4gICAgc3RyOiAnJyxcbiAgICAvLyBleHBlY3RlZCBjbG9zaW5nIG1hcmtlciBjaGFyYWN0ZXIgY29kZVxuICAgIG1hcmtlcjogMFxuICB9XG5cbiAgaWYgKHByZXZfc3RhdGUpIHtcbiAgICAvLyB0aGlzIGlzIGEgY29udGludWF0aW9uIG9mIGEgcHJldmlvdXMgcGFyc2VMaW5rVGl0bGUgY2FsbCBvbiB0aGUgbmV4dCBsaW5lLFxuICAgIC8vIHVzZWQgaW4gcmVmZXJlbmNlIGxpbmtzIG9ubHlcbiAgICBzdGF0ZS5zdHIgPSBwcmV2X3N0YXRlLnN0clxuICAgIHN0YXRlLm1hcmtlciA9IHByZXZfc3RhdGUubWFya2VyXG4gIH0gZWxzZSB7XG4gICAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIHN0YXRlIH1cblxuICAgIGxldCBtYXJrZXIgPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKG1hcmtlciAhPT0gMHgyMiAvKiBcIiAqLyAmJiBtYXJrZXIgIT09IDB4MjcgLyogJyAqLyAmJiBtYXJrZXIgIT09IDB4MjggLyogKCAqLykgeyByZXR1cm4gc3RhdGUgfVxuXG4gICAgc3RhcnQrK1xuICAgIHBvcysrXG5cbiAgICAvLyBpZiBvcGVuaW5nIG1hcmtlciBpcyBcIihcIiwgc3dpdGNoIGl0IHRvIGNsb3NpbmcgbWFya2VyIFwiKVwiXG4gICAgaWYgKG1hcmtlciA9PT0gMHgyOCkgeyBtYXJrZXIgPSAweDI5IH1cblxuICAgIHN0YXRlLm1hcmtlciA9IG1hcmtlclxuICB9XG5cbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNvZGUgPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKGNvZGUgPT09IHN0YXRlLm1hcmtlcikge1xuICAgICAgc3RhdGUucG9zID0gcG9zICsgMVxuICAgICAgc3RhdGUuc3RyICs9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCwgcG9zKSlcbiAgICAgIHN0YXRlLm9rID0gdHJ1ZVxuICAgICAgcmV0dXJuIHN0YXRlXG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAweDI4IC8qICggKi8gJiYgc3RhdGUubWFya2VyID09PSAweDI5IC8qICkgKi8pIHtcbiAgICAgIHJldHVybiBzdGF0ZVxuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICBwb3MrK1xuICAgIH1cblxuICAgIHBvcysrXG4gIH1cblxuICAvLyBubyBjbG9zaW5nIG1hcmtlciBmb3VuZCwgYnV0IHRoaXMgbGluayB0aXRsZSBtYXkgY29udGludWUgb24gdGhlIG5leHQgbGluZSAoZm9yIHJlZmVyZW5jZXMpXG4gIHN0YXRlLmNhbl9jb250aW51ZSA9IHRydWVcbiAgc3RhdGUuc3RyICs9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCwgcG9zKSlcbiAgcmV0dXJuIHN0YXRlXG59XG4iLCAiLy8gSnVzdCBhIHNob3J0Y3V0IGZvciBidWxrIGV4cG9ydFxuXG5pbXBvcnQgcGFyc2VMaW5rTGFiZWwgZnJvbSAnLi9wYXJzZV9saW5rX2xhYmVsLm1qcydcbmltcG9ydCBwYXJzZUxpbmtEZXN0aW5hdGlvbiBmcm9tICcuL3BhcnNlX2xpbmtfZGVzdGluYXRpb24ubWpzJ1xuaW1wb3J0IHBhcnNlTGlua1RpdGxlIGZyb20gJy4vcGFyc2VfbGlua190aXRsZS5tanMnXG5cbmV4cG9ydCB7XG4gIHBhcnNlTGlua0xhYmVsLFxuICBwYXJzZUxpbmtEZXN0aW5hdGlvbixcbiAgcGFyc2VMaW5rVGl0bGVcbn1cbiIsICIvKipcbiAqIGNsYXNzIFJlbmRlcmVyXG4gKlxuICogR2VuZXJhdGVzIEhUTUwgZnJvbSBwYXJzZWQgdG9rZW4gc3RyZWFtLiBFYWNoIGluc3RhbmNlIGhhcyBpbmRlcGVuZGVudFxuICogY29weSBvZiBydWxlcy4gVGhvc2UgY2FuIGJlIHJld3JpdHRlbiB3aXRoIGVhc2UuIEFsc28sIHlvdSBjYW4gYWRkIG5ld1xuICogcnVsZXMgaWYgeW91IGNyZWF0ZSBwbHVnaW4gYW5kIGFkZHMgbmV3IHRva2VuIHR5cGVzLlxuICoqL1xuXG5pbXBvcnQgeyBhc3NpZ24sIHVuZXNjYXBlQWxsLCBlc2NhcGVIdG1sIH0gZnJvbSAnLi9jb21tb24vdXRpbHMubWpzJ1xuXG5jb25zdCBkZWZhdWx0X3J1bGVzID0ge31cblxuZGVmYXVsdF9ydWxlcy5jb2RlX2lubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XVxuXG4gIHJldHVybiAnPGNvZGUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbi5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT4nXG59XG5cbmRlZmF1bHRfcnVsZXMuY29kZV9ibG9jayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XVxuXG4gIHJldHVybiAnPHByZScgKyBzbGYucmVuZGVyQXR0cnModG9rZW4pICsgJz48Y29kZT4nICtcbiAgICAgICAgICBlc2NhcGVIdG1sKHRva2Vuc1tpZHhdLmNvbnRlbnQpICtcbiAgICAgICAgICAnPC9jb2RlPjwvcHJlPlxcbidcbn1cblxuZGVmYXVsdF9ydWxlcy5mZW5jZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XVxuICBjb25zdCBpbmZvID0gdG9rZW4uaW5mbyA/IHVuZXNjYXBlQWxsKHRva2VuLmluZm8pLnRyaW0oKSA6ICcnXG4gIGxldCBsYW5nTmFtZSA9ICcnXG4gIGxldCBsYW5nQXR0cnMgPSAnJ1xuXG4gIGlmIChpbmZvKSB7XG4gICAgY29uc3QgYXJyID0gaW5mby5zcGxpdCgvKFxccyspL2cpXG4gICAgbGFuZ05hbWUgPSBhcnJbMF1cbiAgICBsYW5nQXR0cnMgPSBhcnIuc2xpY2UoMikuam9pbignJylcbiAgfVxuXG4gIGxldCBoaWdobGlnaHRlZFxuICBpZiAob3B0aW9ucy5oaWdobGlnaHQpIHtcbiAgICBoaWdobGlnaHRlZCA9IG9wdGlvbnMuaGlnaGxpZ2h0KHRva2VuLmNvbnRlbnQsIGxhbmdOYW1lLCBsYW5nQXR0cnMpIHx8IGVzY2FwZUh0bWwodG9rZW4uY29udGVudClcbiAgfSBlbHNlIHtcbiAgICBoaWdobGlnaHRlZCA9IGVzY2FwZUh0bWwodG9rZW4uY29udGVudClcbiAgfVxuXG4gIGlmIChoaWdobGlnaHRlZC5pbmRleE9mKCc8cHJlJykgPT09IDApIHtcbiAgICByZXR1cm4gaGlnaGxpZ2h0ZWQgKyAnXFxuJ1xuICB9XG5cbiAgLy8gSWYgbGFuZ3VhZ2UgZXhpc3RzLCBpbmplY3QgY2xhc3MgZ2VudGx5LCB3aXRob3V0IG1vZGlmeWluZyBvcmlnaW5hbCB0b2tlbi5cbiAgLy8gTWF5IGJlLCBvbmUgZGF5IHdlIHdpbGwgYWRkIC5kZWVwQ2xvbmUoKSBmb3IgdG9rZW4gYW5kIHNpbXBsaWZ5IHRoaXMgcGFydCwgYnV0XG4gIC8vIG5vdyB3ZSBwcmVmZXIgdG8ga2VlcCB0aGluZ3MgbG9jYWwuXG4gIGlmIChpbmZvKSB7XG4gICAgY29uc3QgaSA9IHRva2VuLmF0dHJJbmRleCgnY2xhc3MnKVxuICAgIGNvbnN0IHRtcEF0dHJzID0gdG9rZW4uYXR0cnMgPyB0b2tlbi5hdHRycy5zbGljZSgpIDogW11cblxuICAgIGlmIChpIDwgMCkge1xuICAgICAgdG1wQXR0cnMucHVzaChbJ2NsYXNzJywgb3B0aW9ucy5sYW5nUHJlZml4ICsgbGFuZ05hbWVdKVxuICAgIH0gZWxzZSB7XG4gICAgICB0bXBBdHRyc1tpXSA9IHRtcEF0dHJzW2ldLnNsaWNlKClcbiAgICAgIHRtcEF0dHJzW2ldWzFdICs9ICcgJyArIG9wdGlvbnMubGFuZ1ByZWZpeCArIGxhbmdOYW1lXG4gICAgfVxuXG4gICAgLy8gRmFrZSB0b2tlbiBqdXN0IHRvIHJlbmRlciBhdHRyaWJ1dGVzXG4gICAgY29uc3QgdG1wVG9rZW4gPSB7XG4gICAgICBhdHRyczogdG1wQXR0cnNcbiAgICB9XG5cbiAgICByZXR1cm4gYDxwcmU+PGNvZGUke3NsZi5yZW5kZXJBdHRycyh0bXBUb2tlbil9PiR7aGlnaGxpZ2h0ZWR9PC9jb2RlPjwvcHJlPlxcbmBcbiAgfVxuXG4gIHJldHVybiBgPHByZT48Y29kZSR7c2xmLnJlbmRlckF0dHJzKHRva2VuKX0+JHtoaWdobGlnaHRlZH08L2NvZGU+PC9wcmU+XFxuYFxufVxuXG5kZWZhdWx0X3J1bGVzLmltYWdlID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNsZikge1xuICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdXG5cbiAgLy8gXCJhbHRcIiBhdHRyIE1VU1QgYmUgc2V0LCBldmVuIGlmIGVtcHR5LiBCZWNhdXNlIGl0J3MgbWFuZGF0b3J5IGFuZFxuICAvLyBzaG91bGQgYmUgcGxhY2VkIG9uIHByb3BlciBwb3NpdGlvbiBmb3IgdGVzdHMuXG4gIC8vXG4gIC8vIFJlcGxhY2UgY29udGVudCB3aXRoIGFjdHVhbCB2YWx1ZVxuXG4gIHRva2VuLmF0dHJzW3Rva2VuLmF0dHJJbmRleCgnYWx0JyldWzFdID1cbiAgICBzbGYucmVuZGVySW5saW5lQXNUZXh0KHRva2VuLmNoaWxkcmVuLCBvcHRpb25zLCBlbnYpXG5cbiAgcmV0dXJuIHNsZi5yZW5kZXJUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucylcbn1cblxuZGVmYXVsdF9ydWxlcy5oYXJkYnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy54aHRtbE91dCA/ICc8YnIgLz5cXG4nIDogJzxicj5cXG4nXG59XG5kZWZhdWx0X3J1bGVzLnNvZnRicmVhayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucyAvKiwgZW52ICovKSB7XG4gIHJldHVybiBvcHRpb25zLmJyZWFrcyA/IChvcHRpb25zLnhodG1sT3V0ID8gJzxiciAvPlxcbicgOiAnPGJyPlxcbicpIDogJ1xcbidcbn1cblxuZGVmYXVsdF9ydWxlcy50ZXh0ID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uY29udGVudClcbn1cblxuZGVmYXVsdF9ydWxlcy5odG1sX2Jsb2NrID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIHRva2Vuc1tpZHhdLmNvbnRlbnRcbn1cbmRlZmF1bHRfcnVsZXMuaHRtbF9pbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gdG9rZW5zW2lkeF0uY29udGVudFxufVxuXG4vKipcbiAqIG5ldyBSZW5kZXJlcigpXG4gKlxuICogQ3JlYXRlcyBuZXcgW1tSZW5kZXJlcl1dIGluc3RhbmNlIGFuZCBmaWxsIFtbUmVuZGVyZXIjcnVsZXNdXSB3aXRoIGRlZmF1bHRzLlxuICoqL1xuZnVuY3Rpb24gUmVuZGVyZXIgKCkge1xuICAvKipcbiAgICogUmVuZGVyZXIjcnVsZXMgLT4gT2JqZWN0XG4gICAqXG4gICAqIENvbnRhaW5zIHJlbmRlciBydWxlcyBmb3IgdG9rZW5zLiBDYW4gYmUgdXBkYXRlZCBhbmQgZXh0ZW5kZWQuXG4gICAqXG4gICAqICMjIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gICAqXG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzLnN0cm9uZ19vcGVuICA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICc8Yj4nOyB9O1xuICAgKiBtZC5yZW5kZXJlci5ydWxlcy5zdHJvbmdfY2xvc2UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnPC9iPic7IH07XG4gICAqXG4gICAqIHZhciByZXN1bHQgPSBtZC5yZW5kZXJJbmxpbmUoLi4uKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEVhY2ggcnVsZSBpcyBjYWxsZWQgYXMgaW5kZXBlbmRlbnQgc3RhdGljIGZ1bmN0aW9uIHdpdGggZml4ZWQgc2lnbmF0dXJlOlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGZ1bmN0aW9uIG15X3Rva2VuX3JlbmRlcih0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCByZW5kZXJlcikge1xuICAgKiAgIC8vIC4uLlxuICAgKiAgIHJldHVybiByZW5kZXJlZEhUTUw7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFNlZSBbc291cmNlIGNvZGVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcmVuZGVyZXIubWpzKVxuICAgKiBmb3IgbW9yZSBkZXRhaWxzIGFuZCBleGFtcGxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVzID0gYXNzaWduKHt9LCBkZWZhdWx0X3J1bGVzKVxufVxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlckF0dHJzKHRva2VuKSAtPiBTdHJpbmdcbiAqXG4gKiBSZW5kZXIgdG9rZW4gYXR0cmlidXRlcyB0byBzdHJpbmcuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyQXR0cnMgPSBmdW5jdGlvbiByZW5kZXJBdHRycyAodG9rZW4pIHtcbiAgbGV0IGksIGwsIHJlc3VsdFxuXG4gIGlmICghdG9rZW4uYXR0cnMpIHsgcmV0dXJuICcnIH1cblxuICByZXN1bHQgPSAnJ1xuXG4gIGZvciAoaSA9IDAsIGwgPSB0b2tlbi5hdHRycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICByZXN1bHQgKz0gJyAnICsgZXNjYXBlSHRtbCh0b2tlbi5hdHRyc1tpXVswXSkgKyAnPVwiJyArIGVzY2FwZUh0bWwodG9rZW4uYXR0cnNbaV1bMV0pICsgJ1wiJ1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlclRva2VuKHRva2VucywgaWR4LCBvcHRpb25zKSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb2YgdG9rZW5zXG4gKiAtIGlkeCAoTnVtYmVkKTogdG9rZW4gaW5kZXggdG8gcmVuZGVyXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHBhcmFtcyBvZiBwYXJzZXIgaW5zdGFuY2VcbiAqXG4gKiBEZWZhdWx0IHRva2VuIHJlbmRlcmVyLiBDYW4gYmUgb3ZlcnJpZGVuIGJ5IGN1c3RvbSBmdW5jdGlvblxuICogaW4gW1tSZW5kZXJlciNydWxlc11dLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlclRva2VuID0gZnVuY3Rpb24gcmVuZGVyVG9rZW4gKHRva2VucywgaWR4LCBvcHRpb25zKSB7XG4gIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF1cbiAgbGV0IHJlc3VsdCA9ICcnXG5cbiAgLy8gVGlnaHQgbGlzdCBwYXJhZ3JhcGhzXG4gIGlmICh0b2tlbi5oaWRkZW4pIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEluc2VydCBhIG5ld2xpbmUgYmV0d2VlbiBoaWRkZW4gcGFyYWdyYXBoIGFuZCBzdWJzZXF1ZW50IG9wZW5pbmdcbiAgLy8gYmxvY2stbGV2ZWwgdGFnLlxuICAvL1xuICAvLyBGb3IgZXhhbXBsZSwgaGVyZSB3ZSBzaG91bGQgaW5zZXJ0IGEgbmV3bGluZSBiZWZvcmUgYmxvY2txdW90ZTpcbiAgLy8gIC0gYVxuICAvLyAgICA+XG4gIC8vXG4gIGlmICh0b2tlbi5ibG9jayAmJiB0b2tlbi5uZXN0aW5nICE9PSAtMSAmJiBpZHggJiYgdG9rZW5zW2lkeCAtIDFdLmhpZGRlbikge1xuICAgIHJlc3VsdCArPSAnXFxuJ1xuICB9XG5cbiAgLy8gQWRkIHRva2VuIG5hbWUsIGUuZy4gYDxpbWdgXG4gIHJlc3VsdCArPSAodG9rZW4ubmVzdGluZyA9PT0gLTEgPyAnPC8nIDogJzwnKSArIHRva2VuLnRhZ1xuXG4gIC8vIEVuY29kZSBhdHRyaWJ1dGVzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiYFxuICByZXN1bHQgKz0gdGhpcy5yZW5kZXJBdHRycyh0b2tlbilcblxuICAvLyBBZGQgYSBzbGFzaCBmb3Igc2VsZi1jbG9zaW5nIHRhZ3MsIGUuZy4gYDxpbWcgc3JjPVwiZm9vXCIgL2BcbiAgaWYgKHRva2VuLm5lc3RpbmcgPT09IDAgJiYgb3B0aW9ucy54aHRtbE91dCkge1xuICAgIHJlc3VsdCArPSAnIC8nXG4gIH1cblxuICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGFkZCBhIG5ld2xpbmUgYWZ0ZXIgdGhpcyB0YWdcbiAgbGV0IG5lZWRMZiA9IGZhbHNlXG4gIGlmICh0b2tlbi5ibG9jaykge1xuICAgIG5lZWRMZiA9IHRydWVcblxuICAgIGlmICh0b2tlbi5uZXN0aW5nID09PSAxKSB7XG4gICAgICBpZiAoaWR4ICsgMSA8IHRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgbmV4dFRva2VuID0gdG9rZW5zW2lkeCArIDFdXG5cbiAgICAgICAgaWYgKG5leHRUb2tlbi50eXBlID09PSAnaW5saW5lJyB8fCBuZXh0VG9rZW4uaGlkZGVuKSB7XG4gICAgICAgICAgLy8gQmxvY2stbGV2ZWwgdGFnIGNvbnRhaW5pbmcgYW4gaW5saW5lIHRhZy5cbiAgICAgICAgICAvL1xuICAgICAgICAgIG5lZWRMZiA9IGZhbHNlXG4gICAgICAgIH0gZWxzZSBpZiAobmV4dFRva2VuLm5lc3RpbmcgPT09IC0xICYmIG5leHRUb2tlbi50YWcgPT09IHRva2VuLnRhZykge1xuICAgICAgICAgIC8vIE9wZW5pbmcgdGFnICsgY2xvc2luZyB0YWcgb2YgdGhlIHNhbWUgdHlwZS4gRS5nLiBgPGxpPjwvbGk+YC5cbiAgICAgICAgICAvL1xuICAgICAgICAgIG5lZWRMZiA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXN1bHQgKz0gbmVlZExmID8gJz5cXG4nIDogJz4nXG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlcklubGluZSh0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogVGhlIHNhbWUgYXMgW1tSZW5kZXJlci5yZW5kZXJdXSwgYnV0IGZvciBzaW5nbGUgdG9rZW4gb2YgYGlubGluZWAgdHlwZS5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJJbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBvcHRpb25zLCBlbnYpIHtcbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlc1xuXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjb25zdCB0eXBlID0gdG9rZW5zW2ldLnR5cGVcblxuICAgIGlmICh0eXBlb2YgcnVsZXNbdHlwZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXN1bHQgKz0gcnVsZXNbdHlwZV0odG9rZW5zLCBpLCBvcHRpb25zLCBlbnYsIHRoaXMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclRva2VuKHRva2VucywgaSwgb3B0aW9ucylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKiBpbnRlcm5hbFxuICogUmVuZGVyZXIucmVuZGVySW5saW5lQXNUZXh0KHRva2Vucywgb3B0aW9ucywgZW52KSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb24gYmxvY2sgdG9rZW5zIHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKiAtIGVudiAoT2JqZWN0KTogYWRkaXRpb25hbCBkYXRhIGZyb20gcGFyc2VkIGlucHV0IChyZWZlcmVuY2VzLCBmb3IgZXhhbXBsZSlcbiAqXG4gKiBTcGVjaWFsIGtsdWRnZSBmb3IgaW1hZ2UgYGFsdGAgYXR0cmlidXRlcyB0byBjb25mb3JtIENvbW1vbk1hcmsgc3BlYy5cbiAqIERvbid0IHRyeSB0byB1c2UgaXQhIFNwZWMgcmVxdWlyZXMgdG8gc2hvdyBgYWx0YCBjb250ZW50IHdpdGggc3RyaXBwZWQgbWFya3VwLFxuICogaW5zdGVhZCBvZiBzaW1wbGUgZXNjYXBpbmcuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVySW5saW5lQXNUZXh0ID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIGxldCByZXN1bHQgPSAnJ1xuXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBzd2l0Y2ggKHRva2Vuc1tpXS50eXBlKSB7XG4gICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgcmVzdWx0ICs9IHRva2Vuc1tpXS5jb250ZW50XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbnNbaV0uY2hpbGRyZW4sIG9wdGlvbnMsIGVudilcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2h0bWxfaW5saW5lJzpcbiAgICAgIGNhc2UgJ2h0bWxfYmxvY2snOlxuICAgICAgICByZXN1bHQgKz0gdG9rZW5zW2ldLmNvbnRlbnRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3NvZnRicmVhayc6XG4gICAgICBjYXNlICdoYXJkYnJlYWsnOlxuICAgICAgICByZXN1bHQgKz0gJ1xcbidcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIGFsbCBvdGhlciB0b2tlbnMgYXJlIHNraXBwZWRcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogUmVuZGVyZXIucmVuZGVyKHRva2Vucywgb3B0aW9ucywgZW52KSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb24gYmxvY2sgdG9rZW5zIHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKiAtIGVudiAoT2JqZWN0KTogYWRkaXRpb25hbCBkYXRhIGZyb20gcGFyc2VkIGlucHV0IChyZWZlcmVuY2VzLCBmb3IgZXhhbXBsZSlcbiAqXG4gKiBUYWtlcyB0b2tlbiBzdHJlYW0gYW5kIGdlbmVyYXRlcyBIVE1MLiBQcm9iYWJseSwgeW91IHdpbGwgbmV2ZXIgbmVlZCB0byBjYWxsXG4gKiB0aGlzIG1ldGhvZCBkaXJlY3RseS5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAodG9rZW5zLCBvcHRpb25zLCBlbnYpIHtcbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlc1xuXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjb25zdCB0eXBlID0gdG9rZW5zW2ldLnR5cGVcblxuICAgIGlmICh0eXBlID09PSAnaW5saW5lJykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVySW5saW5lKHRva2Vuc1tpXS5jaGlsZHJlbiwgb3B0aW9ucywgZW52KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJ1bGVzW3R5cGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ICs9IHJ1bGVzW3R5cGVdKHRva2VucywgaSwgb3B0aW9ucywgZW52LCB0aGlzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJUb2tlbih0b2tlbnMsIGksIG9wdGlvbnMsIGVudilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlbmRlcmVyXG4iLCAiLyoqXG4gKiBjbGFzcyBSdWxlclxuICpcbiAqIEhlbHBlciBjbGFzcywgdXNlZCBieSBbW01hcmtkb3duSXQjY29yZV1dLCBbW01hcmtkb3duSXQjYmxvY2tdXSBhbmRcbiAqIFtbTWFya2Rvd25JdCNpbmxpbmVdXSB0byBtYW5hZ2Ugc2VxdWVuY2VzIG9mIGZ1bmN0aW9ucyAocnVsZXMpOlxuICpcbiAqIC0ga2VlcCBydWxlcyBpbiBkZWZpbmVkIG9yZGVyXG4gKiAtIGFzc2lnbiB0aGUgbmFtZSB0byBlYWNoIHJ1bGVcbiAqIC0gZW5hYmxlL2Rpc2FibGUgcnVsZXNcbiAqIC0gYWRkL3JlcGxhY2UgcnVsZXNcbiAqIC0gYWxsb3cgYXNzaWduIHJ1bGVzIHRvIGFkZGl0aW9uYWwgbmFtZWQgY2hhaW5zIChpbiB0aGUgc2FtZSlcbiAqIC0gY2FjaGVpbmcgbGlzdHMgb2YgYWN0aXZlIHJ1bGVzXG4gKlxuICogWW91IHdpbGwgbm90IG5lZWQgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkgdW50aWwgd3JpdGUgcGx1Z2lucy4gRm9yIHNpbXBsZVxuICogcnVsZXMgY29udHJvbCB1c2UgW1tNYXJrZG93bkl0LmRpc2FibGVdXSwgW1tNYXJrZG93bkl0LmVuYWJsZV1dIGFuZFxuICogW1tNYXJrZG93bkl0LnVzZV1dLlxuICoqL1xuXG4vKipcbiAqIG5ldyBSdWxlcigpXG4gKiovXG5mdW5jdGlvbiBSdWxlciAoKSB7XG4gIC8vIExpc3Qgb2YgYWRkZWQgcnVsZXMuIEVhY2ggZWxlbWVudCBpczpcbiAgLy9cbiAgLy8ge1xuICAvLyAgIG5hbWU6IFhYWCxcbiAgLy8gICBlbmFibGVkOiBCb29sZWFuLFxuICAvLyAgIGZuOiBGdW5jdGlvbigpLFxuICAvLyAgIGFsdDogWyBuYW1lMiwgbmFtZTMgXVxuICAvLyB9XG4gIC8vXG4gIHRoaXMuX19ydWxlc19fID0gW11cblxuICAvLyBDYWNoZWQgcnVsZSBjaGFpbnMuXG4gIC8vXG4gIC8vIEZpcnN0IGxldmVsIC0gY2hhaW4gbmFtZSwgJycgZm9yIGRlZmF1bHQuXG4gIC8vIFNlY29uZCBsZXZlbCAtIGRpZ2luYWwgYW5jaG9yIGZvciBmYXN0IGZpbHRlcmluZyBieSBjaGFyY29kZXMuXG4gIC8vXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbFxufVxuXG4vLyBIZWxwZXIgbWV0aG9kcywgc2hvdWxkIG5vdCBiZSB1c2VkIGRpcmVjdGx5XG5cbi8vIEZpbmQgcnVsZSBpbmRleCBieSBuYW1lXG4vL1xuUnVsZXIucHJvdG90eXBlLl9fZmluZF9fID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9fcnVsZXNfXy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLl9fcnVsZXNfX1tpXS5uYW1lID09PSBuYW1lKSB7XG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxuLy8gQnVpbGQgcnVsZXMgbG9va3VwIGNhY2hlXG4vL1xuUnVsZXIucHJvdG90eXBlLl9fY29tcGlsZV9fID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCBzZWxmID0gdGhpc1xuICBjb25zdCBjaGFpbnMgPSBbJyddXG5cbiAgLy8gY29sbGVjdCB1bmlxdWUgbmFtZXNcbiAgc2VsZi5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgIGlmICghcnVsZS5lbmFibGVkKSB7IHJldHVybiB9XG5cbiAgICBydWxlLmFsdC5mb3JFYWNoKGZ1bmN0aW9uIChhbHROYW1lKSB7XG4gICAgICBpZiAoY2hhaW5zLmluZGV4T2YoYWx0TmFtZSkgPCAwKSB7XG4gICAgICAgIGNoYWlucy5wdXNoKGFsdE5hbWUpXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICBzZWxmLl9fY2FjaGVfXyA9IHt9XG5cbiAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgc2VsZi5fX2NhY2hlX19bY2hhaW5dID0gW11cbiAgICBzZWxmLl9fcnVsZXNfXy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICBpZiAoIXJ1bGUuZW5hYmxlZCkgeyByZXR1cm4gfVxuXG4gICAgICBpZiAoY2hhaW4gJiYgcnVsZS5hbHQuaW5kZXhPZihjaGFpbikgPCAwKSB7IHJldHVybiB9XG5cbiAgICAgIHNlbGYuX19jYWNoZV9fW2NoYWluXS5wdXNoKHJ1bGUuZm4pXG4gICAgfSlcbiAgfSlcbn1cblxuLyoqXG4gKiBSdWxlci5hdChuYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gbmFtZSAoU3RyaW5nKTogcnVsZSBuYW1lIHRvIHJlcGxhY2UuXG4gKiAtIGZuIChGdW5jdGlvbik6IG5ldyBydWxlIGZ1bmN0aW9uLlxuICogLSBvcHRpb25zIChPYmplY3QpOiBuZXcgcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBSZXBsYWNlIHJ1bGUgYnkgbmFtZSB3aXRoIG5ldyBmdW5jdGlvbiAmIG9wdGlvbnMuIFRocm93cyBlcnJvciBpZiBuYW1lIG5vdFxuICogZm91bmQuXG4gKlxuICogIyMjIyMgT3B0aW9uczpcbiAqXG4gKiAtIF9fYWx0X18gLSBhcnJheSB3aXRoIG5hbWVzIG9mIFwiYWx0ZXJuYXRlXCIgY2hhaW5zLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBSZXBsYWNlIGV4aXN0aW5nIHR5cG9ncmFwaGVyIHJlcGxhY2VtZW50IHJ1bGUgd2l0aCBuZXcgb25lOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5jb3JlLnJ1bGVyLmF0KCdyZXBsYWNlbWVudHMnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKG5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIGNvbnN0IGluZGV4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKVxuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIG5hbWUpIH1cblxuICB0aGlzLl9fcnVsZXNfX1tpbmRleF0uZm4gPSBmblxuICB0aGlzLl9fcnVsZXNfX1tpbmRleF0uYWx0ID0gb3B0LmFsdCB8fCBbXVxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbn1cblxuLyoqXG4gKiBSdWxlci5iZWZvcmUoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBiZWZvcmVOYW1lIChTdHJpbmcpOiBuZXcgcnVsZSB3aWxsIGJlIGFkZGVkIGJlZm9yZSB0aGlzIG9uZS5cbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgdG8gY2hhaW4gYmVmb3JlIG9uZSB3aXRoIGdpdmVuIG5hbWUuIFNlZSBhbHNvXG4gKiBbW1J1bGVyLmFmdGVyXV0sIFtbUnVsZXIucHVzaF1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmJsb2NrLnJ1bGVyLmJlZm9yZSgncGFyYWdyYXBoJywgJ215X3J1bGUnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLmJlZm9yZSA9IGZ1bmN0aW9uIChiZWZvcmVOYW1lLCBydWxlTmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgY29uc3QgaW5kZXggPSB0aGlzLl9fZmluZF9fKGJlZm9yZU5hbWUpXG4gIGNvbnN0IG9wdCA9IG9wdGlvbnMgfHwge31cblxuICBpZiAoaW5kZXggPT09IC0xKSB7IHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgYmVmb3JlTmFtZSkgfVxuXG4gIHRoaXMuX19ydWxlc19fLnNwbGljZShpbmRleCwgMCwge1xuICAgIG5hbWU6IHJ1bGVOYW1lLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pXG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsXG59XG5cbi8qKlxuICogUnVsZXIuYWZ0ZXIoYWZ0ZXJOYW1lLCBydWxlTmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIGFmdGVyTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGlzIG9uZS5cbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgdG8gY2hhaW4gYWZ0ZXIgb25lIHdpdGggZ2l2ZW4gbmFtZS4gU2VlIGFsc29cbiAqIFtbUnVsZXIuYmVmb3JlXV0sIFtbUnVsZXIucHVzaF1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmlubGluZS5ydWxlci5hZnRlcigndGV4dCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5hZnRlciA9IGZ1bmN0aW9uIChhZnRlck5hbWUsIHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICBjb25zdCBpbmRleCA9IHRoaXMuX19maW5kX18oYWZ0ZXJOYW1lKVxuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIGFmdGVyTmFtZSkgfVxuXG4gIHRoaXMuX19ydWxlc19fLnNwbGljZShpbmRleCArIDEsIDAsIHtcbiAgICBuYW1lOiBydWxlTmFtZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KVxuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbFxufVxuXG4vKipcbiAqIFJ1bGVyLnB1c2gocnVsZU5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBydWxlTmFtZSAoU3RyaW5nKTogbmFtZSBvZiBhZGRlZCBydWxlLlxuICogLSBmbiAoRnVuY3Rpb24pOiBydWxlIGZ1bmN0aW9uLlxuICogLSBvcHRpb25zIChPYmplY3QpOiBydWxlIG9wdGlvbnMgKG5vdCBtYW5kYXRvcnkpLlxuICpcbiAqIFB1c2ggbmV3IHJ1bGUgdG8gdGhlIGVuZCBvZiBjaGFpbi4gU2VlIGFsc29cbiAqIFtbUnVsZXIuYmVmb3JlXV0sIFtbUnVsZXIuYWZ0ZXJdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5jb3JlLnJ1bGVyLnB1c2goJ215X3J1bGUnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAocnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIGNvbnN0IG9wdCA9IG9wdGlvbnMgfHwge31cblxuICB0aGlzLl9fcnVsZXNfXy5wdXNoKHtcbiAgICBuYW1lOiBydWxlTmFtZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KVxuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbFxufVxuXG4vKipcbiAqIFJ1bGVyLmVuYWJsZShsaXN0IFssIGlnbm9yZUludmFsaWRdKSAtPiBBcnJheVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZW5hYmxlLlxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIGFueSBydWxlIG5hbWUgbm90IGZvdW5kIC0gdGhyb3cgRXJyb3IuXG4gKiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBSZXR1cm5zIGxpc3Qgb2YgZm91bmQgcnVsZSBuYW1lcyAoaWYgbm8gZXhjZXB0aW9uIGhhcHBlbmVkKS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmRpc2FibGVdXSwgW1tSdWxlci5lbmFibGVPbmx5XV0uXG4gKiovXG5SdWxlci5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbbGlzdF0gfVxuXG4gIGNvbnN0IHJlc3VsdCA9IFtdXG5cbiAgLy8gU2VhcmNoIGJ5IG5hbWUgYW5kIGVuYWJsZVxuICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9fZmluZF9fKG5hbWUpXG5cbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgaWYgKGlnbm9yZUludmFsaWQpIHsgcmV0dXJuIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVsZXMgbWFuYWdlcjogaW52YWxpZCBydWxlIG5hbWUgJyArIG5hbWUpXG4gICAgfVxuICAgIHRoaXMuX19ydWxlc19fW2lkeF0uZW5hYmxlZCA9IHRydWVcbiAgICByZXN1bHQucHVzaChuYW1lKVxuICB9LCB0aGlzKVxuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbFxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogUnVsZXIuZW5hYmxlT25seShsaXN0IFssIGlnbm9yZUludmFsaWRdKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZW5hYmxlICh3aGl0ZWxpc3QpLlxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMsIGFuZCBkaXNhYmxlIGV2ZXJ5dGhpbmcgZWxzZS4gSWYgYW55IHJ1bGUgbmFtZVxuICogbm90IGZvdW5kIC0gdGhyb3cgRXJyb3IuIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZGlzYWJsZV1dLCBbW1J1bGVyLmVuYWJsZV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmVuYWJsZU9ubHkgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFtsaXN0XSB9XG5cbiAgdGhpcy5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkgeyBydWxlLmVuYWJsZWQgPSBmYWxzZSB9KVxuXG4gIHRoaXMuZW5hYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG59XG5cbi8qKlxuICogUnVsZXIuZGlzYWJsZShsaXN0IFssIGlnbm9yZUludmFsaWRdKSAtPiBBcnJheVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIERpc2FibGUgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgYW55IHJ1bGUgbmFtZSBub3QgZm91bmQgLSB0aHJvdyBFcnJvci5cbiAqIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFJldHVybnMgbGlzdCBvZiBmb3VuZCBydWxlIG5hbWVzIChpZiBubyBleGNlcHRpb24gaGFwcGVuZWQpLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZW5hYmxlXV0sIFtbUnVsZXIuZW5hYmxlT25seV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFtsaXN0XSB9XG5cbiAgY29uc3QgcmVzdWx0ID0gW11cblxuICAvLyBTZWFyY2ggYnkgbmFtZSBhbmQgZGlzYWJsZVxuICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLl9fZmluZF9fKG5hbWUpXG5cbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgaWYgKGlnbm9yZUludmFsaWQpIHsgcmV0dXJuIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVsZXMgbWFuYWdlcjogaW52YWxpZCBydWxlIG5hbWUgJyArIG5hbWUpXG4gICAgfVxuICAgIHRoaXMuX19ydWxlc19fW2lkeF0uZW5hYmxlZCA9IGZhbHNlXG4gICAgcmVzdWx0LnB1c2gobmFtZSlcbiAgfSwgdGhpcylcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGxcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFJ1bGVyLmdldFJ1bGVzKGNoYWluTmFtZSkgLT4gQXJyYXlcbiAqXG4gKiBSZXR1cm4gYXJyYXkgb2YgYWN0aXZlIGZ1bmN0aW9ucyAocnVsZXMpIGZvciBnaXZlbiBjaGFpbiBuYW1lLiBJdCBhbmFseXplc1xuICogcnVsZXMgY29uZmlndXJhdGlvbiwgY29tcGlsZXMgY2FjaGVzIGlmIG5vdCBleGlzdHMgYW5kIHJldHVybnMgcmVzdWx0LlxuICpcbiAqIERlZmF1bHQgY2hhaW4gbmFtZSBpcyBgJydgIChlbXB0eSBzdHJpbmcpLiBJdCBjYW4ndCBiZSBza2lwcGVkLiBUaGF0J3NcbiAqIGRvbmUgaW50ZW50aW9uYWxseSwgdG8ga2VlcCBzaWduYXR1cmUgbW9ub21vcnBoaWMgZm9yIGhpZ2ggc3BlZWQuXG4gKiovXG5SdWxlci5wcm90b3R5cGUuZ2V0UnVsZXMgPSBmdW5jdGlvbiAoY2hhaW5OYW1lKSB7XG4gIGlmICh0aGlzLl9fY2FjaGVfXyA9PT0gbnVsbCkge1xuICAgIHRoaXMuX19jb21waWxlX18oKVxuICB9XG5cbiAgLy8gQ2hhaW4gY2FuIGJlIGVtcHR5LCBpZiBydWxlcyBkaXNhYmxlZC4gQnV0IHdlIHN0aWxsIGhhdmUgdG8gcmV0dXJuIEFycmF5LlxuICByZXR1cm4gdGhpcy5fX2NhY2hlX19bY2hhaW5OYW1lXSB8fCBbXVxufVxuXG5leHBvcnQgZGVmYXVsdCBSdWxlclxuIiwgIi8vIFRva2VuIGNsYXNzXG5cbi8qKlxuICogY2xhc3MgVG9rZW5cbiAqKi9cblxuLyoqXG4gKiBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKVxuICpcbiAqIENyZWF0ZSBuZXcgdG9rZW4gYW5kIGZpbGwgcGFzc2VkIHByb3BlcnRpZXMuXG4gKiovXG5mdW5jdGlvbiBUb2tlbiAodHlwZSwgdGFnLCBuZXN0aW5nKSB7XG4gIC8qKlxuICAgKiBUb2tlbiN0eXBlIC0+IFN0cmluZ1xuICAgKlxuICAgKiBUeXBlIG9mIHRoZSB0b2tlbiAoc3RyaW5nLCBlLmcuIFwicGFyYWdyYXBoX29wZW5cIilcbiAgICoqL1xuICB0aGlzLnR5cGUgPSB0eXBlXG5cbiAgLyoqXG4gICAqIFRva2VuI3RhZyAtPiBTdHJpbmdcbiAgICpcbiAgICogaHRtbCB0YWcgbmFtZSwgZS5nLiBcInBcIlxuICAgKiovXG4gIHRoaXMudGFnID0gdGFnXG5cbiAgLyoqXG4gICAqIFRva2VuI2F0dHJzIC0+IEFycmF5XG4gICAqXG4gICAqIEh0bWwgYXR0cmlidXRlcy4gRm9ybWF0OiBgWyBbIG5hbWUxLCB2YWx1ZTEgXSwgWyBuYW1lMiwgdmFsdWUyIF0gXWBcbiAgICoqL1xuICB0aGlzLmF0dHJzID0gbnVsbFxuXG4gIC8qKlxuICAgKiBUb2tlbiNtYXAgLT4gQXJyYXlcbiAgICpcbiAgICogU291cmNlIG1hcCBpbmZvLiBGb3JtYXQ6IGBbIGxpbmVfYmVnaW4sIGxpbmVfZW5kIF1gXG4gICAqKi9cbiAgdGhpcy5tYXAgPSBudWxsXG5cbiAgLyoqXG4gICAqIFRva2VuI25lc3RpbmcgLT4gTnVtYmVyXG4gICAqXG4gICAqIExldmVsIGNoYW5nZSAobnVtYmVyIGluIHstMSwgMCwgMX0gc2V0KSwgd2hlcmU6XG4gICAqXG4gICAqIC0gIGAxYCBtZWFucyB0aGUgdGFnIGlzIG9wZW5pbmdcbiAgICogLSAgYDBgIG1lYW5zIHRoZSB0YWcgaXMgc2VsZi1jbG9zaW5nXG4gICAqIC0gYC0xYCBtZWFucyB0aGUgdGFnIGlzIGNsb3NpbmdcbiAgICoqL1xuICB0aGlzLm5lc3RpbmcgPSBuZXN0aW5nXG5cbiAgLyoqXG4gICAqIFRva2VuI2xldmVsIC0+IE51bWJlclxuICAgKlxuICAgKiBuZXN0aW5nIGxldmVsLCB0aGUgc2FtZSBhcyBgc3RhdGUubGV2ZWxgXG4gICAqKi9cbiAgdGhpcy5sZXZlbCA9IDBcblxuICAvKipcbiAgICogVG9rZW4jY2hpbGRyZW4gLT4gQXJyYXlcbiAgICpcbiAgICogQW4gYXJyYXkgb2YgY2hpbGQgbm9kZXMgKGlubGluZSBhbmQgaW1nIHRva2VucylcbiAgICoqL1xuICB0aGlzLmNoaWxkcmVuID0gbnVsbFxuXG4gIC8qKlxuICAgKiBUb2tlbiNjb250ZW50IC0+IFN0cmluZ1xuICAgKlxuICAgKiBJbiBhIGNhc2Ugb2Ygc2VsZi1jbG9zaW5nIHRhZyAoY29kZSwgaHRtbCwgZmVuY2UsIGV0Yy4pLFxuICAgKiBpdCBoYXMgY29udGVudHMgb2YgdGhpcyB0YWcuXG4gICAqKi9cbiAgdGhpcy5jb250ZW50ID0gJydcblxuICAvKipcbiAgICogVG9rZW4jbWFya3VwIC0+IFN0cmluZ1xuICAgKlxuICAgKiAnKicgb3IgJ18nIGZvciBlbXBoYXNpcywgZmVuY2Ugc3RyaW5nIGZvciBmZW5jZSwgZXRjLlxuICAgKiovXG4gIHRoaXMubWFya3VwID0gJydcblxuICAvKipcbiAgICogVG9rZW4jaW5mbyAtPiBTdHJpbmdcbiAgICpcbiAgICogQWRkaXRpb25hbCBpbmZvcm1hdGlvbjpcbiAgICpcbiAgICogLSBJbmZvIHN0cmluZyBmb3IgXCJmZW5jZVwiIHRva2Vuc1xuICAgKiAtIFRoZSB2YWx1ZSBcImF1dG9cIiBmb3IgYXV0b2xpbmsgXCJsaW5rX29wZW5cIiBhbmQgXCJsaW5rX2Nsb3NlXCIgdG9rZW5zXG4gICAqIC0gVGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgaXRlbSBtYXJrZXIgZm9yIG9yZGVyZWQtbGlzdCBcImxpc3RfaXRlbV9vcGVuXCIgdG9rZW5zXG4gICAqKi9cbiAgdGhpcy5pbmZvID0gJydcblxuICAvKipcbiAgICogVG9rZW4jbWV0YSAtPiBPYmplY3RcbiAgICpcbiAgICogQSBwbGFjZSBmb3IgcGx1Z2lucyB0byBzdG9yZSBhbiBhcmJpdHJhcnkgZGF0YVxuICAgKiovXG4gIHRoaXMubWV0YSA9IG51bGxcblxuICAvKipcbiAgICogVG9rZW4jYmxvY2sgLT4gQm9vbGVhblxuICAgKlxuICAgKiBUcnVlIGZvciBibG9jay1sZXZlbCB0b2tlbnMsIGZhbHNlIGZvciBpbmxpbmUgdG9rZW5zLlxuICAgKiBVc2VkIGluIHJlbmRlcmVyIHRvIGNhbGN1bGF0ZSBsaW5lIGJyZWFrc1xuICAgKiovXG4gIHRoaXMuYmxvY2sgPSBmYWxzZVxuXG4gIC8qKlxuICAgKiBUb2tlbiNoaWRkZW4gLT4gQm9vbGVhblxuICAgKlxuICAgKiBJZiBpdCdzIHRydWUsIGlnbm9yZSB0aGlzIGVsZW1lbnQgd2hlbiByZW5kZXJpbmcuIFVzZWQgZm9yIHRpZ2h0IGxpc3RzXG4gICAqIHRvIGhpZGUgcGFyYWdyYXBocy5cbiAgICoqL1xuICB0aGlzLmhpZGRlbiA9IGZhbHNlXG59XG5cbi8qKlxuICogVG9rZW4uYXR0ckluZGV4KG5hbWUpIC0+IE51bWJlclxuICpcbiAqIFNlYXJjaCBhdHRyaWJ1dGUgaW5kZXggYnkgbmFtZS5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRySW5kZXggPSBmdW5jdGlvbiBhdHRySW5kZXggKG5hbWUpIHtcbiAgaWYgKCF0aGlzLmF0dHJzKSB7IHJldHVybiAtMSB9XG5cbiAgY29uc3QgYXR0cnMgPSB0aGlzLmF0dHJzXG5cbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGF0dHJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGF0dHJzW2ldWzBdID09PSBuYW1lKSB7IHJldHVybiBpIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxuLyoqXG4gKiBUb2tlbi5hdHRyUHVzaChhdHRyRGF0YSlcbiAqXG4gKiBBZGQgYFsgbmFtZSwgdmFsdWUgXWAgYXR0cmlidXRlIHRvIGxpc3QuIEluaXQgYXR0cnMgaWYgbmVjZXNzYXJ5XG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0clB1c2ggPSBmdW5jdGlvbiBhdHRyUHVzaCAoYXR0ckRhdGEpIHtcbiAgaWYgKHRoaXMuYXR0cnMpIHtcbiAgICB0aGlzLmF0dHJzLnB1c2goYXR0ckRhdGEpXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hdHRycyA9IFthdHRyRGF0YV1cbiAgfVxufVxuXG4vKipcbiAqIFRva2VuLmF0dHJTZXQobmFtZSwgdmFsdWUpXG4gKlxuICogU2V0IGBuYW1lYCBhdHRyaWJ1dGUgdG8gYHZhbHVlYC4gT3ZlcnJpZGUgb2xkIHZhbHVlIGlmIGV4aXN0cy5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRyU2V0ID0gZnVuY3Rpb24gYXR0clNldCAobmFtZSwgdmFsdWUpIHtcbiAgY29uc3QgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSlcbiAgY29uc3QgYXR0ckRhdGEgPSBbbmFtZSwgdmFsdWVdXG5cbiAgaWYgKGlkeCA8IDApIHtcbiAgICB0aGlzLmF0dHJQdXNoKGF0dHJEYXRhKVxuICB9IGVsc2Uge1xuICAgIHRoaXMuYXR0cnNbaWR4XSA9IGF0dHJEYXRhXG4gIH1cbn1cblxuLyoqXG4gKiBUb2tlbi5hdHRyR2V0KG5hbWUpXG4gKlxuICogR2V0IHRoZSB2YWx1ZSBvZiBhdHRyaWJ1dGUgYG5hbWVgLCBvciBudWxsIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJHZXQgPSBmdW5jdGlvbiBhdHRyR2V0IChuYW1lKSB7XG4gIGNvbnN0IGlkeCA9IHRoaXMuYXR0ckluZGV4KG5hbWUpXG4gIGxldCB2YWx1ZSA9IG51bGxcbiAgaWYgKGlkeCA+PSAwKSB7XG4gICAgdmFsdWUgPSB0aGlzLmF0dHJzW2lkeF1bMV1cbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBUb2tlbi5hdHRySm9pbihuYW1lLCB2YWx1ZSlcbiAqXG4gKiBKb2luIHZhbHVlIHRvIGV4aXN0aW5nIGF0dHJpYnV0ZSB2aWEgc3BhY2UuIE9yIGNyZWF0ZSBuZXcgYXR0cmlidXRlIGlmIG5vdFxuICogZXhpc3RzLiBVc2VmdWwgdG8gb3BlcmF0ZSB3aXRoIHRva2VuIGNsYXNzZXMuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0ckpvaW4gPSBmdW5jdGlvbiBhdHRySm9pbiAobmFtZSwgdmFsdWUpIHtcbiAgY29uc3QgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSlcblxuICBpZiAoaWR4IDwgMCkge1xuICAgIHRoaXMuYXR0clB1c2goW25hbWUsIHZhbHVlXSlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF1bMV0gPSB0aGlzLmF0dHJzW2lkeF1bMV0gKyAnICcgKyB2YWx1ZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRva2VuXG4iLCAiLy8gQ29yZSBzdGF0ZSBvYmplY3Rcbi8vXG5cbmltcG9ydCBUb2tlbiBmcm9tICcuLi90b2tlbi5tanMnXG5cbmZ1bmN0aW9uIFN0YXRlQ29yZSAoc3JjLCBtZCwgZW52KSB7XG4gIHRoaXMuc3JjID0gc3JjXG4gIHRoaXMuZW52ID0gZW52XG4gIHRoaXMudG9rZW5zID0gW11cbiAgdGhpcy5pbmxpbmVNb2RlID0gZmFsc2VcbiAgdGhpcy5tZCA9IG1kIC8vIGxpbmsgdG8gcGFyc2VyIGluc3RhbmNlXG59XG5cbi8vIHJlLWV4cG9ydCBUb2tlbiBjbGFzcyB0byB1c2UgaW4gY29yZSBydWxlc1xuU3RhdGVDb3JlLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuXG5cbmV4cG9ydCBkZWZhdWx0IFN0YXRlQ29yZVxuIiwgIi8vIE5vcm1hbGl6ZSBpbnB1dCBzdHJpbmdcblxuLy8gaHR0cHM6Ly9zcGVjLmNvbW1vbm1hcmsub3JnLzAuMjkvI2xpbmUtZW5kaW5nXG5jb25zdCBORVdMSU5FU19SRSA9IC9cXHJcXG4/fFxcbi9nXG5jb25zdCBOVUxMX1JFID0gL1xcMC9nXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG5vcm1hbGl6ZSAoc3RhdGUpIHtcbiAgbGV0IHN0clxuXG4gIC8vIE5vcm1hbGl6ZSBuZXdsaW5lc1xuICBzdHIgPSBzdGF0ZS5zcmMucmVwbGFjZShORVdMSU5FU19SRSwgJ1xcbicpXG5cbiAgLy8gUmVwbGFjZSBOVUxMIGNoYXJhY3RlcnNcbiAgc3RyID0gc3RyLnJlcGxhY2UoTlVMTF9SRSwgJ1xcdUZGRkQnKVxuXG4gIHN0YXRlLnNyYyA9IHN0clxufVxuIiwgImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJsb2NrIChzdGF0ZSkge1xuICBsZXQgdG9rZW5cblxuICBpZiAoc3RhdGUuaW5saW5lTW9kZSkge1xuICAgIHRva2VuID0gbmV3IHN0YXRlLlRva2VuKCdpbmxpbmUnLCAnJywgMClcbiAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUuc3JjXG4gICAgdG9rZW4ubWFwID0gWzAsIDFdXG4gICAgdG9rZW4uY2hpbGRyZW4gPSBbXVxuICAgIHN0YXRlLnRva2Vucy5wdXNoKHRva2VuKVxuICB9IGVsc2Uge1xuICAgIHN0YXRlLm1kLmJsb2NrLnBhcnNlKHN0YXRlLnNyYywgc3RhdGUubWQsIHN0YXRlLmVudiwgc3RhdGUudG9rZW5zKVxuICB9XG59XG4iLCAiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5saW5lIChzdGF0ZSkge1xuICBjb25zdCB0b2tlbnMgPSBzdGF0ZS50b2tlbnNcblxuICAvLyBQYXJzZSBpbmxpbmVzXG4gIGZvciAobGV0IGkgPSAwLCBsID0gdG9rZW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IHRvayA9IHRva2Vuc1tpXVxuICAgIGlmICh0b2sudHlwZSA9PT0gJ2lubGluZScpIHtcbiAgICAgIHN0YXRlLm1kLmlubGluZS5wYXJzZSh0b2suY29udGVudCwgc3RhdGUubWQsIHN0YXRlLmVudiwgdG9rLmNoaWxkcmVuKVxuICAgIH1cbiAgfVxufVxuIiwgIi8vIFJlcGxhY2UgbGluay1saWtlIHRleHRzIHdpdGggbGluayBub2Rlcy5cbi8vXG4vLyBDdXJyZW50bHkgcmVzdHJpY3RlZCBieSBgbWQudmFsaWRhdGVMaW5rKClgIHRvIGh0dHAvaHR0cHMvZnRwXG4vL1xuXG5pbXBvcnQgeyBhcnJheVJlcGxhY2VBdCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmZ1bmN0aW9uIGlzTGlua09wZW4gKHN0cikge1xuICByZXR1cm4gL148YVs+XFxzXS9pLnRlc3Qoc3RyKVxufVxuZnVuY3Rpb24gaXNMaW5rQ2xvc2UgKHN0cikge1xuICByZXR1cm4gL148XFwvYVxccyo+L2kudGVzdChzdHIpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxpbmtpZnkgKHN0YXRlKSB7XG4gIGNvbnN0IGJsb2NrVG9rZW5zID0gc3RhdGUudG9rZW5zXG5cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLmxpbmtpZnkpIHsgcmV0dXJuIH1cblxuICBmb3IgKGxldCBqID0gMCwgbCA9IGJsb2NrVG9rZW5zLmxlbmd0aDsgaiA8IGw7IGorKykge1xuICAgIGlmIChibG9ja1Rva2Vuc1tqXS50eXBlICE9PSAnaW5saW5lJyB8fFxuICAgICAgICAhc3RhdGUubWQubGlua2lmeS5wcmV0ZXN0KGJsb2NrVG9rZW5zW2pdLmNvbnRlbnQpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGxldCB0b2tlbnMgPSBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlblxuXG4gICAgbGV0IGh0bWxMaW5rTGV2ZWwgPSAwXG5cbiAgICAvLyBXZSBzY2FuIGZyb20gdGhlIGVuZCwgdG8ga2VlcCBwb3NpdGlvbiB3aGVuIG5ldyB0YWdzIGFkZGVkLlxuICAgIC8vIFVzZSByZXZlcnNlZCBsb2dpYyBpbiBsaW5rcyBzdGFydC9lbmQgbWF0Y2hcbiAgICBmb3IgKGxldCBpID0gdG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBjdXJyZW50VG9rZW4gPSB0b2tlbnNbaV1cblxuICAgICAgLy8gU2tpcCBjb250ZW50IG9mIG1hcmtkb3duIGxpbmtzXG4gICAgICBpZiAoY3VycmVudFRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJykge1xuICAgICAgICBpLS1cbiAgICAgICAgd2hpbGUgKHRva2Vuc1tpXS5sZXZlbCAhPT0gY3VycmVudFRva2VuLmxldmVsICYmIHRva2Vuc1tpXS50eXBlICE9PSAnbGlua19vcGVuJykge1xuICAgICAgICAgIGktLVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgY29udGVudCBvZiBodG1sIHRhZyBsaW5rc1xuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAnaHRtbF9pbmxpbmUnKSB7XG4gICAgICAgIGlmIChpc0xpbmtPcGVuKGN1cnJlbnRUb2tlbi5jb250ZW50KSAmJiBodG1sTGlua0xldmVsID4gMCkge1xuICAgICAgICAgIGh0bWxMaW5rTGV2ZWwtLVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc0xpbmtDbG9zZShjdXJyZW50VG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgICBodG1sTGlua0xldmVsKytcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGh0bWxMaW5rTGV2ZWwgPiAwKSB7IGNvbnRpbnVlIH1cblxuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAndGV4dCcgJiYgc3RhdGUubWQubGlua2lmeS50ZXN0KGN1cnJlbnRUb2tlbi5jb250ZW50KSkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gY3VycmVudFRva2VuLmNvbnRlbnRcbiAgICAgICAgbGV0IGxpbmtzID0gc3RhdGUubWQubGlua2lmeS5tYXRjaCh0ZXh0KVxuXG4gICAgICAgIC8vIE5vdyBzcGxpdCBzdHJpbmcgdG8gbm9kZXNcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBbXVxuICAgICAgICBsZXQgbGV2ZWwgPSBjdXJyZW50VG9rZW4ubGV2ZWxcbiAgICAgICAgbGV0IGxhc3RQb3MgPSAwXG5cbiAgICAgICAgLy8gZm9yYmlkIGVzY2FwZSBzZXF1ZW5jZSBhdCB0aGUgc3RhcnQgb2YgdGhlIHN0cmluZyxcbiAgICAgICAgLy8gdGhpcyBhdm9pZHMgaHR0cFxcOi8vZXhhbXBsZS5jb20vIGZyb20gYmVpbmcgbGlua2lmaWVkIGFzXG4gICAgICAgIC8vIGh0dHA6PGEgaHJlZj1cIi8vZXhhbXBsZS5jb20vXCI+Ly9leGFtcGxlLmNvbS88L2E+XG4gICAgICAgIGlmIChsaW5rcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICBsaW5rc1swXS5pbmRleCA9PT0gMCAmJlxuICAgICAgICAgICAgaSA+IDAgJiZcbiAgICAgICAgICAgIHRva2Vuc1tpIC0gMV0udHlwZSA9PT0gJ3RleHRfc3BlY2lhbCcpIHtcbiAgICAgICAgICBsaW5rcyA9IGxpbmtzLnNsaWNlKDEpXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBsbiA9IDA7IGxuIDwgbGlua3MubGVuZ3RoOyBsbisrKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gbGlua3NbbG5dLnVybFxuICAgICAgICAgIGNvbnN0IGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHVybClcbiAgICAgICAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgeyBjb250aW51ZSB9XG5cbiAgICAgICAgICBsZXQgdXJsVGV4dCA9IGxpbmtzW2xuXS50ZXh0XG5cbiAgICAgICAgICAvLyBMaW5raWZpZXIgbWlnaHQgc2VuZCByYXcgaG9zdG5hbWVzIGxpa2UgXCJleGFtcGxlLmNvbVwiLCB3aGVyZSB1cmxcbiAgICAgICAgICAvLyBzdGFydHMgd2l0aCBkb21haW4gbmFtZS4gU28gd2UgcHJlcGVuZCBodHRwOi8vIGluIHRob3NlIGNhc2VzLFxuICAgICAgICAgIC8vIGFuZCByZW1vdmUgaXQgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAvL1xuICAgICAgICAgIGlmICghbGlua3NbbG5dLnNjaGVtYSkge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KCdodHRwOi8vJyArIHVybFRleHQpLnJlcGxhY2UoL15odHRwOlxcL1xcLy8sICcnKVxuICAgICAgICAgIH0gZWxzZSBpZiAobGlua3NbbG5dLnNjaGVtYSA9PT0gJ21haWx0bzonICYmICEvXm1haWx0bzovaS50ZXN0KHVybFRleHQpKSB7XG4gICAgICAgICAgICB1cmxUZXh0ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQoJ21haWx0bzonICsgdXJsVGV4dCkucmVwbGFjZSgvXm1haWx0bzovLCAnJylcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KHVybFRleHQpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcG9zID0gbGlua3NbbG5dLmluZGV4XG5cbiAgICAgICAgICBpZiAocG9zID4gbGFzdFBvcykge1xuICAgICAgICAgICAgY29uc3QgdG9rZW4gPSBuZXcgc3RhdGUuVG9rZW4oJ3RleHQnLCAnJywgMClcbiAgICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSB0ZXh0LnNsaWNlKGxhc3RQb3MsIHBvcylcbiAgICAgICAgICAgIHRva2VuLmxldmVsID0gbGV2ZWxcbiAgICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdG9rZW5fbyA9IG5ldyBzdGF0ZS5Ub2tlbignbGlua19vcGVuJywgJ2EnLCAxKVxuICAgICAgICAgIHRva2VuX28uYXR0cnMgPSBbWydocmVmJywgZnVsbFVybF1dXG4gICAgICAgICAgdG9rZW5fby5sZXZlbCA9IGxldmVsKytcbiAgICAgICAgICB0b2tlbl9vLm1hcmt1cCA9ICdsaW5raWZ5J1xuICAgICAgICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJ1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW5fbylcblxuICAgICAgICAgIGNvbnN0IHRva2VuX3QgPSBuZXcgc3RhdGUuVG9rZW4oJ3RleHQnLCAnJywgMClcbiAgICAgICAgICB0b2tlbl90LmNvbnRlbnQgPSB1cmxUZXh0XG4gICAgICAgICAgdG9rZW5fdC5sZXZlbCA9IGxldmVsXG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbl90KVxuXG4gICAgICAgICAgY29uc3QgdG9rZW5fYyA9IG5ldyBzdGF0ZS5Ub2tlbignbGlua19jbG9zZScsICdhJywgLTEpXG4gICAgICAgICAgdG9rZW5fYy5sZXZlbCA9IC0tbGV2ZWxcbiAgICAgICAgICB0b2tlbl9jLm1hcmt1cCA9ICdsaW5raWZ5J1xuICAgICAgICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJ1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW5fYylcblxuICAgICAgICAgIGxhc3RQb3MgPSBsaW5rc1tsbl0ubGFzdEluZGV4XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3RQb3MgPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IHRva2VuID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApXG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IHRleHQuc2xpY2UobGFzdFBvcylcbiAgICAgICAgICB0b2tlbi5sZXZlbCA9IGxldmVsXG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbilcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlcGxhY2UgY3VycmVudCBub2RlXG4gICAgICAgIGJsb2NrVG9rZW5zW2pdLmNoaWxkcmVuID0gdG9rZW5zID0gYXJyYXlSZXBsYWNlQXQodG9rZW5zLCBpLCBub2RlcylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsICIvLyBTaW1wbGUgdHlwb2dyYXBoaWMgcmVwbGFjZW1lbnRzXG4vL1xuLy8gKGMpIChDKSDihpIgwqlcbi8vICh0bSkgKFRNKSDihpIg4oSiXG4vLyAocikgKFIpIOKGkiDCrlxuLy8gKy0g4oaSIMKxXG4vLyAuLi4g4oaSIOKApiAoYWxzbyA/Li4uLiDihpIgPy4uLCAhLi4uLiDihpIgIS4uKVxuLy8gPz8/Pz8/Pz8g4oaSID8/PywgISEhISEg4oaSICEhISwgYCwsYCDihpIgYCxgXG4vLyAtLSDihpIgJm5kYXNoOywgLS0tIOKGkiAmbWRhc2g7XG4vL1xuXG4vLyBUT0RPOlxuLy8gLSBmcmFjdGlvbmFscyAxLzIsIDEvNCwgMy80IC0+IMK9LCDCvCwgwr5cbi8vIC0gbXVsdGlwbGljYXRpb25zIDIgeCA0IC0+IDIgw5cgNFxuXG5jb25zdCBSQVJFX1JFID0gL1xcKy18XFwuXFwufFxcP1xcP1xcP1xcP3whISEhfCwsfC0tL1xuXG4vLyBXb3JrYXJvdW5kIGZvciBwaGFudG9tanMgLSBuZWVkIHJlZ2V4IHdpdGhvdXQgL2cgZmxhZyxcbi8vIG9yIHJvb3QgY2hlY2sgd2lsbCBmYWlsIGV2ZXJ5IHNlY29uZCB0aW1lXG5jb25zdCBTQ09QRURfQUJCUl9URVNUX1JFID0gL1xcKChjfHRtfHIpXFwpL2lcblxuY29uc3QgU0NPUEVEX0FCQlJfUkUgPSAvXFwoKGN8dG18cilcXCkvaWdcbmNvbnN0IFNDT1BFRF9BQkJSID0ge1xuICBjOiAnwqknLFxuICByOiAnwq4nLFxuICB0bTogJ+KEoidcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUZuIChtYXRjaCwgbmFtZSkge1xuICByZXR1cm4gU0NPUEVEX0FCQlJbbmFtZS50b0xvd2VyQ2FzZSgpXVxufVxuXG5mdW5jdGlvbiByZXBsYWNlX3Njb3BlZCAoaW5saW5lVG9rZW5zKSB7XG4gIGxldCBpbnNpZGVfYXV0b2xpbmsgPSAwXG5cbiAgZm9yIChsZXQgaSA9IGlubGluZVRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHRva2VuID0gaW5saW5lVG9rZW5zW2ldXG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ3RleHQnICYmICFpbnNpZGVfYXV0b2xpbmspIHtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSB0b2tlbi5jb250ZW50LnJlcGxhY2UoU0NPUEVEX0FCQlJfUkUsIHJlcGxhY2VGbilcbiAgICB9XG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2xpbmtfb3BlbicgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmstLVxuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19jbG9zZScgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmsrK1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZXBsYWNlX3JhcmUgKGlubGluZVRva2Vucykge1xuICBsZXQgaW5zaWRlX2F1dG9saW5rID0gMFxuXG4gIGZvciAobGV0IGkgPSBpbmxpbmVUb2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBjb25zdCB0b2tlbiA9IGlubGluZVRva2Vuc1tpXVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiAhaW5zaWRlX2F1dG9saW5rKSB7XG4gICAgICBpZiAoUkFSRV9SRS50ZXN0KHRva2VuLmNvbnRlbnQpKSB7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSB0b2tlbi5jb250ZW50XG4gICAgICAgICAgLnJlcGxhY2UoL1xcKy0vZywgJ8KxJylcbiAgICAgICAgICAvLyAuLiwgLi4uLCAuLi4uLi4uIC0+IOKAplxuICAgICAgICAgIC8vIGJ1dCA/Li4uLi4gJiAhLi4uLi4gLT4gPy4uICYgIS4uXG4gICAgICAgICAgLnJlcGxhY2UoL1xcLnsyLH0vZywgJ+KApicpLnJlcGxhY2UoLyhbPyFdKeKApi9nLCAnJDEuLicpXG4gICAgICAgICAgLnJlcGxhY2UoLyhbPyFdKXs0LH0vZywgJyQxJDEkMScpLnJlcGxhY2UoLyx7Mix9L2csICcsJylcbiAgICAgICAgICAvLyBlbS1kYXNoXG4gICAgICAgICAgLnJlcGxhY2UoLyhefFteLV0pLS0tKD89W14tXXwkKS9tZywgJyQxXFx1MjAxNCcpXG4gICAgICAgICAgLy8gZW4tZGFzaFxuICAgICAgICAgIC5yZXBsYWNlKC8oXnxcXHMpLS0oPz1cXHN8JCkvbWcsICckMVxcdTIwMTMnKVxuICAgICAgICAgIC5yZXBsYWNlKC8oXnxbXi1cXHNdKS0tKD89W14tXFxzXXwkKS9tZywgJyQxXFx1MjAxMycpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS1cbiAgICB9XG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2xpbmtfY2xvc2UnICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rKytcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVwbGFjZSAoc3RhdGUpIHtcbiAgbGV0IGJsa0lkeFxuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy50eXBvZ3JhcGhlcikgeyByZXR1cm4gfVxuXG4gIGZvciAoYmxrSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDE7IGJsa0lkeCA+PSAwOyBibGtJZHgtLSkge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbYmxrSWR4XS50eXBlICE9PSAnaW5saW5lJykgeyBjb250aW51ZSB9XG5cbiAgICBpZiAoU0NPUEVEX0FCQlJfVEVTVF9SRS50ZXN0KHN0YXRlLnRva2Vuc1tibGtJZHhdLmNvbnRlbnQpKSB7XG4gICAgICByZXBsYWNlX3Njb3BlZChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jaGlsZHJlbilcbiAgICB9XG5cbiAgICBpZiAoUkFSRV9SRS50ZXN0KHN0YXRlLnRva2Vuc1tibGtJZHhdLmNvbnRlbnQpKSB7XG4gICAgICByZXBsYWNlX3JhcmUoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4pXG4gICAgfVxuICB9XG59XG4iLCAiLy8gQ29udmVydCBzdHJhaWdodCBxdW90YXRpb24gbWFya3MgdG8gdHlwb2dyYXBoaWMgb25lc1xuLy9cblxuaW1wb3J0IHsgaXNXaGl0ZVNwYWNlLCBpc1B1bmN0Q2hhckNvZGUsIGlzTWRBc2NpaVB1bmN0IH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuY29uc3QgUVVPVEVfVEVTVF9SRSA9IC9bJ1wiXS9cbmNvbnN0IFFVT1RFX1JFID0gL1snXCJdL2dcbmNvbnN0IEFQT1NUUk9QSEUgPSAnXFx1MjAxOScgLyog4oCZICovXG5cbmZ1bmN0aW9uIGFkZFJlcGxhY2VtZW50IChyZXBsYWNlbWVudHMsIHRva2VuSWR4LCBwb3MsIGNoKSB7XG4gIGlmICghcmVwbGFjZW1lbnRzW3Rva2VuSWR4XSkge1xuICAgIHJlcGxhY2VtZW50c1t0b2tlbklkeF0gPSBbXVxuICB9XG5cbiAgcmVwbGFjZW1lbnRzW3Rva2VuSWR4XS5wdXNoKHsgcG9zLCBjaCB9KVxufVxuXG5mdW5jdGlvbiBhcHBseVJlcGxhY2VtZW50cyAoc3RyLCByZXBsYWNlbWVudHMpIHtcbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGxldCBsYXN0UG9zID0gMFxuXG4gIHJlcGxhY2VtZW50cy5zb3J0KChhLCBiKSA9PiBhLnBvcyAtIGIucG9zKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmVwbGFjZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcmVwbGFjZW1lbnQgPSByZXBsYWNlbWVudHNbaV1cblxuICAgIHJlc3VsdCArPSBzdHIuc2xpY2UobGFzdFBvcywgcmVwbGFjZW1lbnQucG9zKSArIHJlcGxhY2VtZW50LmNoXG4gICAgbGFzdFBvcyA9IHJlcGxhY2VtZW50LnBvcyArIDFcbiAgfVxuXG4gIHJldHVybiByZXN1bHQgKyBzdHIuc2xpY2UobGFzdFBvcylcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc19pbmxpbmVzICh0b2tlbnMsIHN0YXRlKSB7XG4gIGxldCBqXG5cbiAgY29uc3Qgc3RhY2sgPSBbXVxuICAvLyB0b2tlbiBpbmRleCAtPiBsaXN0IG9mIHJlcGxhY2VtZW50cyBpbiB0aGUgb3JpZ2luYWwgdG9rZW4gY29udGVudFxuICBjb25zdCByZXBsYWNlbWVudHMgPSB7fVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgIGNvbnN0IHRoaXNMZXZlbCA9IHRva2Vuc1tpXS5sZXZlbFxuXG4gICAgZm9yIChqID0gc3RhY2subGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgIGlmIChzdGFja1tqXS5sZXZlbCA8PSB0aGlzTGV2ZWwpIHsgYnJlYWsgfVxuICAgIH1cbiAgICBzdGFjay5sZW5ndGggPSBqICsgMVxuXG4gICAgaWYgKHRva2VuLnR5cGUgIT09ICd0ZXh0JykgeyBjb250aW51ZSB9XG5cbiAgICBjb25zdCB0ZXh0ID0gdG9rZW4uY29udGVudFxuICAgIGxldCBwb3MgPSAwXG4gICAgY29uc3QgbWF4ID0gdGV4dC5sZW5ndGhcblxuICAgIC8qIGVzbGludCBuby1sYWJlbHM6MCxibG9jay1zY29wZWQtdmFyOjAgKi9cbiAgICBPVVRFUjpcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBRVU9URV9SRS5sYXN0SW5kZXggPSBwb3NcbiAgICAgIGNvbnN0IHQgPSBRVU9URV9SRS5leGVjKHRleHQpXG4gICAgICBpZiAoIXQpIHsgYnJlYWsgfVxuXG4gICAgICBsZXQgY2FuT3BlbiA9IHRydWVcbiAgICAgIGxldCBjYW5DbG9zZSA9IHRydWVcbiAgICAgIHBvcyA9IHQuaW5kZXggKyAxXG4gICAgICBjb25zdCBpc1NpbmdsZSA9ICh0WzBdID09PSBcIidcIilcblxuICAgICAgLy8gRmluZCBwcmV2aW91cyBjaGFyYWN0ZXIsXG4gICAgICAvLyBkZWZhdWx0IHRvIHNwYWNlIGlmIGl0J3MgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZVxuICAgICAgLy9cbiAgICAgIGxldCBsYXN0Q2hhciA9IDB4MjBcblxuICAgICAgaWYgKHQuaW5kZXggLSAxID49IDApIHtcbiAgICAgICAgbGFzdENoYXIgPSB0ZXh0LmNoYXJDb2RlQXQodC5pbmRleCAtIDEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgPT09ICdzb2Z0YnJlYWsnIHx8IHRva2Vuc1tqXS50eXBlID09PSAnaGFyZGJyZWFrJykgYnJlYWsgLy8gbGFzdENoYXIgZGVmYXVsdHMgdG8gMHgyMFxuICAgICAgICAgIGlmICghdG9rZW5zW2pdLmNvbnRlbnQpIGNvbnRpbnVlIC8vIHNob3VsZCBza2lwIGFsbCB0b2tlbnMgZXhjZXB0ICd0ZXh0JywgJ2h0bWxfaW5saW5lJyBvciAnY29kZV9pbmxpbmUnXG5cbiAgICAgICAgICBsYXN0Q2hhciA9IHRva2Vuc1tqXS5jb250ZW50LmNoYXJDb2RlQXQodG9rZW5zW2pdLmNvbnRlbnQubGVuZ3RoIC0gMSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZpbmQgbmV4dCBjaGFyYWN0ZXIsXG4gICAgICAvLyBkZWZhdWx0IHRvIHNwYWNlIGlmIGl0J3MgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgICAgLy9cbiAgICAgIGxldCBuZXh0Q2hhciA9IDB4MjBcblxuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBuZXh0Q2hhciA9IHRleHQuY2hhckNvZGVBdChwb3MpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGogPSBpICsgMTsgaiA8IHRva2Vucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmICh0b2tlbnNbal0udHlwZSA9PT0gJ3NvZnRicmVhaycgfHwgdG9rZW5zW2pdLnR5cGUgPT09ICdoYXJkYnJlYWsnKSBicmVhayAvLyBuZXh0Q2hhciBkZWZhdWx0cyB0byAweDIwXG4gICAgICAgICAgaWYgKCF0b2tlbnNbal0uY29udGVudCkgY29udGludWUgLy8gc2hvdWxkIHNraXAgYWxsIHRva2VucyBleGNlcHQgJ3RleHQnLCAnaHRtbF9pbmxpbmUnIG9yICdjb2RlX2lubGluZSdcblxuICAgICAgICAgIG5leHRDaGFyID0gdG9rZW5zW2pdLmNvbnRlbnQuY2hhckNvZGVBdCgwKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNMYXN0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobGFzdENoYXIpIHx8IGlzUHVuY3RDaGFyQ29kZShsYXN0Q2hhcilcbiAgICAgIGNvbnN0IGlzTmV4dFB1bmN0Q2hhciA9IGlzTWRBc2NpaVB1bmN0KG5leHRDaGFyKSB8fCBpc1B1bmN0Q2hhckNvZGUobmV4dENoYXIpXG5cbiAgICAgIGNvbnN0IGlzTGFzdFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobGFzdENoYXIpXG4gICAgICBjb25zdCBpc05leHRXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKG5leHRDaGFyKVxuXG4gICAgICBpZiAoaXNOZXh0V2hpdGVTcGFjZSkge1xuICAgICAgICBjYW5PcGVuID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAoaXNOZXh0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTGFzdFdoaXRlU3BhY2UgfHwgaXNMYXN0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbk9wZW4gPSBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0xhc3RXaGl0ZVNwYWNlKSB7XG4gICAgICAgIGNhbkNsb3NlID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAoaXNMYXN0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTmV4dFdoaXRlU3BhY2UgfHwgaXNOZXh0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbkNsb3NlID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobmV4dENoYXIgPT09IDB4MjIgLyogXCIgKi8gJiYgdFswXSA9PT0gJ1wiJykge1xuICAgICAgICBpZiAobGFzdENoYXIgPj0gMHgzMCAvKiAwICovICYmIGxhc3RDaGFyIDw9IDB4MzkgLyogOSAqLykge1xuICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZTogMVwiXCIgLSBjb3VudCBmaXJzdCBxdW90ZSBhcyBhbiBpbmNoXG4gICAgICAgICAgY2FuQ2xvc2UgPSBjYW5PcGVuID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FuT3BlbiAmJiBjYW5DbG9zZSkge1xuICAgICAgICAvLyBSZXBsYWNlIHF1b3RlcyBpbiB0aGUgbWlkZGxlIG9mIHB1bmN0dWF0aW9uIHNlcXVlbmNlLCBidXQgbm90XG4gICAgICAgIC8vIGluIHRoZSBtaWRkbGUgb2YgdGhlIHdvcmRzLCBpLmUuOlxuICAgICAgICAvL1xuICAgICAgICAvLyAxLiBmb28gXCIgYmFyIFwiIGJheiAtIG5vdCByZXBsYWNlZFxuICAgICAgICAvLyAyLiBmb28tXCItYmFyLVwiLWJheiAtIHJlcGxhY2VkXG4gICAgICAgIC8vIDMuIGZvb1wiYmFyXCJiYXogICAgIC0gbm90IHJlcGxhY2VkXG4gICAgICAgIC8vXG4gICAgICAgIGNhbk9wZW4gPSBpc0xhc3RQdW5jdENoYXJcbiAgICAgICAgY2FuQ2xvc2UgPSBpc05leHRQdW5jdENoYXJcbiAgICAgIH1cblxuICAgICAgaWYgKCFjYW5PcGVuICYmICFjYW5DbG9zZSkge1xuICAgICAgICAvLyBtaWRkbGUgb2Ygd29yZFxuICAgICAgICBpZiAoaXNTaW5nbGUpIHtcbiAgICAgICAgICBhZGRSZXBsYWNlbWVudChyZXBsYWNlbWVudHMsIGksIHQuaW5kZXgsIEFQT1NUUk9QSEUpXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbkNsb3NlKSB7XG4gICAgICAgIC8vIHRoaXMgY291bGQgYmUgYSBjbG9zaW5nIHF1b3RlLCByZXdpbmQgdGhlIHN0YWNrIHRvIGdldCBhIG1hdGNoXG4gICAgICAgIGZvciAoaiA9IHN0YWNrLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgbGV0IGl0ZW0gPSBzdGFja1tqXVxuICAgICAgICAgIGlmIChzdGFja1tqXS5sZXZlbCA8IHRoaXNMZXZlbCkgeyBicmVhayB9XG4gICAgICAgICAgaWYgKGl0ZW0uc2luZ2xlID09PSBpc1NpbmdsZSAmJiBzdGFja1tqXS5sZXZlbCA9PT0gdGhpc0xldmVsKSB7XG4gICAgICAgICAgICBpdGVtID0gc3RhY2tbal1cblxuICAgICAgICAgICAgbGV0IG9wZW5RdW90ZVxuICAgICAgICAgICAgbGV0IGNsb3NlUXVvdGVcbiAgICAgICAgICAgIGlmIChpc1NpbmdsZSkge1xuICAgICAgICAgICAgICBvcGVuUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1syXVxuICAgICAgICAgICAgICBjbG9zZVF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbM11cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9wZW5RdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzBdXG4gICAgICAgICAgICAgIGNsb3NlUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1sxXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhZGRSZXBsYWNlbWVudChyZXBsYWNlbWVudHMsIGksIHQuaW5kZXgsIGNsb3NlUXVvdGUpXG4gICAgICAgICAgICBhZGRSZXBsYWNlbWVudChyZXBsYWNlbWVudHMsIGl0ZW0udG9rZW4sIGl0ZW0ucG9zLCBvcGVuUXVvdGUpXG5cbiAgICAgICAgICAgIHN0YWNrLmxlbmd0aCA9IGpcbiAgICAgICAgICAgIGNvbnRpbnVlIE9VVEVSXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5PcGVuKSB7XG4gICAgICAgIHN0YWNrLnB1c2goe1xuICAgICAgICAgIHRva2VuOiBpLFxuICAgICAgICAgIHBvczogdC5pbmRleCxcbiAgICAgICAgICBzaW5nbGU6IGlzU2luZ2xlLFxuICAgICAgICAgIGxldmVsOiB0aGlzTGV2ZWxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoY2FuQ2xvc2UgJiYgaXNTaW5nbGUpIHtcbiAgICAgICAgYWRkUmVwbGFjZW1lbnQocmVwbGFjZW1lbnRzLCBpLCB0LmluZGV4LCBBUE9TVFJPUEhFKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIE9iamVjdC5rZXlzKHJlcGxhY2VtZW50cykuZm9yRWFjaChmdW5jdGlvbiAodG9rZW5JZHgpIHtcbiAgICB0b2tlbnNbdG9rZW5JZHhdLmNvbnRlbnQgPSBhcHBseVJlcGxhY2VtZW50cyh0b2tlbnNbdG9rZW5JZHhdLmNvbnRlbnQsIHJlcGxhY2VtZW50c1t0b2tlbklkeF0pXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNtYXJ0cXVvdGVzIChzdGF0ZSkge1xuICAvKiBlc2xpbnQgbWF4LWRlcHRoOjAgKi9cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLnR5cG9ncmFwaGVyKSB7IHJldHVybiB9XG5cbiAgZm9yIChsZXQgYmxrSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDE7IGJsa0lkeCA+PSAwOyBibGtJZHgtLSkge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbYmxrSWR4XS50eXBlICE9PSAnaW5saW5lJyB8fFxuICAgICAgICAhUVVPVEVfVEVTVF9SRS50ZXN0KHN0YXRlLnRva2Vuc1tibGtJZHhdLmNvbnRlbnQpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIHByb2Nlc3NfaW5saW5lcyhzdGF0ZS50b2tlbnNbYmxrSWR4XS5jaGlsZHJlbiwgc3RhdGUpXG4gIH1cbn1cbiIsICIvLyBKb2luIHJhdyB0ZXh0IHRva2VucyB3aXRoIHRoZSByZXN0IG9mIHRoZSB0ZXh0XG4vL1xuLy8gVGhpcyBpcyBzZXQgYXMgYSBzZXBhcmF0ZSBydWxlIHRvIHByb3ZpZGUgYW4gb3Bwb3J0dW5pdHkgZm9yIHBsdWdpbnNcbi8vIHRvIHJ1biB0ZXh0IHJlcGxhY2VtZW50cyBhZnRlciB0ZXh0IGpvaW4sIGJ1dCBiZWZvcmUgZXNjYXBlIGpvaW4uXG4vL1xuLy8gRm9yIGV4YW1wbGUsIGBcXDopYCBzaG91bGRuJ3QgYmUgcmVwbGFjZWQgd2l0aCBhbiBlbW9qaS5cbi8vXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRleHRfam9pbiAoc3RhdGUpIHtcbiAgbGV0IGN1cnIsIGxhc3RcbiAgY29uc3QgYmxvY2tUb2tlbnMgPSBzdGF0ZS50b2tlbnNcbiAgY29uc3QgbCA9IGJsb2NrVG9rZW5zLmxlbmd0aFxuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgbDsgaisrKSB7XG4gICAgaWYgKGJsb2NrVG9rZW5zW2pdLnR5cGUgIT09ICdpbmxpbmUnKSBjb250aW51ZVxuXG4gICAgY29uc3QgdG9rZW5zID0gYmxvY2tUb2tlbnNbal0uY2hpbGRyZW5cbiAgICBjb25zdCBtYXggPSB0b2tlbnMubGVuZ3RoXG5cbiAgICBmb3IgKGN1cnIgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICAgIGlmICh0b2tlbnNbY3Vycl0udHlwZSA9PT0gJ3RleHRfc3BlY2lhbCcpIHtcbiAgICAgICAgdG9rZW5zW2N1cnJdLnR5cGUgPSAndGV4dCdcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGN1cnIgPSBsYXN0ID0gMDsgY3VyciA8IG1heDsgY3VycisrKSB7XG4gICAgICBpZiAodG9rZW5zW2N1cnJdLnR5cGUgPT09ICd0ZXh0JyAmJlxuICAgICAgICAgIGN1cnIgKyAxIDwgbWF4ICYmXG4gICAgICAgICAgdG9rZW5zW2N1cnIgKyAxXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgLy8gY29sbGFwc2UgdHdvIGFkamFjZW50IHRleHQgbm9kZXNcbiAgICAgICAgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50ID0gdG9rZW5zW2N1cnJdLmNvbnRlbnQgKyB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyICE9PSBsYXN0KSB7IHRva2Vuc1tsYXN0XSA9IHRva2Vuc1tjdXJyXSB9XG5cbiAgICAgICAgbGFzdCsrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnIgIT09IGxhc3QpIHtcbiAgICAgIHRva2Vucy5sZW5ndGggPSBsYXN0XG4gICAgfVxuICB9XG59XG4iLCAiLyoqIGludGVybmFsXG4gKiBjbGFzcyBDb3JlXG4gKlxuICogVG9wLWxldmVsIHJ1bGVzIGV4ZWN1dG9yLiBHbHVlcyBibG9jay9pbmxpbmUgcGFyc2VycyBhbmQgZG9lcyBpbnRlcm1lZGlhdGVcbiAqIHRyYW5zZm9ybWF0aW9ucy5cbiAqKi9cblxuaW1wb3J0IFJ1bGVyIGZyb20gJy4vcnVsZXIubWpzJ1xuaW1wb3J0IFN0YXRlQ29yZSBmcm9tICcuL3J1bGVzX2NvcmUvc3RhdGVfY29yZS5tanMnXG5cbmltcG9ydCByX25vcm1hbGl6ZSBmcm9tICcuL3J1bGVzX2NvcmUvbm9ybWFsaXplLm1qcydcbmltcG9ydCByX2Jsb2NrIGZyb20gJy4vcnVsZXNfY29yZS9ibG9jay5tanMnXG5pbXBvcnQgcl9pbmxpbmUgZnJvbSAnLi9ydWxlc19jb3JlL2lubGluZS5tanMnXG5pbXBvcnQgcl9saW5raWZ5IGZyb20gJy4vcnVsZXNfY29yZS9saW5raWZ5Lm1qcydcbmltcG9ydCByX3JlcGxhY2VtZW50cyBmcm9tICcuL3J1bGVzX2NvcmUvcmVwbGFjZW1lbnRzLm1qcydcbmltcG9ydCByX3NtYXJ0cXVvdGVzIGZyb20gJy4vcnVsZXNfY29yZS9zbWFydHF1b3Rlcy5tanMnXG5pbXBvcnQgcl90ZXh0X2pvaW4gZnJvbSAnLi9ydWxlc19jb3JlL3RleHRfam9pbi5tanMnXG5cbmNvbnN0IF9ydWxlcyA9IFtcbiAgWydub3JtYWxpemUnLCByX25vcm1hbGl6ZV0sXG4gIFsnYmxvY2snLCByX2Jsb2NrXSxcbiAgWydpbmxpbmUnLCByX2lubGluZV0sXG4gIFsnbGlua2lmeScsIHJfbGlua2lmeV0sXG4gIFsncmVwbGFjZW1lbnRzJywgcl9yZXBsYWNlbWVudHNdLFxuICBbJ3NtYXJ0cXVvdGVzJywgcl9zbWFydHF1b3Rlc10sXG4gIC8vIGB0ZXh0X2pvaW5gIGZpbmRzIGB0ZXh0X3NwZWNpYWxgIHRva2VucyAoZm9yIGVzY2FwZSBzZXF1ZW5jZXMpXG4gIC8vIGFuZCBqb2lucyB0aGVtIHdpdGggdGhlIHJlc3Qgb2YgdGhlIHRleHRcbiAgWyd0ZXh0X2pvaW4nLCByX3RleHRfam9pbl1cbl1cblxuLyoqXG4gKiBuZXcgQ29yZSgpXG4gKiovXG5mdW5jdGlvbiBDb3JlICgpIHtcbiAgLyoqXG4gICAqIENvcmUjcnVsZXIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBLZWVwIGNvbmZpZ3VyYXRpb24gb2YgY29yZSBydWxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVyID0gbmV3IFJ1bGVyKClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSlcbiAgfVxufVxuXG4vKipcbiAqIENvcmUucHJvY2VzcyhzdGF0ZSlcbiAqXG4gKiBFeGVjdXRlcyBjb3JlIGNoYWluIHJ1bGVzLlxuICoqL1xuQ29yZS5wcm90b3R5cGUucHJvY2VzcyA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpXG5cbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBydWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBydWxlc1tpXShzdGF0ZSlcbiAgfVxufVxuXG5Db3JlLnByb3RvdHlwZS5TdGF0ZSA9IFN0YXRlQ29yZVxuXG5leHBvcnQgZGVmYXVsdCBDb3JlXG4iLCAiLy8gUGFyc2VyIHN0YXRlIGNsYXNzXG5cbmltcG9ydCBUb2tlbiBmcm9tICcuLi90b2tlbi5tanMnXG5pbXBvcnQgeyBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZnVuY3Rpb24gU3RhdGVCbG9jayAoc3JjLCBtZCwgZW52LCB0b2tlbnMpIHtcbiAgdGhpcy5zcmMgPSBzcmNcblxuICAvLyBsaW5rIHRvIHBhcnNlciBpbnN0YW5jZVxuICB0aGlzLm1kID0gbWRcblxuICB0aGlzLmVudiA9IGVudlxuXG4gIC8vXG4gIC8vIEludGVybmFsIHN0YXRlIHZhcnRpYWJsZXNcbiAgLy9cblxuICB0aGlzLnRva2VucyA9IHRva2Vuc1xuXG4gIHRoaXMuYk1hcmtzID0gW10gIC8vIGxpbmUgYmVnaW4gb2Zmc2V0cyBmb3IgZmFzdCBqdW1wc1xuICB0aGlzLmVNYXJrcyA9IFtdICAvLyBsaW5lIGVuZCBvZmZzZXRzIGZvciBmYXN0IGp1bXBzXG4gIHRoaXMudFNoaWZ0ID0gW10gIC8vIG9mZnNldHMgb2YgdGhlIGZpcnN0IG5vbi1zcGFjZSBjaGFyYWN0ZXJzICh0YWJzIG5vdCBleHBhbmRlZClcbiAgdGhpcy5zQ291bnQgPSBbXSAgLy8gaW5kZW50cyBmb3IgZWFjaCBsaW5lICh0YWJzIGV4cGFuZGVkKVxuXG4gIC8vIEFuIGFtb3VudCBvZiB2aXJ0dWFsIHNwYWNlcyAodGFicyBleHBhbmRlZCkgYmV0d2VlbiBiZWdpbm5pbmdcbiAgLy8gb2YgZWFjaCBsaW5lIChiTWFya3MpIGFuZCByZWFsIGJlZ2lubmluZyBvZiB0aGF0IGxpbmUuXG4gIC8vXG4gIC8vIEl0IGV4aXN0cyBvbmx5IGFzIGEgaGFjayBiZWNhdXNlIGJsb2NrcXVvdGVzIG92ZXJyaWRlIGJNYXJrc1xuICAvLyBsb3NpbmcgaW5mb3JtYXRpb24gaW4gdGhlIHByb2Nlc3MuXG4gIC8vXG4gIC8vIEl0J3MgdXNlZCBvbmx5IHdoZW4gZXhwYW5kaW5nIHRhYnMsIHlvdSBjYW4gdGhpbmsgYWJvdXQgaXQgYXNcbiAgLy8gYW4gaW5pdGlhbCB0YWIgbGVuZ3RoLCBlLmcuIGJzQ291bnQ9MjEgYXBwbGllZCB0byBzdHJpbmcgYFxcdDEyM2BcbiAgLy8gbWVhbnMgZmlyc3QgdGFiIHNob3VsZCBiZSBleHBhbmRlZCB0byA0LTIxJTQgPT09IDMgc3BhY2VzLlxuICAvL1xuICB0aGlzLmJzQ291bnQgPSBbXVxuXG4gIC8vIGJsb2NrIHBhcnNlciB2YXJpYWJsZXNcblxuICAvLyByZXF1aXJlZCBibG9jayBjb250ZW50IGluZGVudCAoZm9yIGV4YW1wbGUsIGlmIHdlIGFyZVxuICAvLyBpbnNpZGUgYSBsaXN0LCBpdCB3b3VsZCBiZSBwb3NpdGlvbmVkIGFmdGVyIGxpc3QgbWFya2VyKVxuICB0aGlzLmJsa0luZGVudCA9IDBcbiAgdGhpcy5saW5lID0gMCAvLyBsaW5lIGluZGV4IGluIHNyY1xuICB0aGlzLmxpbmVNYXggPSAwIC8vIGxpbmVzIGNvdW50XG4gIHRoaXMudGlnaHQgPSBmYWxzZSAgLy8gbG9vc2UvdGlnaHQgbW9kZSBmb3IgbGlzdHNcbiAgdGhpcy5kZEluZGVudCA9IC0xIC8vIGluZGVudCBvZiB0aGUgY3VycmVudCBkZCBibG9jayAoLTEgaWYgdGhlcmUgaXNuJ3QgYW55KVxuICB0aGlzLmxpc3RJbmRlbnQgPSAtMSAvLyBpbmRlbnQgb2YgdGhlIGN1cnJlbnQgbGlzdCBibG9jayAoLTEgaWYgdGhlcmUgaXNuJ3QgYW55KVxuXG4gIC8vIGNhbiBiZSAnYmxvY2txdW90ZScsICdsaXN0JywgJ3Jvb3QnLCAncGFyYWdyYXBoJyBvciAncmVmZXJlbmNlJ1xuICAvLyB1c2VkIGluIGxpc3RzIHRvIGRldGVybWluZSBpZiB0aGV5IGludGVycnVwdCBhIHBhcmFncmFwaFxuICB0aGlzLnBhcmVudFR5cGUgPSAncm9vdCdcblxuICB0aGlzLmxldmVsID0gMFxuXG4gIC8vIENyZWF0ZSBjYWNoZXNcbiAgLy8gR2VuZXJhdGUgbWFya2Vycy5cbiAgY29uc3QgcyA9IHRoaXMuc3JjXG5cbiAgZm9yIChsZXQgc3RhcnQgPSAwLCBwb3MgPSAwLCBpbmRlbnQgPSAwLCBvZmZzZXQgPSAwLCBsZW4gPSBzLmxlbmd0aCwgaW5kZW50X2ZvdW5kID0gZmFsc2U7IHBvcyA8IGxlbjsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHMuY2hhckNvZGVBdChwb3MpXG5cbiAgICBpZiAoIWluZGVudF9mb3VuZCkge1xuICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgIGluZGVudCsrXG5cbiAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgb2Zmc2V0ICs9IDQgLSBvZmZzZXQgJSA0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2Zmc2V0KytcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZW50X2ZvdW5kID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjaCA9PT0gMHgwQSB8fCBwb3MgPT09IGxlbiAtIDEpIHtcbiAgICAgIGlmIChjaCAhPT0gMHgwQSkgeyBwb3MrKyB9XG4gICAgICB0aGlzLmJNYXJrcy5wdXNoKHN0YXJ0KVxuICAgICAgdGhpcy5lTWFya3MucHVzaChwb3MpXG4gICAgICB0aGlzLnRTaGlmdC5wdXNoKGluZGVudClcbiAgICAgIHRoaXMuc0NvdW50LnB1c2gob2Zmc2V0KVxuICAgICAgdGhpcy5ic0NvdW50LnB1c2goMClcblxuICAgICAgaW5kZW50X2ZvdW5kID0gZmFsc2VcbiAgICAgIGluZGVudCA9IDBcbiAgICAgIG9mZnNldCA9IDBcbiAgICAgIHN0YXJ0ID0gcG9zICsgMVxuICAgIH1cbiAgfVxuXG4gIC8vIFB1c2ggZmFrZSBlbnRyeSB0byBzaW1wbGlmeSBjYWNoZSBib3VuZHMgY2hlY2tzXG4gIHRoaXMuYk1hcmtzLnB1c2gocy5sZW5ndGgpXG4gIHRoaXMuZU1hcmtzLnB1c2gocy5sZW5ndGgpXG4gIHRoaXMudFNoaWZ0LnB1c2goMClcbiAgdGhpcy5zQ291bnQucHVzaCgwKVxuICB0aGlzLmJzQ291bnQucHVzaCgwKVxuXG4gIHRoaXMubGluZU1heCA9IHRoaXMuYk1hcmtzLmxlbmd0aCAtIDEgLy8gZG9uJ3QgY291bnQgbGFzdCBmYWtlIGxpbmVcbn1cblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHR5cGUsIHRhZywgbmVzdGluZykge1xuICBjb25zdCB0b2tlbiA9IG5ldyBUb2tlbih0eXBlLCB0YWcsIG5lc3RpbmcpXG4gIHRva2VuLmJsb2NrID0gdHJ1ZVxuXG4gIGlmIChuZXN0aW5nIDwgMCkgdGhpcy5sZXZlbC0tIC8vIGNsb3NpbmcgdGFnXG4gIHRva2VuLmxldmVsID0gdGhpcy5sZXZlbFxuICBpZiAobmVzdGluZyA+IDApIHRoaXMubGV2ZWwrKyAvLyBvcGVuaW5nIHRhZ1xuXG4gIHRoaXMudG9rZW5zLnB1c2godG9rZW4pXG4gIHJldHVybiB0b2tlblxufVxuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gaXNFbXB0eSAobGluZSkge1xuICByZXR1cm4gdGhpcy5iTWFya3NbbGluZV0gKyB0aGlzLnRTaGlmdFtsaW5lXSA+PSB0aGlzLmVNYXJrc1tsaW5lXVxufVxuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwRW1wdHlMaW5lcyA9IGZ1bmN0aW9uIHNraXBFbXB0eUxpbmVzIChmcm9tKSB7XG4gIGZvciAobGV0IG1heCA9IHRoaXMubGluZU1heDsgZnJvbSA8IG1heDsgZnJvbSsrKSB7XG4gICAgaWYgKHRoaXMuYk1hcmtzW2Zyb21dICsgdGhpcy50U2hpZnRbZnJvbV0gPCB0aGlzLmVNYXJrc1tmcm9tXSkge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyb21cbn1cblxuLy8gU2tpcCBzcGFjZXMgZnJvbSBnaXZlbiBwb3NpdGlvbi5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXMgPSBmdW5jdGlvbiBza2lwU3BhY2VzIChwb3MpIHtcbiAgZm9yIChsZXQgbWF4ID0gdGhpcy5zcmMubGVuZ3RoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY29uc3QgY2ggPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcylcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrIH1cbiAgfVxuICByZXR1cm4gcG9zXG59XG5cbi8vIFNraXAgc3BhY2VzIGZyb20gZ2l2ZW4gcG9zaXRpb24gaW4gcmV2ZXJzZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXNCYWNrID0gZnVuY3Rpb24gc2tpcFNwYWNlc0JhY2sgKHBvcywgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7IHJldHVybiBwb3MgfVxuXG4gIHdoaWxlIChwb3MgPiBtaW4pIHtcbiAgICBpZiAoIWlzU3BhY2UodGhpcy5zcmMuY2hhckNvZGVBdCgtLXBvcykpKSB7IHJldHVybiBwb3MgKyAxIH1cbiAgfVxuICByZXR1cm4gcG9zXG59XG5cbi8vIFNraXAgY2hhciBjb2RlcyBmcm9tIGdpdmVuIHBvc2l0aW9uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnMgPSBmdW5jdGlvbiBza2lwQ2hhcnMgKHBvcywgY29kZSkge1xuICBmb3IgKGxldCBtYXggPSB0aGlzLnNyYy5sZW5ndGg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBpZiAodGhpcy5zcmMuY2hhckNvZGVBdChwb3MpICE9PSBjb2RlKSB7IGJyZWFrIH1cbiAgfVxuICByZXR1cm4gcG9zXG59XG5cbi8vIFNraXAgY2hhciBjb2RlcyByZXZlcnNlIGZyb20gZ2l2ZW4gcG9zaXRpb24gLSAxXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnNCYWNrID0gZnVuY3Rpb24gc2tpcENoYXJzQmFjayAocG9zLCBjb2RlLCBtaW4pIHtcbiAgaWYgKHBvcyA8PSBtaW4pIHsgcmV0dXJuIHBvcyB9XG5cbiAgd2hpbGUgKHBvcyA+IG1pbikge1xuICAgIGlmIChjb2RlICE9PSB0aGlzLnNyYy5jaGFyQ29kZUF0KC0tcG9zKSkgeyByZXR1cm4gcG9zICsgMSB9XG4gIH1cbiAgcmV0dXJuIHBvc1xufVxuXG4vLyBjdXQgbGluZXMgcmFuZ2UgZnJvbSBzb3VyY2UuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5nZXRMaW5lcyA9IGZ1bmN0aW9uIGdldExpbmVzIChiZWdpbiwgZW5kLCBpbmRlbnQsIGtlZXBMYXN0TEYpIHtcbiAgaWYgKGJlZ2luID49IGVuZCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgY29uc3QgcXVldWUgPSBuZXcgQXJyYXkoZW5kIC0gYmVnaW4pXG5cbiAgZm9yIChsZXQgaSA9IDAsIGxpbmUgPSBiZWdpbjsgbGluZSA8IGVuZDsgbGluZSsrLCBpKyspIHtcbiAgICBsZXQgbGluZUluZGVudCA9IDBcbiAgICBjb25zdCBsaW5lU3RhcnQgPSB0aGlzLmJNYXJrc1tsaW5lXVxuICAgIGxldCBmaXJzdCA9IGxpbmVTdGFydFxuICAgIGxldCBsYXN0XG5cbiAgICBpZiAobGluZSArIDEgPCBlbmQgfHwga2VlcExhc3RMRikge1xuICAgICAgLy8gTm8gbmVlZCBmb3IgYm91bmRzIGNoZWNrIGJlY2F1c2Ugd2UgaGF2ZSBmYWtlIGVudHJ5IG9uIHRhaWwuXG4gICAgICBsYXN0ID0gdGhpcy5lTWFya3NbbGluZV0gKyAxXG4gICAgfSBlbHNlIHtcbiAgICAgIGxhc3QgPSB0aGlzLmVNYXJrc1tsaW5lXVxuICAgIH1cblxuICAgIHdoaWxlIChmaXJzdCA8IGxhc3QgJiYgbGluZUluZGVudCA8IGluZGVudCkge1xuICAgICAgY29uc3QgY2ggPSB0aGlzLnNyYy5jaGFyQ29kZUF0KGZpcnN0KVxuXG4gICAgICBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgbGluZUluZGVudCArPSA0IC0gKGxpbmVJbmRlbnQgKyB0aGlzLmJzQ291bnRbbGluZV0pICUgNFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmVJbmRlbnQrK1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0IC0gbGluZVN0YXJ0IDwgdGhpcy50U2hpZnRbbGluZV0pIHtcbiAgICAgICAgLy8gcGF0Y2hlZCB0U2hpZnQgbWFza2VkIGNoYXJhY3RlcnMgdG8gbG9vayBsaWtlIHNwYWNlcyAoYmxvY2txdW90ZXMsIGxpc3QgbWFya2VycylcbiAgICAgICAgbGluZUluZGVudCsrXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBmaXJzdCsrXG4gICAgfVxuXG4gICAgaWYgKGxpbmVJbmRlbnQgPiBpbmRlbnQpIHtcbiAgICAgIC8vIHBhcnRpYWxseSBleHBhbmRpbmcgdGFicyBpbiBjb2RlIGJsb2NrcywgZS5nICdcXHRcXHRmb29iYXInXG4gICAgICAvLyB3aXRoIGluZGVudD0yIGJlY29tZXMgJyAgXFx0Zm9vYmFyJ1xuICAgICAgcXVldWVbaV0gPSBuZXcgQXJyYXkobGluZUluZGVudCAtIGluZGVudCArIDEpLmpvaW4oJyAnKSArIHRoaXMuc3JjLnNsaWNlKGZpcnN0LCBsYXN0KVxuICAgIH0gZWxzZSB7XG4gICAgICBxdWV1ZVtpXSA9IHRoaXMuc3JjLnNsaWNlKGZpcnN0LCBsYXN0KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBxdWV1ZS5qb2luKCcnKVxufVxuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGJsb2NrIHJ1bGVzXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuXG5cbmV4cG9ydCBkZWZhdWx0IFN0YXRlQmxvY2tcbiIsICIvLyBHRk0gdGFibGUsIGh0dHBzOi8vZ2l0aHViLmdpdGh1Yi5jb20vZ2ZtLyN0YWJsZXMtZXh0ZW5zaW9uLVxuXG5pbXBvcnQgeyBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuLy8gTGltaXQgdGhlIGFtb3VudCBvZiBlbXB0eSBhdXRvY29tcGxldGVkIGNlbGxzIGluIGEgdGFibGUsXG4vLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2lzc3Vlcy8xMDAwLFxuLy9cbi8vIEJvdGggcHVsbGRvd24tY21hcmsgYW5kIGNvbW1vbm1hcmstaHMgbGltaXQgdGhlIG51bWJlciBvZiBjZWxscyB0aGlzIHdheSB0byB+MjAway5cbi8vIFdlIHNldCBpdCB0byA2NWssIHdoaWNoIGNhbiBleHBhbmQgdXNlciBpbnB1dCBieSBhIGZhY3RvciBvZiB4MzcwXG4vLyAoMjU2eDI1NiBzcXVhcmUgaXMgMS44a0IgZXhwYW5kZWQgaW50byA2NTBrQikuXG5jb25zdCBNQVhfQVVUT0NPTVBMRVRFRF9DRUxMUyA9IDB4MTAwMDBcblxuZnVuY3Rpb24gZ2V0TGluZSAoc3RhdGUsIGxpbmUpIHtcbiAgY29uc3QgcG9zID0gc3RhdGUuYk1hcmtzW2xpbmVdICsgc3RhdGUudFNoaWZ0W2xpbmVdXG4gIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tsaW5lXVxuXG4gIHJldHVybiBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpXG59XG5cbmZ1bmN0aW9uIGVzY2FwZWRTcGxpdCAoc3RyKSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdXG4gIGNvbnN0IG1heCA9IHN0ci5sZW5ndGhcblxuICBsZXQgcG9zID0gMFxuICBsZXQgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gIGxldCBpc0VzY2FwZWQgPSBmYWxzZVxuICBsZXQgbGFzdFBvcyA9IDBcbiAgbGV0IGN1cnJlbnQgPSAnJ1xuXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBpZiAoY2ggPT09IDB4N2MvKiB8ICovKSB7XG4gICAgICBpZiAoIWlzRXNjYXBlZCkge1xuICAgICAgICAvLyBwaXBlIHNlcGFyYXRpbmcgY2VsbHMsICd8J1xuICAgICAgICByZXN1bHQucHVzaChjdXJyZW50ICsgc3RyLnN1YnN0cmluZyhsYXN0UG9zLCBwb3MpKVxuICAgICAgICBjdXJyZW50ID0gJydcbiAgICAgICAgbGFzdFBvcyA9IHBvcyArIDFcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzY2FwZWQgcGlwZSwgJ1xcfCdcbiAgICAgICAgY3VycmVudCArPSBzdHIuc3Vic3RyaW5nKGxhc3RQb3MsIHBvcyAtIDEpXG4gICAgICAgIGxhc3RQb3MgPSBwb3NcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpc0VzY2FwZWQgPSAoY2ggPT09IDB4NWMvKiBcXCAqLylcbiAgICBwb3MrK1xuXG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gIH1cblxuICByZXN1bHQucHVzaChjdXJyZW50ICsgc3RyLnN1YnN0cmluZyhsYXN0UG9zKSlcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRhYmxlIChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgLy8gc2hvdWxkIGhhdmUgYXQgbGVhc3QgdHdvIGxpbmVzXG4gIGlmIChzdGFydExpbmUgKyAyID4gZW5kTGluZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcblxuICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIHNlY29uZCBsaW5lIHNob3VsZCBiZSAnfCcsICctJywgJzonLFxuICAvLyBhbmQgbm8gb3RoZXIgY2hhcmFjdGVycyBhcmUgYWxsb3dlZCBidXQgc3BhY2VzO1xuICAvLyBiYXNpY2FsbHksIHRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgb2YgL15bLTp8XVstOnxcXHNdKiQvIHJlZ2V4cFxuXG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICBpZiAocG9zID49IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBmaXJzdENoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspXG4gIGlmIChmaXJzdENoICE9PSAweDdDLyogfCAqLyAmJiBmaXJzdENoICE9PSAweDJELyogLSAqLyAmJiBmaXJzdENoICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChwb3MgPj0gc3RhdGUuZU1hcmtzW25leHRMaW5lXSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGNvbnN0IHNlY29uZENoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspXG4gIGlmIChzZWNvbmRDaCAhPT0gMHg3Qy8qIHwgKi8gJiYgc2Vjb25kQ2ggIT09IDB4MkQvKiAtICovICYmIHNlY29uZENoICE9PSAweDNBLyogOiAqLyAmJiAhaXNTcGFjZShzZWNvbmRDaCkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIGlmIGZpcnN0IGNoYXJhY3RlciBpcyAnLScsIHRoZW4gc2Vjb25kIGNoYXJhY3RlciBtdXN0IG5vdCBiZSBhIHNwYWNlXG4gIC8vIChkdWUgdG8gcGFyc2luZyBhbWJpZ3VpdHkgd2l0aCBsaXN0KVxuICBpZiAoZmlyc3RDaCA9PT0gMHgyRC8qIC0gKi8gJiYgaXNTcGFjZShzZWNvbmRDaCkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICB3aGlsZSAocG9zIDwgc3RhdGUuZU1hcmtzW25leHRMaW5lXSkge1xuICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgaWYgKGNoICE9PSAweDdDLyogfCAqLyAmJiBjaCAhPT0gMHgyRC8qIC0gKi8gJiYgY2ggIT09IDB4M0EvKiA6ICovICYmICFpc1NwYWNlKGNoKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgcG9zKytcbiAgfVxuXG4gIGxldCBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIHN0YXJ0TGluZSArIDEpXG4gIGxldCBjb2x1bW5zID0gbGluZVRleHQuc3BsaXQoJ3wnKVxuICBjb25zdCBhbGlnbnMgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0ID0gY29sdW1uc1tpXS50cmltKClcbiAgICBpZiAoIXQpIHtcbiAgICAgIC8vIGFsbG93IGVtcHR5IGNvbHVtbnMgYmVmb3JlIGFuZCBhZnRlciB0YWJsZSwgYnV0IG5vdCBpbiBiZXR3ZWVuIGNvbHVtbnM7XG4gICAgICAvLyBlLmcuIGFsbG93IGAgfC0tLXwgYCwgZGlzYWxsb3cgYCAtLS18fC0tLSBgXG4gICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSBjb2x1bW5zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghL146Py0rOj8kLy50ZXN0KHQpKSB7IHJldHVybiBmYWxzZSB9XG4gICAgaWYgKHQuY2hhckNvZGVBdCh0Lmxlbmd0aCAtIDEpID09PSAweDNBLyogOiAqLykge1xuICAgICAgYWxpZ25zLnB1c2godC5jaGFyQ29kZUF0KDApID09PSAweDNBLyogOiAqLyA/ICdjZW50ZXInIDogJ3JpZ2h0JylcbiAgICB9IGVsc2UgaWYgKHQuY2hhckNvZGVBdCgwKSA9PT0gMHgzQS8qIDogKi8pIHtcbiAgICAgIGFsaWducy5wdXNoKCdsZWZ0JylcbiAgICB9IGVsc2Uge1xuICAgICAgYWxpZ25zLnB1c2goJycpXG4gICAgfVxuICB9XG5cbiAgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBzdGFydExpbmUpLnRyaW0oKVxuICBpZiAobGluZVRleHQuaW5kZXhPZignfCcpID09PSAtMSkgeyByZXR1cm4gZmFsc2UgfVxuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuICBjb2x1bW5zID0gZXNjYXBlZFNwbGl0KGxpbmVUZXh0KVxuICBpZiAoY29sdW1ucy5sZW5ndGggJiYgY29sdW1uc1swXSA9PT0gJycpIGNvbHVtbnMuc2hpZnQoKVxuICBpZiAoY29sdW1ucy5sZW5ndGggJiYgY29sdW1uc1tjb2x1bW5zLmxlbmd0aCAtIDFdID09PSAnJykgY29sdW1ucy5wb3AoKVxuXG4gIC8vIGhlYWRlciByb3cgd2lsbCBkZWZpbmUgYW4gYW1vdW50IG9mIGNvbHVtbnMgaW4gdGhlIGVudGlyZSB0YWJsZSxcbiAgLy8gYW5kIGFsaWduIHJvdyBzaG91bGQgYmUgZXhhY3RseSB0aGUgc2FtZSAodGhlIHJlc3Qgb2YgdGhlIHJvd3MgY2FuIGRpZmZlcilcbiAgY29uc3QgY29sdW1uQ291bnQgPSBjb2x1bW5zLmxlbmd0aFxuICBpZiAoY29sdW1uQ291bnQgPT09IDAgfHwgY29sdW1uQ291bnQgIT09IGFsaWducy5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlIH1cblxuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZVxuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3RhYmxlJ1xuXG4gIC8vIHVzZSAnYmxvY2txdW90ZScgbGlzdHMgZm9yIHRlcm1pbmF0aW9uIGJlY2F1c2UgaXQnc1xuICAvLyB0aGUgbW9zdCBzaW1pbGFyIHRvIHRhYmxlc1xuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnYmxvY2txdW90ZScpXG5cbiAgY29uc3QgdG9rZW5fdG8gPSBzdGF0ZS5wdXNoKCd0YWJsZV9vcGVuJywgJ3RhYmxlJywgMSlcbiAgY29uc3QgdGFibGVMaW5lcyA9IFtzdGFydExpbmUsIDBdXG4gIHRva2VuX3RvLm1hcCA9IHRhYmxlTGluZXNcblxuICBjb25zdCB0b2tlbl90aG8gPSBzdGF0ZS5wdXNoKCd0aGVhZF9vcGVuJywgJ3RoZWFkJywgMSlcbiAgdG9rZW5fdGhvLm1hcCA9IFtzdGFydExpbmUsIHN0YXJ0TGluZSArIDFdXG5cbiAgY29uc3QgdG9rZW5faHRybyA9IHN0YXRlLnB1c2goJ3RyX29wZW4nLCAndHInLCAxKVxuICB0b2tlbl9odHJvLm1hcCA9IFtzdGFydExpbmUsIHN0YXJ0TGluZSArIDFdXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdG9rZW5faG8gPSBzdGF0ZS5wdXNoKCd0aF9vcGVuJywgJ3RoJywgMSlcbiAgICBpZiAoYWxpZ25zW2ldKSB7XG4gICAgICB0b2tlbl9oby5hdHRycyA9IFtbJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXV1dXG4gICAgfVxuXG4gICAgY29uc3QgdG9rZW5faWwgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMClcbiAgICB0b2tlbl9pbC5jb250ZW50ID0gY29sdW1uc1tpXS50cmltKClcbiAgICB0b2tlbl9pbC5jaGlsZHJlbiA9IFtdXG5cbiAgICBzdGF0ZS5wdXNoKCd0aF9jbG9zZScsICd0aCcsIC0xKVxuICB9XG5cbiAgc3RhdGUucHVzaCgndHJfY2xvc2UnLCAndHInLCAtMSlcbiAgc3RhdGUucHVzaCgndGhlYWRfY2xvc2UnLCAndGhlYWQnLCAtMSlcblxuICBsZXQgdGJvZHlMaW5lc1xuICBsZXQgYXV0b2NvbXBsZXRlZENlbGxzID0gMFxuXG4gIGZvciAobmV4dExpbmUgPSBzdGFydExpbmUgKyAyOyBuZXh0TGluZSA8IGVuZExpbmU7IG5leHRMaW5lKyspIHtcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhayB9XG5cbiAgICBsZXQgdGVybWluYXRlID0gZmFsc2VcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhayB9XG4gICAgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBuZXh0TGluZSkudHJpbSgpXG4gICAgaWYgKCFsaW5lVGV4dCkgeyBicmVhayB9XG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyBicmVhayB9XG4gICAgY29sdW1ucyA9IGVzY2FwZWRTcGxpdChsaW5lVGV4dClcbiAgICBpZiAoY29sdW1ucy5sZW5ndGggJiYgY29sdW1uc1swXSA9PT0gJycpIGNvbHVtbnMuc2hpZnQoKVxuICAgIGlmIChjb2x1bW5zLmxlbmd0aCAmJiBjb2x1bW5zW2NvbHVtbnMubGVuZ3RoIC0gMV0gPT09ICcnKSBjb2x1bW5zLnBvcCgpXG5cbiAgICAvLyBub3RlOiBhdXRvY29tcGxldGUgY291bnQgY2FuIGJlIG5lZ2F0aXZlIGlmIHVzZXIgc3BlY2lmaWVzIG1vcmUgY29sdW1ucyB0aGFuIGhlYWRlcixcbiAgICAvLyBidXQgdGhhdCBkb2VzIG5vdCBhZmZlY3QgaW50ZW5kZWQgdXNlICh3aGljaCBpcyBsaW1pdGluZyBleHBhbnNpb24pXG4gICAgYXV0b2NvbXBsZXRlZENlbGxzICs9IGNvbHVtbkNvdW50IC0gY29sdW1ucy5sZW5ndGhcbiAgICBpZiAoYXV0b2NvbXBsZXRlZENlbGxzID4gTUFYX0FVVE9DT01QTEVURURfQ0VMTFMpIHsgYnJlYWsgfVxuXG4gICAgaWYgKG5leHRMaW5lID09PSBzdGFydExpbmUgKyAyKSB7XG4gICAgICBjb25zdCB0b2tlbl90Ym8gPSBzdGF0ZS5wdXNoKCd0Ym9keV9vcGVuJywgJ3Rib2R5JywgMSlcbiAgICAgIHRva2VuX3Riby5tYXAgPSB0Ym9keUxpbmVzID0gW3N0YXJ0TGluZSArIDIsIDBdXG4gICAgfVxuXG4gICAgY29uc3QgdG9rZW5fdHJvID0gc3RhdGUucHVzaCgndHJfb3BlbicsICd0cicsIDEpXG4gICAgdG9rZW5fdHJvLm1hcCA9IFtuZXh0TGluZSwgbmV4dExpbmUgKyAxXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2x1bW5Db3VudDsgaSsrKSB7XG4gICAgICBjb25zdCB0b2tlbl90ZG8gPSBzdGF0ZS5wdXNoKCd0ZF9vcGVuJywgJ3RkJywgMSlcbiAgICAgIGlmIChhbGlnbnNbaV0pIHtcbiAgICAgICAgdG9rZW5fdGRvLmF0dHJzID0gW1snc3R5bGUnLCAndGV4dC1hbGlnbjonICsgYWxpZ25zW2ldXV1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdG9rZW5faWwgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMClcbiAgICAgIHRva2VuX2lsLmNvbnRlbnQgPSBjb2x1bW5zW2ldID8gY29sdW1uc1tpXS50cmltKCkgOiAnJ1xuICAgICAgdG9rZW5faWwuY2hpbGRyZW4gPSBbXVxuXG4gICAgICBzdGF0ZS5wdXNoKCd0ZF9jbG9zZScsICd0ZCcsIC0xKVxuICAgIH1cbiAgICBzdGF0ZS5wdXNoKCd0cl9jbG9zZScsICd0cicsIC0xKVxuICB9XG5cbiAgaWYgKHRib2R5TGluZXMpIHtcbiAgICBzdGF0ZS5wdXNoKCd0Ym9keV9jbG9zZScsICd0Ym9keScsIC0xKVxuICAgIHRib2R5TGluZXNbMV0gPSBuZXh0TGluZVxuICB9XG5cbiAgc3RhdGUucHVzaCgndGFibGVfY2xvc2UnLCAndGFibGUnLCAtMSlcbiAgdGFibGVMaW5lc1sxXSA9IG5leHRMaW5lXG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGVcbiAgc3RhdGUubGluZSA9IG5leHRMaW5lXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gQ29kZSBibG9jayAoNCBzcGFjZXMgcGFkZGVkKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb2RlIChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLyosIHNpbGVudCAqLykge1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPCA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMVxuICBsZXQgbGFzdCA9IG5leHRMaW5lXG5cbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIGlmIChzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkge1xuICAgICAgbmV4dExpbmUrK1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICBuZXh0TGluZSsrXG4gICAgICBsYXN0ID0gbmV4dExpbmVcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGJyZWFrXG4gIH1cblxuICBzdGF0ZS5saW5lID0gbGFzdFxuXG4gIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnY29kZV9ibG9jaycsICdjb2RlJywgMClcbiAgdG9rZW4uY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbGFzdCwgNCArIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpICsgJ1xcbidcbiAgdG9rZW4ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV1cblxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIGZlbmNlcyAoYGBgIGxhbmcsIH5+fiBsYW5nKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmZW5jZSAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdXG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKHBvcyArIDMgPiBtYXgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgaWYgKG1hcmtlciAhPT0gMHg3RS8qIH4gKi8gJiYgbWFya2VyICE9PSAweDYwIC8qIGAgKi8pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIHNjYW4gbWFya2VyIGxlbmd0aFxuICBsZXQgbWVtID0gcG9zXG4gIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcilcblxuICBsZXQgbGVuID0gcG9zIC0gbWVtXG5cbiAgaWYgKGxlbiA8IDMpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBtYXJrdXAgPSBzdGF0ZS5zcmMuc2xpY2UobWVtLCBwb3MpXG4gIGNvbnN0IHBhcmFtcyA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heClcblxuICBpZiAobWFya2VyID09PSAweDYwIC8qIGAgKi8pIHtcbiAgICBpZiAocGFyYW1zLmluZGV4T2YoU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpKSA+PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvLyBTaW5jZSBzdGFydCBpcyBmb3VuZCwgd2UgY2FuIHJlcG9ydCBzdWNjZXNzIGhlcmUgaW4gdmFsaWRhdGlvbiBtb2RlXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWUgfVxuXG4gIC8vIHNlYXJjaCBlbmQgb2YgYmxvY2tcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lXG4gIGxldCBoYXZlRW5kTWFya2VyID0gZmFsc2VcblxuICBmb3IgKDs7KSB7XG4gICAgbmV4dExpbmUrK1xuICAgIGlmIChuZXh0TGluZSA+PSBlbmRMaW5lKSB7XG4gICAgICAvLyB1bmNsb3NlZCBibG9jayBzaG91bGQgYmUgYXV0b2Nsb3NlZCBieSBlbmQgb2YgZG9jdW1lbnQuXG4gICAgICAvLyBhbHNvIGJsb2NrIHNlZW1zIHRvIGJlIGF1dG9jbG9zZWQgYnkgZW5kIG9mIHBhcmVudFxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBwb3MgPSBtZW0gPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV1cblxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkge1xuICAgICAgLy8gbm9uLWVtcHR5IGxpbmUgd2l0aCBuZWdhdGl2ZSBpbmRlbnQgc2hvdWxkIHN0b3AgdGhlIGxpc3Q6XG4gICAgICAvLyAtIGBgYFxuICAgICAgLy8gIHRlc3RcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IG1hcmtlcikgeyBjb250aW51ZSB9XG5cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICAvLyBjbG9zaW5nIGZlbmNlIHNob3VsZCBiZSBpbmRlbnRlZCBsZXNzIHRoYW4gNCBzcGFjZXNcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgcG9zID0gc3RhdGUuc2tpcENoYXJzKHBvcywgbWFya2VyKVxuXG4gICAgLy8gY2xvc2luZyBjb2RlIGZlbmNlIG11c3QgYmUgYXQgbGVhc3QgYXMgbG9uZyBhcyB0aGUgb3BlbmluZyBvbmVcbiAgICBpZiAocG9zIC0gbWVtIDwgbGVuKSB7IGNvbnRpbnVlIH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0YWlsIGhhcyBzcGFjZXMgb25seVxuICAgIHBvcyA9IHN0YXRlLnNraXBTcGFjZXMocG9zKVxuXG4gICAgaWYgKHBvcyA8IG1heCkgeyBjb250aW51ZSB9XG5cbiAgICBoYXZlRW5kTWFya2VyID0gdHJ1ZVxuICAgIC8vIGZvdW5kIVxuICAgIGJyZWFrXG4gIH1cblxuICAvLyBJZiBhIGZlbmNlIGhhcyBoZWFkaW5nIHNwYWNlcywgdGhleSBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIGl0cyBpbm5lciBibG9ja1xuICBsZW4gPSBzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZSArIChoYXZlRW5kTWFya2VyID8gMSA6IDApXG5cbiAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdmZW5jZScsICdjb2RlJywgMClcbiAgdG9rZW4uaW5mbyA9IHBhcmFtc1xuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lICsgMSwgbmV4dExpbmUsIGxlbiwgdHJ1ZSlcbiAgdG9rZW4ubWFya3VwID0gbWFya3VwXG4gIHRva2VuLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBCbG9jayBxdW90ZXNcblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJsb2NrcXVvdGUgKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cblxuICBjb25zdCBvbGRMaW5lTWF4ID0gc3RhdGUubGluZU1heFxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gY2hlY2sgdGhlIGJsb2NrIHF1b3RlIG1hcmtlclxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzRS8qID4gKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyB3ZSBrbm93IHRoYXQgaXQncyBnb2luZyB0byBiZSBhIHZhbGlkIGJsb2NrcXVvdGUsXG4gIC8vIHNvIG5vIHBvaW50IHRyeWluZyB0byBmaW5kIHRoZSBlbmQgb2YgaXQgaW4gc2lsZW50IG1vZGVcbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgY29uc3Qgb2xkQk1hcmtzID0gW11cbiAgY29uc3Qgb2xkQlNDb3VudCA9IFtdXG4gIGNvbnN0IG9sZFNDb3VudCA9IFtdXG4gIGNvbnN0IG9sZFRTaGlmdCA9IFtdXG5cbiAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ2Jsb2NrcXVvdGUnKVxuXG4gIGNvbnN0IG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlXG4gIHN0YXRlLnBhcmVudFR5cGUgPSAnYmxvY2txdW90ZSdcbiAgbGV0IGxhc3RMaW5lRW1wdHkgPSBmYWxzZVxuICBsZXQgbmV4dExpbmVcblxuICAvLyBTZWFyY2ggdGhlIGVuZCBvZiB0aGUgYmxvY2tcbiAgLy9cbiAgLy8gQmxvY2sgZW5kcyB3aXRoIGVpdGhlcjpcbiAgLy8gIDEuIGFuIGVtcHR5IGxpbmUgb3V0c2lkZTpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPiB0ZXN0XG4gIC8vXG4gIC8vICAgICBgYGBcbiAgLy8gIDIuIGFuIGVtcHR5IGxpbmUgaW5zaWRlOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+XG4gIC8vICAgICB0ZXN0XG4gIC8vICAgICBgYGBcbiAgLy8gIDMuIGFub3RoZXIgdGFnOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+IHRlc3RcbiAgLy8gICAgICAtIC0gLVxuICAvLyAgICAgYGBgXG4gIGZvciAobmV4dExpbmUgPSBzdGFydExpbmU7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgIC8vIGNoZWNrIGlmIGl0J3Mgb3V0ZGVudGVkLCBpLmUuIGl0J3MgaW5zaWRlIGxpc3QgaXRlbSBhbmQgaW5kZW50ZWRcbiAgICAvLyBsZXNzIHRoYW4gc2FpZCBsaXN0IGl0ZW06XG4gICAgLy9cbiAgICAvLyBgYGBcbiAgICAvLyAxLiBhbnl0aGluZ1xuICAgIC8vICAgID4gY3VycmVudCBibG9ja3F1b3RlXG4gICAgLy8gMi4gY2hlY2tpbmcgdGhpcyBsaW5lXG4gICAgLy8gYGBgXG4gICAgY29uc3QgaXNPdXRkZW50ZWQgPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50XG5cbiAgICBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV1cblxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICAvLyBDYXNlIDE6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoaXMgbGluZSBpcyBlbXB0eS5cbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKSA9PT0gMHgzRS8qID4gKi8gJiYgIWlzT3V0ZGVudGVkKSB7XG4gICAgICAvLyBUaGlzIGxpbmUgaXMgaW5zaWRlIHRoZSBibG9ja3F1b3RlLlxuXG4gICAgICAvLyBzZXQgb2Zmc2V0IHBhc3Qgc3BhY2VzIGFuZCBcIj5cIlxuICAgICAgbGV0IGluaXRpYWwgPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdICsgMVxuICAgICAgbGV0IHNwYWNlQWZ0ZXJNYXJrZXJcbiAgICAgIGxldCBhZGp1c3RUYWJcblxuICAgICAgLy8gc2tpcCBvbmUgb3B0aW9uYWwgc3BhY2UgYWZ0ZXIgJz4nXG4gICAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyMCAvKiBzcGFjZSAqLykge1xuICAgICAgICAvLyAnID4gICB0ZXN0ICdcbiAgICAgICAgLy8gICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlOlxuICAgICAgICBwb3MrK1xuICAgICAgICBpbml0aWFsKytcbiAgICAgICAgYWRqdXN0VGFiID0gZmFsc2VcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgwOSAvKiB0YWIgKi8pIHtcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IHRydWVcblxuICAgICAgICBpZiAoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdICsgaW5pdGlhbCkgJSA0ID09PSAzKSB7XG4gICAgICAgICAgLy8gJyAgPlxcdCAgdGVzdCAnXG4gICAgICAgICAgLy8gICAgICAgXiAtLSBwb3NpdGlvbiBzdGFydCBvZiBsaW5lIGhlcmUgKHRhYiBoYXMgd2lkdGg9PT0xKVxuICAgICAgICAgIHBvcysrXG4gICAgICAgICAgaW5pdGlhbCsrXG4gICAgICAgICAgYWRqdXN0VGFiID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyAnID5cXHQgIHRlc3QgJ1xuICAgICAgICAgIC8vICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICsgc2hpZnQgYnNDb3VudCBzbGlnaHRseVxuICAgICAgICAgIC8vICAgICAgICAgdG8gbWFrZSBleHRyYSBzcGFjZSBhcHBlYXJcbiAgICAgICAgICBhZGp1c3RUYWIgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSBmYWxzZVxuICAgICAgfVxuXG4gICAgICBsZXQgb2Zmc2V0ID0gaW5pdGlhbFxuICAgICAgb2xkQk1hcmtzLnB1c2goc3RhdGUuYk1hcmtzW25leHRMaW5lXSlcbiAgICAgIHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gPSBwb3NcblxuICAgICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICAgICAgICBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgICAgICBpZiAoY2ggPT09IDB4MDkpIHtcbiAgICAgICAgICAgIG9mZnNldCArPSA0IC0gKG9mZnNldCArIHN0YXRlLmJzQ291bnRbbmV4dExpbmVdICsgKGFkanVzdFRhYiA/IDEgOiAwKSkgJSA0XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9mZnNldCsrXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBwb3MrK1xuICAgICAgfVxuXG4gICAgICBsYXN0TGluZUVtcHR5ID0gcG9zID49IG1heFxuXG4gICAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pXG4gICAgICBzdGF0ZS5ic0NvdW50W25leHRMaW5lXSA9IHN0YXRlLnNDb3VudFtuZXh0TGluZV0gKyAxICsgKHNwYWNlQWZ0ZXJNYXJrZXIgPyAxIDogMClcblxuICAgICAgb2xkU0NvdW50LnB1c2goc3RhdGUuc0NvdW50W25leHRMaW5lXSlcbiAgICAgIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPSBvZmZzZXQgLSBpbml0aWFsXG5cbiAgICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pXG4gICAgICBzdGF0ZS50U2hpZnRbbmV4dExpbmVdID0gcG9zIC0gc3RhdGUuYk1hcmtzW25leHRMaW5lXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBDYXNlIDI6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoZSBsYXN0IGxpbmUgd2FzIGVtcHR5LlxuICAgIGlmIChsYXN0TGluZUVtcHR5KSB7IGJyZWFrIH1cblxuICAgIC8vIENhc2UgMzogYW5vdGhlciB0YWcgZm91bmQuXG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXJtaW5hdGUpIHtcbiAgICAgIC8vIFF1aXJrIHRvIGVuZm9yY2UgXCJoYXJkIHRlcm1pbmF0aW9uIG1vZGVcIiBmb3IgcGFyYWdyYXBocztcbiAgICAgIC8vIG5vcm1hbGx5IGlmIHlvdSBjYWxsIGB0b2tlbml6ZShzdGF0ZSwgc3RhcnRMaW5lLCBuZXh0TGluZSlgLFxuICAgICAgLy8gcGFyYWdyYXBocyB3aWxsIGxvb2sgYmVsb3cgbmV4dExpbmUgZm9yIHBhcmFncmFwaCBjb250aW51YXRpb24sXG4gICAgICAvLyBidXQgaWYgYmxvY2txdW90ZSBpcyB0ZXJtaW5hdGVkIGJ5IGFub3RoZXIgdGFnLCB0aGV5IHNob3VsZG4ndFxuICAgICAgc3RhdGUubGluZU1heCA9IG5leHRMaW5lXG5cbiAgICAgIGlmIChzdGF0ZS5ibGtJbmRlbnQgIT09IDApIHtcbiAgICAgICAgLy8gc3RhdGUuYmxrSW5kZW50IHdhcyBub24temVybywgd2Ugbm93IHNldCBpdCB0byB6ZXJvLFxuICAgICAgICAvLyBzbyB3ZSBuZWVkIHRvIHJlLWNhbGN1bGF0ZSBhbGwgb2Zmc2V0cyB0byBhcHBlYXIgYXNcbiAgICAgICAgLy8gaWYgaW5kZW50IHdhc24ndCBjaGFuZ2VkXG4gICAgICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pXG4gICAgICAgIG9sZEJTQ291bnQucHVzaChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSlcbiAgICAgICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSlcbiAgICAgICAgb2xkU0NvdW50LnB1c2goc3RhdGUuc0NvdW50W25leHRMaW5lXSlcbiAgICAgICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSAtPSBzdGF0ZS5ibGtJbmRlbnRcbiAgICAgIH1cblxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKVxuICAgIG9sZEJTQ291bnQucHVzaChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSlcbiAgICBvbGRUU2hpZnQucHVzaChzdGF0ZS50U2hpZnRbbmV4dExpbmVdKVxuICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pXG5cbiAgICAvLyBBIG5lZ2F0aXZlIGluZGVudGF0aW9uIG1lYW5zIHRoYXQgdGhpcyBpcyBhIHBhcmFncmFwaCBjb250aW51YXRpb25cbiAgICAvL1xuICAgIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPSAtMVxuICB9XG5cbiAgY29uc3Qgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50XG4gIHN0YXRlLmJsa0luZGVudCA9IDBcblxuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnYmxvY2txdW90ZV9vcGVuJywgJ2Jsb2NrcXVvdGUnLCAxKVxuICB0b2tlbl9vLm1hcmt1cCA9ICc+J1xuICBjb25zdCBsaW5lcyA9IFtzdGFydExpbmUsIDBdXG4gIHRva2VuX28ubWFwID0gbGluZXNcblxuICBzdGF0ZS5tZC5ibG9jay50b2tlbml6ZShzdGF0ZSwgc3RhcnRMaW5lLCBuZXh0TGluZSlcblxuICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnYmxvY2txdW90ZV9jbG9zZScsICdibG9ja3F1b3RlJywgLTEpXG4gIHRva2VuX2MubWFya3VwID0gJz4nXG5cbiAgc3RhdGUubGluZU1heCA9IG9sZExpbmVNYXhcbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGVcbiAgbGluZXNbMV0gPSBzdGF0ZS5saW5lXG5cbiAgLy8gUmVzdG9yZSBvcmlnaW5hbCB0U2hpZnQ7IHRoaXMgbWlnaHQgbm90IGJlIG5lY2Vzc2FyeSBzaW5jZSB0aGUgcGFyc2VyXG4gIC8vIGhhcyBhbHJlYWR5IGJlZW4gaGVyZSwgYnV0IGp1c3QgdG8gbWFrZSBzdXJlIHdlIGNhbiBkbyB0aGF0LlxuICBmb3IgKGxldCBpID0gMDsgaSA8IG9sZFRTaGlmdC5sZW5ndGg7IGkrKykge1xuICAgIHN0YXRlLmJNYXJrc1tpICsgc3RhcnRMaW5lXSA9IG9sZEJNYXJrc1tpXVxuICAgIHN0YXRlLnRTaGlmdFtpICsgc3RhcnRMaW5lXSA9IG9sZFRTaGlmdFtpXVxuICAgIHN0YXRlLnNDb3VudFtpICsgc3RhcnRMaW5lXSA9IG9sZFNDb3VudFtpXVxuICAgIHN0YXRlLmJzQ291bnRbaSArIHN0YXJ0TGluZV0gPSBvbGRCU0NvdW50W2ldXG4gIH1cbiAgc3RhdGUuYmxrSW5kZW50ID0gb2xkSW5kZW50XG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBIb3Jpem9udGFsIHJ1bGVcblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhyIChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKylcblxuICAvLyBDaGVjayBociBtYXJrZXJcbiAgaWYgKG1hcmtlciAhPT0gMHgyQS8qICogKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyRC8qIC0gKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHg1Ri8qIF8gKi8pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIG1hcmtlcnMgY2FuIGJlIG1peGVkIHdpdGggc3BhY2VzLCBidXQgdGhlcmUgc2hvdWxkIGJlIGF0IGxlYXN0IDMgb2YgdGhlbVxuXG4gIGxldCBjbnQgPSAxXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuICAgIGlmIChjaCAhPT0gbWFya2VyICYmICFpc1NwYWNlKGNoKSkgeyByZXR1cm4gZmFsc2UgfVxuICAgIGlmIChjaCA9PT0gbWFya2VyKSB7IGNudCsrIH1cbiAgfVxuXG4gIGlmIChjbnQgPCAzKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIDFcblxuICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2hyJywgJ2hyJywgMClcbiAgdG9rZW4ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV1cbiAgdG9rZW4ubWFya3VwID0gQXJyYXkoY250ICsgMSkuam9pbihTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcikpXG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBMaXN0c1xuXG5pbXBvcnQgeyBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuLy8gU2VhcmNoIGBbLSsqXVtcXG4gXWAsIHJldHVybnMgbmV4dCBwb3MgYWZ0ZXIgbWFya2VyIG9uIHN1Y2Nlc3Ncbi8vIG9yIC0xIG9uIGZhaWwuXG5mdW5jdGlvbiBza2lwQnVsbGV0TGlzdE1hcmtlciAoc3RhdGUsIHN0YXJ0TGluZSkge1xuICBjb25zdCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuXG4gIGNvbnN0IG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuICAvLyBDaGVjayBidWxsZXRcbiAgaWYgKG1hcmtlciAhPT0gMHgyQS8qICogKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyRC8qIC0gKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyQi8qICsgKi8pIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIGlmIChwb3MgPCBtYXgpIHtcbiAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICAgIGlmICghaXNTcGFjZShjaCkpIHtcbiAgICAgIC8vIFwiIC10ZXN0IFwiIC0gaXMgbm90IGEgbGlzdCBpdGVtXG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcG9zXG59XG5cbi8vIFNlYXJjaCBgXFxkK1suKV1bXFxuIF1gLCByZXR1cm5zIG5leHQgcG9zIGFmdGVyIG1hcmtlciBvbiBzdWNjZXNzXG4vLyBvciAtMSBvbiBmYWlsLlxuZnVuY3Rpb24gc2tpcE9yZGVyZWRMaXN0TWFya2VyIChzdGF0ZSwgc3RhcnRMaW5lKSB7XG4gIGNvbnN0IHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuICBjb25zdCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuICBsZXQgcG9zID0gc3RhcnRcblxuICAvLyBMaXN0IG1hcmtlciBzaG91bGQgaGF2ZSBhdCBsZWFzdCAyIGNoYXJzIChkaWdpdCArIGRvdClcbiAgaWYgKHBvcyArIDEgPj0gbWF4KSB7IHJldHVybiAtMSB9XG5cbiAgbGV0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspXG5cbiAgaWYgKGNoIDwgMHgzMC8qIDAgKi8gfHwgY2ggPiAweDM5LyogOSAqLykgeyByZXR1cm4gLTEgfVxuXG4gIGZvciAoOzspIHtcbiAgICAvLyBFT0wgLT4gZmFpbFxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiAtMSB9XG5cbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKVxuXG4gICAgaWYgKGNoID49IDB4MzAvKiAwICovICYmIGNoIDw9IDB4MzkvKiA5ICovKSB7XG4gICAgICAvLyBMaXN0IG1hcmtlciBzaG91bGQgaGF2ZSBubyBtb3JlIHRoYW4gOSBkaWdpdHNcbiAgICAgIC8vIChwcmV2ZW50cyBpbnRlZ2VyIG92ZXJmbG93IGluIGJyb3dzZXJzKVxuICAgICAgaWYgKHBvcyAtIHN0YXJ0ID49IDEwKSB7IHJldHVybiAtMSB9XG5cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gZm91bmQgdmFsaWQgbWFya2VyXG4gICAgaWYgKGNoID09PSAweDI5LyogKSAqLyB8fCBjaCA9PT0gMHgyZS8qIC4gKi8pIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICBpZiAocG9zIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAvLyBcIiAxLnRlc3QgXCIgLSBpcyBub3QgYSBsaXN0IGl0ZW1cbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgfVxuICByZXR1cm4gcG9zXG59XG5cbmZ1bmN0aW9uIG1hcmtUaWdodFBhcmFncmFwaHMgKHN0YXRlLCBpZHgpIHtcbiAgY29uc3QgbGV2ZWwgPSBzdGF0ZS5sZXZlbCArIDJcblxuICBmb3IgKGxldCBpID0gaWR4ICsgMiwgbCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAyOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHN0YXRlLnRva2Vuc1tpXS5sZXZlbCA9PT0gbGV2ZWwgJiYgc3RhdGUudG9rZW5zW2ldLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tpICsgMl0uaGlkZGVuID0gdHJ1ZVxuICAgICAgc3RhdGUudG9rZW5zW2ldLmhpZGRlbiA9IHRydWVcbiAgICAgIGkgKz0gMlxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsaXN0IChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgbGV0IG1heCwgcG9zLCBzdGFydCwgdG9rZW5cbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lXG4gIGxldCB0aWdodCA9IHRydWVcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gU3BlY2lhbCBjYXNlOlxuICAvLyAgLSBpdGVtIDFcbiAgLy8gICAtIGl0ZW0gMlxuICAvLyAgICAtIGl0ZW0gM1xuICAvLyAgICAgLSBpdGVtIDRcbiAgLy8gICAgICAtIHRoaXMgb25lIGlzIGEgcGFyYWdyYXBoIGNvbnRpbnVhdGlvblxuICBpZiAoc3RhdGUubGlzdEluZGVudCA+PSAwICYmXG4gICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUubGlzdEluZGVudCA+PSA0ICYmXG4gICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBsZXQgaXNUZXJtaW5hdGluZ1BhcmFncmFwaCA9IGZhbHNlXG5cbiAgLy8gbGltaXQgY29uZGl0aW9ucyB3aGVuIGxpc3QgY2FuIGludGVycnVwdFxuICAvLyBhIHBhcmFncmFwaCAodmFsaWRhdGlvbiBtb2RlIG9ubHkpXG4gIGlmIChzaWxlbnQgJiYgc3RhdGUucGFyZW50VHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAvLyBOZXh0IGxpc3QgaXRlbSBzaG91bGQgc3RpbGwgdGVybWluYXRlIHByZXZpb3VzIGxpc3QgaXRlbTtcbiAgICAvL1xuICAgIC8vIFRoaXMgY29kZSBjYW4gZmFpbCBpZiBwbHVnaW5zIHVzZSBibGtJbmRlbnQgYXMgd2VsbCBhcyBsaXN0cyxcbiAgICAvLyBidXQgSSBob3BlIHRoZSBzcGVjIGdldHMgZml4ZWQgbG9uZyBiZWZvcmUgdGhhdCBoYXBwZW5zLlxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPj0gc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBpc1Rlcm1pbmF0aW5nUGFyYWdyYXBoID0gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIC8vIERldGVjdCBsaXN0IHR5cGUgYW5kIHBvc2l0aW9uIGFmdGVyIG1hcmtlclxuICBsZXQgaXNPcmRlcmVkXG4gIGxldCBtYXJrZXJWYWx1ZVxuICBsZXQgcG9zQWZ0ZXJNYXJrZXJcbiAgaWYgKChwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpKSA+PSAwKSB7XG4gICAgaXNPcmRlcmVkID0gdHJ1ZVxuICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICBtYXJrZXJWYWx1ZSA9IE51bWJlcihzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvc0FmdGVyTWFya2VyIC0gMSkpXG5cbiAgICAvLyBJZiB3ZSdyZSBzdGFydGluZyBhIG5ldyBvcmRlcmVkIGxpc3QgcmlnaHQgYWZ0ZXJcbiAgICAvLyBhIHBhcmFncmFwaCwgaXQgc2hvdWxkIHN0YXJ0IHdpdGggMS5cbiAgICBpZiAoaXNUZXJtaW5hdGluZ1BhcmFncmFwaCAmJiBtYXJrZXJWYWx1ZSAhPT0gMSkgcmV0dXJuIGZhbHNlXG4gIH0gZWxzZSBpZiAoKHBvc0FmdGVyTWFya2VyID0gc2tpcEJ1bGxldExpc3RNYXJrZXIoc3RhdGUsIG5leHRMaW5lKSkgPj0gMCkge1xuICAgIGlzT3JkZXJlZCA9IGZhbHNlXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBJZiB3ZSdyZSBzdGFydGluZyBhIG5ldyB1bm9yZGVyZWQgbGlzdCByaWdodCBhZnRlclxuICAvLyBhIHBhcmFncmFwaCwgZmlyc3QgbGluZSBzaG91bGQgbm90IGJlIGVtcHR5LlxuICBpZiAoaXNUZXJtaW5hdGluZ1BhcmFncmFwaCkge1xuICAgIGlmIChzdGF0ZS5za2lwU3BhY2VzKHBvc0FmdGVyTWFya2VyKSA+PSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdKSByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIEZvciB2YWxpZGF0aW9uIG1vZGUgd2UgY2FuIHRlcm1pbmF0ZSBpbW1lZGlhdGVseVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlIH1cblxuICAvLyBXZSBzaG91bGQgdGVybWluYXRlIGxpc3Qgb24gc3R5bGUgY2hhbmdlLiBSZW1lbWJlciBmaXJzdCBvbmUgdG8gY29tcGFyZS5cbiAgY29uc3QgbWFya2VyQ2hhckNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3NBZnRlck1hcmtlciAtIDEpXG5cbiAgLy8gU3RhcnQgbGlzdFxuICBjb25zdCBsaXN0VG9rSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aFxuXG4gIGlmIChpc09yZGVyZWQpIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ29yZGVyZWRfbGlzdF9vcGVuJywgJ29sJywgMSlcbiAgICBpZiAobWFya2VyVmFsdWUgIT09IDEpIHtcbiAgICAgIHRva2VuLmF0dHJzID0gW1snc3RhcnQnLCBtYXJrZXJWYWx1ZV1dXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgnYnVsbGV0X2xpc3Rfb3BlbicsICd1bCcsIDEpXG4gIH1cblxuICBjb25zdCBsaXN0TGluZXMgPSBbbmV4dExpbmUsIDBdXG4gIHRva2VuLm1hcCA9IGxpc3RMaW5lc1xuICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKVxuXG4gIC8vXG4gIC8vIEl0ZXJhdGUgbGlzdCBpdGVtc1xuICAvL1xuXG4gIGxldCBwcmV2RW1wdHlFbmQgPSBmYWxzZVxuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnbGlzdCcpXG5cbiAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGVcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdsaXN0J1xuXG4gIHdoaWxlIChuZXh0TGluZSA8IGVuZExpbmUpIHtcbiAgICBwb3MgPSBwb3NBZnRlck1hcmtlclxuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV1cblxuICAgIGNvbnN0IGluaXRpYWwgPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdICsgcG9zQWZ0ZXJNYXJrZXIgLSAoc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pXG4gICAgbGV0IG9mZnNldCA9IGluaXRpYWxcblxuICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gICAgICBpZiAoY2ggPT09IDB4MDkpIHtcbiAgICAgICAgb2Zmc2V0ICs9IDQgLSAob2Zmc2V0ICsgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pICUgNFxuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMHgyMCkge1xuICAgICAgICBvZmZzZXQrK1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgcG9zKytcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50U3RhcnQgPSBwb3NcbiAgICBsZXQgaW5kZW50QWZ0ZXJNYXJrZXJcblxuICAgIGlmIChjb250ZW50U3RhcnQgPj0gbWF4KSB7XG4gICAgICAvLyB0cmltbWluZyBzcGFjZSBpbiBcIi0gICAgXFxuICAzXCIgY2FzZSwgaW5kZW50IGlzIDEgaGVyZVxuICAgICAgaW5kZW50QWZ0ZXJNYXJrZXIgPSAxXG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gb2Zmc2V0IC0gaW5pdGlhbFxuICAgIH1cblxuICAgIC8vIElmIHdlIGhhdmUgbW9yZSB0aGFuIDQgc3BhY2VzLCB0aGUgaW5kZW50IGlzIDFcbiAgICAvLyAodGhlIHJlc3QgaXMganVzdCBpbmRlbnRlZCBjb2RlIGJsb2NrKVxuICAgIGlmIChpbmRlbnRBZnRlck1hcmtlciA+IDQpIHsgaW5kZW50QWZ0ZXJNYXJrZXIgPSAxIH1cblxuICAgIC8vIFwiICAtICB0ZXN0XCJcbiAgICAvLyAgXl5eXl4gLSBjYWxjdWxhdGluZyB0b3RhbCBsZW5ndGggb2YgdGhpcyB0aGluZ1xuICAgIGNvbnN0IGluZGVudCA9IGluaXRpYWwgKyBpbmRlbnRBZnRlck1hcmtlclxuXG4gICAgLy8gUnVuIHN1YnBhcnNlciAmIHdyaXRlIHRva2Vuc1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgnbGlzdF9pdGVtX29wZW4nLCAnbGknLCAxKVxuICAgIHRva2VuLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyQ2hhckNvZGUpXG4gICAgY29uc3QgaXRlbUxpbmVzID0gW25leHRMaW5lLCAwXVxuICAgIHRva2VuLm1hcCA9IGl0ZW1MaW5lc1xuICAgIGlmIChpc09yZGVyZWQpIHtcbiAgICAgIHRva2VuLmluZm8gPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvc0FmdGVyTWFya2VyIC0gMSlcbiAgICB9XG5cbiAgICAvLyBjaGFuZ2UgY3VycmVudCBzdGF0ZSwgdGhlbiByZXN0b3JlIGl0IGFmdGVyIHBhcnNlciBzdWJjYWxsXG4gICAgY29uc3Qgb2xkVGlnaHQgPSBzdGF0ZS50aWdodFxuICAgIGNvbnN0IG9sZFRTaGlmdCA9IHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICBjb25zdCBvbGRTQ291bnQgPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdXG5cbiAgICAvLyAgLSBleGFtcGxlIGxpc3RcbiAgICAvLyBeIGxpc3RJbmRlbnQgcG9zaXRpb24gd2lsbCBiZSBoZXJlXG4gICAgLy8gICBeIGJsa0luZGVudCBwb3NpdGlvbiB3aWxsIGJlIGhlcmVcbiAgICAvL1xuICAgIGNvbnN0IG9sZExpc3RJbmRlbnQgPSBzdGF0ZS5saXN0SW5kZW50XG4gICAgc3RhdGUubGlzdEluZGVudCA9IHN0YXRlLmJsa0luZGVudFxuICAgIHN0YXRlLmJsa0luZGVudCA9IGluZGVudFxuXG4gICAgc3RhdGUudGlnaHQgPSB0cnVlXG4gICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IGNvbnRlbnRTdGFydCAtIHN0YXRlLmJNYXJrc1tuZXh0TGluZV1cbiAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2Zmc2V0XG5cbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCAmJiBzdGF0ZS5pc0VtcHR5KG5leHRMaW5lICsgMSkpIHtcbiAgICAgIC8vIHdvcmthcm91bmQgZm9yIHRoaXMgY2FzZVxuICAgICAgLy8gKGxpc3QgaXRlbSBpcyBlbXB0eSwgbGlzdCB0ZXJtaW5hdGVzIGJlZm9yZSBcImZvb1wiKTpcbiAgICAgIC8vIH5+fn5+fn5+XG4gICAgICAvLyAgIC1cbiAgICAgIC8vXG4gICAgICAvLyAgICAgZm9vXG4gICAgICAvLyB+fn5+fn5+flxuICAgICAgc3RhdGUubGluZSA9IE1hdGgubWluKHN0YXRlLmxpbmUgKyAyLCBlbmRMaW5lKVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5tZC5ibG9jay50b2tlbml6ZShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpXG4gICAgfVxuXG4gICAgLy8gSWYgYW55IG9mIGxpc3QgaXRlbSBpcyB0aWdodCwgbWFyayBsaXN0IGFzIHRpZ2h0XG4gICAgaWYgKCFzdGF0ZS50aWdodCB8fCBwcmV2RW1wdHlFbmQpIHtcbiAgICAgIHRpZ2h0ID0gZmFsc2VcbiAgICB9XG4gICAgLy8gSXRlbSBiZWNvbWUgbG9vc2UgaWYgZmluaXNoIHdpdGggZW1wdHkgbGluZSxcbiAgICAvLyBidXQgd2Ugc2hvdWxkIGZpbHRlciBsYXN0IGVsZW1lbnQsIGJlY2F1c2UgaXQgbWVhbnMgbGlzdCBmaW5pc2hcbiAgICBwcmV2RW1wdHlFbmQgPSAoc3RhdGUubGluZSAtIG5leHRMaW5lKSA+IDEgJiYgc3RhdGUuaXNFbXB0eShzdGF0ZS5saW5lIC0gMSlcblxuICAgIHN0YXRlLmJsa0luZGVudCA9IHN0YXRlLmxpc3RJbmRlbnRcbiAgICBzdGF0ZS5saXN0SW5kZW50ID0gb2xkTGlzdEluZGVudFxuICAgIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPSBvbGRUU2hpZnRcbiAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2xkU0NvdW50XG4gICAgc3RhdGUudGlnaHQgPSBvbGRUaWdodFxuXG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdsaXN0X2l0ZW1fY2xvc2UnLCAnbGknLCAtMSlcbiAgICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKVxuXG4gICAgbmV4dExpbmUgPSBzdGF0ZS5saW5lXG4gICAgaXRlbUxpbmVzWzFdID0gbmV4dExpbmVcblxuICAgIGlmIChuZXh0TGluZSA+PSBlbmRMaW5lKSB7IGJyZWFrIH1cblxuICAgIC8vXG4gICAgLy8gVHJ5IHRvIGNoZWNrIGlmIGxpc3QgaXMgdGVybWluYXRlZCBvciBjb250aW51ZWQuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhayB9XG5cbiAgICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgYnJlYWsgfVxuXG4gICAgLy8gZmFpbCBpZiB0ZXJtaW5hdGluZyBibG9jayBmb3VuZFxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhayB9XG5cbiAgICAvLyBmYWlsIGlmIGxpc3QgaGFzIGFub3RoZXIgdHlwZVxuICAgIGlmIChpc09yZGVyZWQpIHtcbiAgICAgIHBvc0FmdGVyTWFya2VyID0gc2tpcE9yZGVyZWRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSlcbiAgICAgIGlmIChwb3NBZnRlck1hcmtlciA8IDApIHsgYnJlYWsgfVxuICAgICAgc3RhcnQgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXVxuICAgIH0gZWxzZSB7XG4gICAgICBwb3NBZnRlck1hcmtlciA9IHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSlcbiAgICAgIGlmIChwb3NBZnRlck1hcmtlciA8IDApIHsgYnJlYWsgfVxuICAgIH1cblxuICAgIGlmIChtYXJrZXJDaGFyQ29kZSAhPT0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKSkgeyBicmVhayB9XG4gIH1cblxuICAvLyBGaW5hbGl6ZSBsaXN0XG4gIGlmIChpc09yZGVyZWQpIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ29yZGVyZWRfbGlzdF9jbG9zZScsICdvbCcsIC0xKVxuICB9IGVsc2Uge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgnYnVsbGV0X2xpc3RfY2xvc2UnLCAndWwnLCAtMSlcbiAgfVxuICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKVxuXG4gIGxpc3RMaW5lc1sxXSA9IG5leHRMaW5lXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZVxuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlXG5cbiAgLy8gbWFyayBwYXJhZ3JhcGhzIHRpZ2h0IGlmIG5lZWRlZFxuICBpZiAodGlnaHQpIHtcbiAgICBtYXJrVGlnaHRQYXJhZ3JhcGhzKHN0YXRlLCBsaXN0VG9rSWR4KVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cbiIsICJpbXBvcnQgeyBpc1NwYWNlLCBub3JtYWxpemVSZWZlcmVuY2UgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZWZlcmVuY2UgKHN0YXRlLCBzdGFydExpbmUsIF9lbmRMaW5lLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV1cbiAgbGV0IG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdXG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDFcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGZ1bmN0aW9uIGdldE5leHRMaW5lIChuZXh0TGluZSkge1xuICAgIGNvbnN0IGVuZExpbmUgPSBzdGF0ZS5saW5lTWF4XG5cbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSB8fCBzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkge1xuICAgICAgLy8gZW1wdHkgbGluZSBvciBlbmQgb2YgaW5wdXRcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgbGV0IGlzQ29udGludWF0aW9uID0gZmFsc2VcblxuICAgIC8vIHRoaXMgd291bGQgYmUgYSBjb2RlIGJsb2NrIG5vcm1hbGx5LCBidXQgYWZ0ZXIgcGFyYWdyYXBoXG4gICAgLy8gaXQncyBjb25zaWRlcmVkIGEgbGF6eSBjb250aW51YXRpb24gcmVnYXJkbGVzcyBvZiB3aGF0J3MgdGhlcmVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgaXNDb250aW51YXRpb24gPSB0cnVlIH1cblxuICAgIC8vIHF1aXJrIGZvciBibG9ja3F1b3RlcywgdGhpcyBsaW5lIHNob3VsZCBhbHJlYWR5IGJlIGNoZWNrZWQgYnkgdGhhdCBydWxlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCAwKSB7IGlzQ29udGludWF0aW9uID0gdHJ1ZSB9XG5cbiAgICBpZiAoIWlzQ29udGludWF0aW9uKSB7XG4gICAgICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncmVmZXJlbmNlJylcbiAgICAgIGNvbnN0IG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlXG4gICAgICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3JlZmVyZW5jZSdcblxuICAgICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZVxuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICAgIHRlcm1pbmF0ZSA9IHRydWVcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlXG4gICAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICAgIC8vIHRlcm1pbmF0ZWQgYnkgYW5vdGhlciBibG9ja1xuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdXG4gICAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXVxuXG4gICAgLy8gbWF4ICsgMSBleHBsaWNpdGx5IGluY2x1ZGVzIHRoZSBuZXdsaW5lXG4gICAgcmV0dXJuIHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCArIDEpXG4gIH1cblxuICBsZXQgc3RyID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4ICsgMSlcblxuICBtYXggPSBzdHIubGVuZ3RoXG4gIGxldCBsYWJlbEVuZCA9IC0xXG5cbiAgZm9yIChwb3MgPSAxOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKGNoID09PSAweDVCIC8qIFsgKi8pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4NUQgLyogXSAqLykge1xuICAgICAgbGFiZWxFbmQgPSBwb3NcbiAgICAgIGJyZWFrXG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHgwQSAvKiBcXG4gKi8pIHtcbiAgICAgIGNvbnN0IGxpbmVDb250ZW50ID0gZ2V0TmV4dExpbmUobmV4dExpbmUpXG4gICAgICBpZiAobGluZUNvbnRlbnQgIT09IG51bGwpIHtcbiAgICAgICAgc3RyICs9IGxpbmVDb250ZW50XG4gICAgICAgIG1heCA9IHN0ci5sZW5ndGhcbiAgICAgICAgbmV4dExpbmUrK1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4NUMgLyogXFwgKi8pIHtcbiAgICAgIHBvcysrXG4gICAgICBpZiAocG9zIDwgbWF4ICYmIHN0ci5jaGFyQ29kZUF0KHBvcykgPT09IDB4MEEpIHtcbiAgICAgICAgY29uc3QgbGluZUNvbnRlbnQgPSBnZXROZXh0TGluZShuZXh0TGluZSlcbiAgICAgICAgaWYgKGxpbmVDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgc3RyICs9IGxpbmVDb250ZW50XG4gICAgICAgICAgbWF4ID0gc3RyLmxlbmd0aFxuICAgICAgICAgIG5leHRMaW5lKytcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChsYWJlbEVuZCA8IDAgfHwgc3RyLmNoYXJDb2RlQXQobGFiZWxFbmQgKyAxKSAhPT0gMHgzQS8qIDogKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgIF5eXiBza2lwIG9wdGlvbmFsIHdoaXRlc3BhY2UgaGVyZVxuICBmb3IgKHBvcyA9IGxhYmVsRW5kICsgMjsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgIGlmIChjaCA9PT0gMHgwQSkge1xuICAgICAgY29uc3QgbGluZUNvbnRlbnQgPSBnZXROZXh0TGluZShuZXh0TGluZSlcbiAgICAgIGlmIChsaW5lQ29udGVudCAhPT0gbnVsbCkge1xuICAgICAgICBzdHIgKz0gbGluZUNvbnRlbnRcbiAgICAgICAgbWF4ID0gc3RyLmxlbmd0aFxuICAgICAgICBuZXh0TGluZSsrXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgLyogZXNsaW50IG5vLWVtcHR5OjAgKi9cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgIF5eXl5eXl5eXl5eIHBhcnNlIHRoaXNcbiAgY29uc3QgZGVzdFJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RyLCBwb3MsIG1heClcbiAgaWYgKCFkZXN0UmVzLm9rKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3QgaHJlZiA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsoZGVzdFJlcy5zdHIpXG4gIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGhyZWYpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcG9zID0gZGVzdFJlcy5wb3NcblxuICAvLyBzYXZlIGN1cnNvciBzdGF0ZSwgd2UgY291bGQgcmVxdWlyZSB0byByb2xsYmFjayBsYXRlclxuICBjb25zdCBkZXN0RW5kUG9zID0gcG9zXG4gIGNvbnN0IGRlc3RFbmRMaW5lTm8gPSBuZXh0TGluZVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBeXl4gc2tpcHBpbmcgdGhvc2Ugc3BhY2VzXG4gIGNvbnN0IHN0YXJ0ID0gcG9zXG4gIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKGNoID09PSAweDBBKSB7XG4gICAgICBjb25zdCBsaW5lQ29udGVudCA9IGdldE5leHRMaW5lKG5leHRMaW5lKVxuICAgICAgaWYgKGxpbmVDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHN0ciArPSBsaW5lQ29udGVudFxuICAgICAgICBtYXggPSBzdHIubGVuZ3RoXG4gICAgICAgIG5leHRMaW5lKytcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAvKiBOb3RoaW5nICovXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgIF5eXl5eXl4gcGFyc2UgdGhpc1xuICBsZXQgdGl0bGVSZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua1RpdGxlKHN0ciwgcG9zLCBtYXgpXG4gIHdoaWxlICh0aXRsZVJlcy5jYW5fY29udGludWUpIHtcbiAgICBjb25zdCBsaW5lQ29udGVudCA9IGdldE5leHRMaW5lKG5leHRMaW5lKVxuICAgIGlmIChsaW5lQ29udGVudCA9PT0gbnVsbCkgYnJlYWtcbiAgICBzdHIgKz0gbGluZUNvbnRlbnRcbiAgICBwb3MgPSBtYXhcbiAgICBtYXggPSBzdHIubGVuZ3RoXG4gICAgbmV4dExpbmUrK1xuICAgIHRpdGxlUmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4LCB0aXRsZVJlcylcbiAgfVxuICBsZXQgdGl0bGVcblxuICBpZiAocG9zIDwgbWF4ICYmIHN0YXJ0ICE9PSBwb3MgJiYgdGl0bGVSZXMub2spIHtcbiAgICB0aXRsZSA9IHRpdGxlUmVzLnN0clxuICAgIHBvcyA9IHRpdGxlUmVzLnBvc1xuICB9IGVsc2Uge1xuICAgIHRpdGxlID0gJydcbiAgICBwb3MgPSBkZXN0RW5kUG9zXG4gICAgbmV4dExpbmUgPSBkZXN0RW5kTGluZU5vXG4gIH1cblxuICAvLyBza2lwIHRyYWlsaW5nIHNwYWNlcyB1bnRpbCB0aGUgcmVzdCBvZiB0aGUgbGluZVxuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpXG4gICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhayB9XG4gICAgcG9zKytcbiAgfVxuXG4gIGlmIChwb3MgPCBtYXggJiYgc3RyLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgwQSkge1xuICAgIGlmICh0aXRsZSkge1xuICAgICAgLy8gZ2FyYmFnZSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lIGFmdGVyIHRpdGxlLFxuICAgICAgLy8gYnV0IGl0IGNvdWxkIHN0aWxsIGJlIGEgdmFsaWQgcmVmZXJlbmNlIGlmIHdlIHJvbGwgYmFja1xuICAgICAgdGl0bGUgPSAnJ1xuICAgICAgcG9zID0gZGVzdEVuZFBvc1xuICAgICAgbmV4dExpbmUgPSBkZXN0RW5kTGluZU5vXG4gICAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKVxuICAgICAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrIH1cbiAgICAgICAgcG9zKytcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAocG9zIDwgbWF4ICYmIHN0ci5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEpIHtcbiAgICAvLyBnYXJiYWdlIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmVcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGNvbnN0IGxhYmVsID0gbm9ybWFsaXplUmVmZXJlbmNlKHN0ci5zbGljZSgxLCBsYWJlbEVuZCkpXG4gIGlmICghbGFiZWwpIHtcbiAgICAvLyBDb21tb25NYXJrIDAuMjAgZGlzYWxsb3dzIGVtcHR5IGxhYmVsc1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gUmVmZXJlbmNlIGNhbiBub3QgdGVybWluYXRlIGFueXRoaW5nLiBUaGlzIGNoZWNrIGlzIGZvciBzYWZldHkgb25seS5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWUgfVxuXG4gIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgc3RhdGUuZW52LnJlZmVyZW5jZXMgPSB7fVxuICB9XG4gIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXNbbGFiZWxdID09PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLmVudi5yZWZlcmVuY2VzW2xhYmVsXSA9IHsgdGl0bGUsIGhyZWYgfVxuICB9XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gTGlzdCBvZiB2YWxpZCBodG1sIGJsb2NrcyBuYW1lcywgYWNjb3JkaW5nIHRvIGNvbW1vbm1hcmsgc3BlY1xuLy8gaHR0cHM6Ly9zcGVjLmNvbW1vbm1hcmsub3JnLzAuMzAvI2h0bWwtYmxvY2tzXG5cbmV4cG9ydCBkZWZhdWx0IFtcbiAgJ2FkZHJlc3MnLFxuICAnYXJ0aWNsZScsXG4gICdhc2lkZScsXG4gICdiYXNlJyxcbiAgJ2Jhc2Vmb250JyxcbiAgJ2Jsb2NrcXVvdGUnLFxuICAnYm9keScsXG4gICdjYXB0aW9uJyxcbiAgJ2NlbnRlcicsXG4gICdjb2wnLFxuICAnY29sZ3JvdXAnLFxuICAnZGQnLFxuICAnZGV0YWlscycsXG4gICdkaWFsb2cnLFxuICAnZGlyJyxcbiAgJ2RpdicsXG4gICdkbCcsXG4gICdkdCcsXG4gICdmaWVsZHNldCcsXG4gICdmaWdjYXB0aW9uJyxcbiAgJ2ZpZ3VyZScsXG4gICdmb290ZXInLFxuICAnZm9ybScsXG4gICdmcmFtZScsXG4gICdmcmFtZXNldCcsXG4gICdoMScsXG4gICdoMicsXG4gICdoMycsXG4gICdoNCcsXG4gICdoNScsXG4gICdoNicsXG4gICdoZWFkJyxcbiAgJ2hlYWRlcicsXG4gICdocicsXG4gICdodG1sJyxcbiAgJ2lmcmFtZScsXG4gICdsZWdlbmQnLFxuICAnbGknLFxuICAnbGluaycsXG4gICdtYWluJyxcbiAgJ21lbnUnLFxuICAnbWVudWl0ZW0nLFxuICAnbmF2JyxcbiAgJ25vZnJhbWVzJyxcbiAgJ29sJyxcbiAgJ29wdGdyb3VwJyxcbiAgJ29wdGlvbicsXG4gICdwJyxcbiAgJ3BhcmFtJyxcbiAgJ3NlYXJjaCcsXG4gICdzZWN0aW9uJyxcbiAgJ3N1bW1hcnknLFxuICAndGFibGUnLFxuICAndGJvZHknLFxuICAndGQnLFxuICAndGZvb3QnLFxuICAndGgnLFxuICAndGhlYWQnLFxuICAndGl0bGUnLFxuICAndHInLFxuICAndHJhY2snLFxuICAndWwnXG5dXG4iLCAiLy8gUmVnZXhwcyB0byBtYXRjaCBodG1sIGVsZW1lbnRzXG5cbmNvbnN0IGF0dHJfbmFtZSA9ICdbYS16QS1aXzpdW2EtekEtWjAtOTouXy1dKidcblxuY29uc3QgdW5xdW90ZWQgPSAnW15cIlxcJz08PmBcXFxceDAwLVxcXFx4MjBdKydcbmNvbnN0IHNpbmdsZV9xdW90ZWQgPSBcIidbXiddKidcIlxuY29uc3QgZG91YmxlX3F1b3RlZCA9ICdcIlteXCJdKlwiJ1xuXG5jb25zdCBhdHRyX3ZhbHVlID0gJyg/OicgKyB1bnF1b3RlZCArICd8JyArIHNpbmdsZV9xdW90ZWQgKyAnfCcgKyBkb3VibGVfcXVvdGVkICsgJyknXG5cbmNvbnN0IGF0dHJpYnV0ZSA9ICcoPzpcXFxccysnICsgYXR0cl9uYW1lICsgJyg/OlxcXFxzKj1cXFxccyonICsgYXR0cl92YWx1ZSArICcpPyknXG5cbmNvbnN0IG9wZW5fdGFnID0gJzxbQS1aYS16XVtBLVphLXowLTlcXFxcLV0qJyArIGF0dHJpYnV0ZSArICcqXFxcXHMqXFxcXC8/PidcblxuY29uc3QgY2xvc2VfdGFnID0gJzxcXFxcL1tBLVphLXpdW0EtWmEtejAtOVxcXFwtXSpcXFxccyo+J1xuY29uc3QgY29tbWVudCA9ICc8IS0tLT8+fDwhLS0oPzpbXi1dfC1bXi1dfC0tW14+XSkqLS0+J1xuY29uc3QgcHJvY2Vzc2luZyA9ICc8Wz9dW1xcXFxzXFxcXFNdKj9bP10+J1xuY29uc3QgZGVjbGFyYXRpb24gPSAnPCFbQS1aYS16XVtePl0qPidcbmNvbnN0IGNkYXRhID0gJzwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPidcblxuY29uc3QgSFRNTF9UQUdfUkUgPSBuZXcgUmVnRXhwKCdeKD86JyArIG9wZW5fdGFnICsgJ3wnICsgY2xvc2VfdGFnICsgJ3wnICsgY29tbWVudCArXG4gICAgICAgICAgICAgICAgICAgICAgICAnfCcgKyBwcm9jZXNzaW5nICsgJ3wnICsgZGVjbGFyYXRpb24gKyAnfCcgKyBjZGF0YSArICcpJylcbmNvbnN0IEhUTUxfT1BFTl9DTE9TRV9UQUdfUkUgPSBuZXcgUmVnRXhwKCdeKD86JyArIG9wZW5fdGFnICsgJ3wnICsgY2xvc2VfdGFnICsgJyknKVxuXG5leHBvcnQgeyBIVE1MX1RBR19SRSwgSFRNTF9PUEVOX0NMT1NFX1RBR19SRSB9XG4iLCAiLy8gSFRNTCBibG9ja1xuXG5pbXBvcnQgYmxvY2tfbmFtZXMgZnJvbSAnLi4vY29tbW9uL2h0bWxfYmxvY2tzLm1qcydcbmltcG9ydCB7IEhUTUxfT1BFTl9DTE9TRV9UQUdfUkUgfSBmcm9tICcuLi9jb21tb24vaHRtbF9yZS5tanMnXG5cbi8vIEFuIGFycmF5IG9mIG9wZW5pbmcgYW5kIGNvcnJlc3BvbmRpbmcgY2xvc2luZyBzZXF1ZW5jZXMgZm9yIGh0bWwgdGFncyxcbi8vIGxhc3QgYXJndW1lbnQgZGVmaW5lcyB3aGV0aGVyIGl0IGNhbiB0ZXJtaW5hdGUgYSBwYXJhZ3JhcGggb3Igbm90XG4vL1xuY29uc3QgSFRNTF9TRVFVRU5DRVMgPSBbXG4gIFsvXjwoc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSkoPz0oXFxzfD58JCkpL2ksIC88XFwvKHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpPi9pLCB0cnVlXSxcbiAgWy9ePCEtLS8sIC8tLT4vLCB0cnVlXSxcbiAgWy9ePFxcPy8sIC9cXD8+LywgdHJ1ZV0sXG4gIFsvXjwhW0EtWl0vLCAvPi8sIHRydWVdLFxuICBbL148IVxcW0NEQVRBXFxbLywgL1xcXVxcXT4vLCB0cnVlXSxcbiAgW25ldyBSZWdFeHAoJ148Lz8oJyArIGJsb2NrX25hbWVzLmpvaW4oJ3wnKSArICcpKD89KFxcXFxzfC8/PnwkKSknLCAnaScpLCAvXiQvLCB0cnVlXSxcbiAgW25ldyBSZWdFeHAoSFRNTF9PUEVOX0NMT1NFX1RBR19SRS5zb3VyY2UgKyAnXFxcXHMqJCcpLCAvXiQvLCBmYWxzZV1cbl1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaHRtbF9ibG9jayAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdXG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLmh0bWwpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQy8qIDwgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBsZXQgbGluZVRleHQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpXG5cbiAgbGV0IGkgPSAwXG4gIGZvciAoOyBpIDwgSFRNTF9TRVFVRU5DRVMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoSFRNTF9TRVFVRU5DRVNbaV1bMF0udGVzdChsaW5lVGV4dCkpIHsgYnJlYWsgfVxuICB9XG4gIGlmIChpID09PSBIVE1MX1NFUVVFTkNFUy5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoc2lsZW50KSB7XG4gICAgLy8gdHJ1ZSBpZiB0aGlzIHNlcXVlbmNlIGNhbiBiZSBhIHRlcm1pbmF0b3IsIGZhbHNlIG90aGVyd2lzZVxuICAgIHJldHVybiBIVE1MX1NFUVVFTkNFU1tpXVsyXVxuICB9XG5cbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMVxuXG4gIC8vIEJsb2NrIHR5cGVzIDYgYW5kIDcgKHRoZSBvbmx5IG9uZXMgd2hvc2UgZW5kIGNvbmRpdGlvbiBpcyBhIGJsYW5rIGxpbmUpXG4gIC8vIGhhdmUgYC9eJC9gIGFzIHRoZWlyIGNsb3NpbmcgcmVnZXhwLiBGb3IgYWxsIG90aGVyIHR5cGVzICgxLTUsIGUuZy5cbiAgLy8gYDwhLS1gIGNvbW1lbnRzKSwgYSBibGFuayBsaW5lIGlzIHJlZ3VsYXIgY29udGVudCBhbmQgbXVzdCBub3QgdGVybWluYXRlXG4gIC8vIHRoZSBibG9jayAtIGl0IGVuZHMgb25seSB3aGVuIGl0cyBjbG9zaW5nIHNlcXVlbmNlIGlzIGZvdW5kLlxuICBjb25zdCBlbmRzT25CbGFua0xpbmUgPSBIVE1MX1NFUVVFTkNFU1tpXVsxXS50ZXN0KCcnKVxuXG4gIC8vIElmIHdlIGFyZSBoZXJlIC0gd2UgZGV0ZWN0ZWQgSFRNTCBibG9jay5cbiAgLy8gTGV0J3Mgcm9sbCBkb3duIHRpbGwgYmxvY2sgZW5kLlxuICBpZiAoIUhUTUxfU0VRVUVOQ0VTW2ldWzFdLnRlc3QobGluZVRleHQpKSB7XG4gICAgZm9yICg7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgICAgLy8gQW4gb3V0ZGVudGVkIGJsYW5rIGxpbmUgc2hvdWxkbid0IGVuZCBhIGJsb2NrIHRoYXQgZG9lc24ndCBlbmQgb24gYVxuICAgICAgICAvLyBibGFuayBsaW5lIChlLmcuIGEgYDwhLS1gIGNvbW1lbnQgaW5zaWRlIGEgbGlzdCBpdGVtKS4gU3VjaCBibG9ja3NcbiAgICAgICAgLy8gbXVzdCBjb250aW51ZSB1bnRpbCB0aGVpciBjbG9zaW5nIHNlcXVlbmNlIHJlZ2FyZGxlc3Mgb2YgaW5kZW50LlxuICAgICAgICBpZiAoZW5kc09uQmxhbmtMaW5lIHx8ICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkgeyBicmVhayB9XG4gICAgICB9XG5cbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdXG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdXG4gICAgICBsaW5lVGV4dCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heClcblxuICAgICAgaWYgKEhUTUxfU0VRVUVOQ0VTW2ldWzFdLnRlc3QobGluZVRleHQpKSB7XG4gICAgICAgIGlmIChsaW5lVGV4dC5sZW5ndGggIT09IDApIHsgbmV4dExpbmUrKyB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lXG5cbiAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdodG1sX2Jsb2NrJywgJycsIDApXG4gIHRva2VuLm1hcCA9IFtzdGFydExpbmUsIG5leHRMaW5lXVxuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCB0cnVlKVxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gaGVhZGluZyAoIywgIyMsIC4uLilcblxuaW1wb3J0IHsgaXNTcGFjZSwgYXNjaWlUcmltIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaGVhZGluZyAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdXG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gIGlmIChjaCAhPT0gMHgyMy8qICMgKi8gfHwgcG9zID49IG1heCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIGNvdW50IGhlYWRpbmcgbGV2ZWxcbiAgbGV0IGxldmVsID0gMVxuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKVxuICB3aGlsZSAoY2ggPT09IDB4MjMvKiAjICovICYmIHBvcyA8IG1heCAmJiBsZXZlbCA8PSA2KSB7XG4gICAgbGV2ZWwrK1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoKytwb3MpXG4gIH1cblxuICBpZiAobGV2ZWwgPiA2IHx8IChwb3MgPCBtYXggJiYgIWlzU3BhY2UoY2gpKSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWUgfVxuXG4gIC8vIExldCdzIGN1dCB0YWlscyBsaWtlICcgICAgIyMjICAnIGZyb20gdGhlIGVuZCBvZiBzdHJpbmdcblxuICBtYXggPSBzdGF0ZS5za2lwU3BhY2VzQmFjayhtYXgsIHBvcylcbiAgY29uc3QgdG1wID0gc3RhdGUuc2tpcENoYXJzQmFjayhtYXgsIDB4MjMsIHBvcykgLy8gI1xuICBpZiAodG1wID4gcG9zICYmIGlzU3BhY2Uoc3RhdGUuc3JjLmNoYXJDb2RlQXQodG1wIC0gMSkpKSB7XG4gICAgbWF4ID0gdG1wXG4gIH1cblxuICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lICsgMVxuXG4gIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdoZWFkaW5nX29wZW4nLCAnaCcgKyBTdHJpbmcobGV2ZWwpLCAxKVxuICB0b2tlbl9vLm1hcmt1cCA9ICcjIyMjIyMjIycuc2xpY2UoMCwgbGV2ZWwpXG4gIHRva2VuX28ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV1cblxuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApXG4gIHRva2VuX2kuY29udGVudCA9IGFzY2lpVHJpbShzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpKVxuICB0b2tlbl9pLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG4gIHRva2VuX2kuY2hpbGRyZW4gPSBbXVxuXG4gIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS5wdXNoKCdoZWFkaW5nX2Nsb3NlJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgLTEpXG4gIHRva2VuX2MubWFya3VwID0gJyMjIyMjIyMjJy5zbGljZSgwLCBsZXZlbClcblxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIGxoZWFkaW5nICgtLS0sID09PSlcblxuaW1wb3J0IHsgYXNjaWlUcmltIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGhlYWRpbmcgKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUvKiwgc2lsZW50ICovKSB7XG4gIGNvbnN0IHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdwYXJhZ3JhcGgnKVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGVcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdwYXJhZ3JhcGgnIC8vIHVzZSBwYXJhZ3JhcGggdG8gbWF0Y2ggdGVybWluYXRvclJ1bGVzXG5cbiAgLy8ganVtcCBsaW5lLWJ5LWxpbmUgdW50aWwgZW1wdHkgb25lIG9yIEVPRlxuICBsZXQgbGV2ZWwgPSAwXG4gIGxldCBtYXJrZXJcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMVxuXG4gIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmUgJiYgIXN0YXRlLmlzRW1wdHkobmV4dExpbmUpOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAvLyBpdCdzIGNvbnNpZGVyZWQgYSBsYXp5IGNvbnRpbnVhdGlvbiByZWdhcmRsZXNzIG9mIHdoYXQncyB0aGVyZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykgeyBjb250aW51ZSB9XG5cbiAgICAvL1xuICAgIC8vIENoZWNrIGZvciB1bmRlcmxpbmUgaW4gc2V0ZXh0IGhlYWRlclxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPj0gc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV1cbiAgICAgIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV1cblxuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG5cbiAgICAgICAgaWYgKG1hcmtlciA9PT0gMHgyRC8qIC0gKi8gfHwgbWFya2VyID09PSAweDNELyogPSAqLykge1xuICAgICAgICAgIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcilcbiAgICAgICAgICBwb3MgPSBzdGF0ZS5za2lwU3BhY2VzKHBvcylcblxuICAgICAgICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICAgICAgICBsZXZlbCA9IChtYXJrZXIgPT09IDB4M0QvKiA9ICovID8gMSA6IDIpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHF1aXJrIGZvciBibG9ja3F1b3RlcywgdGhpcyBsaW5lIHNob3VsZCBhbHJlYWR5IGJlIGNoZWNrZWQgYnkgdGhhdCBydWxlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCAwKSB7IGNvbnRpbnVlIH1cblxuICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7IGJyZWFrIH1cbiAgfVxuXG4gIGlmICghbGV2ZWwpIHtcbiAgICAvLyBEaWRuJ3QgZmluZCB2YWxpZCB1bmRlcmxpbmVcbiAgICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGFzY2lpVHJpbShzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKSlcblxuICBzdGF0ZS5saW5lID0gbmV4dExpbmUgKyAxXG5cbiAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfb3BlbicsICdoJyArIFN0cmluZyhsZXZlbCksIDEpXG4gIHRva2VuX28ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpXG4gIHRva2VuX28ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV1cblxuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApXG4gIHRva2VuX2kuY29udGVudCA9IGNvbnRlbnRcbiAgdG9rZW5faS5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lIC0gMV1cbiAgdG9rZW5faS5jaGlsZHJlbiA9IFtdXG5cbiAgY29uc3QgdG9rZW5fYyA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfY2xvc2UnLCAnaCcgKyBTdHJpbmcobGV2ZWwpLCAtMSlcbiAgdG9rZW5fYy5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcilcblxuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZVxuXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gUGFyYWdyYXBoXG5cbmltcG9ydCB7IGFzY2lpVHJpbSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcmFncmFwaCAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSkge1xuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncGFyYWdyYXBoJylcbiAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGVcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMVxuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3BhcmFncmFwaCdcblxuICAvLyBqdW1wIGxpbmUtYnktbGluZSB1bnRpbCBlbXB0eSBvbmUgb3IgRU9GXG4gIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmUgJiYgIXN0YXRlLmlzRW1wdHkobmV4dExpbmUpOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAvLyBpdCdzIGNvbnNpZGVyZWQgYSBsYXp5IGNvbnRpbnVhdGlvbiByZWdhcmRsZXNzIG9mIHdoYXQncyB0aGVyZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykgeyBjb250aW51ZSB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBjb250aW51ZSB9XG5cbiAgICAvLyBTb21lIHRhZ3MgY2FuIHRlcm1pbmF0ZSBwYXJhZ3JhcGggd2l0aG91dCBlbXB0eSBsaW5lLlxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWVcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhayB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gYXNjaWlUcmltKHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpKVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZVxuXG4gIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdwYXJhZ3JhcGhfb3BlbicsICdwJywgMSlcbiAgdG9rZW5fby5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXVxuXG4gIGNvbnN0IHRva2VuX2kgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMClcbiAgdG9rZW5faS5jb250ZW50ID0gY29udGVudFxuICB0b2tlbl9pLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdXG4gIHRva2VuX2kuY2hpbGRyZW4gPSBbXVxuXG4gIHN0YXRlLnB1c2goJ3BhcmFncmFwaF9jbG9zZScsICdwJywgLTEpXG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGVcblxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8qKiBpbnRlcm5hbFxuICogY2xhc3MgUGFyc2VyQmxvY2tcbiAqXG4gKiBCbG9jay1sZXZlbCB0b2tlbml6ZXIuXG4gKiovXG5cbmltcG9ydCBSdWxlciBmcm9tICcuL3J1bGVyLm1qcydcbmltcG9ydCBTdGF0ZUJsb2NrIGZyb20gJy4vcnVsZXNfYmxvY2svc3RhdGVfYmxvY2subWpzJ1xuXG5pbXBvcnQgcl90YWJsZSBmcm9tICcuL3J1bGVzX2Jsb2NrL3RhYmxlLm1qcydcbmltcG9ydCByX2NvZGUgZnJvbSAnLi9ydWxlc19ibG9jay9jb2RlLm1qcydcbmltcG9ydCByX2ZlbmNlIGZyb20gJy4vcnVsZXNfYmxvY2svZmVuY2UubWpzJ1xuaW1wb3J0IHJfYmxvY2txdW90ZSBmcm9tICcuL3J1bGVzX2Jsb2NrL2Jsb2NrcXVvdGUubWpzJ1xuaW1wb3J0IHJfaHIgZnJvbSAnLi9ydWxlc19ibG9jay9oci5tanMnXG5pbXBvcnQgcl9saXN0IGZyb20gJy4vcnVsZXNfYmxvY2svbGlzdC5tanMnXG5pbXBvcnQgcl9yZWZlcmVuY2UgZnJvbSAnLi9ydWxlc19ibG9jay9yZWZlcmVuY2UubWpzJ1xuaW1wb3J0IHJfaHRtbF9ibG9jayBmcm9tICcuL3J1bGVzX2Jsb2NrL2h0bWxfYmxvY2subWpzJ1xuaW1wb3J0IHJfaGVhZGluZyBmcm9tICcuL3J1bGVzX2Jsb2NrL2hlYWRpbmcubWpzJ1xuaW1wb3J0IHJfbGhlYWRpbmcgZnJvbSAnLi9ydWxlc19ibG9jay9saGVhZGluZy5tanMnXG5pbXBvcnQgcl9wYXJhZ3JhcGggZnJvbSAnLi9ydWxlc19ibG9jay9wYXJhZ3JhcGgubWpzJ1xuXG5jb25zdCBfcnVsZXMgPSBbXG4gIC8vIEZpcnN0IDIgcGFyYW1zIC0gcnVsZSBuYW1lICYgc291cmNlLiBTZWNvbmRhcnkgYXJyYXkgLSBsaXN0IG9mIHJ1bGVzLFxuICAvLyB3aGljaCBjYW4gYmUgdGVybWluYXRlZCBieSB0aGlzIG9uZS5cbiAgWyd0YWJsZScsIHJfdGFibGUsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZSddXSxcbiAgWydjb2RlJywgcl9jb2RlXSxcbiAgWydmZW5jZScsIHJfZmVuY2UsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnXV0sXG4gIFsnYmxvY2txdW90ZScsIHJfYmxvY2txdW90ZSwgWydwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnLCAnbGlzdCddXSxcbiAgWydocicsIHJfaHIsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnXV0sXG4gIFsnbGlzdCcsIHJfbGlzdCwgWydwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnXV0sXG4gIFsncmVmZXJlbmNlJywgcl9yZWZlcmVuY2VdLFxuICBbJ2h0bWxfYmxvY2snLCByX2h0bWxfYmxvY2ssIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJ11dLFxuICBbJ2hlYWRpbmcnLCByX2hlYWRpbmcsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJ11dLFxuICBbJ2xoZWFkaW5nJywgcl9saGVhZGluZ10sXG4gIFsncGFyYWdyYXBoJywgcl9wYXJhZ3JhcGhdXG5dXG5cbi8qKlxuICogbmV3IFBhcnNlckJsb2NrKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlckJsb2NrICgpIHtcbiAgLyoqXG4gICAqIFBhcnNlckJsb2NrI3J1bGVyIC0+IFJ1bGVyXG4gICAqXG4gICAqIFtbUnVsZXJdXSBpbnN0YW5jZS4gS2VlcCBjb25maWd1cmF0aW9uIG9mIGJsb2NrIHJ1bGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgX3J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlci5wdXNoKF9ydWxlc1tpXVswXSwgX3J1bGVzW2ldWzFdLCB7IGFsdDogKF9ydWxlc1tpXVsyXSB8fCBbXSkuc2xpY2UoKSB9KVxuICB9XG59XG5cbi8vIEdlbmVyYXRlIHRva2VucyBmb3IgaW5wdXQgcmFuZ2Vcbi8vXG5QYXJzZXJCbG9jay5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSkge1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpXG4gIGNvbnN0IGxlbiA9IHJ1bGVzLmxlbmd0aFxuICBjb25zdCBtYXhOZXN0aW5nID0gc3RhdGUubWQub3B0aW9ucy5tYXhOZXN0aW5nXG4gIGxldCBsaW5lID0gc3RhcnRMaW5lXG4gIGxldCBoYXNFbXB0eUxpbmVzID0gZmFsc2VcblxuICB3aGlsZSAobGluZSA8IGVuZExpbmUpIHtcbiAgICBzdGF0ZS5saW5lID0gbGluZSA9IHN0YXRlLnNraXBFbXB0eUxpbmVzKGxpbmUpXG4gICAgaWYgKGxpbmUgPj0gZW5kTGluZSkgeyBicmVhayB9XG5cbiAgICAvLyBUZXJtaW5hdGlvbiBjb25kaXRpb24gZm9yIG5lc3RlZCBjYWxscy5cbiAgICAvLyBOZXN0ZWQgY2FsbHMgY3VycmVudGx5IHVzZWQgZm9yIGJsb2NrcXVvdGVzICYgbGlzdHNcbiAgICBpZiAoc3RhdGUuc0NvdW50W2xpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrIH1cblxuICAgIC8vIElmIG5lc3RpbmcgbGV2ZWwgZXhjZWVkZWQgLSBza2lwIHRhaWwgdG8gdGhlIGVuZC4gVGhhdCdzIG5vdCBvcmRpbmFyeVxuICAgIC8vIHNpdHVhdGlvbiBhbmQgd2Ugc2hvdWxkIG5vdCBjYXJlIGFib3V0IGNvbnRlbnQuXG4gICAgaWYgKHN0YXRlLmxldmVsID49IG1heE5lc3RpbmcpIHtcbiAgICAgIHN0YXRlLmxpbmUgPSBlbmRMaW5lXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIC8vIFRyeSBhbGwgcG9zc2libGUgcnVsZXMuXG4gICAgLy8gT24gc3VjY2VzcywgcnVsZSBzaG91bGQ6XG4gICAgLy9cbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUubGluZWBcbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUudG9rZW5zYFxuICAgIC8vIC0gcmV0dXJuIHRydWVcbiAgICBjb25zdCBwcmV2TGluZSA9IHN0YXRlLmxpbmVcbiAgICBsZXQgb2sgPSBmYWxzZVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgbGluZSwgZW5kTGluZSwgZmFsc2UpXG4gICAgICBpZiAob2spIHtcbiAgICAgICAgaWYgKHByZXZMaW5lID49IHN0YXRlLmxpbmUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJibG9jayBydWxlIGRpZG4ndCBpbmNyZW1lbnQgc3RhdGUubGluZVwiKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdGhpcyBjYW4gb25seSBoYXBwZW4gaWYgdXNlciBkaXNhYmxlcyBwYXJhZ3JhcGggcnVsZVxuICAgIGlmICghb2spIHRocm93IG5ldyBFcnJvcignbm9uZSBvZiB0aGUgYmxvY2sgcnVsZXMgbWF0Y2hlZCcpXG5cbiAgICAvLyBzZXQgc3RhdGUudGlnaHQgaWYgd2UgaGFkIGFuIGVtcHR5IGxpbmUgYmVmb3JlIGN1cnJlbnQgdGFnXG4gICAgLy8gaS5lLiBsYXRlc3QgZW1wdHkgbGluZSBzaG91bGQgbm90IGNvdW50XG4gICAgc3RhdGUudGlnaHQgPSAhaGFzRW1wdHlMaW5lc1xuXG4gICAgLy8gcGFyYWdyYXBoIG1pZ2h0IFwiZWF0XCIgb25lIG5ld2xpbmUgYWZ0ZXIgaXQgaW4gbmVzdGVkIGxpc3RzXG4gICAgaWYgKHN0YXRlLmlzRW1wdHkoc3RhdGUubGluZSAtIDEpKSB7XG4gICAgICBoYXNFbXB0eUxpbmVzID0gdHJ1ZVxuICAgIH1cblxuICAgIGxpbmUgPSBzdGF0ZS5saW5lXG5cbiAgICBpZiAobGluZSA8IGVuZExpbmUgJiYgc3RhdGUuaXNFbXB0eShsaW5lKSkge1xuICAgICAgaGFzRW1wdHlMaW5lcyA9IHRydWVcbiAgICAgIGxpbmUrK1xuICAgICAgc3RhdGUubGluZSA9IGxpbmVcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZXJCbG9jay5wYXJzZShzdHIsIG1kLCBlbnYsIG91dFRva2VucylcbiAqXG4gKiBQcm9jZXNzIGlucHV0IHN0cmluZyBhbmQgcHVzaCBibG9jayB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VyQmxvY2sucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHNyYywgbWQsIGVudiwgb3V0VG9rZW5zKSB7XG4gIGlmICghc3JjKSB7IHJldHVybiB9XG5cbiAgY29uc3Qgc3RhdGUgPSBuZXcgdGhpcy5TdGF0ZShzcmMsIG1kLCBlbnYsIG91dFRva2VucylcblxuICB0aGlzLnRva2VuaXplKHN0YXRlLCBzdGF0ZS5saW5lLCBzdGF0ZS5saW5lTWF4KVxufVxuXG5QYXJzZXJCbG9jay5wcm90b3R5cGUuU3RhdGUgPSBTdGF0ZUJsb2NrXG5cbmV4cG9ydCBkZWZhdWx0IFBhcnNlckJsb2NrXG4iLCAiLy8gSW5saW5lIHBhcnNlciBzdGF0ZVxuXG5pbXBvcnQgVG9rZW4gZnJvbSAnLi4vdG9rZW4ubWpzJ1xuaW1wb3J0IHsgaXNXaGl0ZVNwYWNlLCBpc1B1bmN0Q2hhckNvZGUsIGlzTWRBc2NpaVB1bmN0IH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZnVuY3Rpb24gU3RhdGVJbmxpbmUgKHNyYywgbWQsIGVudiwgb3V0VG9rZW5zKSB7XG4gIHRoaXMuc3JjID0gc3JjXG4gIHRoaXMuZW52ID0gZW52XG4gIHRoaXMubWQgPSBtZFxuICB0aGlzLnRva2VucyA9IG91dFRva2Vuc1xuICB0aGlzLnRva2Vuc19tZXRhID0gQXJyYXkob3V0VG9rZW5zLmxlbmd0aClcblxuICB0aGlzLnBvcyA9IDBcbiAgdGhpcy5wb3NNYXggPSB0aGlzLnNyYy5sZW5ndGhcbiAgdGhpcy5sZXZlbCA9IDBcbiAgdGhpcy5wZW5kaW5nID0gJydcbiAgdGhpcy5wZW5kaW5nTGV2ZWwgPSAwXG5cbiAgLy8gU3RvcmVzIHsgc3RhcnQ6IGVuZCB9IHBhaXJzLiBVc2VmdWwgZm9yIGJhY2t0cmFja1xuICAvLyBvcHRpbWl6YXRpb24gb2YgcGFpcnMgcGFyc2UgKGVtcGhhc2lzLCBzdHJpa2VzKS5cbiAgdGhpcy5jYWNoZSA9IHt9XG5cbiAgLy8gTGlzdCBvZiBlbXBoYXNpcy1saWtlIGRlbGltaXRlcnMgZm9yIGN1cnJlbnQgdGFnXG4gIHRoaXMuZGVsaW1pdGVycyA9IFtdXG5cbiAgLy8gU3RhY2sgb2YgZGVsaW1pdGVyIGxpc3RzIGZvciB1cHBlciBsZXZlbCB0YWdzXG4gIHRoaXMuX3ByZXZfZGVsaW1pdGVycyA9IFtdXG5cbiAgLy8gYmFja3RpY2sgbGVuZ3RoID0+IGxhc3Qgc2VlbiBwb3NpdGlvblxuICB0aGlzLmJhY2t0aWNrcyA9IHt9XG4gIHRoaXMuYmFja3RpY2tzU2Nhbm5lZCA9IGZhbHNlXG5cbiAgLy8gQ291bnRlciB1c2VkIHRvIGRpc2FibGUgaW5saW5lIGxpbmtpZnktaXQgZXhlY3V0aW9uXG4gIC8vIGluc2lkZSA8YT4gYW5kIG1hcmtkb3duIGxpbmtzXG4gIHRoaXMubGlua0xldmVsID0gMFxufVxuXG4vLyBGbHVzaCBwZW5kaW5nIHRleHRcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUucHVzaFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHRva2VuID0gbmV3IFRva2VuKCd0ZXh0JywgJycsIDApXG4gIHRva2VuLmNvbnRlbnQgPSB0aGlzLnBlbmRpbmdcbiAgdG9rZW4ubGV2ZWwgPSB0aGlzLnBlbmRpbmdMZXZlbFxuICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKVxuICB0aGlzLnBlbmRpbmcgPSAnJ1xuICByZXR1cm4gdG9rZW5cbn1cblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vIElmIHBlbmRpbmcgdGV4dCBleGlzdHMgLSBmbHVzaCBpdCBhcyB0ZXh0IHRva2VuXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodHlwZSwgdGFnLCBuZXN0aW5nKSB7XG4gIGlmICh0aGlzLnBlbmRpbmcpIHtcbiAgICB0aGlzLnB1c2hQZW5kaW5nKClcbiAgfVxuXG4gIGNvbnN0IHRva2VuID0gbmV3IFRva2VuKHR5cGUsIHRhZywgbmVzdGluZylcbiAgbGV0IHRva2VuX21ldGEgPSBudWxsXG5cbiAgaWYgKG5lc3RpbmcgPCAwKSB7XG4gICAgLy8gY2xvc2luZyB0YWdcbiAgICB0aGlzLmxldmVsLS1cbiAgICB0aGlzLmRlbGltaXRlcnMgPSB0aGlzLl9wcmV2X2RlbGltaXRlcnMucG9wKClcbiAgfVxuXG4gIHRva2VuLmxldmVsID0gdGhpcy5sZXZlbFxuXG4gIGlmIChuZXN0aW5nID4gMCkge1xuICAgIC8vIG9wZW5pbmcgdGFnXG4gICAgdGhpcy5sZXZlbCsrXG4gICAgdGhpcy5fcHJldl9kZWxpbWl0ZXJzLnB1c2godGhpcy5kZWxpbWl0ZXJzKVxuICAgIHRoaXMuZGVsaW1pdGVycyA9IFtdXG4gICAgdG9rZW5fbWV0YSA9IHsgZGVsaW1pdGVyczogdGhpcy5kZWxpbWl0ZXJzIH1cbiAgfVxuXG4gIHRoaXMucGVuZGluZ0xldmVsID0gdGhpcy5sZXZlbFxuICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKVxuICB0aGlzLnRva2Vuc19tZXRhLnB1c2godG9rZW5fbWV0YSlcbiAgcmV0dXJuIHRva2VuXG59XG5cbi8vIFNjYW4gYSBzZXF1ZW5jZSBvZiBlbXBoYXNpcy1saWtlIG1hcmtlcnMsIGFuZCBkZXRlcm1pbmUgd2hldGhlclxuLy8gaXQgY2FuIHN0YXJ0IGFuIGVtcGhhc2lzIHNlcXVlbmNlIG9yIGVuZCBhbiBlbXBoYXNpcyBzZXF1ZW5jZS5cbi8vXG4vLyAgLSBzdGFydCAtIHBvc2l0aW9uIHRvIHNjYW4gZnJvbSAoaXQgc2hvdWxkIHBvaW50IGF0IGEgdmFsaWQgbWFya2VyKTtcbi8vICAtIGNhblNwbGl0V29yZCAtIGRldGVybWluZSBpZiB0aGVzZSBtYXJrZXJzIGNhbiBiZSBmb3VuZCBpbnNpZGUgYSB3b3JkXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnNjYW5EZWxpbXMgPSBmdW5jdGlvbiAoc3RhcnQsIGNhblNwbGl0V29yZCkge1xuICBjb25zdCBtYXggPSB0aGlzLnBvc01heFxuICBjb25zdCBtYXJrZXIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KVxuXG4gIC8vIEFzdHJhbCBjaGFyYWN0ZXJzIGJlbG93IGFyZSBjb21iaW5lZCBtYW51YWxseSwgYmVjYXVzZSAuY29kZVBvaW50QXQoKVxuICAvLyBkb2VzIG5vdCBndWFyYW50ZWUgbnVtZXJpYyB0eXBlIG91dHB1dC4gQW5kIHdlIGRvbid0IHdpc2ggSklUIGNhY2hlIGlzc3Vlcy5cbiAgLy8gVGhlIGJyb2tlbiBzdXJyb2dhdGUgcGFpcnMgYXJlIGV2YWx1YXRlZCBhcyBVK0ZGRkQgdG8gcHJldmVudCBwb3NzaWJsZVxuICAvLyBjcmFzaGVzLlxuXG4gIGxldCBsYXN0Q2hhclxuICBpZiAoc3RhcnQgPT09IDApIHtcbiAgICAvLyB0cmVhdCBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgYXMgYSB3aGl0ZXNwYWNlXG4gICAgbGFzdENoYXIgPSAweDIwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPT09IDEpIHtcbiAgICBsYXN0Q2hhciA9IHRoaXMuc3JjLmNoYXJDb2RlQXQoMClcbiAgICBpZiAoKGxhc3RDaGFyICYgMHhGODAwKSA9PT0gMHhEODAwKSB7IGxhc3RDaGFyID0gMHhGRkZEIH1cbiAgfSBlbHNlIHtcbiAgICBsYXN0Q2hhciA9IHRoaXMuc3JjLmNoYXJDb2RlQXQoc3RhcnQgLSAxKVxuICAgIGlmICgobGFzdENoYXIgJiAweEZDMDApID09PSAweERDMDApIHtcbiAgICAgIC8vIGxvdyBzdXJyb2dhdGUgPT4gYWRkIGhpZ2ggb25lLCByZXBsYWNlIGJyb2tlbiBwYWlyIHdpdGggVStGRkZEXG4gICAgICBjb25zdCBoaWdoU3VyciA9IHRoaXMuc3JjLmNoYXJDb2RlQXQoc3RhcnQgLSAyKVxuICAgICAgbGFzdENoYXIgPSAoaGlnaFN1cnIgJiAweEZDMDApID09PSAweEQ4MDBcbiAgICAgICAgPyAweDEwMDAwICsgKChoaWdoU3VyciAtIDB4RDgwMCkgPDwgMTApICsgKGxhc3RDaGFyIC0gMHhEQzAwKVxuICAgICAgICA6IDB4RkZGRFxuICAgIH0gZWxzZSBpZiAoKGxhc3RDaGFyICYgMHhGQzAwKSA9PT0gMHhEODAwKSB7XG4gICAgICBsYXN0Q2hhciA9IDB4RkZGRFxuICAgIH1cbiAgfVxuXG4gIGxldCBwb3MgPSBzdGFydFxuICB3aGlsZSAocG9zIDwgbWF4ICYmIHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gbWFya2VyKSB7IHBvcysrIH1cblxuICBjb25zdCBjb3VudCA9IHBvcyAtIHN0YXJ0XG5cbiAgLy8gdHJlYXQgZW5kIG9mIHRoZSBsaW5lIGFzIGEgd2hpdGVzcGFjZVxuICBsZXQgbmV4dENoYXIgPSBwb3MgPCBtYXggPyB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgOiAweDIwXG4gIGlmICgobmV4dENoYXIgJiAweEZDMDApID09PSAweEQ4MDApIHtcbiAgICAvLyBoaWdoIHN1cnJvZ2F0ZSA9PiBhZGQgbG93IG9uZSwgcmVwbGFjZSBicm9rZW4gcGFpciB3aXRoIFUrRkZGRFxuICAgIGNvbnN0IGxvd1N1cnIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpXG4gICAgbmV4dENoYXIgPSAobG93U3VyciAmIDB4RkMwMCkgPT09IDB4REMwMFxuICAgICAgPyAweDEwMDAwICsgKChuZXh0Q2hhciAtIDB4RDgwMCkgPDwgMTApICsgKGxvd1N1cnIgLSAweERDMDApXG4gICAgICA6IDB4RkZGRFxuICB9IGVsc2UgaWYgKChuZXh0Q2hhciAmIDB4RkMwMCkgPT09IDB4REMwMCkge1xuICAgIG5leHRDaGFyID0gMHhGRkZEXG4gIH1cblxuICBjb25zdCBpc0xhc3RQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChsYXN0Q2hhcikgfHwgaXNQdW5jdENoYXJDb2RlKGxhc3RDaGFyKVxuICBjb25zdCBpc05leHRQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChuZXh0Q2hhcikgfHwgaXNQdW5jdENoYXJDb2RlKG5leHRDaGFyKVxuXG4gIGNvbnN0IGlzTGFzdFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobGFzdENoYXIpXG4gIGNvbnN0IGlzTmV4dFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobmV4dENoYXIpXG5cbiAgY29uc3QgbGVmdF9mbGFua2luZyA9XG4gICAgIWlzTmV4dFdoaXRlU3BhY2UgJiYgKCFpc05leHRQdW5jdENoYXIgfHwgaXNMYXN0V2hpdGVTcGFjZSB8fCBpc0xhc3RQdW5jdENoYXIpXG4gIGNvbnN0IHJpZ2h0X2ZsYW5raW5nID1cbiAgICAhaXNMYXN0V2hpdGVTcGFjZSAmJiAoIWlzTGFzdFB1bmN0Q2hhciB8fCBpc05leHRXaGl0ZVNwYWNlIHx8IGlzTmV4dFB1bmN0Q2hhcilcblxuICBjb25zdCBjYW5fb3BlbiA9IGxlZnRfZmxhbmtpbmcgJiYgKGNhblNwbGl0V29yZCB8fCAhcmlnaHRfZmxhbmtpbmcgfHwgaXNMYXN0UHVuY3RDaGFyKVxuICBjb25zdCBjYW5fY2xvc2UgPSByaWdodF9mbGFua2luZyAmJiAoY2FuU3BsaXRXb3JkIHx8ICFsZWZ0X2ZsYW5raW5nIHx8IGlzTmV4dFB1bmN0Q2hhcilcblxuICByZXR1cm4geyBjYW5fb3BlbiwgY2FuX2Nsb3NlLCBsZW5ndGg6IGNvdW50IH1cbn1cblxuLy8gcmUtZXhwb3J0IFRva2VuIGNsYXNzIHRvIHVzZSBpbiBibG9jayBydWxlc1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLlRva2VuID0gVG9rZW5cblxuZXhwb3J0IGRlZmF1bHQgU3RhdGVJbmxpbmVcbiIsICIvLyBTa2lwIHRleHQgY2hhcmFjdGVycyBmb3IgdGV4dCB0b2tlbiwgcGxhY2UgdGhvc2UgdG8gcGVuZGluZyBidWZmZXJcbi8vIGFuZCBpbmNyZW1lbnQgY3VycmVudCBwb3NcblxuLy8gUnVsZSB0byBza2lwIHB1cmUgdGV4dFxuLy8gJ3t9JCVAfis9OicgcmVzZXJ2ZWQgZm9yIGV4dGVudGlvbnNcblxuLy8gISwgXCIsICMsICQsICUsICYsICcsICgsICksICosICssICwsIC0sIC4sIC8sIDosIDssIDwsID0sID4sID8sIEAsIFssIFxcLCBdLCBeLCBfLCBgLCB7LCB8LCB9LCBvciB+XG5cbi8vICEhISEgRG9uJ3QgY29uZnVzZSB3aXRoIFwiTWFya2Rvd24gQVNDSUkgUHVuY3R1YXRpb25cIiBjaGFyc1xuLy8gaHR0cDovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4xNS8jYXNjaWktcHVuY3R1YXRpb24tY2hhcmFjdGVyXG5mdW5jdGlvbiBpc1Rlcm1pbmF0b3JDaGFyIChjaCkge1xuICBzd2l0Y2ggKGNoKSB7XG4gICAgY2FzZSAweDBBLyogXFxuICovOlxuICAgIGNhc2UgMHgyMS8qICEgKi86XG4gICAgY2FzZSAweDIzLyogIyAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDI2LyogJiAqLzpcbiAgICBjYXNlIDB4MkEvKiAqICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDJELyogLSAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgIGNhc2UgMHgzQy8qIDwgKi86XG4gICAgY2FzZSAweDNELyogPSAqLzpcbiAgICBjYXNlIDB4M0UvKiA+ICovOlxuICAgIGNhc2UgMHg0MC8qIEAgKi86XG4gICAgY2FzZSAweDVCLyogWyAqLzpcbiAgICBjYXNlIDB4NUMvKiBcXCAqLzpcbiAgICBjYXNlIDB4NUQvKiBdICovOlxuICAgIGNhc2UgMHg1RS8qIF4gKi86XG4gICAgY2FzZSAweDVGLyogXyAqLzpcbiAgICBjYXNlIDB4NjAvKiBgICovOlxuICAgIGNhc2UgMHg3Qi8qIHsgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGV4dCAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zXG5cbiAgd2hpbGUgKHBvcyA8IHN0YXRlLnBvc01heCAmJiAhaXNUZXJtaW5hdG9yQ2hhcihzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpKSkge1xuICAgIHBvcysrXG4gIH1cblxuICBpZiAocG9zID09PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShzdGF0ZS5wb3MsIHBvcykgfVxuXG4gIHN0YXRlLnBvcyA9IHBvc1xuXG4gIHJldHVybiB0cnVlXG59XG5cbi8vIEFsdGVybmF0aXZlIGltcGxlbWVudGF0aW9uLCBmb3IgbWVtb3J5LlxuLy9cbi8vIEl0IGNvc3RzIDEwJSBvZiBwZXJmb3JtYW5jZSwgYnV0IGFsbG93cyBleHRlbmQgdGVybWluYXRvcnMgbGlzdCwgaWYgcGxhY2UgaXRcbi8vIHRvIGBQYXJzZXJJbmxpbmVgIHByb3BlcnR5LiBQcm9iYWJseSwgd2lsbCBzd2l0Y2ggdG8gaXQgc29tZXRpbWUsIHN1Y2hcbi8vIGZsZXhpYmlsaXR5IHJlcXVpcmVkLlxuXG4vKlxudmFyIFRFUk1JTkFUT1JfUkUgPSAvW1xcbiEjJCUmKitcXC06PD0+QFtcXFxcXFxdXl9ge31+XS87XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGV4dChzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBwb3MgPSBzdGF0ZS5wb3MsXG4gICAgICBpZHggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5zZWFyY2goVEVSTUlOQVRPUl9SRSk7XG5cbiAgLy8gZmlyc3QgY2hhciBpcyB0ZXJtaW5hdG9yIC0+IGVtcHR5IHRleHRcbiAgaWYgKGlkeCA9PT0gMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBubyB0ZXJtaW5hdG9yIC0+IHRleHQgdGlsbCBlbmQgb2Ygc3RyaW5nXG4gIGlmIChpZHggPCAwKSB7XG4gICAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2UocG9zKTsgfVxuICAgIHN0YXRlLnBvcyA9IHN0YXRlLnNyYy5sZW5ndGg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShwb3MsIHBvcyArIGlkeCk7IH1cblxuICBzdGF0ZS5wb3MgKz0gaWR4O1xuXG4gIHJldHVybiB0cnVlO1xufTsgKi9cbiIsICIvLyBQcm9jZXNzIGxpbmtzIGxpa2UgaHR0cHM6Ly9leGFtcGxlLm9yZy9cblxuLy8gUkZDMzk4Njogc2NoZW1lID0gQUxQSEEgKiggQUxQSEEgLyBESUdJVCAvIFwiK1wiIC8gXCItXCIgLyBcIi5cIiApXG5jb25zdCBTQ0hFTUVfUkUgPSAvKD86XnxbXmEtejAtOS4rLV0pKFthLXpdW2EtejAtOS4rLV0qKSQvaVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsaW5raWZ5IChzdGF0ZSwgc2lsZW50KSB7XG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5saW5raWZ5KSByZXR1cm4gZmFsc2VcbiAgaWYgKHN0YXRlLmxpbmtMZXZlbCA+IDApIHJldHVybiBmYWxzZVxuXG4gIGNvbnN0IHBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICBpZiAocG9zICsgMyA+IG1heCkgcmV0dXJuIGZhbHNlXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDNBLyogOiAqLykgcmV0dXJuIGZhbHNlXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKSAhPT0gMHgyRi8qIC8gKi8pIHJldHVybiBmYWxzZVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMikgIT09IDB4MkYvKiAvICovKSByZXR1cm4gZmFsc2VcblxuICBjb25zdCBtYXRjaCA9IHN0YXRlLnBlbmRpbmcubWF0Y2goU0NIRU1FX1JFKVxuICBpZiAoIW1hdGNoKSByZXR1cm4gZmFsc2VcblxuICBjb25zdCBwcm90byA9IG1hdGNoWzFdXG5cbiAgY29uc3QgbGluayA9IHN0YXRlLm1kLmxpbmtpZnkubWF0Y2hBdFN0YXJ0KHN0YXRlLnNyYy5zbGljZShwb3MgLSBwcm90by5sZW5ndGgpKVxuICBpZiAoIWxpbmspIHJldHVybiBmYWxzZVxuXG4gIGxldCB1cmwgPSBsaW5rLnVybFxuXG4gIC8vIGludmFsaWQgbGluaywgYnV0IHN0aWxsIGRldGVjdGVkIGJ5IGxpbmtpZnkgc29tZWhvdztcbiAgLy8gbmVlZCB0byBjaGVjayB0byBwcmV2ZW50IGluZmluaXRlIGxvb3AgYmVsb3dcbiAgaWYgKHVybC5sZW5ndGggPD0gcHJvdG8ubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAvLyBkaXNhbGxvdyAnKicgYXQgdGhlIGVuZCBvZiB0aGUgbGluayAoY29uZmxpY3RzIHdpdGggZW1waGFzaXMpXG4gIC8vIGRvIG1hbnVhbCBiYWNrc2VhcmNoIHRvIGF2b2lkIHBlcmYgaXNzdWVzIHdpdGggcmVnZXggL1xcKiskLyBvbiBcIioqKiouLi4qKioqYVwiLlxuICBsZXQgdXJsRW5kID0gdXJsLmxlbmd0aFxuICB3aGlsZSAodXJsRW5kID4gMCAmJiB1cmwuY2hhckNvZGVBdCh1cmxFbmQgLSAxKSA9PT0gMHgyQS8qICogKi8pIHtcbiAgICB1cmxFbmQtLVxuICB9XG4gIGlmICh1cmxFbmQgIT09IHVybC5sZW5ndGgpIHtcbiAgICB1cmwgPSB1cmwuc2xpY2UoMCwgdXJsRW5kKVxuICB9XG5cbiAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsodXJsKVxuICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgcmV0dXJuIGZhbHNlXG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5zbGljZSgwLCAtcHJvdG8ubGVuZ3RoKVxuXG4gICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2xpbmtfb3BlbicsICdhJywgMSlcbiAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXVxuICAgIHRva2VuX28ubWFya3VwID0gJ2xpbmtpZnknXG4gICAgdG9rZW5fby5pbmZvID0gJ2F1dG8nXG5cbiAgICBjb25zdCB0b2tlbl90ID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKVxuICAgIHRva2VuX3QuY29udGVudCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KHVybClcblxuICAgIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS5wdXNoKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSlcbiAgICB0b2tlbl9jLm1hcmt1cCA9ICdsaW5raWZ5J1xuICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJ1xuICB9XG5cbiAgc3RhdGUucG9zICs9IHVybC5sZW5ndGggLSBwcm90by5sZW5ndGhcbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBQcm9jZWVzcyAnXFxuJ1xuXG5pbXBvcnQgeyBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbmV3bGluZSAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zXG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEvKiBcXG4gKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBwbWF4ID0gc3RhdGUucGVuZGluZy5sZW5ndGggLSAxXG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heFxuXG4gIC8vICcgIFxcbicgLT4gaGFyZGJyZWFrXG4gIC8vIExvb2t1cCBpbiBwZW5kaW5nIGNoYXJzIGlzIGJhZCBwcmFjdGljZSEgRG9uJ3QgY29weSB0byBvdGhlciBydWxlcyFcbiAgLy8gUGVuZGluZyBzdHJpbmcgaXMgc3RvcmVkIGluIGNvbmNhdCBtb2RlLCBpbmRleGVkIGxvb2t1cHMgd2lsbCBjYXVzZVxuICAvLyBjb252ZXJ0aW9uIHRvIGZsYXQgbW9kZS5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBpZiAocG1heCA+PSAwICYmIHN0YXRlLnBlbmRpbmcuY2hhckNvZGVBdChwbWF4KSA9PT0gMHgyMCkge1xuICAgICAgaWYgKHBtYXggPj0gMSAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCAtIDEpID09PSAweDIwKSB7XG4gICAgICAgIC8vIEZpbmQgd2hpdGVzcGFjZXMgdGFpbCBvZiBwZW5kaW5nIGNoYXJzLlxuICAgICAgICBsZXQgd3MgPSBwbWF4IC0gMVxuICAgICAgICB3aGlsZSAod3MgPj0gMSAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQod3MgLSAxKSA9PT0gMHgyMCkgd3MtLVxuXG4gICAgICAgIHN0YXRlLnBlbmRpbmcgPSBzdGF0ZS5wZW5kaW5nLnNsaWNlKDAsIHdzKVxuICAgICAgICBzdGF0ZS5wdXNoKCdoYXJkYnJlYWsnLCAnYnInLCAwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucGVuZGluZyA9IHN0YXRlLnBlbmRpbmcuc2xpY2UoMCwgLTEpXG4gICAgICAgIHN0YXRlLnB1c2goJ3NvZnRicmVhaycsICdicicsIDApXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnB1c2goJ3NvZnRicmVhaycsICdicicsIDApXG4gICAgfVxuICB9XG5cbiAgcG9zKytcblxuICAvLyBza2lwIGhlYWRpbmcgc3BhY2VzIGZvciBuZXh0IGxpbmVcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBpc1NwYWNlKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykpKSB7IHBvcysrIH1cblxuICBzdGF0ZS5wb3MgPSBwb3NcbiAgcmV0dXJuIHRydWVcbn1cbiIsICIvLyBQcm9jZXNzIGVzY2FwZWQgY2hhcnMgYW5kIGhhcmRicmVha3NcblxuaW1wb3J0IHsgaXNTcGFjZSB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmNvbnN0IEVTQ0FQRUQgPSBbXVxuXG5mb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7IEVTQ0FQRUQucHVzaCgwKSB9XG5cbidcXFxcIVwiIyQlJlxcJygpKissLi86Ozw9Pj9AW11eX2B7fH1+LSdcbiAgLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChjaCkgeyBFU0NBUEVEW2NoLmNoYXJDb2RlQXQoMCldID0gMSB9KVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBlc2NhcGUgKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHg1Qy8qIFxcICovKSByZXR1cm4gZmFsc2VcbiAgcG9zKytcblxuICAvLyAnXFwnIGF0IHRoZSBlbmQgb2YgdGhlIGlubGluZSBibG9ja1xuICBpZiAocG9zID49IG1heCkgcmV0dXJuIGZhbHNlXG5cbiAgbGV0IGNoMSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICBpZiAoY2gxID09PSAweDBBKSB7XG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHN0YXRlLnB1c2goJ2hhcmRicmVhaycsICdicicsIDApXG4gICAgfVxuXG4gICAgcG9zKytcbiAgICAvLyBza2lwIGxlYWRpbmcgd2hpdGVzcGFjZXMgZnJvbSBuZXh0IGxpbmVcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjaDEgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICBpZiAoIWlzU3BhY2UoY2gxKSkgYnJlYWtcbiAgICAgIHBvcysrXG4gICAgfVxuXG4gICAgc3RhdGUucG9zID0gcG9zXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8vICdcXCcgYmVmb3JlIGEgc3BhY2UgaXMgYSBsaXRlcmFsIGJhY2tzbGFzaC4gRG9uJ3QgY29uc3VtZSB0aGUgc3BhY2UsIHNvIGFcbiAgLy8gdHJhaWxpbmcgdHdvLXNwYWNlIGhhcmQgbGluZSBicmVhayBpcyBzdGlsbCBkZXRlY3RlZCBieSB0aGUgbmV3bGluZSBydWxlLlxuICBpZiAoY2gxID09PSAweDIwKSB7XG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgndGV4dF9zcGVjaWFsJywgJycsIDApXG4gICAgICB0b2tlbi5jb250ZW50ID0gJ1xcXFwnXG4gICAgICB0b2tlbi5tYXJrdXAgPSAnXFxcXCdcbiAgICAgIHRva2VuLmluZm8gPSAnZXNjYXBlJ1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyA9IHBvc1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBsZXQgZXNjYXBlZFN0ciA9IHN0YXRlLnNyY1twb3NdXG5cbiAgaWYgKGNoMSA+PSAweEQ4MDAgJiYgY2gxIDw9IDB4REJGRiAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgY29uc3QgY2gyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSlcblxuICAgIGlmIChjaDIgPj0gMHhEQzAwICYmIGNoMiA8PSAweERGRkYpIHtcbiAgICAgIGVzY2FwZWRTdHIgKz0gc3RhdGUuc3JjW3BvcyArIDFdXG4gICAgICBwb3MrK1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9yaWdTdHIgPSAnXFxcXCcgKyBlc2NhcGVkU3RyXG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHRfc3BlY2lhbCcsICcnLCAwKVxuXG4gICAgaWYgKGNoMSA8IDI1NiAmJiBFU0NBUEVEW2NoMV0gIT09IDApIHtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSBlc2NhcGVkU3RyXG4gICAgfSBlbHNlIHtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSBvcmlnU3RyXG4gICAgfVxuXG4gICAgdG9rZW4ubWFya3VwID0gb3JpZ1N0clxuICAgIHRva2VuLmluZm8gPSAnZXNjYXBlJ1xuICB9XG5cbiAgc3RhdGUucG9zID0gcG9zICsgMVxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIFBhcnNlIGJhY2t0aWNrc1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBiYWNrdGljayAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zXG4gIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuXG4gIGlmIChjaCAhPT0gMHg2MC8qIGAgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBzdGFydCA9IHBvc1xuICBwb3MrK1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICAvLyBzY2FuIG1hcmtlciBsZW5ndGhcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDYwLyogYCAqLykgeyBwb3MrKyB9XG5cbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MpXG4gIGNvbnN0IG9wZW5lckxlbmd0aCA9IG1hcmtlci5sZW5ndGhcblxuICBpZiAoc3RhdGUuYmFja3RpY2tzU2Nhbm5lZCAmJiAoc3RhdGUuYmFja3RpY2tzW29wZW5lckxlbmd0aF0gfHwgMCkgPD0gc3RhcnQpIHtcbiAgICBpZiAoIXNpbGVudCkgc3RhdGUucGVuZGluZyArPSBtYXJrZXJcbiAgICBzdGF0ZS5wb3MgKz0gb3BlbmVyTGVuZ3RoXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGxldCBtYXRjaEVuZCA9IHBvc1xuICBsZXQgbWF0Y2hTdGFydFxuXG4gIC8vIE5vdGhpbmcgZm91bmQgaW4gdGhlIGNhY2hlLCBzY2FuIHVudGlsIHRoZSBlbmQgb2YgdGhlIGxpbmUgKG9yIHVudGlsIG1hcmtlciBpcyBmb3VuZClcbiAgd2hpbGUgKChtYXRjaFN0YXJ0ID0gc3RhdGUuc3JjLmluZGV4T2YoJ2AnLCBtYXRjaEVuZCkpICE9PSAtMSkge1xuICAgIG1hdGNoRW5kID0gbWF0Y2hTdGFydCArIDFcblxuICAgIC8vIHNjYW4gbWFya2VyIGxlbmd0aFxuICAgIHdoaWxlIChtYXRjaEVuZCA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChtYXRjaEVuZCkgPT09IDB4NjAvKiBgICovKSB7IG1hdGNoRW5kKysgfVxuXG4gICAgY29uc3QgY2xvc2VyTGVuZ3RoID0gbWF0Y2hFbmQgLSBtYXRjaFN0YXJ0XG5cbiAgICBpZiAoY2xvc2VyTGVuZ3RoID09PSBvcGVuZXJMZW5ndGgpIHtcbiAgICAgIC8vIEZvdW5kIG1hdGNoaW5nIGNsb3NlciBsZW5ndGguXG4gICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2NvZGVfaW5saW5lJywgJ2NvZGUnLCAwKVxuICAgICAgICB0b2tlbi5tYXJrdXAgPSBtYXJrZXJcbiAgICAgICAgdG9rZW4uY29udGVudCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1hdGNoU3RhcnQpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnICcpXG4gICAgICAgICAgLnJlcGxhY2UoL14gKC4rKSAkLywgJyQxJylcbiAgICAgIH1cbiAgICAgIHN0YXRlLnBvcyA9IG1hdGNoRW5kXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIFNvbWUgZGlmZmVyZW50IGxlbmd0aCBmb3VuZCwgcHV0IGl0IGluIGNhY2hlIGFzIHVwcGVyIGxpbWl0IG9mIHdoZXJlIGNsb3NlciBjYW4gYmUgZm91bmRcbiAgICBzdGF0ZS5iYWNrdGlja3NbY2xvc2VyTGVuZ3RoXSA9IG1hdGNoU3RhcnRcbiAgfVxuXG4gIC8vIFNjYW5uZWQgdGhyb3VnaCB0aGUgZW5kLCBkaWRuJ3QgZmluZCBhbnl0aGluZ1xuICBzdGF0ZS5iYWNrdGlja3NTY2FubmVkID0gdHJ1ZVxuXG4gIGlmICghc2lsZW50KSBzdGF0ZS5wZW5kaW5nICs9IG1hcmtlclxuICBzdGF0ZS5wb3MgKz0gb3BlbmVyTGVuZ3RoXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gfn5zdHJpa2UgdGhyb3VnaH5+XG4vL1xuXG4vLyBJbnNlcnQgZWFjaCBtYXJrZXIgYXMgYSBzZXBhcmF0ZSB0ZXh0IHRva2VuLCBhbmQgYWRkIGl0IHRvIGRlbGltaXRlciBsaXN0XG4vL1xuZnVuY3Rpb24gc3RyaWtldGhyb3VnaF90b2tlbml6ZSAoc3RhdGUsIHNpbGVudCkge1xuICBjb25zdCBzdGFydCA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydClcblxuICBpZiAoc2lsZW50KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKG1hcmtlciAhPT0gMHg3RS8qIH4gKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBzY2FubmVkID0gc3RhdGUuc2NhbkRlbGltcyhzdGF0ZS5wb3MsIHRydWUpXG4gIGxldCBsZW4gPSBzY2FubmVkLmxlbmd0aFxuICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKVxuXG4gIGlmIChsZW4gPCAyKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IHRva2VuXG5cbiAgaWYgKGxlbiAlIDIpIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMClcbiAgICB0b2tlbi5jb250ZW50ID0gY2hcbiAgICBsZW4tLVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKVxuICAgIHRva2VuLmNvbnRlbnQgPSBjaCArIGNoXG5cbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgbWFya2VyLFxuICAgICAgbGVuZ3RoOiAwLCAgICAgLy8gZGlzYWJsZSBcInJ1bGUgb2YgM1wiIGxlbmd0aCBjaGVja3MgbWVhbnQgZm9yIGVtcGhhc2lzXG4gICAgICB0b2tlbjogc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG4gICAgICBlbmQ6IC0xLFxuICAgICAgb3Blbjogc2Nhbm5lZC5jYW5fb3BlbixcbiAgICAgIGNsb3NlOiBzY2FubmVkLmNhbl9jbG9zZVxuICAgIH0pXG4gIH1cblxuICBzdGF0ZS5wb3MgKz0gc2Nhbm5lZC5sZW5ndGhcblxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBwb3N0UHJvY2VzcyAoc3RhdGUsIGRlbGltaXRlcnMpIHtcbiAgbGV0IHRva2VuXG4gIGNvbnN0IGxvbmVNYXJrZXJzID0gW11cbiAgY29uc3QgbWF4ID0gZGVsaW1pdGVycy5sZW5ndGhcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heDsgaSsrKSB7XG4gICAgY29uc3Qgc3RhcnREZWxpbSA9IGRlbGltaXRlcnNbaV1cblxuICAgIGlmIChzdGFydERlbGltLm1hcmtlciAhPT0gMHg3RS8qIH4gKi8pIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0RGVsaW0uZW5kID09PSAtMSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBjb25zdCBlbmREZWxpbSA9IGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmRdXG5cbiAgICB0b2tlbiA9IHN0YXRlLnRva2Vuc1tzdGFydERlbGltLnRva2VuXVxuICAgIHRva2VuLnR5cGUgPSAnc19vcGVuJ1xuICAgIHRva2VuLnRhZyA9ICdzJ1xuICAgIHRva2VuLm5lc3RpbmcgPSAxXG4gICAgdG9rZW4ubWFya3VwID0gJ35+J1xuICAgIHRva2VuLmNvbnRlbnQgPSAnJ1xuXG4gICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW5dXG4gICAgdG9rZW4udHlwZSA9ICdzX2Nsb3NlJ1xuICAgIHRva2VuLnRhZyA9ICdzJ1xuICAgIHRva2VuLm5lc3RpbmcgPSAtMVxuICAgIHRva2VuLm1hcmt1cCA9ICd+fidcbiAgICB0b2tlbi5jb250ZW50ID0gJydcblxuICAgIGlmIChzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW4gLSAxXS50eXBlID09PSAndGV4dCcgJiZcbiAgICAgICAgc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuIC0gMV0uY29udGVudCA9PT0gJ34nKSB7XG4gICAgICBsb25lTWFya2Vycy5wdXNoKGVuZERlbGltLnRva2VuIC0gMSlcbiAgICB9XG4gIH1cblxuICAvLyBJZiBhIG1hcmtlciBzZXF1ZW5jZSBoYXMgYW4gb2RkIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBpdCdzIHNwbGl0dGVkXG4gIC8vIGxpa2UgdGhpczogYH5+fn5+YCAtPiBgfmAgKyBgfn5gICsgYH5+YCwgbGVhdmluZyBvbmUgbWFya2VyIGF0IHRoZVxuICAvLyBzdGFydCBvZiB0aGUgc2VxdWVuY2UuXG4gIC8vXG4gIC8vIFNvLCB3ZSBoYXZlIHRvIG1vdmUgYWxsIHRob3NlIG1hcmtlcnMgYWZ0ZXIgc3Vic2VxdWVudCBzX2Nsb3NlIHRhZ3MuXG4gIC8vXG4gIHdoaWxlIChsb25lTWFya2Vycy5sZW5ndGgpIHtcbiAgICBjb25zdCBpID0gbG9uZU1hcmtlcnMucG9wKClcbiAgICBsZXQgaiA9IGkgKyAxXG5cbiAgICB3aGlsZSAoaiA8IHN0YXRlLnRva2Vucy5sZW5ndGggJiYgc3RhdGUudG9rZW5zW2pdLnR5cGUgPT09ICdzX2Nsb3NlJykge1xuICAgICAgaisrXG4gICAgfVxuXG4gICAgai0tXG5cbiAgICBpZiAoaSAhPT0gaikge1xuICAgICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbal1cbiAgICAgIHN0YXRlLnRva2Vuc1tqXSA9IHN0YXRlLnRva2Vuc1tpXVxuICAgICAgc3RhdGUudG9rZW5zW2ldID0gdG9rZW5cbiAgICB9XG4gIH1cbn1cblxuLy8gV2FsayB0aHJvdWdoIGRlbGltaXRlciBsaXN0IGFuZCByZXBsYWNlIHRleHQgdG9rZW5zIHdpdGggdGFnc1xuLy9cbmZ1bmN0aW9uIHN0cmlrZXRocm91Z2hfcG9zdFByb2Nlc3MgKHN0YXRlKSB7XG4gIGNvbnN0IHRva2Vuc19tZXRhID0gc3RhdGUudG9rZW5zX21ldGFcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zX21ldGEubGVuZ3RoXG5cbiAgcG9zdFByb2Nlc3Moc3RhdGUsIHN0YXRlLmRlbGltaXRlcnMpXG5cbiAgZm9yIChsZXQgY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIGlmICh0b2tlbnNfbWV0YVtjdXJyXSAmJiB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKSB7XG4gICAgICBwb3N0UHJvY2VzcyhzdGF0ZSwgdG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICB0b2tlbml6ZTogc3RyaWtldGhyb3VnaF90b2tlbml6ZSxcbiAgcG9zdFByb2Nlc3M6IHN0cmlrZXRocm91Z2hfcG9zdFByb2Nlc3Ncbn1cbiIsICIvLyBQcm9jZXNzICp0aGlzKiBhbmQgX3RoYXRfXG4vL1xuXG4vLyBJbnNlcnQgZWFjaCBtYXJrZXIgYXMgYSBzZXBhcmF0ZSB0ZXh0IHRva2VuLCBhbmQgYWRkIGl0IHRvIGRlbGltaXRlciBsaXN0XG4vL1xuZnVuY3Rpb24gZW1waGFzaXNfdG9rZW5pemUgKHN0YXRlLCBzaWxlbnQpIHtcbiAgY29uc3Qgc3RhcnQgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpXG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChtYXJrZXIgIT09IDB4NUYgLyogXyAqLyAmJiBtYXJrZXIgIT09IDB4MkEgLyogKiAqLykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGNvbnN0IHNjYW5uZWQgPSBzdGF0ZS5zY2FuRGVsaW1zKHN0YXRlLnBvcywgbWFya2VyID09PSAweDJBKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2Nhbm5lZC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKVxuICAgIHRva2VuLmNvbnRlbnQgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcilcblxuICAgIHN0YXRlLmRlbGltaXRlcnMucHVzaCh7XG4gICAgICAvLyBDaGFyIGNvZGUgb2YgdGhlIHN0YXJ0aW5nIG1hcmtlciAobnVtYmVyKS5cbiAgICAgIC8vXG4gICAgICBtYXJrZXIsXG5cbiAgICAgIC8vIFRvdGFsIGxlbmd0aCBvZiB0aGVzZSBzZXJpZXMgb2YgZGVsaW1pdGVycy5cbiAgICAgIC8vXG4gICAgICBsZW5ndGg6IHNjYW5uZWQubGVuZ3RoLFxuXG4gICAgICAvLyBBIHBvc2l0aW9uIG9mIHRoZSB0b2tlbiB0aGlzIGRlbGltaXRlciBjb3JyZXNwb25kcyB0by5cbiAgICAgIC8vXG4gICAgICB0b2tlbjogc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG5cbiAgICAgIC8vIElmIHRoaXMgZGVsaW1pdGVyIGlzIG1hdGNoZWQgYXMgYSB2YWxpZCBvcGVuZXIsIGBlbmRgIHdpbGwgYmVcbiAgICAgIC8vIGVxdWFsIHRvIGl0cyBwb3NpdGlvbiwgb3RoZXJ3aXNlIGl0J3MgYC0xYC5cbiAgICAgIC8vXG4gICAgICBlbmQ6IC0xLFxuXG4gICAgICAvLyBCb29sZWFuIGZsYWdzIHRoYXQgZGV0ZXJtaW5lIGlmIHRoaXMgZGVsaW1pdGVyIGNvdWxkIG9wZW4gb3IgY2xvc2VcbiAgICAgIC8vIGFuIGVtcGhhc2lzLlxuICAgICAgLy9cbiAgICAgIG9wZW46IHNjYW5uZWQuY2FuX29wZW4sXG4gICAgICBjbG9zZTogc2Nhbm5lZC5jYW5fY2xvc2VcbiAgICB9KVxuICB9XG5cbiAgc3RhdGUucG9zICs9IHNjYW5uZWQubGVuZ3RoXG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gcG9zdFByb2Nlc3MgKHN0YXRlLCBkZWxpbWl0ZXJzKSB7XG4gIGNvbnN0IG1heCA9IGRlbGltaXRlcnMubGVuZ3RoXG5cbiAgZm9yIChsZXQgaSA9IG1heCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3Qgc3RhcnREZWxpbSA9IGRlbGltaXRlcnNbaV1cblxuICAgIGlmIChzdGFydERlbGltLm1hcmtlciAhPT0gMHg1Ri8qIF8gKi8gJiYgc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4MkEvKiAqICovKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vIFByb2Nlc3Mgb25seSBvcGVuaW5nIG1hcmtlcnNcbiAgICBpZiAoc3RhcnREZWxpbS5lbmQgPT09IC0xKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGNvbnN0IGVuZERlbGltID0gZGVsaW1pdGVyc1tzdGFydERlbGltLmVuZF1cblxuICAgIC8vIElmIHRoZSBwcmV2aW91cyBkZWxpbWl0ZXIgaGFzIHRoZSBzYW1lIG1hcmtlciBhbmQgaXMgYWRqYWNlbnQgdG8gdGhpcyBvbmUsXG4gICAgLy8gbWVyZ2UgdGhvc2UgaW50byBvbmUgc3Ryb25nIGRlbGltaXRlci5cbiAgICAvL1xuICAgIC8vIGA8ZW0+PGVtPndoYXRldmVyPC9lbT48L2VtPmAgLT4gYDxzdHJvbmc+d2hhdGV2ZXI8L3N0cm9uZz5gXG4gICAgLy9cbiAgICBjb25zdCBpc1N0cm9uZyA9IGkgPiAwICYmXG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW2kgLSAxXS5lbmQgPT09IHN0YXJ0RGVsaW0uZW5kICsgMSAmJlxuICAgICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCBmaXJzdCB0d28gbWFya2VycyBtYXRjaCBhbmQgYWRqYWNlbnRcbiAgICAgICAgICAgICAgIGRlbGltaXRlcnNbaSAtIDFdLm1hcmtlciA9PT0gc3RhcnREZWxpbS5tYXJrZXIgJiZcbiAgICAgICAgICAgICAgIGRlbGltaXRlcnNbaSAtIDFdLnRva2VuID09PSBzdGFydERlbGltLnRva2VuIC0gMSAmJlxuICAgICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCBsYXN0IHR3byBtYXJrZXJzIGFyZSBhZGphY2VudCAod2UgY2FuIHNhZmVseSBhc3N1bWUgdGhleSBtYXRjaClcbiAgICAgICAgICAgICAgIGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmQgKyAxXS50b2tlbiA9PT0gZW5kRGVsaW0udG9rZW4gKyAxXG5cbiAgICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoc3RhcnREZWxpbS5tYXJrZXIpXG5cbiAgICBjb25zdCB0b2tlbl9vID0gc3RhdGUudG9rZW5zW3N0YXJ0RGVsaW0udG9rZW5dXG4gICAgdG9rZW5fby50eXBlID0gaXNTdHJvbmcgPyAnc3Ryb25nX29wZW4nIDogJ2VtX29wZW4nXG4gICAgdG9rZW5fby50YWcgPSBpc1N0cm9uZyA/ICdzdHJvbmcnIDogJ2VtJ1xuICAgIHRva2VuX28ubmVzdGluZyA9IDFcbiAgICB0b2tlbl9vLm1hcmt1cCA9IGlzU3Ryb25nID8gY2ggKyBjaCA6IGNoXG4gICAgdG9rZW5fby5jb250ZW50ID0gJydcblxuICAgIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW5dXG4gICAgdG9rZW5fYy50eXBlID0gaXNTdHJvbmcgPyAnc3Ryb25nX2Nsb3NlJyA6ICdlbV9jbG9zZSdcbiAgICB0b2tlbl9jLnRhZyA9IGlzU3Ryb25nID8gJ3N0cm9uZycgOiAnZW0nXG4gICAgdG9rZW5fYy5uZXN0aW5nID0gLTFcbiAgICB0b2tlbl9jLm1hcmt1cCA9IGlzU3Ryb25nID8gY2ggKyBjaCA6IGNoXG4gICAgdG9rZW5fYy5jb250ZW50ID0gJydcblxuICAgIGlmIChpc1N0cm9uZykge1xuICAgICAgc3RhdGUudG9rZW5zW2RlbGltaXRlcnNbaSAtIDFdLnRva2VuXS5jb250ZW50ID0gJydcbiAgICAgIHN0YXRlLnRva2Vuc1tkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kICsgMV0udG9rZW5dLmNvbnRlbnQgPSAnJ1xuICAgICAgaS0tXG4gICAgfVxuICB9XG59XG5cbi8vIFdhbGsgdGhyb3VnaCBkZWxpbWl0ZXIgbGlzdCBhbmQgcmVwbGFjZSB0ZXh0IHRva2VucyB3aXRoIHRhZ3Ncbi8vXG5mdW5jdGlvbiBlbXBoYXNpc19wb3N0X3Byb2Nlc3MgKHN0YXRlKSB7XG4gIGNvbnN0IHRva2Vuc19tZXRhID0gc3RhdGUudG9rZW5zX21ldGFcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zX21ldGEubGVuZ3RoXG5cbiAgcG9zdFByb2Nlc3Moc3RhdGUsIHN0YXRlLmRlbGltaXRlcnMpXG5cbiAgZm9yIChsZXQgY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIGlmICh0b2tlbnNfbWV0YVtjdXJyXSAmJiB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKSB7XG4gICAgICBwb3N0UHJvY2VzcyhzdGF0ZSwgdG9rZW5zX21ldGFbY3Vycl0uZGVsaW1pdGVycylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICB0b2tlbml6ZTogZW1waGFzaXNfdG9rZW5pemUsXG4gIHBvc3RQcm9jZXNzOiBlbXBoYXNpc19wb3N0X3Byb2Nlc3Ncbn1cbiIsICIvLyBQcm9jZXNzIFtsaW5rXSg8dG8+IFwic3R1ZmZcIilcblxuaW1wb3J0IHsgbm9ybWFsaXplUmVmZXJlbmNlLCBpc1NwYWNlIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzLm1qcydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbGluayAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgY29kZSwgbGFiZWwsIHJlcywgcmVmXG4gIGxldCBocmVmID0gJydcbiAgbGV0IHRpdGxlID0gJydcbiAgbGV0IHN0YXJ0ID0gc3RhdGUucG9zXG4gIGxldCBwYXJzZVJlZmVyZW5jZSA9IHRydWVcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKSAhPT0gMHg1Qi8qIFsgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBvbGRQb3MgPSBzdGF0ZS5wb3NcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG4gIGNvbnN0IGxhYmVsU3RhcnQgPSBzdGF0ZS5wb3MgKyAxXG4gIGNvbnN0IGxhYmVsRW5kID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhdGUucG9zLCB0cnVlKVxuXG4gIC8vIHBhcnNlciBmYWlsZWQgdG8gZmluZCAnXScsIHNvIGl0J3Mgbm90IGEgdmFsaWQgbGlua1xuICBpZiAobGFiZWxFbmQgPCAwKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgbGV0IHBvcyA9IGxhYmVsRW5kICsgMVxuICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjgvKiAoICovKSB7XG4gICAgLy9cbiAgICAvLyBJbmxpbmUgbGlua1xuICAgIC8vXG5cbiAgICAvLyBtaWdodCBoYXZlIGZvdW5kIGEgdmFsaWQgc2hvcnRjdXQgbGluaywgZGlzYWJsZSByZWZlcmVuY2UgcGFyc2luZ1xuICAgIHBhcnNlUmVmZXJlbmNlID0gZmFsc2VcblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHBvcysrXG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhayB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgIF5eXl5eXiBwYXJzaW5nIGxpbmsgZGVzdGluYXRpb25cbiAgICBzdGFydCA9IHBvc1xuICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heClcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKVxuICAgICAgaWYgKHN0YXRlLm1kLnZhbGlkYXRlTGluayhocmVmKSkge1xuICAgICAgICBwb3MgPSByZXMucG9zXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBocmVmID0gJydcbiAgICAgIH1cblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgc3RhcnQgPSBwb3NcbiAgICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrIH1cbiAgICAgIH1cblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgXl5eXl5eXiBwYXJzaW5nIGxpbmsgdGl0bGVcbiAgICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rVGl0bGUoc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heClcbiAgICAgIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiByZXMub2spIHtcbiAgICAgICAgdGl0bGUgPSByZXMuc3RyXG4gICAgICAgIHBvcyA9IHJlcy5wb3NcblxuICAgICAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICAgICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKVxuICAgICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3MgPj0gbWF4IHx8IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MjkvKiApICovKSB7XG4gICAgICAvLyBwYXJzaW5nIGEgdmFsaWQgc2hvcnRjdXQgbGluayBmYWlsZWQsIGZhbGxiYWNrIHRvIHJlZmVyZW5jZVxuICAgICAgcGFyc2VSZWZlcmVuY2UgPSB0cnVlXG4gICAgfVxuICAgIHBvcysrXG4gIH1cblxuICBpZiAocGFyc2VSZWZlcmVuY2UpIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDVCLyogWyAqLykge1xuICAgICAgc3RhcnQgPSBwb3MgKyAxXG4gICAgICBwb3MgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBwb3MpXG4gICAgICBpZiAocG9zID49IDApIHtcbiAgICAgICAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcysrKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbGFiZWxFbmQgKyAxXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvcyA9IGxhYmVsRW5kICsgMVxuICAgIH1cblxuICAgIC8vIGNvdmVycyBsYWJlbCA9PT0gJycgYW5kIGxhYmVsID09PSB1bmRlZmluZWRcbiAgICAvLyAoY29sbGFwc2VkIHJlZmVyZW5jZSBsaW5rIGFuZCBzaG9ydGN1dCByZWZlcmVuY2UgbGluayByZXNwZWN0aXZlbHkpXG4gICAgaWYgKCFsYWJlbCkgeyBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCkgfVxuXG4gICAgcmVmID0gc3RhdGUuZW52LnJlZmVyZW5jZXNbbm9ybWFsaXplUmVmZXJlbmNlKGxhYmVsKV1cbiAgICBpZiAoIXJlZikge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaHJlZiA9IHJlZi5ocmVmXG4gICAgdGl0bGUgPSByZWYudGl0bGVcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wb3MgPSBsYWJlbFN0YXJ0XG4gICAgc3RhdGUucG9zTWF4ID0gbGFiZWxFbmRcblxuICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpXG4gICAgY29uc3QgYXR0cnMgPSBbWydocmVmJywgaHJlZl1dXG4gICAgdG9rZW5fby5hdHRycyA9IGF0dHJzXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsndGl0bGUnLCB0aXRsZV0pXG4gICAgfVxuXG4gICAgc3RhdGUubGlua0xldmVsKytcbiAgICBzdGF0ZS5tZC5pbmxpbmUudG9rZW5pemUoc3RhdGUpXG4gICAgc3RhdGUubGlua0xldmVsLS1cblxuICAgIHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKVxuICB9XG5cbiAgc3RhdGUucG9zID0gcG9zXG4gIHN0YXRlLnBvc01heCA9IG1heFxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIFByb2Nlc3MgIVtpbWFnZV0oPHNyYz4gXCJ0aXRsZVwiKVxuXG5pbXBvcnQgeyBub3JtYWxpemVSZWZlcmVuY2UsIGlzU3BhY2UgfSBmcm9tICcuLi9jb21tb24vdXRpbHMubWpzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbWFnZSAoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgY29kZSwgY29udGVudCwgbGFiZWwsIHBvcywgcmVmLCByZXMsIHRpdGxlLCBzdGFydFxuICBsZXQgaHJlZiA9ICcnXG4gIGNvbnN0IG9sZFBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKSAhPT0gMHgyMS8qICEgKi8pIHsgcmV0dXJuIGZhbHNlIH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyArIDEpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGNvbnN0IGxhYmVsU3RhcnQgPSBzdGF0ZS5wb3MgKyAyXG4gIGNvbnN0IGxhYmVsRW5kID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhdGUucG9zICsgMSwgZmFsc2UpXG5cbiAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kICddJywgc28gaXQncyBub3QgYSB2YWxpZCBsaW5rXG4gIGlmIChsYWJlbEVuZCA8IDApIHsgcmV0dXJuIGZhbHNlIH1cblxuICBwb3MgPSBsYWJlbEVuZCArIDFcbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDI4LyogKCAqLykge1xuICAgIC8vXG4gICAgLy8gSW5saW5lIGxpbmtcbiAgICAvL1xuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgcG9zKytcbiAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrIH1cbiAgICB9XG4gICAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgXl5eXl5eIHBhcnNpbmcgbGluayBkZXN0aW5hdGlvblxuICAgIHN0YXJ0ID0gcG9zXG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KVxuICAgIGlmIChyZXMub2spIHtcbiAgICAgIGhyZWYgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHJlcy5zdHIpXG4gICAgICBpZiAoc3RhdGUubWQudmFsaWRhdGVMaW5rKGhyZWYpKSB7XG4gICAgICAgIHBvcyA9IHJlcy5wb3NcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAnJ1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgc3RhcnQgPSBwb3NcbiAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrIH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgICAgXl5eXl5eXiBwYXJzaW5nIGxpbmsgdGl0bGVcbiAgICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua1RpdGxlKHN0YXRlLnNyYywgcG9zLCBzdGF0ZS5wb3NNYXgpXG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHJlcy5vaykge1xuICAgICAgdGl0bGUgPSByZXMuc3RyXG4gICAgICBwb3MgPSByZXMucG9zXG5cbiAgICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpXG4gICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGl0bGUgPSAnJ1xuICAgIH1cblxuICAgIGlmIChwb3MgPj0gbWF4IHx8IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MjkvKiApICovKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3NcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBwb3MrK1xuICB9IGVsc2Uge1xuICAgIC8vXG4gICAgLy8gTGluayByZWZlcmVuY2VcbiAgICAvL1xuICAgIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXMgPT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUIvKiBbICovKSB7XG4gICAgICBzdGFydCA9IHBvcyArIDFcbiAgICAgIHBvcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHBvcylcbiAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKyspXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsYWJlbEVuZCArIDFcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcG9zID0gbGFiZWxFbmQgKyAxXG4gICAgfVxuXG4gICAgLy8gY292ZXJzIGxhYmVsID09PSAnJyBhbmQgbGFiZWwgPT09IHVuZGVmaW5lZFxuICAgIC8vIChjb2xsYXBzZWQgcmVmZXJlbmNlIGxpbmsgYW5kIHNob3J0Y3V0IHJlZmVyZW5jZSBsaW5rIHJlc3BlY3RpdmVseSlcbiAgICBpZiAoIWxhYmVsKSB7IGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKGxhYmVsU3RhcnQsIGxhYmVsRW5kKSB9XG5cbiAgICByZWYgPSBzdGF0ZS5lbnYucmVmZXJlbmNlc1tub3JtYWxpemVSZWZlcmVuY2UobGFiZWwpXVxuICAgIGlmICghcmVmKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3NcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBocmVmID0gcmVmLmhyZWZcbiAgICB0aXRsZSA9IHJlZi50aXRsZVxuICB9XG5cbiAgLy9cbiAgLy8gV2UgZm91bmQgdGhlIGVuZCBvZiB0aGUgbGluaywgYW5kIGtub3cgZm9yIGEgZmFjdCBpdCdzIGEgdmFsaWQgbGluaztcbiAgLy8gc28gYWxsIHRoYXQncyBsZWZ0IHRvIGRvIGlzIHRvIGNhbGwgdG9rZW5pemVyLlxuICAvL1xuICBpZiAoIXNpbGVudCkge1xuICAgIGNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UobGFiZWxTdGFydCwgbGFiZWxFbmQpXG5cbiAgICBjb25zdCB0b2tlbnMgPSBbXVxuICAgIHN0YXRlLm1kLmlubGluZS5wYXJzZShcbiAgICAgIGNvbnRlbnQsXG4gICAgICBzdGF0ZS5tZCxcbiAgICAgIHN0YXRlLmVudixcbiAgICAgIHRva2Vuc1xuICAgIClcblxuICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaW1hZ2UnLCAnaW1nJywgMClcbiAgICBjb25zdCBhdHRycyA9IFtbJ3NyYycsIGhyZWZdLCBbJ2FsdCcsICcnXV1cbiAgICB0b2tlbi5hdHRycyA9IGF0dHJzXG4gICAgdG9rZW4uY2hpbGRyZW4gPSB0b2tlbnNcbiAgICB0b2tlbi5jb250ZW50ID0gY29udGVudFxuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsndGl0bGUnLCB0aXRsZV0pXG4gICAgfVxuICB9XG5cbiAgc3RhdGUucG9zID0gcG9zXG4gIHN0YXRlLnBvc01heCA9IG1heFxuICByZXR1cm4gdHJ1ZVxufVxuIiwgIi8vIFByb2Nlc3MgYXV0b2xpbmtzICc8cHJvdG9jb2w6Li4uPidcblxuLyogZXNsaW50IG1heC1sZW46MCAqL1xuY29uc3QgRU1BSUxfUkUgPSAvXihbYS16QS1aMC05LiEjJCUmJyorLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKikkL1xuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXggKi9cbmNvbnN0IEFVVE9MSU5LX1JFID0gL14oW2EtekEtWl1bYS16QS1aMC05Ky4tXXsxLDMxfSk6KFtePD5cXHgwMC1cXHgyMF0qKSQvXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGF1dG9saW5rIChzdGF0ZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5wb3NcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQy8qIDwgKi8pIHsgcmV0dXJuIGZhbHNlIH1cblxuICBjb25zdCBzdGFydCA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICBmb3IgKDs7KSB7XG4gICAgaWYgKCsrcG9zID49IG1heCkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcylcblxuICAgIGlmIChjaCA9PT0gMHgzQyAvKiA8ICovKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoY2ggPT09IDB4M0UgLyogPiAqLykgYnJlYWtcbiAgfVxuXG4gIGNvbnN0IHVybCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCArIDEsIHBvcylcblxuICBpZiAoQVVUT0xJTktfUkUudGVzdCh1cmwpKSB7XG4gICAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsodXJsKVxuICAgIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGZ1bGxVcmwpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBpZiAoIXNpbGVudCkge1xuICAgICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2xpbmtfb3BlbicsICdhJywgMSlcbiAgICAgIHRva2VuX28uYXR0cnMgPSBbWydocmVmJywgZnVsbFVybF1dXG4gICAgICB0b2tlbl9vLm1hcmt1cCA9ICdhdXRvbGluaydcbiAgICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJ1xuXG4gICAgICBjb25zdCB0b2tlbl90ID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKVxuICAgICAgdG9rZW5fdC5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKVxuXG4gICAgICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpXG4gICAgICB0b2tlbl9jLm1hcmt1cCA9ICdhdXRvbGluaydcbiAgICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJ1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyArPSB1cmwubGVuZ3RoICsgMlxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBpZiAoRU1BSUxfUkUudGVzdCh1cmwpKSB7XG4gICAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsoJ21haWx0bzonICsgdXJsKVxuICAgIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGZ1bGxVcmwpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBpZiAoIXNpbGVudCkge1xuICAgICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2xpbmtfb3BlbicsICdhJywgMSlcbiAgICAgIHRva2VuX28uYXR0cnMgPSBbWydocmVmJywgZnVsbFVybF1dXG4gICAgICB0b2tlbl9vLm1hcmt1cCA9ICdhdXRvbGluaydcbiAgICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJ1xuXG4gICAgICBjb25zdCB0b2tlbl90ID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKVxuICAgICAgdG9rZW5fdC5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKVxuXG4gICAgICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpXG4gICAgICB0b2tlbl9jLm1hcmt1cCA9ICdhdXRvbGluaydcbiAgICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJ1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyArPSB1cmwubGVuZ3RoICsgMlxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn1cbiIsICIvLyBQcm9jZXNzIGh0bWwgdGFnc1xuXG5pbXBvcnQgeyBIVE1MX1RBR19SRSB9IGZyb20gJy4uL2NvbW1vbi9odG1sX3JlLm1qcydcblxuZnVuY3Rpb24gaXNMaW5rT3BlbiAoc3RyKSB7XG4gIHJldHVybiAvXjxhWz5cXHNdL2kudGVzdChzdHIpXG59XG5mdW5jdGlvbiBpc0xpbmtDbG9zZSAoc3RyKSB7XG4gIHJldHVybiAvXjxcXC9hXFxzKj4vaS50ZXN0KHN0cilcbn1cblxuZnVuY3Rpb24gaXNMZXR0ZXIgKGNoKSB7XG4gIC8qIGVzbGludCBuby1iaXR3aXNlOjAgKi9cbiAgY29uc3QgbGMgPSBjaCB8IDB4MjAgLy8gdG8gbG93ZXIgY2FzZVxuICByZXR1cm4gKGxjID49IDB4NjEvKiBhICovKSAmJiAobGMgPD0gMHg3YS8qIHogKi8pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGh0bWxfaW5saW5lIChzdGF0ZSwgc2lsZW50KSB7XG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5odG1sKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gQ2hlY2sgc3RhcnRcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4XG4gIGNvbnN0IHBvcyA9IHN0YXRlLnBvc1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQy8qIDwgKi8gfHxcbiAgICAgIHBvcyArIDIgPj0gbWF4KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBRdWljayBmYWlsIG9uIHNlY29uZCBjaGFyXG4gIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSlcbiAgaWYgKGNoICE9PSAweDIxLyogISAqLyAmJlxuICAgICAgY2ggIT09IDB4M0YvKiA/ICovICYmXG4gICAgICBjaCAhPT0gMHgyRi8qIC8gKi8gJiZcbiAgICAgICFpc0xldHRlcihjaCkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGNvbnN0IG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcykubWF0Y2goSFRNTF9UQUdfUkUpXG4gIGlmICghbWF0Y2gpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoIXNpbGVudCkge1xuICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaHRtbF9pbmxpbmUnLCAnJywgMClcbiAgICB0b2tlbi5jb250ZW50ID0gbWF0Y2hbMF1cblxuICAgIGlmIChpc0xpbmtPcGVuKHRva2VuLmNvbnRlbnQpKSBzdGF0ZS5saW5rTGV2ZWwrK1xuICAgIGlmIChpc0xpbmtDbG9zZSh0b2tlbi5jb250ZW50KSkgc3RhdGUubGlua0xldmVsLS1cbiAgfVxuICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoXG4gIHJldHVybiB0cnVlXG59XG4iLCAiLy8gUHJvY2VzcyBodG1sIGVudGl0eSAtICYjMTIzOywgJiN4QUY7LCAmcXVvdDssIC4uLlxuXG5pbXBvcnQgeyBkZWNvZGVIVE1MU3RyaWN0IH0gZnJvbSAnZW50aXRpZXMnXG5pbXBvcnQgeyBpc1ZhbGlkRW50aXR5Q29kZSwgZnJvbUNvZGVQb2ludCB9IGZyb20gJy4uL2NvbW1vbi91dGlscy5tanMnXG5cbmNvbnN0IERJR0lUQUxfUkUgPSAvXiYjKCg/OnhbYS1mMC05XXsxLDZ9fFswLTldezEsN30pKTsvaVxuY29uc3QgTkFNRURfUkUgPSAvXiYoW2Etel1bYS16MC05XXsxLDMxfSk7L2lcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZW50aXR5IChzdGF0ZSwgc2lsZW50KSB7XG4gIGNvbnN0IHBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXhcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgyNi8qICYgKi8pIHJldHVybiBmYWxzZVxuXG4gIGlmIChwb3MgKyAxID49IG1heCkgcmV0dXJuIGZhbHNlXG5cbiAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKVxuXG4gIGlmIChjaCA9PT0gMHgyMyAvKiAjICovKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChESUdJVEFMX1JFKVxuICAgIGlmIChtYXRjaCkge1xuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgY29uc3QgY29kZSA9IG1hdGNoWzFdWzBdLnRvTG93ZXJDYXNlKCkgPT09ICd4JyA/IHBhcnNlSW50KG1hdGNoWzFdLnNsaWNlKDEpLCAxNikgOiBwYXJzZUludChtYXRjaFsxXSwgMTApXG5cbiAgICAgICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0ZXh0X3NwZWNpYWwnLCAnJywgMClcbiAgICAgICAgdG9rZW4uY29udGVudCA9IGlzVmFsaWRFbnRpdHlDb2RlKGNvZGUpID8gZnJvbUNvZGVQb2ludChjb2RlKSA6IGZyb21Db2RlUG9pbnQoMHhGRkZEKVxuICAgICAgICB0b2tlbi5tYXJrdXAgPSBtYXRjaFswXVxuICAgICAgICB0b2tlbi5pbmZvID0gJ2VudGl0eSdcbiAgICAgIH1cbiAgICAgIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGhcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcykubWF0Y2goTkFNRURfUkUpXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBjb25zdCBkZWNvZGVkID0gZGVjb2RlSFRNTFN0cmljdChtYXRjaFswXSlcbiAgICAgIGlmIChkZWNvZGVkICE9PSBtYXRjaFswXSkge1xuICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgndGV4dF9zcGVjaWFsJywgJycsIDApXG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IGRlY29kZWRcbiAgICAgICAgICB0b2tlbi5tYXJrdXAgPSBtYXRjaFswXVxuICAgICAgICAgIHRva2VuLmluZm8gPSAnZW50aXR5J1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn1cbiIsICIvLyBGb3IgZWFjaCBvcGVuaW5nIGVtcGhhc2lzLWxpa2UgbWFya2VyIGZpbmQgYSBtYXRjaGluZyBjbG9zaW5nIG9uZVxuLy9cblxuZnVuY3Rpb24gcHJvY2Vzc0RlbGltaXRlcnMgKGRlbGltaXRlcnMpIHtcbiAgY29uc3Qgb3BlbmVyc0JvdHRvbSA9IHt9XG4gIGNvbnN0IG1heCA9IGRlbGltaXRlcnMubGVuZ3RoXG5cbiAgaWYgKCFtYXgpIHJldHVyblxuXG4gIC8vIGhlYWRlcklkeCBpcyB0aGUgZmlyc3QgZGVsaW1pdGVyIG9mIHRoZSBjdXJyZW50ICh3aGVyZSBjbG9zZXIgaXMpIGRlbGltaXRlciBydW5cbiAgbGV0IGhlYWRlcklkeCA9IDBcbiAgbGV0IGxhc3RUb2tlbklkeCA9IC0yIC8vIG5lZWRzIGFueSB2YWx1ZSBsb3dlciB0aGFuIC0xXG4gIGNvbnN0IGp1bXBzID0gW11cblxuICBmb3IgKGxldCBjbG9zZXJJZHggPSAwOyBjbG9zZXJJZHggPCBtYXg7IGNsb3NlcklkeCsrKSB7XG4gICAgY29uc3QgY2xvc2VyID0gZGVsaW1pdGVyc1tjbG9zZXJJZHhdXG5cbiAgICBqdW1wcy5wdXNoKDApXG5cbiAgICAvLyBtYXJrZXJzIGJlbG9uZyB0byBzYW1lIGRlbGltaXRlciBydW4gaWY6XG4gICAgLy8gIC0gdGhleSBoYXZlIGFkamFjZW50IHRva2Vuc1xuICAgIC8vICAtIEFORCBtYXJrZXJzIGFyZSB0aGUgc2FtZVxuICAgIC8vXG4gICAgaWYgKGRlbGltaXRlcnNbaGVhZGVySWR4XS5tYXJrZXIgIT09IGNsb3Nlci5tYXJrZXIgfHwgbGFzdFRva2VuSWR4ICE9PSBjbG9zZXIudG9rZW4gLSAxKSB7XG4gICAgICBoZWFkZXJJZHggPSBjbG9zZXJJZHhcbiAgICB9XG5cbiAgICBsYXN0VG9rZW5JZHggPSBjbG9zZXIudG9rZW5cblxuICAgIC8vIExlbmd0aCBpcyBvbmx5IHVzZWQgZm9yIGVtcGhhc2lzLXNwZWNpZmljIFwicnVsZSBvZiAzXCIsXG4gICAgLy8gaWYgaXQncyBub3QgZGVmaW5lZCAoaW4gc3RyaWtldGhyb3VnaCBvciAzcmQgcGFydHkgcGx1Z2lucyksXG4gICAgLy8gd2UgY2FuIGRlZmF1bHQgaXQgdG8gMCB0byBkaXNhYmxlIHRob3NlIGNoZWNrcy5cbiAgICAvL1xuICAgIGNsb3Nlci5sZW5ndGggPSBjbG9zZXIubGVuZ3RoIHx8IDBcblxuICAgIGlmICghY2xvc2VyLmNsb3NlKSBjb250aW51ZVxuXG4gICAgLy8gUHJldmlvdXNseSBjYWxjdWxhdGVkIGxvd2VyIGJvdW5kcyAocHJldmlvdXMgZmFpbHMpXG4gICAgLy8gZm9yIGVhY2ggbWFya2VyLCBlYWNoIGRlbGltaXRlciBsZW5ndGggbW9kdWxvIDMsXG4gICAgLy8gYW5kIGZvciB3aGV0aGVyIHRoaXMgY2xvc2VyIGNhbiBiZSBhbiBvcGVuZXI7XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvbW1vbm1hcmsvY21hcmsvY29tbWl0LzM0MjUwZTEyY2NlYmRjNjM3MmI4YjQ5YzQ0ZmFiNTdjNzI0NDM0NjBcbiAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zICovXG4gICAgaWYgKCFvcGVuZXJzQm90dG9tLmhhc093blByb3BlcnR5KGNsb3Nlci5tYXJrZXIpKSB7XG4gICAgICBvcGVuZXJzQm90dG9tW2Nsb3Nlci5tYXJrZXJdID0gWy0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdXG4gICAgfVxuXG4gICAgY29uc3QgbWluT3BlbmVySWR4ID0gb3BlbmVyc0JvdHRvbVtjbG9zZXIubWFya2VyXVsoY2xvc2VyLm9wZW4gPyAzIDogMCkgKyAoY2xvc2VyLmxlbmd0aCAlIDMpXVxuXG4gICAgbGV0IG9wZW5lcklkeCA9IGhlYWRlcklkeCAtIGp1bXBzW2hlYWRlcklkeF0gLSAxXG5cbiAgICBsZXQgbmV3TWluT3BlbmVySWR4ID0gb3BlbmVySWR4XG5cbiAgICBmb3IgKDsgb3BlbmVySWR4ID4gbWluT3BlbmVySWR4OyBvcGVuZXJJZHggLT0ganVtcHNbb3BlbmVySWR4XSArIDEpIHtcbiAgICAgIGNvbnN0IG9wZW5lciA9IGRlbGltaXRlcnNbb3BlbmVySWR4XVxuXG4gICAgICBpZiAob3BlbmVyLm1hcmtlciAhPT0gY2xvc2VyLm1hcmtlcikgY29udGludWVcblxuICAgICAgaWYgKG9wZW5lci5vcGVuICYmIG9wZW5lci5lbmQgPCAwKSB7XG4gICAgICAgIGxldCBpc09kZE1hdGNoID0gZmFsc2VcblxuICAgICAgICAvLyBmcm9tIHNwZWM6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIG9uZSBvZiB0aGUgZGVsaW1pdGVycyBjYW4gYm90aCBvcGVuIGFuZCBjbG9zZSBlbXBoYXNpcywgdGhlbiB0aGVcbiAgICAgICAgLy8gc3VtIG9mIHRoZSBsZW5ndGhzIG9mIHRoZSBkZWxpbWl0ZXIgcnVucyBjb250YWluaW5nIHRoZSBvcGVuaW5nIGFuZFxuICAgICAgICAvLyBjbG9zaW5nIGRlbGltaXRlcnMgbXVzdCBub3QgYmUgYSBtdWx0aXBsZSBvZiAzIHVubGVzcyBib3RoIGxlbmd0aHNcbiAgICAgICAgLy8gYXJlIG11bHRpcGxlcyBvZiAzLlxuICAgICAgICAvL1xuICAgICAgICBpZiAob3BlbmVyLmNsb3NlIHx8IGNsb3Nlci5vcGVuKSB7XG4gICAgICAgICAgaWYgKChvcGVuZXIubGVuZ3RoICsgY2xvc2VyLmxlbmd0aCkgJSAzID09PSAwKSB7XG4gICAgICAgICAgICBpZiAob3BlbmVyLmxlbmd0aCAlIDMgIT09IDAgfHwgY2xvc2VyLmxlbmd0aCAlIDMgIT09IDApIHtcbiAgICAgICAgICAgICAgaXNPZGRNYXRjaCA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzT2RkTWF0Y2gpIHtcbiAgICAgICAgICAvLyBJZiBwcmV2aW91cyBkZWxpbWl0ZXIgY2Fubm90IGJlIGFuIG9wZW5lciwgd2UgY2FuIHNhZmVseSBza2lwXG4gICAgICAgICAgLy8gdGhlIGVudGlyZSBzZXF1ZW5jZSBpbiBmdXR1cmUgY2hlY2tzLiBUaGlzIGlzIHJlcXVpcmVkIHRvIG1ha2VcbiAgICAgICAgICAvLyBzdXJlIGFsZ29yaXRobSBoYXMgbGluZWFyIGNvbXBsZXhpdHkgKHNlZSAqXypfKl8qXypfLi4uIGNhc2UpLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgY29uc3QgbGFzdEp1bXAgPSBvcGVuZXJJZHggPiAwICYmICFkZWxpbWl0ZXJzW29wZW5lcklkeCAtIDFdLm9wZW5cbiAgICAgICAgICAgID8ganVtcHNbb3BlbmVySWR4IC0gMV0gKyAxXG4gICAgICAgICAgICA6IDBcblxuICAgICAgICAgIGp1bXBzW2Nsb3NlcklkeF0gPSBjbG9zZXJJZHggLSBvcGVuZXJJZHggKyBsYXN0SnVtcFxuICAgICAgICAgIGp1bXBzW29wZW5lcklkeF0gPSBsYXN0SnVtcFxuXG4gICAgICAgICAgY2xvc2VyLm9wZW4gPSBmYWxzZVxuICAgICAgICAgIG9wZW5lci5lbmQgPSBjbG9zZXJJZHhcbiAgICAgICAgICBvcGVuZXIuY2xvc2UgPSBmYWxzZVxuICAgICAgICAgIG5ld01pbk9wZW5lcklkeCA9IC0xXG4gICAgICAgICAgLy8gdHJlYXQgbmV4dCB0b2tlbiBhcyBzdGFydCBvZiBydW4sXG4gICAgICAgICAgLy8gaXQgb3B0aW1pemVzIHNraXBzIGluICoqPC4uLj4qKmEqKjwuLi4+KiogcGF0aG9sb2dpY2FsIGNhc2VcbiAgICAgICAgICBsYXN0VG9rZW5JZHggPSAtMlxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmV3TWluT3BlbmVySWR4ICE9PSAtMSkge1xuICAgICAgLy8gSWYgbWF0Y2ggZm9yIHRoaXMgZGVsaW1pdGVyIHJ1biBmYWlsZWQsIHdlIHdhbnQgdG8gc2V0IGxvd2VyIGJvdW5kIGZvclxuICAgICAgLy8gZnV0dXJlIGxvb2t1cHMuIFRoaXMgaXMgcmVxdWlyZWQgdG8gbWFrZSBzdXJlIGFsZ29yaXRobSBoYXMgbGluZWFyXG4gICAgICAvLyBjb21wbGV4aXR5LlxuICAgICAgLy9cbiAgICAgIC8vIFNlZSBkZXRhaWxzIGhlcmU6XG4gICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vY29tbW9ubWFyay9jbWFyay9pc3N1ZXMvMTc4I2lzc3VlY29tbWVudC0yNzA0MTc0NDJcbiAgICAgIC8vXG4gICAgICBvcGVuZXJzQm90dG9tW2Nsb3Nlci5tYXJrZXJdWyhjbG9zZXIub3BlbiA/IDMgOiAwKSArICgoY2xvc2VyLmxlbmd0aCB8fCAwKSAlIDMpXSA9IG5ld01pbk9wZW5lcklkeFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsaW5rX3BhaXJzIChzdGF0ZSkge1xuICBjb25zdCB0b2tlbnNfbWV0YSA9IHN0YXRlLnRva2Vuc19tZXRhXG4gIGNvbnN0IG1heCA9IHN0YXRlLnRva2Vuc19tZXRhLmxlbmd0aFxuXG4gIHByb2Nlc3NEZWxpbWl0ZXJzKHN0YXRlLmRlbGltaXRlcnMpXG5cbiAgZm9yIChsZXQgY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIGlmICh0b2tlbnNfbWV0YVtjdXJyXSAmJiB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKSB7XG4gICAgICBwcm9jZXNzRGVsaW1pdGVycyh0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKVxuICAgIH1cbiAgfVxufVxuIiwgIi8vIENsZWFuIHVwIHRva2VucyBhZnRlciBlbXBoYXNpcyBhbmQgc3RyaWtldGhyb3VnaCBwb3N0cHJvY2Vzc2luZzpcbi8vIG1lcmdlIGFkamFjZW50IHRleHQgbm9kZXMgaW50byBvbmUgYW5kIHJlLWNhbGN1bGF0ZSBhbGwgdG9rZW4gbGV2ZWxzXG4vL1xuLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbml0aWFsbHkgZW1waGFzaXMgZGVsaW1pdGVyIG1hcmtlcnMgKCosIF8sIH4pXG4vLyBhcmUgdHJlYXRlZCBhcyB0aGVpciBvd24gc2VwYXJhdGUgdGV4dCB0b2tlbnMuIFRoZW4gZW1waGFzaXMgcnVsZSBlaXRoZXJcbi8vIGxlYXZlcyB0aGVtIGFzIHRleHQgKG5lZWRlZCB0byBtZXJnZSB3aXRoIGFkamFjZW50IHRleHQpIG9yIHR1cm5zIHRoZW1cbi8vIGludG8gb3BlbmluZy9jbG9zaW5nIHRhZ3MgKHdoaWNoIG1lc3NlcyB1cCBsZXZlbHMgaW5zaWRlKS5cbi8vXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZyYWdtZW50c19qb2luIChzdGF0ZSkge1xuICBsZXQgY3VyciwgbGFzdFxuICBsZXQgbGV2ZWwgPSAwXG4gIGNvbnN0IHRva2VucyA9IHN0YXRlLnRva2Vuc1xuICBjb25zdCBtYXggPSBzdGF0ZS50b2tlbnMubGVuZ3RoXG5cbiAgZm9yIChjdXJyID0gbGFzdCA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIC8vIHJlLWNhbGN1bGF0ZSBsZXZlbHMgYWZ0ZXIgZW1waGFzaXMvc3RyaWtldGhyb3VnaCB0dXJucyBzb21lIHRleHQgbm9kZXNcbiAgICAvLyBpbnRvIG9wZW5pbmcvY2xvc2luZyB0YWdzXG4gICAgaWYgKHRva2Vuc1tjdXJyXS5uZXN0aW5nIDwgMCkgbGV2ZWwtLSAvLyBjbG9zaW5nIHRhZ1xuICAgIHRva2Vuc1tjdXJyXS5sZXZlbCA9IGxldmVsXG4gICAgaWYgKHRva2Vuc1tjdXJyXS5uZXN0aW5nID4gMCkgbGV2ZWwrKyAvLyBvcGVuaW5nIHRhZ1xuXG4gICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dCcgJiZcbiAgICAgICAgY3VyciArIDEgPCBtYXggJiZcbiAgICAgICAgdG9rZW5zW2N1cnIgKyAxXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgIC8vIGNvbGxhcHNlIHR3byBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnQgPSB0b2tlbnNbY3Vycl0uY29udGVudCArIHRva2Vuc1tjdXJyICsgMV0uY29udGVudFxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VyciAhPT0gbGFzdCkgeyB0b2tlbnNbbGFzdF0gPSB0b2tlbnNbY3Vycl0gfVxuXG4gICAgICBsYXN0KytcbiAgICB9XG4gIH1cblxuICBpZiAoY3VyciAhPT0gbGFzdCkge1xuICAgIHRva2Vucy5sZW5ndGggPSBsYXN0XG4gIH1cbn1cbiIsICIvKiogaW50ZXJuYWxcbiAqIGNsYXNzIFBhcnNlcklubGluZVxuICpcbiAqIFRva2VuaXplcyBwYXJhZ3JhcGggY29udGVudC5cbiAqKi9cblxuaW1wb3J0IFJ1bGVyIGZyb20gJy4vcnVsZXIubWpzJ1xuaW1wb3J0IFN0YXRlSW5saW5lIGZyb20gJy4vcnVsZXNfaW5saW5lL3N0YXRlX2lubGluZS5tanMnXG5cbmltcG9ydCByX3RleHQgZnJvbSAnLi9ydWxlc19pbmxpbmUvdGV4dC5tanMnXG5pbXBvcnQgcl9saW5raWZ5IGZyb20gJy4vcnVsZXNfaW5saW5lL2xpbmtpZnkubWpzJ1xuaW1wb3J0IHJfbmV3bGluZSBmcm9tICcuL3J1bGVzX2lubGluZS9uZXdsaW5lLm1qcydcbmltcG9ydCByX2VzY2FwZSBmcm9tICcuL3J1bGVzX2lubGluZS9lc2NhcGUubWpzJ1xuaW1wb3J0IHJfYmFja3RpY2tzIGZyb20gJy4vcnVsZXNfaW5saW5lL2JhY2t0aWNrcy5tanMnXG5pbXBvcnQgcl9zdHJpa2V0aHJvdWdoIGZyb20gJy4vcnVsZXNfaW5saW5lL3N0cmlrZXRocm91Z2gubWpzJ1xuaW1wb3J0IHJfZW1waGFzaXMgZnJvbSAnLi9ydWxlc19pbmxpbmUvZW1waGFzaXMubWpzJ1xuaW1wb3J0IHJfbGluayBmcm9tICcuL3J1bGVzX2lubGluZS9saW5rLm1qcydcbmltcG9ydCByX2ltYWdlIGZyb20gJy4vcnVsZXNfaW5saW5lL2ltYWdlLm1qcydcbmltcG9ydCByX2F1dG9saW5rIGZyb20gJy4vcnVsZXNfaW5saW5lL2F1dG9saW5rLm1qcydcbmltcG9ydCByX2h0bWxfaW5saW5lIGZyb20gJy4vcnVsZXNfaW5saW5lL2h0bWxfaW5saW5lLm1qcydcbmltcG9ydCByX2VudGl0eSBmcm9tICcuL3J1bGVzX2lubGluZS9lbnRpdHkubWpzJ1xuXG5pbXBvcnQgcl9iYWxhbmNlX3BhaXJzIGZyb20gJy4vcnVsZXNfaW5saW5lL2JhbGFuY2VfcGFpcnMubWpzJ1xuaW1wb3J0IHJfZnJhZ21lbnRzX2pvaW4gZnJvbSAnLi9ydWxlc19pbmxpbmUvZnJhZ21lbnRzX2pvaW4ubWpzJ1xuXG4vLyBQYXJzZXIgcnVsZXNcblxuY29uc3QgX3J1bGVzID0gW1xuICBbJ3RleHQnLCByX3RleHRdLFxuICBbJ2xpbmtpZnknLCByX2xpbmtpZnldLFxuICBbJ25ld2xpbmUnLCByX25ld2xpbmVdLFxuICBbJ2VzY2FwZScsIHJfZXNjYXBlXSxcbiAgWydiYWNrdGlja3MnLCByX2JhY2t0aWNrc10sXG4gIFsnc3RyaWtldGhyb3VnaCcsIHJfc3RyaWtldGhyb3VnaC50b2tlbml6ZV0sXG4gIFsnZW1waGFzaXMnLCByX2VtcGhhc2lzLnRva2VuaXplXSxcbiAgWydsaW5rJywgcl9saW5rXSxcbiAgWydpbWFnZScsIHJfaW1hZ2VdLFxuICBbJ2F1dG9saW5rJywgcl9hdXRvbGlua10sXG4gIFsnaHRtbF9pbmxpbmUnLCByX2h0bWxfaW5saW5lXSxcbiAgWydlbnRpdHknLCByX2VudGl0eV1cbl1cblxuLy8gYHJ1bGUyYCBydWxlc2V0IHdhcyBjcmVhdGVkIHNwZWNpZmljYWxseSBmb3IgZW1waGFzaXMvc3RyaWtldGhyb3VnaFxuLy8gcG9zdC1wcm9jZXNzaW5nIGFuZCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuLy9cbi8vIERvbid0IHVzZSB0aGlzIGZvciBhbnl0aGluZyBleGNlcHQgcGFpcnMgKHBsdWdpbnMgd29ya2luZyB3aXRoIGBiYWxhbmNlX3BhaXJzYCkuXG4vL1xuY29uc3QgX3J1bGVzMiA9IFtcbiAgWydiYWxhbmNlX3BhaXJzJywgcl9iYWxhbmNlX3BhaXJzXSxcbiAgWydzdHJpa2V0aHJvdWdoJywgcl9zdHJpa2V0aHJvdWdoLnBvc3RQcm9jZXNzXSxcbiAgWydlbXBoYXNpcycsIHJfZW1waGFzaXMucG9zdFByb2Nlc3NdLFxuICAvLyBydWxlcyBmb3IgcGFpcnMgc2VwYXJhdGUgJyoqJyBpbnRvIGl0cyBvd24gdGV4dCB0b2tlbnMsIHdoaWNoIG1heSBiZSBsZWZ0IHVudXNlZCxcbiAgLy8gcnVsZSBiZWxvdyBtZXJnZXMgdW51c2VkIHNlZ21lbnRzIGJhY2sgd2l0aCB0aGUgcmVzdCBvZiB0aGUgdGV4dFxuICBbJ2ZyYWdtZW50c19qb2luJywgcl9mcmFnbWVudHNfam9pbl1cbl1cblxuLyoqXG4gKiBuZXcgUGFyc2VySW5saW5lKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlcklubGluZSAoKSB7XG4gIC8qKlxuICAgKiBQYXJzZXJJbmxpbmUjcnVsZXIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBLZWVwIGNvbmZpZ3VyYXRpb24gb2YgaW5saW5lIHJ1bGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgX3J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlci5wdXNoKF9ydWxlc1tpXVswXSwgX3J1bGVzW2ldWzFdKVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlcjIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBTZWNvbmQgcnVsZXIgdXNlZCBmb3IgcG9zdC1wcm9jZXNzaW5nXG4gICAqIChlLmcuIGluIGVtcGhhc2lzLWxpa2UgcnVsZXMpLlxuICAgKiovXG4gIHRoaXMucnVsZXIyID0gbmV3IFJ1bGVyKClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IF9ydWxlczIubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyMi5wdXNoKF9ydWxlczJbaV1bMF0sIF9ydWxlczJbaV1bMV0pXG4gIH1cbn1cblxuLy8gU2tpcCBzaW5nbGUgdG9rZW4gYnkgcnVubmluZyBhbGwgcnVsZXMgaW4gdmFsaWRhdGlvbiBtb2RlO1xuLy8gcmV0dXJucyBgdHJ1ZWAgaWYgYW55IHJ1bGUgcmVwb3J0ZWQgc3VjY2Vzc1xuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUuc2tpcFRva2VuID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gIGNvbnN0IHBvcyA9IHN0YXRlLnBvc1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpXG4gIGNvbnN0IGxlbiA9IHJ1bGVzLmxlbmd0aFxuICBjb25zdCBtYXhOZXN0aW5nID0gc3RhdGUubWQub3B0aW9ucy5tYXhOZXN0aW5nXG4gIGNvbnN0IGNhY2hlID0gc3RhdGUuY2FjaGVcblxuICBpZiAodHlwZW9mIGNhY2hlW3Bvc10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgc3RhdGUucG9zID0gY2FjaGVbcG9zXVxuICAgIHJldHVyblxuICB9XG5cbiAgbGV0IG9rID0gZmFsc2VcblxuICBpZiAoc3RhdGUubGV2ZWwgPCBtYXhOZXN0aW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgLy8gSW5jcmVtZW50IHN0YXRlLmxldmVsIGFuZCBkZWNyZW1lbnQgaXQgbGF0ZXIgdG8gbGltaXQgcmVjdXJzaW9uLlxuICAgICAgLy8gSXQncyBoYXJtbGVzcyB0byBkbyBoZXJlLCBiZWNhdXNlIG5vIHRva2VucyBhcmUgY3JlYXRlZC4gQnV0IGlkZWFsbHksXG4gICAgICAvLyB3ZSdkIG5lZWQgYSBzZXBhcmF0ZSBwcml2YXRlIHN0YXRlIHZhcmlhYmxlIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAvL1xuICAgICAgc3RhdGUubGV2ZWwrK1xuICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgdHJ1ZSlcbiAgICAgIHN0YXRlLmxldmVsLS1cblxuICAgICAgaWYgKG9rKSB7XG4gICAgICAgIGlmIChwb3MgPj0gc3RhdGUucG9zKSB7IHRocm93IG5ldyBFcnJvcihcImlubGluZSBydWxlIGRpZG4ndCBpbmNyZW1lbnQgc3RhdGUucG9zXCIpIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVG9vIG11Y2ggbmVzdGluZywganVzdCBza2lwIHVudGlsIHRoZSBlbmQgb2YgdGhlIHBhcmFncmFwaC5cbiAgICAvL1xuICAgIC8vIE5PVEU6IHRoaXMgd2lsbCBjYXVzZSBsaW5rcyB0byBiZWhhdmUgaW5jb3JyZWN0bHkgaW4gdGhlIGZvbGxvd2luZyBjYXNlLFxuICAgIC8vICAgICAgIHdoZW4gYW4gYW1vdW50IG9mIGBbYCBpcyBleGFjdGx5IGVxdWFsIHRvIGBtYXhOZXN0aW5nICsgMWA6XG4gICAgLy9cbiAgICAvLyAgICAgICBbW1tbW1tbW1tbW1tbW1tbW1tbW1tmb29dKClcbiAgICAvL1xuICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHdvcmthcm91bmQgd2hlbiBDTSBzdGFuZGFyZCB3aWxsIGFsbG93IG5lc3RlZCBsaW5rc1xuICAgIC8vICAgICAgICh3ZSBjYW4gcmVwbGFjZSBpdCBieSBwcmV2ZW50aW5nIGxpbmtzIGZyb20gYmVpbmcgcGFyc2VkIGluXG4gICAgLy8gICAgICAgdmFsaWRhdGlvbiBtb2RlKVxuICAgIC8vXG4gICAgc3RhdGUucG9zID0gc3RhdGUucG9zTWF4XG4gIH1cblxuICBpZiAoIW9rKSB7IHN0YXRlLnBvcysrIH1cbiAgY2FjaGVbcG9zXSA9IHN0YXRlLnBvc1xufVxuXG4vLyBHZW5lcmF0ZSB0b2tlbnMgZm9yIGlucHV0IHJhbmdlXG4vL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS50b2tlbml6ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpXG4gIGNvbnN0IGxlbiA9IHJ1bGVzLmxlbmd0aFxuICBjb25zdCBlbmQgPSBzdGF0ZS5wb3NNYXhcbiAgY29uc3QgbWF4TmVzdGluZyA9IHN0YXRlLm1kLm9wdGlvbnMubWF4TmVzdGluZ1xuXG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBlbmQpIHtcbiAgICAvLyBUcnkgYWxsIHBvc3NpYmxlIHJ1bGVzLlxuICAgIC8vIE9uIHN1Y2Nlc3MsIHJ1bGUgc2hvdWxkOlxuICAgIC8vXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnBvc2BcbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUudG9rZW5zYFxuICAgIC8vIC0gcmV0dXJuIHRydWVcbiAgICBjb25zdCBwcmV2UG9zID0gc3RhdGUucG9zXG4gICAgbGV0IG9rID0gZmFsc2VcblxuICAgIGlmIChzdGF0ZS5sZXZlbCA8IG1heE5lc3RpbmcpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgZmFsc2UpXG4gICAgICAgIGlmIChvaykge1xuICAgICAgICAgIGlmIChwcmV2UG9zID49IHN0YXRlLnBvcykgeyB0aHJvdyBuZXcgRXJyb3IoXCJpbmxpbmUgcnVsZSBkaWRuJ3QgaW5jcmVtZW50IHN0YXRlLnBvc1wiKSB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvaykge1xuICAgICAgaWYgKHN0YXRlLnBvcyA+PSBlbmQpIHsgYnJlYWsgfVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyY1tzdGF0ZS5wb3MrK11cbiAgfVxuXG4gIGlmIChzdGF0ZS5wZW5kaW5nKSB7XG4gICAgc3RhdGUucHVzaFBlbmRpbmcoKVxuICB9XG59XG5cbi8qKlxuICogUGFyc2VySW5saW5lLnBhcnNlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKVxuICpcbiAqIFByb2Nlc3MgaW5wdXQgc3RyaW5nIGFuZCBwdXNoIGlubGluZSB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICBjb25zdCBzdGF0ZSA9IG5ldyB0aGlzLlN0YXRlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKVxuXG4gIHRoaXMudG9rZW5pemUoc3RhdGUpXG5cbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyMi5nZXRSdWxlcygnJylcbiAgY29uc3QgbGVuID0gcnVsZXMubGVuZ3RoXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHJ1bGVzW2ldKHN0YXRlKVxuICB9XG59XG5cblBhcnNlcklubGluZS5wcm90b3R5cGUuU3RhdGUgPSBTdGF0ZUlubGluZVxuXG5leHBvcnQgZGVmYXVsdCBQYXJzZXJJbmxpbmVcbiIsICIvLyBtYXJrZG93bi1pdCBkZWZhdWx0IG9wdGlvbnNcblxuZXhwb3J0IGRlZmF1bHQge1xuICBvcHRpb25zOiB7XG4gICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICBodG1sOiBmYWxzZSxcblxuICAgIC8vIFVzZSAnLycgdG8gY2xvc2Ugc2luZ2xlIHRhZ3MgKDxiciAvPilcbiAgICB4aHRtbE91dDogZmFsc2UsXG5cbiAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgYnJlYWtzOiBmYWxzZSxcblxuICAgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsYW5nUHJlZml4OiAnbGFuZ3VhZ2UtJyxcblxuICAgIC8vIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHRzIHRvIGxpbmtzXG4gICAgbGlua2lmeTogZmFsc2UsXG5cbiAgICAvLyBFbmFibGUgc29tZSBsYW5ndWFnZS1uZXV0cmFsIHJlcGxhY2VtZW50cyArIHF1b3RlcyBiZWF1dGlmaWNhdGlvblxuICAgIHR5cG9ncmFwaGVyOiBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnwqvCu+KAnuKAnCcgZm9yIFJ1c3NpYW4sICfigJ7igJzigJrigJgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLCAvKiDigJzigJ3igJjigJkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gICAgbWF4TmVzdGluZzogMTAwXG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuICAgIGNvcmU6IHt9LFxuICAgIGJsb2NrOiB7fSxcbiAgICBpbmxpbmU6IHt9XG4gIH1cbn1cbiIsICIvLyBcIlplcm9cIiBwcmVzZXQsIHdpdGggbm90aGluZyBlbmFibGVkLiBVc2VmdWwgZm9yIG1hbnVhbCBjb25maWd1cmluZyBvZiBzaW1wbGVcbi8vIG1vZGVzLiBGb3IgZXhhbXBsZSwgdG8gcGFyc2UgYm9sZC9pdGFsaWMgb25seS5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBvcHRpb25zOiB7XG4gICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICBodG1sOiBmYWxzZSxcblxuICAgIC8vIFVzZSAnLycgdG8gY2xvc2Ugc2luZ2xlIHRhZ3MgKDxiciAvPilcbiAgICB4aHRtbE91dDogZmFsc2UsXG5cbiAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgYnJlYWtzOiBmYWxzZSxcblxuICAgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsYW5nUHJlZml4OiAnbGFuZ3VhZ2UtJyxcblxuICAgIC8vIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHRzIHRvIGxpbmtzXG4gICAgbGlua2lmeTogZmFsc2UsXG5cbiAgICAvLyBFbmFibGUgc29tZSBsYW5ndWFnZS1uZXV0cmFsIHJlcGxhY2VtZW50cyArIHF1b3RlcyBiZWF1dGlmaWNhdGlvblxuICAgIHR5cG9ncmFwaGVyOiBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnwqvCu+KAnuKAnCcgZm9yIFJ1c3NpYW4sICfigJ7igJzigJrigJgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLCAvKiDigJzigJ3igJjigJkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gICAgbWF4TmVzdGluZzogMjBcbiAgfSxcblxuICBjb21wb25lbnRzOiB7XG5cbiAgICBjb3JlOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnbm9ybWFsaXplJyxcbiAgICAgICAgJ2Jsb2NrJyxcbiAgICAgICAgJ2lubGluZScsXG4gICAgICAgICd0ZXh0X2pvaW4nXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAncGFyYWdyYXBoJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBpbmxpbmU6IHtcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICdmcmFnbWVudHNfam9pbidcbiAgICAgIF1cbiAgICB9XG4gIH1cbn1cbiIsICIvLyBDb21tb25tYXJrIGRlZmF1bHQgb3B0aW9uc1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG9wdGlvbnM6IHtcbiAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIGh0bWw6IHRydWUsXG5cbiAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgeGh0bWxPdXQ6IHRydWUsXG5cbiAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgYnJlYWtzOiBmYWxzZSxcblxuICAgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsYW5nUHJlZml4OiAnbGFuZ3VhZ2UtJyxcblxuICAgIC8vIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHRzIHRvIGxpbmtzXG4gICAgbGlua2lmeTogZmFsc2UsXG5cbiAgICAvLyBFbmFibGUgc29tZSBsYW5ndWFnZS1uZXV0cmFsIHJlcGxhY2VtZW50cyArIHF1b3RlcyBiZWF1dGlmaWNhdGlvblxuICAgIHR5cG9ncmFwaGVyOiBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnwqvCu+KAnuKAnCcgZm9yIFJ1c3NpYW4sICfigJ7igJzigJrigJgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLCAvKiDigJzigJ3igJjigJkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gICAgbWF4TmVzdGluZzogMjBcbiAgfSxcblxuICBjb21wb25lbnRzOiB7XG5cbiAgICBjb3JlOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnbm9ybWFsaXplJyxcbiAgICAgICAgJ2Jsb2NrJyxcbiAgICAgICAgJ2lubGluZScsXG4gICAgICAgICd0ZXh0X2pvaW4nXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnYmxvY2txdW90ZScsXG4gICAgICAgICdjb2RlJyxcbiAgICAgICAgJ2ZlbmNlJyxcbiAgICAgICAgJ2hlYWRpbmcnLFxuICAgICAgICAnaHInLFxuICAgICAgICAnaHRtbF9ibG9jaycsXG4gICAgICAgICdsaGVhZGluZycsXG4gICAgICAgICdsaXN0JyxcbiAgICAgICAgJ3JlZmVyZW5jZScsXG4gICAgICAgICdwYXJhZ3JhcGgnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2F1dG9saW5rJyxcbiAgICAgICAgJ2JhY2t0aWNrcycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdlbnRpdHknLFxuICAgICAgICAnZXNjYXBlJyxcbiAgICAgICAgJ2h0bWxfaW5saW5lJyxcbiAgICAgICAgJ2ltYWdlJyxcbiAgICAgICAgJ2xpbmsnLFxuICAgICAgICAnbmV3bGluZScsXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdmcmFnbWVudHNfam9pbidcbiAgICAgIF1cbiAgICB9XG4gIH1cbn1cbiIsICIvLyBNYWluIHBhcnNlciBjbGFzc1xuXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2NvbW1vbi91dGlscy5tanMnXG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycy9pbmRleC5tanMnXG5pbXBvcnQgUmVuZGVyZXIgZnJvbSAnLi9yZW5kZXJlci5tanMnXG5pbXBvcnQgUGFyc2VyQ29yZSBmcm9tICcuL3BhcnNlcl9jb3JlLm1qcydcbmltcG9ydCBQYXJzZXJCbG9jayBmcm9tICcuL3BhcnNlcl9ibG9jay5tanMnXG5pbXBvcnQgUGFyc2VySW5saW5lIGZyb20gJy4vcGFyc2VyX2lubGluZS5tanMnXG5pbXBvcnQgTGlua2lmeUl0IGZyb20gJ2xpbmtpZnktaXQnXG5pbXBvcnQgKiBhcyBtZHVybCBmcm9tICdtZHVybCdcbmltcG9ydCBwdW55Y29kZSBmcm9tICdwdW55Y29kZS5qcydcblxuaW1wb3J0IGNmZ19kZWZhdWx0IGZyb20gJy4vcHJlc2V0cy9kZWZhdWx0Lm1qcydcbmltcG9ydCBjZmdfemVybyBmcm9tICcuL3ByZXNldHMvemVyby5tanMnXG5pbXBvcnQgY2ZnX2NvbW1vbm1hcmsgZnJvbSAnLi9wcmVzZXRzL2NvbW1vbm1hcmsubWpzJ1xuXG5jb25zdCBjb25maWcgPSB7XG4gIGRlZmF1bHQ6IGNmZ19kZWZhdWx0LFxuICB6ZXJvOiBjZmdfemVybyxcbiAgY29tbW9ubWFyazogY2ZnX2NvbW1vbm1hcmtcbn1cblxuLy9cbi8vIFRoaXMgdmFsaWRhdG9yIGNhbiBwcm9oaWJpdCBtb3JlIHRoYW4gcmVhbGx5IG5lZWRlZCB0byBwcmV2ZW50IFhTUy4gSXQncyBhXG4vLyB0cmFkZW9mZiB0byBrZWVwIGNvZGUgc2ltcGxlIGFuZCB0byBiZSBzZWN1cmUgYnkgZGVmYXVsdC5cbi8vXG4vLyBJZiB5b3UgbmVlZCBkaWZmZXJlbnQgc2V0dXAgLSBvdmVycmlkZSB2YWxpZGF0b3IgbWV0aG9kIGFzIHlvdSB3aXNoLiBPclxuLy8gcmVwbGFjZSBpdCB3aXRoIGR1bW15IGZ1bmN0aW9uIGFuZCB1c2UgZXh0ZXJuYWwgc2FuaXRpemVyLlxuLy9cblxuY29uc3QgQkFEX1BST1RPX1JFID0gL14odmJzY3JpcHR8amF2YXNjcmlwdHxmaWxlfGRhdGEpOi9cbmNvbnN0IEdPT0RfREFUQV9SRSA9IC9eZGF0YTppbWFnZVxcLyhnaWZ8cG5nfGpwZWd8d2VicCk7L1xuXG5mdW5jdGlvbiB2YWxpZGF0ZUxpbmsgKHVybCkge1xuICAvLyB1cmwgc2hvdWxkIGJlIG5vcm1hbGl6ZWQgYXQgdGhpcyBwb2ludCwgYW5kIGV4aXN0aW5nIGVudGl0aWVzIGFyZSBkZWNvZGVkXG4gIGNvbnN0IHN0ciA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKVxuXG4gIHJldHVybiBCQURfUFJPVE9fUkUudGVzdChzdHIpID8gR09PRF9EQVRBX1JFLnRlc3Qoc3RyKSA6IHRydWVcbn1cblxuY29uc3QgUkVDT0RFX0hPU1ROQU1FX0ZPUiA9IFsnaHR0cDonLCAnaHR0cHM6JywgJ21haWx0bzonXVxuXG5mdW5jdGlvbiBub3JtYWxpemVMaW5rICh1cmwpIHtcbiAgY29uc3QgcGFyc2VkID0gbWR1cmwucGFyc2UodXJsLCB0cnVlKVxuXG4gIGlmIChwYXJzZWQuaG9zdG5hbWUpIHtcbiAgICAvLyBFbmNvZGUgaG9zdG5hbWVzIGluIHVybHMgbGlrZTpcbiAgICAvLyBgaHR0cDovL2hvc3QvYCwgYGh0dHBzOi8vaG9zdC9gLCBgbWFpbHRvOnVzZXJAaG9zdGAsIGAvL2hvc3QvYFxuICAgIC8vXG4gICAgLy8gV2UgZG9uJ3QgZW5jb2RlIHVua25vd24gc2NoZW1hcywgYmVjYXVzZSBpdCdzIGxpa2VseSB0aGF0IHdlIGVuY29kZVxuICAgIC8vIHNvbWV0aGluZyB3ZSBzaG91bGRuJ3QgKGUuZy4gYHNreXBlOm5hbWVgIHRyZWF0ZWQgYXMgYHNreXBlOmhvc3RgKVxuICAgIC8vXG4gICAgaWYgKCFwYXJzZWQucHJvdG9jb2wgfHwgUkVDT0RFX0hPU1ROQU1FX0ZPUi5pbmRleE9mKHBhcnNlZC5wcm90b2NvbCkgPj0gMCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFyc2VkLmhvc3RuYW1lID0gcHVueWNvZGUudG9BU0NJSShwYXJzZWQuaG9zdG5hbWUpXG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWR1cmwuZW5jb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMaW5rVGV4dCAodXJsKSB7XG4gIGNvbnN0IHBhcnNlZCA9IG1kdXJsLnBhcnNlKHVybCwgdHJ1ZSlcblxuICBpZiAocGFyc2VkLmhvc3RuYW1lKSB7XG4gICAgLy8gRW5jb2RlIGhvc3RuYW1lcyBpbiB1cmxzIGxpa2U6XG4gICAgLy8gYGh0dHA6Ly9ob3N0L2AsIGBodHRwczovL2hvc3QvYCwgYG1haWx0bzp1c2VyQGhvc3RgLCBgLy9ob3N0L2BcbiAgICAvL1xuICAgIC8vIFdlIGRvbid0IGVuY29kZSB1bmtub3duIHNjaGVtYXMsIGJlY2F1c2UgaXQncyBsaWtlbHkgdGhhdCB3ZSBlbmNvZGVcbiAgICAvLyBzb21ldGhpbmcgd2Ugc2hvdWxkbid0IChlLmcuIGBza3lwZTpuYW1lYCB0cmVhdGVkIGFzIGBza3lwZTpob3N0YClcbiAgICAvL1xuICAgIGlmICghcGFyc2VkLnByb3RvY29sIHx8IFJFQ09ERV9IT1NUTkFNRV9GT1IuaW5kZXhPZihwYXJzZWQucHJvdG9jb2wpID49IDApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhcnNlZC5ob3N0bmFtZSA9IHB1bnljb2RlLnRvVW5pY29kZShwYXJzZWQuaG9zdG5hbWUpXG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICAvLyBhZGQgJyUnIHRvIGV4Y2x1ZGUgbGlzdCBiZWNhdXNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9pc3N1ZXMvNzIwXG4gIHJldHVybiBtZHVybC5kZWNvZGUobWR1cmwuZm9ybWF0KHBhcnNlZCksIG1kdXJsLmRlY29kZS5kZWZhdWx0Q2hhcnMgKyAnJScpXG59XG5cbi8qKlxuICogY2xhc3MgTWFya2Rvd25JdFxuICpcbiAqIE1haW4gcGFyc2VyL3JlbmRlcmVyIGNsYXNzLlxuICpcbiAqICMjIyMjIFVzYWdlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogLy8gbm9kZS5qcywgXCJjbGFzc2ljXCIgd2F5OlxuICogdmFyIE1hcmtkb3duSXQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpLFxuICogICAgIG1kID0gbmV3IE1hcmtkb3duSXQoKTtcbiAqIHZhciByZXN1bHQgPSBtZC5yZW5kZXIoJyMgbWFya2Rvd24taXQgcnVsZXp6IScpO1xuICpcbiAqIC8vIG5vZGUuanMsIHRoZSBzYW1lLCBidXQgd2l0aCBzdWdhcjpcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqIHZhciByZXN1bHQgPSBtZC5yZW5kZXIoJyMgbWFya2Rvd24taXQgcnVsZXp6IScpO1xuICpcbiAqIC8vIGJyb3dzZXIgd2l0aG91dCBBTUQsIGFkZGVkIHRvIFwid2luZG93XCIgb24gc2NyaXB0IGxvYWRcbiAqIC8vIE5vdGUsIHRoZXJlIGFyZSBubyBkYXNoLlxuICogdmFyIG1kID0gd2luZG93Lm1hcmtkb3duaXQoKTtcbiAqIHZhciByZXN1bHQgPSBtZC5yZW5kZXIoJyMgbWFya2Rvd24taXQgcnVsZXp6IScpO1xuICogYGBgXG4gKlxuICogU2luZ2xlIGxpbmUgcmVuZGVyaW5nLCB3aXRob3V0IHBhcmFncmFwaCB3cmFwOlxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqIHZhciByZXN1bHQgPSBtZC5yZW5kZXJJbmxpbmUoJ19fbWFya2Rvd24taXRfXyBydWxlenohJyk7XG4gKiBgYGBcbiAqKi9cblxuLyoqXG4gKiBuZXcgTWFya2Rvd25JdChbcHJlc2V0TmFtZSwgb3B0aW9uc10pXG4gKiAtIHByZXNldE5hbWUgKFN0cmluZyk6IG9wdGlvbmFsLCBgY29tbW9ubWFya2AgLyBgemVyb2BcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KVxuICpcbiAqIENyZWF0ZXMgcGFyc2VyIGluc3RhbnNlIHdpdGggZ2l2ZW4gY29uZmlnLiBDYW4gYmUgY2FsbGVkIHdpdGhvdXQgYG5ld2AuXG4gKlxuICogIyMjIyMgcHJlc2V0TmFtZVxuICpcbiAqIE1hcmtkb3duSXQgcHJvdmlkZXMgbmFtZWQgcHJlc2V0cyBhcyBhIGNvbnZlbmllbmNlIHRvIHF1aWNrbHlcbiAqIGVuYWJsZS9kaXNhYmxlIGFjdGl2ZSBzeW50YXggcnVsZXMgYW5kIG9wdGlvbnMgZm9yIGNvbW1vbiB1c2UgY2FzZXMuXG4gKlxuICogLSBbXCJjb21tb25tYXJrXCJdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcHJlc2V0cy9jb21tb25tYXJrLm1qcykgLVxuICogICBjb25maWd1cmVzIHBhcnNlciB0byBzdHJpY3QgW0NvbW1vbk1hcmtdKGh0dHA6Ly9jb21tb25tYXJrLm9yZy8pIG1vZGUuXG4gKiAtIFtkZWZhdWx0XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvZGVmYXVsdC5tanMpIC1cbiAqICAgc2ltaWxhciB0byBHRk0sIHVzZWQgd2hlbiBubyBwcmVzZXQgbmFtZSBnaXZlbi4gRW5hYmxlcyBhbGwgYXZhaWxhYmxlIHJ1bGVzLFxuICogICBidXQgc3RpbGwgd2l0aG91dCBodG1sLCB0eXBvZ3JhcGhlciAmIGF1dG9saW5rZXIuXG4gKiAtIFtcInplcm9cIl0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9wcmVzZXRzL3plcm8ubWpzKSAtXG4gKiAgIGFsbCBydWxlcyBkaXNhYmxlZC4gVXNlZnVsIHRvIHF1aWNrbHkgc2V0dXAgeW91ciBjb25maWcgdmlhIGAuZW5hYmxlKClgLlxuICogICBGb3IgZXhhbXBsZSwgd2hlbiB5b3UgbmVlZCBvbmx5IGBib2xkYCBhbmQgYGl0YWxpY2AgbWFya3VwIGFuZCBub3RoaW5nIGVsc2UuXG4gKlxuICogIyMjIyMgb3B0aW9uczpcbiAqXG4gKiAtIF9faHRtbF9fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBlbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZS4gQmUgY2FyZWZ1bCFcbiAqICAgVGhhdCdzIG5vdCBzYWZlISBZb3UgbWF5IG5lZWQgZXh0ZXJuYWwgc2FuaXRpemVyIHRvIHByb3RlY3Qgb3V0cHV0IGZyb20gWFNTLlxuICogICBJdCdzIGJldHRlciB0byBleHRlbmQgZmVhdHVyZXMgdmlhIHBsdWdpbnMsIGluc3RlYWQgb2YgZW5hYmxpbmcgSFRNTC5cbiAqIC0gX194aHRtbE91dF9fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBhZGQgJy8nIHdoZW4gY2xvc2luZyBzaW5nbGUgdGFnc1xuICogICAoYDxiciAvPmApLiBUaGlzIGlzIG5lZWRlZCBvbmx5IGZvciBmdWxsIENvbW1vbk1hcmsgY29tcGF0aWJpbGl0eS4gSW4gcmVhbFxuICogICB3b3JsZCB5b3Ugd2lsbCBuZWVkIEhUTUwgb3V0cHV0LlxuICogLSBfX2JyZWFrc19fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBjb252ZXJ0IGBcXG5gIGluIHBhcmFncmFwaHMgaW50byBgPGJyPmAuXG4gKiAtIF9fbGFuZ1ByZWZpeF9fIC0gYGxhbmd1YWdlLWAuIENTUyBsYW5ndWFnZSBjbGFzcyBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3MuXG4gKiAgIENhbiBiZSB1c2VmdWwgZm9yIGV4dGVybmFsIGhpZ2hsaWdodGVycy5cbiAqIC0gX19saW5raWZ5X18gLSBgZmFsc2VgLiBTZXQgYHRydWVgIHRvIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHQgdG8gbGlua3MuXG4gKiAtIF9fdHlwb2dyYXBoZXJfXyAgLSBgZmFsc2VgLiBTZXQgYHRydWVgIHRvIGVuYWJsZSBbc29tZSBsYW5ndWFnZS1uZXV0cmFsXG4gKiAgIHJlcGxhY2VtZW50XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3J1bGVzX2NvcmUvcmVwbGFjZW1lbnRzLm1qcykgK1xuICogICBxdW90ZXMgYmVhdXRpZmljYXRpb24gKHNtYXJ0cXVvdGVzKS5cbiAqIC0gX19xdW90ZXNfXyAtIGDigJzigJ3igJjigJlgLCBTdHJpbmcgb3IgQXJyYXkuIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnRcbiAqICAgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCBhbmQgc21hcnRxdW90ZXMgb24uIEZvciBleGFtcGxlLCB5b3UgY2FuXG4gKiAgIHVzZSBgJ8KrwrvigJ7igJwnYCBmb3IgUnVzc2lhbiwgYCfigJ7igJzigJrigJgnYCBmb3IgR2VybWFuLCBhbmRcbiAqICAgYFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J11gIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAqIC0gX19oaWdobGlnaHRfXyAtIGBudWxsYC4gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24gZm9yIGZlbmNlZCBjb2RlIGJsb2Nrcy5cbiAqICAgSGlnaGxpZ2h0ZXIgYGZ1bmN0aW9uIChzdHIsIGxhbmcpYCBzaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTC4gSXQgY2FuIGFsc29cbiAqICAgcmV0dXJuIGVtcHR5IHN0cmluZyBpZiB0aGUgc291cmNlIHdhcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWRcbiAqICAgZXh0ZXJuYWx5LiBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIGNvbW1vbm1hcmsgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgnY29tbW9ubWFyaycpO1xuICpcbiAqIC8vIGRlZmF1bHQgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIC8vIGVuYWJsZSBldmVyeXRoaW5nXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaHRtbDogdHJ1ZSxcbiAqICAgbGlua2lmeTogdHJ1ZSxcbiAqICAgdHlwb2dyYXBoZXI6IHRydWVcbiAqIH0pO1xuICogYGBgXG4gKlxuICogIyMjIyMgU3ludGF4IGhpZ2hsaWdodGluZ1xuICpcbiAqIGBgYGpzXG4gKiB2YXIgaGxqcyA9IHJlcXVpcmUoJ2hpZ2hsaWdodC5qcycpIC8vIGh0dHBzOi8vaGlnaGxpZ2h0anMub3JnL1xuICpcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoc3RyLCB7IGxhbmd1YWdlOiBsYW5nLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KS52YWx1ZTtcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICcnOyAvLyB1c2UgZXh0ZXJuYWwgZGVmYXVsdCBlc2NhcGluZ1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIE9yIHdpdGggZnVsbCB3cmFwcGVyIG92ZXJyaWRlIChpZiB5b3UgbmVlZCBhc3NpZ24gY2xhc3MgdG8gYDxwcmU+YCBvciBgPGNvZGU+YCk6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGhsanMgPSByZXF1aXJlKCdoaWdobGlnaHQuanMnKSAvLyBodHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiAqXG4gKiAvLyBBY3R1YWwgZGVmYXVsdCB2YWx1ZXNcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gJzxwcmU+PGNvZGUgY2xhc3M9XCJobGpzXCI+JyArXG4gKiAgICAgICAgICAgICAgICBobGpzLmhpZ2hsaWdodChzdHIsIHsgbGFuZ3VhZ2U6IGxhbmcsIGlnbm9yZUlsbGVnYWxzOiB0cnVlIH0pLnZhbHVlICtcbiAqICAgICAgICAgICAgICAgICc8L2NvZGU+PC9wcmU+JztcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICc8cHJlPjxjb2RlIGNsYXNzPVwiaGxqc1wiPicgKyBtZC51dGlscy5lc2NhcGVIdG1sKHN0cikgKyAnPC9jb2RlPjwvcHJlPic7XG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKlxuICoqL1xuZnVuY3Rpb24gTWFya2Rvd25JdCAocHJlc2V0TmFtZSwgb3B0aW9ucykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWFya2Rvd25JdCkpIHtcbiAgICByZXR1cm4gbmV3IE1hcmtkb3duSXQocHJlc2V0TmFtZSwgb3B0aW9ucylcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIGlmICghdXRpbHMuaXNTdHJpbmcocHJlc2V0TmFtZSkpIHtcbiAgICAgIG9wdGlvbnMgPSBwcmVzZXROYW1lIHx8IHt9XG4gICAgICBwcmVzZXROYW1lID0gJ2RlZmF1bHQnXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjaW5saW5lIC0+IFBhcnNlcklubGluZVxuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1BhcnNlcklubGluZV1dLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5pbmxpbmUgPSBuZXcgUGFyc2VySW5saW5lKClcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNibG9jayAtPiBQYXJzZXJCbG9ja1xuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1BhcnNlckJsb2NrXV0uIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmJsb2NrID0gbmV3IFBhcnNlckJsb2NrKClcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNjb3JlIC0+IENvcmVcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tDb3JlXV0gY2hhaW4gZXhlY3V0b3IuIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmNvcmUgPSBuZXcgUGFyc2VyQ29yZSgpXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjcmVuZGVyZXIgLT4gUmVuZGVyZXJcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tSZW5kZXJlcl1dLiBVc2UgaXQgdG8gbW9kaWZ5IG91dHB1dCBsb29rLiBPciB0byBhZGQgcmVuZGVyaW5nXG4gICAqIHJ1bGVzIGZvciBuZXcgdG9rZW4gdHlwZXMsIGdlbmVyYXRlZCBieSBwbHVnaW5zLlxuICAgKlxuICAgKiAjIyMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICAgKlxuICAgKiBmdW5jdGlvbiBteVRva2VuKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNlbGYpIHtcbiAgICogICAvLy4uLlxuICAgKiAgIHJldHVybiByZXN1bHQ7XG4gICAqIH07XG4gICAqXG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzWydteV90b2tlbiddID0gbXlUb2tlblxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIFtbUmVuZGVyZXJdXSBkb2NzIGFuZCBbc291cmNlIGNvZGVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcmVuZGVyZXIubWpzKS5cbiAgICoqL1xuICB0aGlzLnJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKClcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNsaW5raWZ5IC0+IExpbmtpZnlJdFxuICAgKlxuICAgKiBbbGlua2lmeS1pdF0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L2xpbmtpZnktaXQpIGluc3RhbmNlLlxuICAgKiBVc2VkIGJ5IFtsaW5raWZ5XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3J1bGVzX2NvcmUvbGlua2lmeS5tanMpXG4gICAqIHJ1bGUuXG4gICAqKi9cbiAgdGhpcy5saW5raWZ5ID0gbmV3IExpbmtpZnlJdCgpXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjdmFsaWRhdGVMaW5rKHVybCkgLT4gQm9vbGVhblxuICAgKlxuICAgKiBMaW5rIHZhbGlkYXRpb24gZnVuY3Rpb24uIENvbW1vbk1hcmsgYWxsb3dzIHRvbyBtdWNoIGluIGxpbmtzLiBCeSBkZWZhdWx0XG4gICAqIHdlIGRpc2FibGUgYGphdmFzY3JpcHQ6YCwgYHZic2NyaXB0OmAsIGBmaWxlOmAgc2NoZW1hcywgYW5kIGFsbW9zdCBhbGwgYGRhdGE6Li4uYCBzY2hlbWFzXG4gICAqIGV4Y2VwdCBzb21lIGVtYmVkZGVkIGltYWdlIHR5cGVzLlxuICAgKlxuICAgKiBZb3UgY2FuIGNoYW5nZSB0aGlzIGJlaGF2aW91cjpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gICAqIC8vIGVuYWJsZSBldmVyeXRoaW5nXG4gICAqIG1kLnZhbGlkYXRlTGluayA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWU7IH1cbiAgICogYGBgXG4gICAqKi9cbiAgdGhpcy52YWxpZGF0ZUxpbmsgPSB2YWxpZGF0ZUxpbmtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNub3JtYWxpemVMaW5rKHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZW5jb2RlIGxpbmsgdXJsIHRvIGEgbWFjaGluZS1yZWFkYWJsZSBmb3JtYXQsXG4gICAqIHdoaWNoIGluY2x1ZGVzIHVybC1lbmNvZGluZywgcHVueWNvZGUsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm5vcm1hbGl6ZUxpbmsgPSBub3JtYWxpemVMaW5rXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjbm9ybWFsaXplTGlua1RleHQodXJsKSAtPiBTdHJpbmdcbiAgICpcbiAgICogRnVuY3Rpb24gdXNlZCB0byBkZWNvZGUgbGluayB1cmwgdG8gYSBodW1hbi1yZWFkYWJsZSBmb3JtYXRgXG4gICAqKi9cbiAgdGhpcy5ub3JtYWxpemVMaW5rVGV4dCA9IG5vcm1hbGl6ZUxpbmtUZXh0XG5cbiAgLy8gRXhwb3NlIHV0aWxzICYgaGVscGVycyBmb3IgZWFzeSBhY2NlcyBmcm9tIHBsdWdpbnNcblxuICAvKipcbiAgICogTWFya2Rvd25JdCN1dGlscyAtPiB1dGlsc1xuICAgKlxuICAgKiBBc3NvcnRlZCB1dGlsaXR5IGZ1bmN0aW9ucywgdXNlZnVsIHRvIHdyaXRlIHBsdWdpbnMuIFNlZSBkZXRhaWxzXG4gICAqIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL2NvbW1vbi91dGlscy5tanMpLlxuICAgKiovXG4gIHRoaXMudXRpbHMgPSB1dGlsc1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2hlbHBlcnMgLT4gaGVscGVyc1xuICAgKlxuICAgKiBMaW5rIGNvbXBvbmVudHMgcGFyc2VyIGZ1bmN0aW9ucywgdXNlZnVsIHRvIHdyaXRlIHBsdWdpbnMuIFNlZSBkZXRhaWxzXG4gICAqIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL2hlbHBlcnMpLlxuICAgKiovXG4gIHRoaXMuaGVscGVycyA9IHV0aWxzLmFzc2lnbih7fSwgaGVscGVycylcblxuICB0aGlzLm9wdGlvbnMgPSB7fVxuICB0aGlzLmNvbmZpZ3VyZShwcmVzZXROYW1lKVxuXG4gIGlmIChvcHRpb25zKSB7IHRoaXMuc2V0KG9wdGlvbnMpIH1cbn1cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5zZXQob3B0aW9ucylcbiAqXG4gKiBTZXQgcGFyc2VyIG9wdGlvbnMgKGluIHRoZSBzYW1lIGZvcm1hdCBhcyBpbiBjb25zdHJ1Y3RvcikuIFByb2JhYmx5LCB5b3VcbiAqIHdpbGwgbmV2ZXIgbmVlZCBpdCwgYnV0IHlvdSBjYW4gY2hhbmdlIG9wdGlvbnMgYWZ0ZXIgY29uc3RydWN0b3IgY2FsbC5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuc2V0KHsgaHRtbDogdHJ1ZSwgYnJlYWtzOiB0cnVlIH0pXG4gKiAgICAgICAgICAgICAuc2V0KHsgdHlwb2dyYXBoZXI6IHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBfX05vdGU6X18gVG8gYWNoaWV2ZSB0aGUgYmVzdCBwb3NzaWJsZSBwZXJmb3JtYW5jZSwgZG9uJ3QgbW9kaWZ5IGFcbiAqIGBtYXJrZG93bi1pdGAgaW5zdGFuY2Ugb3B0aW9ucyBvbiB0aGUgZmx5LiBJZiB5b3UgbmVlZCBtdWx0aXBsZSBjb25maWd1cmF0aW9uc1xuICogaXQncyBiZXN0IHRvIGNyZWF0ZSBtdWx0aXBsZSBpbnN0YW5jZXMgYW5kIGluaXRpYWxpemUgZWFjaCB3aXRoIHNlcGFyYXRlXG4gKiBjb25maWcuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB1dGlscy5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKVxuICByZXR1cm4gdGhpc1xufVxuXG4vKiogY2hhaW5hYmxlLCBpbnRlcm5hbFxuICogTWFya2Rvd25JdC5jb25maWd1cmUocHJlc2V0cylcbiAqXG4gKiBCYXRjaCBsb2FkIG9mIGFsbCBvcHRpb25zIGFuZCBjb21wZW5lbnQgc2V0dGluZ3MuIFRoaXMgaXMgaW50ZXJuYWwgbWV0aG9kLFxuICogYW5kIHlvdSBwcm9iYWJseSB3aWxsIG5vdCBuZWVkIGl0LiBCdXQgaWYgeW91IHdpbGwgLSBzZWUgYXZhaWxhYmxlIHByZXNldHNcbiAqIGFuZCBkYXRhIHN0cnVjdHVyZSBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L3RyZWUvbWFzdGVyL2xpYi9wcmVzZXRzKVxuICpcbiAqIFdlIHN0cm9uZ2x5IHJlY29tbWVuZCB0byB1c2UgcHJlc2V0cyBpbnN0ZWFkIG9mIGRpcmVjdCBjb25maWcgbG9hZHMuIFRoYXRcbiAqIHdpbGwgZ2l2ZSBiZXR0ZXIgY29tcGF0aWJpbGl0eSB3aXRoIG5leHQgdmVyc2lvbnMuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5jb25maWd1cmUgPSBmdW5jdGlvbiAocHJlc2V0cykge1xuICBjb25zdCBzZWxmID0gdGhpc1xuXG4gIGlmICh1dGlscy5pc1N0cmluZyhwcmVzZXRzKSkge1xuICAgIGNvbnN0IHByZXNldE5hbWUgPSBwcmVzZXRzXG4gICAgcHJlc2V0cyA9IGNvbmZpZ1twcmVzZXROYW1lXVxuICAgIGlmICghcHJlc2V0cykgeyB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGBtYXJrZG93bi1pdGAgcHJlc2V0IFwiJyArIHByZXNldE5hbWUgKyAnXCIsIGNoZWNrIG5hbWUnKSB9XG4gIH1cblxuICBpZiAoIXByZXNldHMpIHsgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBgbWFya2Rvd24taXRgIHByZXNldCwgY2FuXFwndCBiZSBlbXB0eScpIH1cblxuICBpZiAocHJlc2V0cy5vcHRpb25zKSB7IHNlbGYuc2V0KHByZXNldHMub3B0aW9ucykgfVxuXG4gIGlmIChwcmVzZXRzLmNvbXBvbmVudHMpIHtcbiAgICBPYmplY3Qua2V5cyhwcmVzZXRzLmNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpIHtcbiAgICAgICAgc2VsZltuYW1lXS5ydWxlci5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlcylcbiAgICAgIH1cbiAgICAgIGlmIChwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMyKSB7XG4gICAgICAgIHNlbGZbbmFtZV0ucnVsZXIyLmVuYWJsZU9ubHkocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzMilcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbi8qKiBjaGFpbmFibGVcbiAqIE1hcmtkb3duSXQuZW5hYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IHJ1bGUgbmFtZSBvciBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZW5hYmxlXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBFbmFibGUgbGlzdCBvciBydWxlcy4gSXQgd2lsbCBhdXRvbWF0aWNhbGx5IGZpbmQgYXBwcm9wcmlhdGUgY29tcG9uZW50cyxcbiAqIGNvbnRhaW5pbmcgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgcnVsZSBub3QgZm91bmQsIGFuZCBgaWdub3JlSW52YWxpZGBcbiAqIG5vdCBzZXQgLSB0aHJvd3MgZXhjZXB0aW9uLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKClcbiAqICAgICAgICAgICAgIC5lbmFibGUoWydzdWInLCAnc3VwJ10pXG4gKiAgICAgICAgICAgICAuZGlzYWJsZSgnc21hcnRxdW90ZXMnKTtcbiAqIGBgYFxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgbGV0IHJlc3VsdCA9IFtdXG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbbGlzdF0gfVxuXG4gIFsnY29yZScsICdibG9jaycsICdpbmxpbmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFpbikge1xuICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpc1tjaGFpbl0ucnVsZXIuZW5hYmxlKGxpc3QsIHRydWUpKVxuICB9LCB0aGlzKVxuXG4gIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5pbmxpbmUucnVsZXIyLmVuYWJsZShsaXN0LCB0cnVlKSlcblxuICBjb25zdCBtaXNzZWQgPSBsaXN0LmZpbHRlcihmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gcmVzdWx0LmluZGV4T2YobmFtZSkgPCAwIH0pXG5cbiAgaWYgKG1pc3NlZC5sZW5ndGggJiYgIWlnbm9yZUludmFsaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01hcmtkb3duSXQuIEZhaWxlZCB0byBlbmFibGUgdW5rbm93biBydWxlKHMpOiAnICsgbWlzc2VkKVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5kaXNhYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IHJ1bGUgbmFtZSBvciBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbTWFya2Rvd25JdC5lbmFibGVdXSwgYnV0IHR1cm4gc3BlY2lmaWVkIHJ1bGVzIG9mZi5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBsZXQgcmVzdWx0ID0gW11cblxuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFtsaXN0XSB9XG5cbiAgWydjb3JlJywgJ2Jsb2NrJywgJ2lubGluZSddLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzW2NoYWluXS5ydWxlci5kaXNhYmxlKGxpc3QsIHRydWUpKVxuICB9LCB0aGlzKVxuXG4gIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5pbmxpbmUucnVsZXIyLmRpc2FibGUobGlzdCwgdHJ1ZSkpXG5cbiAgY29uc3QgbWlzc2VkID0gbGlzdC5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHJlc3VsdC5pbmRleE9mKG5hbWUpIDwgMCB9KVxuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZGlzYWJsZSB1bmtub3duIHJ1bGUocyk6ICcgKyBtaXNzZWQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC51c2UocGx1Z2luLCBwYXJhbXMpXG4gKlxuICogTG9hZCBzcGVjaWZpZWQgcGx1Z2luIHdpdGggZ2l2ZW4gcGFyYW1zIGludG8gY3VycmVudCBwYXJzZXIgaW5zdGFuY2UuXG4gKiBJdCdzIGp1c3QgYSBzdWdhciB0byBjYWxsIGBwbHVnaW4obWQsIHBhcmFtcylgIHdpdGggY3VycmluZy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGl0ZXJhdG9yID0gcmVxdWlyZSgnbWFya2Rvd24taXQtZm9yLWlubGluZScpO1xuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAudXNlKGl0ZXJhdG9yLCAnZm9vX3JlcGxhY2UnLCAndGV4dCcsIGZ1bmN0aW9uICh0b2tlbnMsIGlkeCkge1xuICogICAgICAgICAgICAgICB0b2tlbnNbaWR4XS5jb250ZW50ID0gdG9rZW5zW2lkeF0uY29udGVudC5yZXBsYWNlKC9mb28vZywgJ2JhcicpO1xuICogICAgICAgICAgICAgfSk7XG4gKiBgYGBcbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uIChwbHVnaW4gLyosIHBhcmFtcywgLi4uICovKSB7XG4gIGNvbnN0IGFyZ3MgPSBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXG4gIHBsdWdpbi5hcHBseShwbHVnaW4sIGFyZ3MpXG4gIHJldHVybiB0aGlzXG59XG5cbi8qKiBpbnRlcm5hbFxuICogTWFya2Rvd25JdC5wYXJzZShzcmMsIGVudikgLT4gQXJyYXlcbiAqIC0gc3JjIChTdHJpbmcpOiBzb3VyY2Ugc3RyaW5nXG4gKiAtIGVudiAoT2JqZWN0KTogZW52aXJvbm1lbnQgc2FuZGJveFxuICpcbiAqIFBhcnNlIGlucHV0IHN0cmluZyBhbmQgcmV0dXJuIGxpc3Qgb2YgYmxvY2sgdG9rZW5zIChzcGVjaWFsIHRva2VuIHR5cGVcbiAqIFwiaW5saW5lXCIgd2lsbCBjb250YWluIGxpc3Qgb2YgaW5saW5lIHRva2VucykuIFlvdSBzaG91bGQgbm90IGNhbGwgdGhpc1xuICogbWV0aG9kIGRpcmVjdGx5LCB1bnRpbCB5b3Ugd3JpdGUgY3VzdG9tIHJlbmRlcmVyIChmb3IgZXhhbXBsZSwgdG8gcHJvZHVjZVxuICogQVNUKS5cbiAqXG4gKiBgZW52YCBpcyB1c2VkIHRvIHBhc3MgZGF0YSBiZXR3ZWVuIFwiZGlzdHJpYnV0ZWRcIiBydWxlcyBhbmQgcmV0dXJuIGFkZGl0aW9uYWxcbiAqIG1ldGFkYXRhIGxpa2UgcmVmZXJlbmNlIGluZm8sIG5lZWRlZCBmb3IgdGhlIHJlbmRlcmVyLiBJdCBhbHNvIGNhbiBiZSB1c2VkIHRvXG4gKiBpbmplY3QgZGF0YSBpbiBzcGVjaWZpYyBjYXNlcy4gVXN1YWxseSwgeW91IHdpbGwgYmUgb2sgdG8gcGFzcyBge31gLFxuICogYW5kIHRoZW4gcGFzcyB1cGRhdGVkIG9iamVjdCB0byByZW5kZXJlci5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGlmICh0eXBlb2Ygc3JjICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW5wdXQgZGF0YSBzaG91bGQgYmUgYSBTdHJpbmcnKVxuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBuZXcgdGhpcy5jb3JlLlN0YXRlKHNyYywgdGhpcywgZW52KVxuXG4gIHRoaXMuY29yZS5wcm9jZXNzKHN0YXRlKVxuXG4gIHJldHVybiBzdGF0ZS50b2tlbnNcbn1cblxuLyoqXG4gKiBNYXJrZG93bkl0LnJlbmRlcihzcmMgWywgZW52XSkgLT4gU3RyaW5nXG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBSZW5kZXIgbWFya2Rvd24gc3RyaW5nIGludG8gaHRtbC4gSXQgZG9lcyBhbGwgbWFnaWMgZm9yIHlvdSA6KS5cbiAqXG4gKiBgZW52YCBjYW4gYmUgdXNlZCB0byBpbmplY3QgYWRkaXRpb25hbCBtZXRhZGF0YSAoYHt9YCBieSBkZWZhdWx0KS5cbiAqIEJ1dCB5b3Ugd2lsbCBub3QgbmVlZCBpdCB3aXRoIGhpZ2ggcHJvYmFiaWxpdHkuIFNlZSBhbHNvIGNvbW1lbnRcbiAqIGluIFtbTWFya2Rvd25JdC5wYXJzZV1dLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGVudiA9IGVudiB8fCB7fVxuXG4gIHJldHVybiB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnBhcnNlKHNyYywgZW52KSwgdGhpcy5vcHRpb25zLCBlbnYpXG59XG5cbi8qKiBpbnRlcm5hbFxuICogTWFya2Rvd25JdC5wYXJzZUlubGluZShzcmMsIGVudikgLT4gQXJyYXlcbiAqIC0gc3JjIChTdHJpbmcpOiBzb3VyY2Ugc3RyaW5nXG4gKiAtIGVudiAoT2JqZWN0KTogZW52aXJvbm1lbnQgc2FuZGJveFxuICpcbiAqIFRoZSBzYW1lIGFzIFtbTWFya2Rvd25JdC5wYXJzZV1dIGJ1dCBza2lwIGFsbCBibG9jayBydWxlcy4gSXQgcmV0dXJucyB0aGVcbiAqIGJsb2NrIHRva2VucyBsaXN0IHdpdGggdGhlIHNpbmdsZSBgaW5saW5lYCBlbGVtZW50LCBjb250YWluaW5nIHBhcnNlZCBpbmxpbmVcbiAqIHRva2VucyBpbiBgY2hpbGRyZW5gIHByb3BlcnR5LiBBbHNvIHVwZGF0ZXMgYGVudmAgb2JqZWN0LlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUucGFyc2VJbmxpbmUgPSBmdW5jdGlvbiAoc3JjLCBlbnYpIHtcbiAgY29uc3Qgc3RhdGUgPSBuZXcgdGhpcy5jb3JlLlN0YXRlKHNyYywgdGhpcywgZW52KVxuXG4gIHN0YXRlLmlubGluZU1vZGUgPSB0cnVlXG4gIHRoaXMuY29yZS5wcm9jZXNzKHN0YXRlKVxuXG4gIHJldHVybiBzdGF0ZS50b2tlbnNcbn1cblxuLyoqXG4gKiBNYXJrZG93bkl0LnJlbmRlcklubGluZShzcmMgWywgZW52XSkgLT4gU3RyaW5nXG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBTaW1pbGFyIHRvIFtbTWFya2Rvd25JdC5yZW5kZXJdXSBidXQgZm9yIHNpbmdsZSBwYXJhZ3JhcGggY29udGVudC4gUmVzdWx0XG4gKiB3aWxsIE5PVCBiZSB3cmFwcGVkIGludG8gYDxwPmAgdGFncy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBlbnYgPSBlbnYgfHwge31cblxuICByZXR1cm4gdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5wYXJzZUlubGluZShzcmMsIGVudiksIHRoaXMub3B0aW9ucywgZW52KVxufVxuXG5leHBvcnQgZGVmYXVsdCBNYXJrZG93bkl0XG4iLCAiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVklCRVggc2lkZWJhciB3ZWJ2aWV3LlxuICpcbiAqIERFU0lHTiBSVUxFIFx1MjAxNCB0aGlzIHJlbmRlcmVyIGRyYXdzIE5PVEhJTkcgb2YgaXRzIG93bi4gSXQgcmVwcm9kdWNlcyB0aGUgRE9NXG4gKiBjbGFzcyBzdHJ1Y3R1cmUgb2YgVlMgQ29kZSdzIG5hdGl2ZSBjaGF0IHdpZGdldCAoYC5pbnRlcmFjdGl2ZS1zZXNzaW9uYCxcbiAqIGAuaW50ZXJhY3RpdmUtaXRlbS1jb250YWluZXJgLCBgLmNoYXQtaW5wdXQtY29udGFpbmVyYCwgXHUyMDI2KSBleGFjdGx5IGFzIHRoZVxuICogd29ya2JlbmNoIHJlbmRlcmVyIGJ1aWxkcyBpdCwgc28gdGhhdCB0aGUgdmVyYmF0aW0tZXh0cmFjdGVkIHN0eWxlc2hlZXQgaW5cbiAqIG1lZGlhL25hdGl2ZS1jaGF0LmNzcyBzdHlsZXMgaXQgaWRlbnRpY2FsbHkgdG8gdGhlIHJlYWwgdGhpbmcuIElmIGEgcGllY2Ugb2ZcbiAqIFVJIGxvb2tzIGRpZmZlcmVudCBmcm9tIG5hdGl2ZSBWUyBDb2RlIGNoYXQsIHRoZSBmaXggaXMgdG8gY29ycmVjdCB0aGUgRE9NXG4gKiBzdHJ1Y3R1cmUgb3IgcmUtZXh0cmFjdCB0aGUgQ1NTIFx1MjAxNCBuZXZlciB0byBoYW5kLXR1bmUgc3R5bGVzLlxuICovXG5cbmNvbnN0IE1hcmtkb3duSXQgPSByZXF1aXJlKFwibWFya2Rvd24taXRcIik7XG5cbmNvbnN0IHZzY29kZSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcbmNvbnN0IG1kID0gbmV3IE1hcmtkb3duSXQoeyBodG1sOiBmYWxzZSwgbGlua2lmeTogdHJ1ZSwgYnJlYWtzOiBmYWxzZSB9KTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gIGFnZW50czogW10sXG4gIHByb2plY3RzOiBbXSxcbiAgY29udmVyc2F0aW9uczogW10sXG4gIHNlbGVjdGVkQ29udmVyc2F0aW9uSWQ6IG51bGwsXG4gIHNlbGVjdGVkUHJvamVjdElkOiBudWxsLFxuICB0YXNrczogW10sXG4gIGhlYWx0aDogbnVsbCxcbiAgb3B0aW9uczogeyBtb2RlbElkOiBudWxsLCBlZmZvcnQ6IFwiXCIsIGFwcHJvdmFsTW9kZTogXCJkZWZhdWx0XCIgfSxcbiAgYnVzeTogZmFsc2UsXG4gIGNvbm5lY3Rpb25FcnJvcjogbnVsbCxcbiAgLy8gQ29tcG9zZXIgYC9gIGFuZCBgQGAgYXNzaXN0IHBvcHVwLlxuICBhc3Npc3RJdGVtczogW10sXG4gIGFzc2lzdEluZGV4OiAwLFxuICBhc3Npc3RSYW5nZTogbnVsbCxcbiAgbWVudGlvblJlcXVlc3RJZDogbnVsbCxcbiAgbWVudGlvbkZpbGVzOiBbXSxcbn07XG5cbmNvbnN0IEFDVElWRV9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICBcInF1ZXVlZFwiLCBcImludGVycHJldGluZ1wiLCBcImF3YWl0aW5nX2NvbmZpcm1hdGlvblwiLFxuICBcInJlc29sdmluZ19zZXNzaW9uXCIsIFwicnVubmluZ19hZ2VudFwiLCBcInRlc3RpbmdcIixcbl0pO1xuXG5jb25zdCBTVEFUVVNfTUVTU0FHRVMgPSB7XG4gIHF1ZXVlZDogXCJcdUIzMDBcdUFFMzAgXHVDOTExXHVDNzg1XHVCMkM4XHVCMkU0LlwiLFxuICBpbnRlcnByZXRpbmc6IFwiXHVDNjk0XHVDQ0FEXHVDNzQ0IFx1RDU3NFx1QzExRFx1RDU1OFx1QUNFMCBcdUM3ODhcdUMyQjVcdUIyQzhcdUIyRTQuXCIsXG4gIGF3YWl0aW5nX2NvbmZpcm1hdGlvbjogXCJcdUQ2NTVcdUM3NzhcdUM3NDQgXHVBRTMwXHVCMkU0XHVCOUFDXHVBQ0UwIFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIixcbiAgcmVzb2x2aW5nX3Nlc3Npb246IFwiXHVENTA0XHVCODVDXHVDODFEXHVEMkI4IFx1QzEzOFx1QzE1OFx1Qzc0NCBcdUNDM0VcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxuICBydW5uaW5nX2FnZW50OiBcIlx1QzY5NFx1Q0NBRFx1Qzc0NCBcdUNDOThcdUI5QUNcdUQ1NThcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxuICB0ZXN0aW5nOiBcIlx1RDE0Q1x1QzJBNFx1RDJCOFx1Qjk3QyBcdUMyRTRcdUQ1ODlcdUQ1NThcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxufTtcblxuY29uc3QgQUdFTlRfTkFNRVMgPSB7IFwiY2xhdWRlLWNvZGVcIjogXCJDbGF1ZGUgQ29kZVwiLCBcImNvZGV4LWNsaVwiOiBcIkNvZGV4XCIsIFwiZ2VtaW5pLWNsaVwiOiBcIkdlbWluaVwiIH07XG5cbi8qKlxuICogU2xhc2ggY29tbWFuZHMgb2ZmZXJlZCBieSB0aGUgY29tcG9zZXIuXG4gKlxuICogVGhlIGJyaWRnZSBleHBvc2VzIG5vIGNvbW1hbmQgQVBJLCBzbyB0aGVzZSBhcmUgcHJvbXB0IHNob3J0Y3V0cyBleHBhbmRlZFxuICogbG9jYWxseTogYHByb21wdGAgcmVwbGFjZXMgdGhlIHR5cGVkIHRva2VuLCBgYWN0aW9uYCBydW5zIGluIHRoZSB3ZWJ2aWV3LlxuICovXG5jb25zdCBTTEFTSF9DT01NQU5EUyA9IFtcbiAgeyB2YWx1ZTogXCIvY2xlYXJcIiwgZGVzY3JpcHRpb246IFwiXHVDNzg1XHVCODI1IFx1QkU0NFx1QzZCMFx1QUUzMFwiLCBhY3Rpb246IFwiY2xlYXJcIiB9LFxuICB7IHZhbHVlOiBcIi9leHBsYWluXCIsIGRlc2NyaXB0aW9uOiBcIlx1QzEyMFx1RDBERFx1RDU1QyBcdUNGNTRcdUI0RENcdUIwOTggXHVENTA0XHVCODVDXHVDODFEXHVEMkI4IFx1QzEyNFx1QkE4NVwiLCBwcm9tcHQ6IFwiXHVCMkU0XHVDNzRDXHVDNzQ0IFx1Qzc3NFx1RDU3NFx1RDU1OFx1QUUzMCBcdUMyN0RcdUFDOEMgXHVDMTI0XHVCQTg1XHVENTc0XHVDOTE4OiBcIiB9LFxuICB7IHZhbHVlOiBcIi9maXhcIiwgZGVzY3JpcHRpb246IFwiXHVCQjM4XHVDODFDXHVCOTdDIFx1Qzg3MFx1QzBBQ1x1RDU1OFx1QUNFMCBcdUMyMThcdUM4MTVcIiwgcHJvbXB0OiBcIlx1QjJFNFx1Qzc0QyBcdUJCMzhcdUM4MUNcdUM3NTggXHVDNkQwXHVDNzc4XHVDNzQ0IFx1Qzg3MFx1QzBBQ1x1RDU1OFx1QUNFMCBcdUMyMThcdUM4MTVcdUQ1NzRcdUM5MTg6IFwiIH0sXG4gIHsgdmFsdWU6IFwiL3Rlc3RcIiwgZGVzY3JpcHRpb246IFwiXHVBRDAwXHVCODI4IFx1RDE0Q1x1QzJBNFx1RDJCOCBcdUM3OTFcdUMxMzEgXHVCNjEwXHVCMjk0IFx1QzJFNFx1RDU4OVwiLCBwcm9tcHQ6IFwiXHVCMkU0XHVDNzRDIFx1QjMwMFx1QzBDMVx1Qzc1OCBcdUFEMDBcdUI4MjggXHVEMTRDXHVDMkE0XHVEMkI4XHVCOTdDIFx1Qzc5MVx1QzEzMVx1RDU1OFx1QUM3MFx1QjA5OCBcdUMyRTRcdUQ1ODlcdUQ1NzRcdUM5MTg6IFwiIH0sXG4gIHsgdmFsdWU6IFwiL3Jldmlld1wiLCBkZXNjcmlwdGlvbjogXCJcdUQ2MDRcdUM3QUMgXHVCQ0MwXHVBQ0JEXHVDMEFDXHVENTZEIFx1QUM4MFx1RDFBMFwiLCBwcm9tcHQ6IFwiXHVENjA0XHVDN0FDIFx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOFx1Qzc1OCBcdUJDQzBcdUFDQkRcdUMwQUNcdUQ1NkRcdUM3NDQgXHVBQzgwXHVEMUEwXHVENTc0XHVDOTE4LiBcIiB9LFxuXTtcblxuLy8gI3JlZ2lvbiBET00gaGVscGVyc1xuXG5mdW5jdGlvbiBlbCh0YWcsIGNsYXNzTmFtZSwgdGV4dCkge1xuICBjb25zdCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICBpZiAoY2xhc3NOYW1lKSBub2RlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgaWYgKHRleHQgIT09IHVuZGVmaW5lZCkgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiBjb2RpY29uKG5hbWUpIHtcbiAgcmV0dXJuIGVsKFwic3BhblwiLCBgY29kaWNvbiBjb2RpY29uLSR7bmFtZX1gKTtcbn1cblxuZnVuY3Rpb24gdmliZXhNYXJrKCkge1xuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gIGltYWdlLmNsYXNzTmFtZSA9IFwidmliZXgtd2VsY29tZS1sb2dvXCI7XG4gIGltYWdlLnNyYyA9IGRvY3VtZW50LmJvZHkuZGF0YXNldC52aWJleEljb24gfHwgXCJcIjtcbiAgaW1hZ2UuYWx0ID0gXCJcIjtcbiAgaW1hZ2Uuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICByZXR1cm4gaW1hZ2U7XG59XG5cbmZ1bmN0aW9uIHJlbmRlck1hcmtkb3duKHRleHQpIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwiZGl2XCIsIFwicmVuZGVyZWQtbWFya2Rvd25cIik7XG4gIGhvc3QuaW5uZXJIVE1MID0gbWQucmVuZGVyKFN0cmluZyh0ZXh0IHx8IFwiXCIpKTtcbiAgZm9yIChjb25zdCBhbmNob3Igb2YgaG9zdC5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXVwiKSkge1xuICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcG9zdCh7IHR5cGU6IFwib3BlbkxpbmtcIiwgaHJlZjogYW5jaG9yLmdldEF0dHJpYnV0ZShcImhyZWZcIikgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGhvc3Q7XG59XG5cbmZ1bmN0aW9uIHBvc3QobWVzc2FnZSkge1xuICB2c2NvZGUucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG59XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBMYXlvdXQgc2tlbGV0b24gKGJ1aWx0IG9uY2UpXG5cbi8vIFRoZSBleHRyYWN0ZWQgc3R5bGVzaGVldCBzY29wZXMgbW9zdCBydWxlcyB1bmRlciB0aGUgd29ya2JlbmNoIHJvb3Rcbi8vIChgLm1vbmFjby13b3JrYmVuY2ggLmludGVyYWN0aXZlLXNlc3Npb24gXHUyMDI2YCkgYW5kIHRoZW1lIGNsYXNzZXMgKGAudnMtZGFya2ApLlxuLy8gVGhlIHdlYnZpZXcgYm9keSBzdGFuZHMgaW4gZm9yIHRoZSB3b3JrYmVuY2ggcm9vdCwgc28gaXQgbXVzdCBjYXJyeSB0aGVcbi8vIHNhbWUgY2xhc3NlczsgdGhlIHRoZW1lIGNsYXNzIGZvbGxvd3MgVlMgQ29kZSdzIG93biBib2R5IGNsYXNzLlxuZnVuY3Rpb24gc3luY1dvcmtiZW5jaENsYXNzZXMoKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICBjb25zdCB0aGVtZU1hcCA9IFtcbiAgICBbXCJ2c2NvZGUtaGlnaC1jb250cmFzdC1saWdodFwiLCBcImhjLWxpZ2h0XCJdLFxuICAgIFtcInZzY29kZS1oaWdoLWNvbnRyYXN0XCIsIFwiaGMtYmxhY2tcIl0sXG4gICAgW1widnNjb2RlLWxpZ2h0XCIsIFwidnNcIl0sXG4gICAgW1widnNjb2RlLWRhcmtcIiwgXCJ2cy1kYXJrXCJdLFxuICBdO1xuICBsZXQgZGVzaXJlZCA9IFwidnMtZGFya1wiO1xuICBmb3IgKGNvbnN0IFt3ZWJ2aWV3Q2xhc3MsIHdvcmtiZW5jaENsYXNzXSBvZiB0aGVtZU1hcCkge1xuICAgIGlmIChib2R5LmNsYXNzTGlzdC5jb250YWlucyh3ZWJ2aWV3Q2xhc3MpKSB7XG4gICAgICBkZXNpcmVkID0gd29ya2JlbmNoQ2xhc3M7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgLy8gT25seSB0b3VjaCB0aGUgYXR0cmlidXRlIHdoZW4gc29tZXRoaW5nIGFjdHVhbGx5IGNoYW5nZXMgXHUyMDE0IHRoZSBvYnNlcnZlclxuICAvLyBiZWxvdyB3YXRjaGVzIGNsYXNzIG11dGF0aW9ucyBhbmQgbXVzdCBub3QgYmUgcmUtdHJpZ2dlcmVkIGJ5IHRoaXMgc3luYy5cbiAgaWYgKGJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibW9uYWNvLXdvcmtiZW5jaFwiKSAmJiBib2R5LmNsYXNzTGlzdC5jb250YWlucyhkZXNpcmVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBib2R5LmNsYXNzTGlzdC5hZGQoXCJtb25hY28td29ya2JlbmNoXCIpO1xuICBmb3IgKGNvbnN0IFssIHdvcmtiZW5jaENsYXNzXSBvZiB0aGVtZU1hcCkge1xuICAgIGlmICh3b3JrYmVuY2hDbGFzcyAhPT0gZGVzaXJlZCkgYm9keS5jbGFzc0xpc3QucmVtb3ZlKHdvcmtiZW5jaENsYXNzKTtcbiAgfVxuICBib2R5LmNsYXNzTGlzdC5hZGQoZGVzaXJlZCk7XG59XG5zeW5jV29ya2JlbmNoQ2xhc3NlcygpO1xubmV3IE11dGF0aW9uT2JzZXJ2ZXIoc3luY1dvcmtiZW5jaENsYXNzZXMpLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICBhdHRyaWJ1dGVzOiB0cnVlLFxuICBhdHRyaWJ1dGVGaWx0ZXI6IFtcImNsYXNzXCJdLFxufSk7XG5cbi8vIE5vIGN1c3RvbSBjaHJvbWU6IHRoZSBwYW5lbCdzIHRpdGxlIGJhciwgaXRzIGFjdGlvbnMgKG5ldyBjb252ZXJzYXRpb24sXG4vLyBoaXN0b3J5KSBhbmQgdGhlIHRhYiBpdHNlbGYgYXJlIHJlbmRlcmVkIG5hdGl2ZWx5IGJ5IFZTIENvZGUgdmlhIHRoZVxuLy8gdmlldy90aXRsZSBtZW51IGNvbnRyaWJ1dGlvbnMgaW4gcGFja2FnZS5qc29uLlxuY29uc3Qgcm9vdCA9IGVsKFwiZGl2XCIsIFwiaW50ZXJhY3RpdmUtc2Vzc2lvblwiKTtcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdCk7XG5cbmNvbnN0IGxpc3QgPSBlbChcImRpdlwiLCBcInZpYmV4LWxpc3RcIik7XG5yb290LmFwcGVuZChsaXN0KTtcblxuLy8gQ29tcG9zZXIgXHUyMDE0IG1pcnJvcnMgdGhlIERPTSB0aGUgd29ya2JlbmNoIGJ1aWxkcyBhdCBydW50aW1lLCBjYXB0dXJlZCBmcm9tIGFcbi8vIGxpdmUgbmF0aXZlIGNoYXQgc2Vzc2lvbiBvdmVyIHRoZSBDaHJvbWUgRGV2VG9vbHMgUHJvdG9jb2xcbi8vIChzY3JhdGNocGFkL2RvbWR1bXAuanMpLiBEbyBub3QgcmVzdHJ1Y3R1cmUgYnkgaW50dWl0aW9uOiByZS1kdW1wIGFuZCBtYXRjaC5cbmZ1bmN0aW9uIHRvb2xiYXIoZXh0cmFDbGFzc2VzKSB7XG4gIGNvbnN0IGhvc3QgPSBlbChcImRpdlwiLCBgbW9uYWNvLXRvb2xiYXIgJHtleHRyYUNsYXNzZXN9YCk7XG4gIGNvbnN0IGJhciA9IGVsKFwiZGl2XCIsIFwibW9uYWNvLWFjdGlvbi1iYXJcIik7XG4gIGNvbnN0IGl0ZW1zID0gZWwoXCJ1bFwiLCBcImFjdGlvbnMtY29udGFpbmVyXCIpO1xuICBiYXIuYXBwZW5kKGl0ZW1zKTtcbiAgaG9zdC5hcHBlbmQoYmFyKTtcbiAgcmV0dXJuIHsgaG9zdCwgaXRlbXMgfTtcbn1cblxuY29uc3QgaW5wdXRQYXJ0ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1wYXJ0XCIpO1xuY29uc3QgaW5wdXRBbmRUb29sYmFyID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1hbmQtc2lkZS10b29sYmFyXCIpO1xuY29uc3QgaW5wdXRDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtaW5wdXQtY29udGFpbmVyXCIpO1xuY29uc3QgYXR0YWNobWVudHNDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtYXR0YWNobWVudHMtY29udGFpbmVyXCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBuYXRpdmUgaGlkZXMgaXQgd2hpbGUgZW1wdHlcbmNvbnN0IGF0dGFjaGVkQ29udGV4dCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1hdHRhY2hlZC1jb250ZXh0XCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuYXBwZW5kKGF0dGFjaGVkQ29udGV4dCk7XG5jb25zdCBlZGl0b3JDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtZWRpdG9yLWNvbnRhaW5lclwiKTtcbmNvbnN0IGVkaXRvckhvc3QgPSBlbChcImRpdlwiLCBcImludGVyYWN0aXZlLWlucHV0LWVkaXRvclwiKTtcbi8vIFx1QjEyNFx1Qzc3NFx1RDJGMFx1QkUwQyBcdUM3ODVcdUI4MjVcdUNDM0RcdUM3NDAgTW9uYWNvIFx1QjM3MFx1Q0Y1NFx1QjgwOFx1Qzc3NFx1QzE1OFx1QzczQ1x1Qjg1QyBgL1x1QkE4NVx1QjgzOWBcdTAwQjdgQFx1RDMwQ1x1Qzc3Q2AgXHVEMUEwXHVEMDcwXHVDNUQwIFx1QzBDOVx1Qzc0NCBcdUM3ODVcdUQ3OENcdUIyRTQuXG4vLyB0ZXh0YXJlYSBcdUIyOTQgXHVCRDgwXHVCRDg0IFx1QzJBNFx1RDBDMFx1Qzc3Q1x1Qzc3NCBcdUJEODhcdUFDMDBcdUIyQTVcdUQ1NThcdUJCQzBcdUI4NUMsIFx1QUMxOVx1Qzc0MCBcdUFFMDBcdUFGMzRcdTAwQjdcdUM5MDRcdUJDMTRcdUFGQzggXHVBRERDXHVDRTU5XHVDNzNDXHVCODVDIFx1RDE0RFx1QzJBNFx1RDJCOFx1Qjk3Q1xuLy8gXHVCMkU0XHVDMkRDIFx1QURGOFx1QjlBQ1x1QjI5NCBcdUJCRjhcdUI3RUNcdUI5N0MgXHVCNEE0XHVDNUQwIFx1QUU1NFx1QUNFMCB0ZXh0YXJlYSBcdUFFMDBcdUM3OTBcdUIyOTQgXHVEMjJDXHVCQTg1XHVENTU4XHVBQzhDIFx1QjQ1NFx1QjJFNChcdUNFOTBcdUI3RkZcdUI5Q0MgXHVCQ0Y0XHVDNzg0KS5cbmNvbnN0IGlucHV0TWlycm9yID0gZWwoXCJkaXZcIiwgXCJ2aWJleC1pbnB1dC1taXJyb3JcIik7XG5jb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbnRleHRhcmVhLmNsYXNzTmFtZSA9IFwidmliZXgtaW5wdXRcIjtcbnRleHRhcmVhLnJvd3MgPSAxO1xuZWRpdG9ySG9zdC5hcHBlbmQoaW5wdXRNaXJyb3IsIHRleHRhcmVhKTtcbmVkaXRvckNvbnRhaW5lci5hcHBlbmQoZWRpdG9ySG9zdCk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsICgpID0+IHtcbiAgaW5wdXRNaXJyb3Iuc2Nyb2xsVG9wID0gdGV4dGFyZWEuc2Nyb2xsVG9wO1xufSk7XG5cbmNvbnN0IHRvb2xiYXJzID0gZWwoXCJkaXZcIiwgXCJjaGF0LWlucHV0LXRvb2xiYXJzXCIpO1xuY29uc3QgaW5wdXRUb29sYmFyID0gdG9vbGJhcihcInJlc3BvbnNpdmUgcmVzcG9uc2l2ZS1sYXN0IGNoYXQtaW5wdXQtdG9vbGJhclwiKTtcbmNvbnN0IGV4ZWN1dGVUb29sYmFyID0gdG9vbGJhcihcImNoYXQtZXhlY3V0ZS10b29sYmFyXCIpO1xuY29uc3QgZXhlY3V0ZUl0ZW1zID0gZXhlY3V0ZVRvb2xiYXIuaXRlbXM7XG50b29sYmFycy5hcHBlbmQoaW5wdXRUb29sYmFyLmhvc3QsIGV4ZWN1dGVUb29sYmFyLmhvc3QpO1xuaW5wdXRDb250YWluZXIuYXBwZW5kKGF0dGFjaG1lbnRzQ29udGFpbmVyLCBlZGl0b3JDb250YWluZXIsIHRvb2xiYXJzKTtcbmlucHV0QW5kVG9vbGJhci5hcHBlbmQoaW5wdXRDb250YWluZXIpO1xuaW5wdXRQYXJ0LmFwcGVuZChpbnB1dEFuZFRvb2xiYXIpO1xuXG4vLyBCZWxvdyB0aGUgYm94LCBpbiBuYXRpdmUgb3JkZXI6IGNvbnRleHQtdXNhZ2UgKGVtcHR5KSwgc3RhdHVzIChoaWRkZW4gd2hpbGVcbi8vIGVtcHR5KSwgdGhlbiB0aGUgc2Vjb25kYXJ5IGlucHV0IHRvb2xiYXIgY2FycnlpbmcgdGhlIHNlc3Npb24vb3B0aW9uIHBpbGxzLlxuY29uc3Qgc2Vjb25kYXJ5VG9vbGJhciA9IGVsKFwiZGl2XCIsIFwiY2hhdC1zZWNvbmRhcnktdG9vbGJhclwiKTtcbmNvbnN0IGNvbnRleHRVc2FnZSA9IGVsKFwiZGl2XCIsIFwiY2hhdC1jb250ZXh0LXVzYWdlLWNvbnRhaW5lclwiKTtcbmNvbnN0IHN0YXR1c0NvbnRhaW5lciA9IGVsKFwiZGl2XCIsIFwiY2hhdC1pbnB1dC1zdGF0dXMtY29udGFpbmVyIGhhcy1uby1hY3Rpb25zXCIpO1xuc3RhdHVzQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbmNvbnN0IHNlY29uZGFyeUlucHV0VG9vbGJhciA9IHRvb2xiYXIoXCJyZXNwb25zaXZlIHJlc3BvbnNpdmUtYWxsIGNoYXQtc2Vjb25kYXJ5LWlucHV0LXRvb2xiYXJcIik7XG5zZWNvbmRhcnlUb29sYmFyLmFwcGVuZChjb250ZXh0VXNhZ2UsIHN0YXR1c0NvbnRhaW5lciwgc2Vjb25kYXJ5SW5wdXRUb29sYmFyLmhvc3QpO1xuaW5wdXRQYXJ0LmFwcGVuZChzZWNvbmRhcnlUb29sYmFyKTtcbnJvb3QuYXBwZW5kKGlucHV0UGFydCk7XG5cbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCAoKSA9PiBpbnB1dENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwiZm9jdXNlZFwiKSk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiBpbnB1dENvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKFwiZm9jdXNlZFwiKSk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgcmVuZGVySW5wdXREZWNvcmF0aW9ucyk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgYXV0b0dyb3cpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gIC8vIFRoZSBgL2AgYEBgIHBvcHVwIG93bnMgbmF2aWdhdGlvbiBhbmQgYWNjZXB0IGtleXMgd2hpbGUgaXQgaXMgb3Blbi5cbiAgaWYgKGhhbmRsZUFzc2lzdEtleShldmVudCkpIHJldHVybjtcbiAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSAmJiAhZXZlbnQuaXNDb21wb3NpbmcpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHN1Ym1pdCgpO1xuICB9XG59KTtcblxuLy8gI3JlZ2lvbiBJbnB1dCBkZWNvcmF0aW9ucyAoYC9cdUJBODVcdUI4MzlgXHUwMEI3YEBcdUQzMENcdUM3N0NgIFx1RDFBMFx1RDA3MCBcdUMwQzkgKyBcdUNDQThcdUJEODAgXHVDRTY5KVxuXG4vKiogXHVDNjQ0XHVDMTMxIFx1QzIxOFx1Qjc3RFx1MDBCN1x1QUM4MFx1QzBDOSBcdUFDQjBcdUFDRkNcdUI4NUMgXHVDMkU0XHVDODc0XHVDNzc0IFx1RDY1NVx1Qzc3OFx1QjQxQyBcdUQzMENcdUM3N0NcdUI0RTQuIFx1QUNCRFx1Qjg1QyBcdTIxOTIge25hbWUsIHJlbGF0aXZlUGF0aH0gKi9cbmNvbnN0IGtub3duRmlsZXMgPSBuZXcgTWFwKCk7XG5cbmZ1bmN0aW9uIHJlbWVtYmVyRmlsZShmaWxlKSB7XG4gIGlmIChmaWxlPy5yZWxhdGl2ZVBhdGgpIGtub3duRmlsZXMuc2V0KGZpbGUucmVsYXRpdmVQYXRoLCBmaWxlKTtcbn1cblxuLyoqIFx1RDYwNFx1QzdBQyBcdUM3ODVcdUI4MjVcdUM1RDBcdUMxMUMgXHVDMkU0XHVDODc0IFx1RDMwQ1x1Qzc3Q1x1QUNGQyBcdUI5RTRcdUNFNkRcdUI0MUMgQFx1RDFBMFx1RDA3MFx1QjRFNC4gKi9cbmZ1bmN0aW9uIG1lbnRpb25Ub2tlbnNJblRleHQoKSB7XG4gIGNvbnN0IGZvdW5kID0gW107XG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdGV4dGFyZWEudmFsdWUubWF0Y2hBbGwoLyhefFxccylAKFteXFxzXSspL2cpKSB7XG4gICAgY29uc3QgcGF0aCA9IG1hdGNoWzJdLnJlcGxhY2UoL1suLCE/OjtdKyQvLCBcIlwiKTtcbiAgICBpZiAoa25vd25GaWxlcy5oYXMocGF0aCkpIGZvdW5kLnB1c2gocGF0aCk7XG4gIH1cbiAgcmV0dXJuIFsuLi5uZXcgU2V0KGZvdW5kKV07XG59XG5cbi8qKiBcdUM3ODVcdUI4MjUgXHVEMTREXHVDMkE0XHVEMkI4XHVCOTdDIFx1QkJGOFx1QjdFQ1x1QzVEMCBcdUIyRTRcdUMyREMgXHVBREY4XHVCOUFDXHVCQTcwIFx1QzcyMFx1RDZBOCBcdUQxQTBcdUQwNzBcdUM1RDBcdUI5Q0MgXHVDMEM5XHVDNzQ0IFx1Qzc4NVx1RDc4Q1x1QjJFNC4gKi9cbmZ1bmN0aW9uIHJlbmRlcklucHV0RGVjb3JhdGlvbnMoKSB7XG4gIGNvbnN0IHZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG4gIGlucHV0TWlycm9yLnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gIC8vIFx1QkIzOFx1QzExQyBcdUMyRENcdUM3OTFcdUM3NTggXHVDMkFDXHVCNzk4XHVDMkRDIFx1QkE4NVx1QjgzOSBcdTIwMTQgXHVDMkU0XHVDODFDIFx1QjRGMVx1Qjg1RFx1QjQxQyBcdUJBODVcdUI4MzlcdUM3N0MgXHVCNTRDXHVCOUNDIFx1RDFBMFx1RDA3MFx1QzczQ1x1Qjg1QyBcdUNERThcdUFFMDkuXG4gIGxldCByZXN0ID0gdmFsdWU7XG4gIGNvbnN0IHNsYXNoID0gdmFsdWUubWF0Y2goL15cXC9bXFx3LV0rLyk7XG4gIGlmIChzbGFzaCAmJiBTTEFTSF9DT01NQU5EUy5zb21lKChjb21tYW5kKSA9PiBjb21tYW5kLnZhbHVlID09PSBzbGFzaFswXSkpIHtcbiAgICBpbnB1dE1pcnJvci5hcHBlbmQoZWwoXCJzcGFuXCIsIFwidmliZXgtdG9rZW5cIiwgc2xhc2hbMF0pKTtcbiAgICByZXN0ID0gdmFsdWUuc2xpY2Uoc2xhc2hbMF0ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIEBcdUQzMENcdUM3N0MgXHVEMUEwXHVEMDcwIFx1MjAxNCBrbm93bkZpbGVzIFx1QzVEMCBcdUM3ODhcdUIyOTQgXHVBQ0JEXHVCODVDXHVCOUNDIFx1QzBDOVx1Qzc0NCBcdUM3ODVcdUQ3OENcdUIyRTQuXG4gIGxldCBjdXJzb3IgPSAwO1xuICBmb3IgKGNvbnN0IG1hdGNoIG9mIHJlc3QubWF0Y2hBbGwoLyhefFxccylAKFteXFxzXSspL2cpKSB7XG4gICAgY29uc3QgY2xlYW4gPSBtYXRjaFsyXS5yZXBsYWNlKC9bLiwhPzo7XSskLywgXCJcIik7XG4gICAgaWYgKCFrbm93bkZpbGVzLmhhcyhjbGVhbikpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHRva2VuU3RhcnQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzFdLmxlbmd0aDtcbiAgICBjb25zdCB0b2tlbkVuZCA9IHRva2VuU3RhcnQgKyAxICsgY2xlYW4ubGVuZ3RoOyAvLyAnQCcgKyBcdUFDQkRcdUI4NUNcbiAgICBpbnB1dE1pcnJvci5hcHBlbmQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocmVzdC5zbGljZShjdXJzb3IsIHRva2VuU3RhcnQpKSk7XG4gICAgaW5wdXRNaXJyb3IuYXBwZW5kKGVsKFwic3BhblwiLCBcInZpYmV4LXRva2VuXCIsIGBAJHtjbGVhbn1gKSk7XG4gICAgY3Vyc29yID0gdG9rZW5FbmQ7XG4gIH1cbiAgaW5wdXRNaXJyb3IuYXBwZW5kKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJlc3Quc2xpY2UoY3Vyc29yKSkpO1xuICBpbnB1dE1pcnJvci5zY3JvbGxUb3AgPSB0ZXh0YXJlYS5zY3JvbGxUb3A7XG4gIHJlbmRlckF0dGFjaG1lbnRQaWxscygpO1xufVxuXG4vKiogQFx1RDFBMFx1RDA3MFx1QUNGQyAxOjEgXHVCODVDIFx1QjMwMFx1Qzc1MVx1RDU1OFx1QjI5NCBcdUNDQThcdUJEODAgXHVDRTY5LiBcdUNFNjlcdUM3NTggXHUyNzE1IFx1QjI5NCBcdUJDRjhcdUJCMzggXHVEMUEwXHVEMDcwXHVCM0M0IFx1RDU2OFx1QUVEOCBcdUM5QzBcdUM2QjRcdUIyRTQuICovXG5mdW5jdGlvbiByZW5kZXJBdHRhY2htZW50UGlsbHMoKSB7XG4gIGNvbnN0IHRva2VucyA9IG1lbnRpb25Ub2tlbnNJblRleHQoKTtcbiAgYXR0YWNoZWRDb250ZXh0LnJlcGxhY2VDaGlsZHJlbigpO1xuICBhdHRhY2htZW50c0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gdG9rZW5zLmxlbmd0aCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgZm9yIChjb25zdCBwYXRoIG9mIHRva2Vucykge1xuICAgIGNvbnN0IGZpbGUgPSBrbm93bkZpbGVzLmdldChwYXRoKTtcbiAgICBjb25zdCBwaWxsID0gZWwoXCJkaXZcIiwgXCJjaGF0LWF0dGFjaGVkLWNvbnRleHQtYXR0YWNobWVudFwiKTtcbiAgICBjb25zdCBsYWJlbCA9IGVsKFwic3BhblwiLCBcIm1vbmFjby1pY29uLWxhYmVsXCIpO1xuICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwiZmlsZVwiKSwgZWwoXCJzcGFuXCIsIFwidmliZXgtcGlsbC1uYW1lXCIsIGZpbGUubmFtZSB8fCBwYXRoKSk7XG4gICAgY29uc3QgcmVtb3ZlID0gZWwoXCJhXCIsIFwidmliZXgtcGlsbC1yZW1vdmVcIik7XG4gICAgcmVtb3ZlLnRpdGxlID0gXCJcdUNDQThcdUJEODAgXHVENTc0XHVDODFDXCI7XG4gICAgcmVtb3ZlLmFwcGVuZChjb2RpY29uKFwiY2xvc2VcIikpO1xuICAgIHJlbW92ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgZXNjYXBlZCA9IHBhdGgucmVwbGFjZSgvWy4qKz9eXFwke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChgKF58XFxcXHMpQCR7ZXNjYXBlZH0oPz1cXFxcc3wkKVxcXFxzP2AsIFwiZ1wiKTtcbiAgICAgIHRleHRhcmVhLnZhbHVlID0gdGV4dGFyZWEudmFsdWUucmVwbGFjZShwYXR0ZXJuLCBcIiQxXCIpLnJlcGxhY2UoLyAgKy9nLCBcIiBcIikudHJpbVN0YXJ0KCk7XG4gICAgICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgICAgIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgfSk7XG4gICAgcGlsbC5hcHBlbmQobGFiZWwsIHJlbW92ZSk7XG4gICAgYXR0YWNoZWRDb250ZXh0LmFwcGVuZChwaWxsKTtcbiAgfVxufVxuXG4vKiogdGV4dGFyZWEudmFsdWUgXHVCOTdDIFx1Q0Y1NFx1QjREQ1x1Qjg1QyBcdUJDMTRcdUFGQkMgXHVCQUE4XHVCNEUwIFx1QzlDMFx1QzgxMFx1QzVEMFx1QzExQyBcdUQ2MzhcdUNEOUNcdUQ1NThcdUIyOTQgXHVCMkU4XHVDNzdDIFx1QUMzMVx1QzJFMFx1QzgxMC4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb3NlcigpIHtcbiAgYXV0b0dyb3coKTtcbiAgc3luY1NlbmRFbmFibGVkKCk7XG4gIHJlbmRlcklucHV0RGVjb3JhdGlvbnMoKTtcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG5mdW5jdGlvbiBhdXRvR3JvdygpIHtcbiAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRleHRhcmVhLnNjcm9sbEhlaWdodCwgMjQwKX1weGA7XG4gIC8vIFRoZSBwb3B1cCBmbG9hdHMgaW4gdmlld3BvcnQgc3BhY2UsIHNvIGl0IG11c3QgZm9sbG93IHRoZSBib3ggYXMgaXQgZ3Jvd3MuXG4gIGlmIChhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikgcG9zaXRpb25Bc3Npc3QoKTtcbn1cblxuLy8gI2VuZHJlZ2lvblxuXG4vLyAjcmVnaW9uIENvbXBvc2VyIGFzc2lzdCAoYC9gIGNvbW1hbmRzIGFuZCBgQGAgZmlsZSBtZW50aW9ucylcblxuLy8gQXBwZW5kZWQgdG8gPGJvZHk+LCBub3QgdG8gdGhlIGNvbXBvc2VyOiBldmVyeSBjb21wb3NlciBhbmNlc3RvciBzZXRzXG4vLyBgb3ZlcmZsb3c6IGhpZGRlbmAsIHNvIGEgcG9wdXAgcGFyZW50ZWQgdGhlcmUgaXMgY2xpcHBlZCBhd2F5IGFuZCBuZXZlclxuLy8gYmVjb21lcyB2aXNpYmxlLiBJdCBpcyBwb3NpdGlvbmVkIGFnYWluc3QgdGhlIGlucHV0IGJveCBpbiB2aWV3cG9ydCBzcGFjZVxuLy8gYnkgYHBvc2l0aW9uQXNzaXN0KClgIGluc3RlYWQuXG5jb25zdCBhc3Npc3RQb3B1cCA9IGVsKFwiZGl2XCIsIFwidmliZXgtbWVudSB2aWJleC1hc3Npc3RcIik7XG5hc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5kb2N1bWVudC5ib2R5LmFwcGVuZChhc3Npc3RQb3B1cCk7XG5cbi8qKiBQbGFjZXMgdGhlIHBvcHVwIGRpcmVjdGx5IGFib3ZlIHRoZSBpbnB1dCBib3gsIGZsaXBwaW5nIGJlbG93IGlmIG5lZWRlZC4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uQXNzaXN0KCkge1xuICBjb25zdCBhbmNob3IgPSBpbnB1dENvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgYXNzaXN0UG9wdXAuc3R5bGUubGVmdCA9IGAke2FuY2hvci5sZWZ0fXB4YDtcbiAgYXNzaXN0UG9wdXAuc3R5bGUud2lkdGggPSBgJHthbmNob3Iud2lkdGh9cHhgO1xuICBjb25zdCBoZWlnaHQgPSBhc3Npc3RQb3B1cC5vZmZzZXRIZWlnaHQ7XG4gIGNvbnN0IGFib3ZlID0gYW5jaG9yLnRvcCAtIGhlaWdodCAtIDQ7XG4gIGFzc2lzdFBvcHVwLnN0eWxlLnRvcCA9IGAke2Fib3ZlID49IDQgPyBhYm92ZSA6IGFuY2hvci5ib3R0b20gKyA0fXB4YDtcbn1cblxuLyoqIFRoZSBgL1x1MjAyNmAgb3IgYEBcdTIwMjZgIHRva2VuIHRoZSBjYXJldCBjdXJyZW50bHkgc2l0cyBpbiwgaWYgYW55LiAqL1xuZnVuY3Rpb24gYXNzaXN0VG9rZW5BdENhcmV0KCkge1xuICBjb25zdCBjYXJldCA9IHRleHRhcmVhLnNlbGVjdGlvblN0YXJ0ID8/IHRleHRhcmVhLnZhbHVlLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2ggPSB0ZXh0YXJlYS52YWx1ZS5zbGljZSgwLCBjYXJldCkubWF0Y2goLyhefFxccykoWy9AXVteXFxzXSopJC91KTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHRva2VuID0gbWF0Y2hbMl07XG4gIHJldHVybiB7IHRva2VuLCBzdGFydDogY2FyZXQgLSB0b2tlbi5sZW5ndGgsIGVuZDogY2FyZXQgfTtcbn1cblxuZnVuY3Rpb24gY2xvc2VBc3Npc3QoKSB7XG4gIHN0YXRlLmFzc2lzdEl0ZW1zID0gW107XG4gIHN0YXRlLmFzc2lzdFJhbmdlID0gbnVsbDtcbiAgYXNzaXN0UG9wdXAuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBhc3Npc3RQb3B1cC5yZXBsYWNlQ2hpbGRyZW4oKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQXNzaXN0KCkge1xuICBjb25zdCByYW5nZSA9IGFzc2lzdFRva2VuQXRDYXJldCgpO1xuICBpZiAoIXJhbmdlKSB7XG4gICAgY2xvc2VBc3Npc3QoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgc3RhdGUuYXNzaXN0UmFuZ2UgPSByYW5nZTtcbiAgc3RhdGUuYXNzaXN0SW5kZXggPSAwO1xuXG4gIGlmIChyYW5nZS50b2tlbi5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gcmFuZ2UudG9rZW4udG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICBzdGF0ZS5hc3Npc3RJdGVtcyA9IFNMQVNIX0NPTU1BTkRTXG4gICAgICAuZmlsdGVyKChjb21tYW5kKSA9PiBjb21tYW5kLnZhbHVlLnN0YXJ0c1dpdGgocXVlcnkpKVxuICAgICAgLm1hcCgoY29tbWFuZCkgPT4gKHsga2luZDogXCJjb21tYW5kXCIsIGxhYmVsOiBjb21tYW5kLnZhbHVlLCAuLi5jb21tYW5kIH0pKTtcbiAgICByZW5kZXJBc3Npc3QoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBGaWxlcyBhcnJpdmUgYXN5bmNocm9ub3VzbHk7IHJlbmRlciB3aGF0IGlzIGFscmVhZHkgY2FjaGVkIHNvIHRoZSBwb3B1cFxuICAvLyBvcGVucyBvbiB0aGUgZmlyc3Qga2V5c3Ryb2tlIGluc3RlYWQgb2YgYWZ0ZXIgdGhlIHJvdW5kLXRyaXAuXG4gIHN0YXRlLmFzc2lzdEl0ZW1zID0gbWVudGlvbkl0ZW1zKHJhbmdlLnRva2VuLnNsaWNlKDEpKTtcbiAgcmVuZGVyQXNzaXN0KCk7XG4gIHN0YXRlLm1lbnRpb25SZXF1ZXN0SWQgPSBgbWVudGlvbi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMil9YDtcbiAgcG9zdCh7IHR5cGU6IFwic2VhcmNoTWVudGlvbnNcIiwgcmVxdWVzdElkOiBzdGF0ZS5tZW50aW9uUmVxdWVzdElkLCBxdWVyeTogcmFuZ2UudG9rZW4uc2xpY2UoMSkgfSk7XG59XG5cbi8qKiBDYWNoZWQgbWVudGlvbiBjYW5kaWRhdGVzIG5hcnJvd2VkIGJ5IHRoZSB0eXBlZCBwcmVmaXguICovXG5mdW5jdGlvbiBtZW50aW9uSXRlbXMocXVlcnkpIHtcbiAgY29uc3QgbmVlZGxlID0gU3RyaW5nKHF1ZXJ5IHx8IFwiXCIpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gIHJldHVybiBzdGF0ZS5tZW50aW9uRmlsZXNcbiAgICAuZmlsdGVyKChmaWxlKSA9PiAhbmVlZGxlIHx8IGZpbGUucmVsYXRpdmVQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuaW5jbHVkZXMobmVlZGxlKSlcbiAgICAubWFwKChmaWxlKSA9PiAoeyBraW5kOiBcImZpbGVcIiwgbGFiZWw6IGZpbGUubmFtZSwgZGVzY3JpcHRpb246IGZpbGUucmVsYXRpdmVQYXRoLCBmaWxlIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXNzaXN0KCkge1xuICBpZiAoIXN0YXRlLmFzc2lzdFJhbmdlIHx8ICFzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGgpIHtcbiAgICBhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgYXNzaXN0UG9wdXAucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdGF0ZS5hc3Npc3RJbmRleCA+PSBzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGgpIHN0YXRlLmFzc2lzdEluZGV4ID0gMDtcbiAgYXNzaXN0UG9wdXAucmVwbGFjZUNoaWxkcmVuKFxuICAgIC4uLnN0YXRlLmFzc2lzdEl0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IGVsKFwiZGl2XCIsIGB2aWJleC1tZW51LWl0ZW0ke2luZGV4ID09PSBzdGF0ZS5hc3Npc3RJbmRleCA/IFwiIGNoZWNrZWRcIiA6IFwiXCJ9YCk7XG4gICAgICByb3cuYXBwZW5kKFxuICAgICAgICBjb2RpY29uKGl0ZW0ua2luZCA9PT0gXCJmaWxlXCIgPyBcImZpbGVcIiA6IFwidGVybWluYWxcIiksXG4gICAgICAgIGVsKFwic3BhblwiLCBcInZpYmV4LWFzc2lzdC1sYWJlbFwiLCBpdGVtLmxhYmVsKSxcbiAgICAgICAgZWwoXCJzcGFuXCIsIFwidmliZXgtYXNzaXN0LWRlc2NyaXB0aW9uXCIsIGl0ZW0uZGVzY3JpcHRpb24gfHwgXCJcIiksXG4gICAgICApO1xuICAgICAgLy8gS2VlcCBmb2N1cyBpbiB0aGUgdGV4dGFyZWEgc28gdGhlIGNhcmV0IG9mZnNldHMgc3RheSB2YWxpZC5cbiAgICAgIHJvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGFwcGx5QXNzaXN0KGluZGV4KSk7XG4gICAgICByZXR1cm4gcm93O1xuICAgIH0pLFxuICApO1xuICBhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgcG9zaXRpb25Bc3Npc3QoKTtcbn1cblxuLyoqIFN3YXBzIHRoZSB0cmFja2VkIHRva2VuIGZvciBgcmVwbGFjZW1lbnRgIGFuZCBwdXRzIHRoZSBjYXJldCBhZnRlciBpdC4gKi9cbmZ1bmN0aW9uIHJlcGxhY2VBc3Npc3RUb2tlbihyZXBsYWNlbWVudCkge1xuICBjb25zdCByYW5nZSA9IHN0YXRlLmFzc2lzdFJhbmdlIHx8IGFzc2lzdFRva2VuQXRDYXJldCgpO1xuICBpZiAoIXJhbmdlKSByZXR1cm47XG4gIGNvbnN0IHZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG4gIHRleHRhcmVhLnZhbHVlID0gdmFsdWUuc2xpY2UoMCwgcmFuZ2Uuc3RhcnQpICsgcmVwbGFjZW1lbnQgKyB2YWx1ZS5zbGljZShyYW5nZS5lbmQpO1xuICBjb25zdCBjYXJldCA9IHJhbmdlLnN0YXJ0ICsgcmVwbGFjZW1lbnQubGVuZ3RoO1xuICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZShjYXJldCwgY2FyZXQpO1xuICBhdXRvR3JvdygpO1xuICBzeW5jU2VuZEVuYWJsZWQoKTtcbiAgcmVuZGVySW5wdXREZWNvcmF0aW9ucygpO1xufVxuXG5mdW5jdGlvbiBhcHBseUFzc2lzdChpbmRleCkge1xuICBjb25zdCBpdGVtID0gc3RhdGUuYXNzaXN0SXRlbXNbaW5kZXhdO1xuICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgaWYgKGl0ZW0ua2luZCA9PT0gXCJjb21tYW5kXCIgJiYgaXRlbS5hY3Rpb24gPT09IFwiY2xlYXJcIikge1xuICAgIHRleHRhcmVhLnZhbHVlID0gXCJcIjtcbiAgICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgfSBlbHNlIGlmIChpdGVtLmtpbmQgPT09IFwiY29tbWFuZFwiKSB7XG4gICAgcmVwbGFjZUFzc2lzdFRva2VuKGl0ZW0ucHJvbXB0IHx8IGAke2l0ZW0udmFsdWV9IGApO1xuICB9IGVsc2Uge1xuICAgIHJlbWVtYmVyRmlsZShpdGVtLmZpbGUpO1xuICAgIHJlcGxhY2VBc3Npc3RUb2tlbihgQCR7aXRlbS5maWxlLnJlbGF0aXZlUGF0aH0gYCk7XG4gIH1cbiAgY2xvc2VBc3Npc3QoKTtcbiAgdGV4dGFyZWEuZm9jdXMoKTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSBwb3B1cCBjb25zdW1lZCB0aGUga2V5LiAqL1xuZnVuY3Rpb24gaGFuZGxlQXNzaXN0S2V5KGV2ZW50KSB7XG4gIGlmIChhc3Npc3RQb3B1cC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCAhc3RhdGUuYXNzaXN0SXRlbXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgfHwgZXZlbnQua2V5ID09PSBcIkFycm93VXBcIikge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgZGVsdGEgPSBldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgPyAxIDogLTE7XG4gICAgY29uc3QgY291bnQgPSBzdGF0ZS5hc3Npc3RJdGVtcy5sZW5ndGg7XG4gICAgc3RhdGUuYXNzaXN0SW5kZXggPSAoc3RhdGUuYXNzaXN0SW5kZXggKyBkZWx0YSArIGNvdW50KSAlIGNvdW50O1xuICAgIHJlbmRlckFzc2lzdCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICgoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5ID09PSBcIlRhYlwiKSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmlzQ29tcG9zaW5nKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBhcHBseUFzc2lzdChzdGF0ZS5hc3Npc3RJbmRleCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2xvc2VBc3Npc3QoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB1cGRhdGVBc3Npc3QpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHVwZGF0ZUFzc2lzdCk7XG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiBzZXRUaW1lb3V0KGNsb3NlQXNzaXN0LCAxMjApKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsICgpID0+IHtcbiAgaWYgKGFzc2lzdFBvcHVwLnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiKSBwb3NpdGlvbkFzc2lzdCgpO1xufSk7XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBQaWNrZXJzIChtb2RlbCAvIGVmZm9ydCAvIGFwcHJvdmFsIC8gaGlzdG9yeSlcblxubGV0IG9wZW5NZW51ID0gbnVsbDtcblxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICBpZiAob3Blbk1lbnUpIHtcbiAgICBvcGVuTWVudS5yZW1vdmUoKTtcbiAgICBvcGVuTWVudSA9IG51bGw7XG4gIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICBpZiAob3Blbk1lbnUgJiYgIW9wZW5NZW51LmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIGNsb3NlTWVudSgpO1xufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGF0dGFjaE1lbnUoaG9zdCwgaXRlbXMsIG9uUGljaykge1xuICByZXR1cm4gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAob3Blbk1lbnUgJiYgb3Blbk1lbnUuZGF0YXNldC5vd25lciA9PT0gaG9zdC5kYXRhc2V0LnBpY2tlcklkKSB7XG4gICAgICBjbG9zZU1lbnUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2xvc2VNZW51KCk7XG4gICAgY29uc3QgbWVudSA9IGVsKFwiZGl2XCIsIFwidmliZXgtbWVudVwiKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMoKSkge1xuICAgICAgaWYgKGl0ZW0uZ3JvdXApIHtcbiAgICAgICAgbWVudS5hcHBlbmQoZWwoXCJkaXZcIiwgXCJ2aWJleC1tZW51LWdyb3VwXCIsIGl0ZW0uZ3JvdXApKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByb3cgPSBlbChcImRpdlwiLCBgdmliZXgtbWVudS1pdGVtJHtpdGVtLmNoZWNrZWQgPyBcIiBjaGVja2VkXCIgOiBcIlwifWApO1xuICAgICAgcm93LmFwcGVuZChpdGVtLmNoZWNrZWQgPyBjb2RpY29uKFwiY2hlY2tcIikgOiBlbChcInNwYW5cIiwgXCJjb2RpY29uXCIpKTtcbiAgICAgIHJvdy5hcHBlbmQoZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgaXRlbS5sYWJlbCkpO1xuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICBvblBpY2soaXRlbS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG1lbnUuYXBwZW5kKHJvdyk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGNvbXBvc2VyJ3MgYW5jZXN0b3JzIGFsbCBjbGlwIG92ZXJmbG93ICh0aGUgd29ya2JlbmNoIHJlbmRlcnMgaXRzXG4gICAgLy8gZHJvcGRvd25zIGluIGFuIG92ZXJsYXkgY29udGFpbmVyIGZvciB0aGUgc2FtZSByZWFzb24pLCBzbyB0aGUgbWVudSBpc1xuICAgIC8vIGFwcGVuZGVkIHRvIDxib2R5PiBhbmQgcG9zaXRpb25lZCBhZ2FpbnN0IHRoZSBhbmNob3IgaW4gdmlld3BvcnQgc3BhY2UuXG4gICAgaG9zdC5kYXRhc2V0LnBpY2tlcklkIHx8PSBgcGlja2VyLSR7KytwaWNrZXJJZFNlcX1gO1xuICAgIG1lbnUuZGF0YXNldC5vd25lciA9IGhvc3QuZGF0YXNldC5waWNrZXJJZDtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZChtZW51KTtcbiAgICBjb25zdCBhbmNob3IgPSBob3N0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGhlaWdodCA9IG1lbnUub2Zmc2V0SGVpZ2h0O1xuICAgIGNvbnN0IHRvcCA9IGFuY2hvci50b3AgLSBoZWlnaHQgLSA0O1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke01hdGgubWF4KDQsIE1hdGgubWluKGFuY2hvci5sZWZ0LCB3aW5kb3cuaW5uZXJXaWR0aCAtIG1lbnUub2Zmc2V0V2lkdGggLSA0KSl9cHhgO1xuICAgIC8vIEZsaXAgYmVsb3cgdGhlIGFuY2hvciB3aGVuIHRoZXJlIGlzIG5vdCBlbm91Z2ggcm9vbSBhYm92ZS5cbiAgICBtZW51LnN0eWxlLnRvcCA9IGAke3RvcCA+PSA0ID8gdG9wIDogYW5jaG9yLmJvdHRvbSArIDR9cHhgO1xuICAgIG9wZW5NZW51ID0gbWVudTtcbiAgfTtcbn1cbmxldCBwaWNrZXJJZFNlcSA9IDA7XG5cbi8qKlxuICogVGhlIG1vZGVsIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtaW5wdXQtcGlja2VyLWl0ZW0gPiBkaXYuYWN0aW9uLWxhYmVsLm1vZGVsLXBpY2tlci1zcGxpdCA+XG4gKiAgIGEubW9kZWwtcGlja2VyLXNlY3Rpb24ubW9kZWwtcGlja2VyLW5hbWUgPiBbY29kaWNvbiwgLmNoYXQtaW5wdXQtcGlja2VyLWxhYmVsXVxuICovXG5mdW5jdGlvbiBtb2RlbFBpY2tlclBpbGwoeyBpdGVtcywgb25QaWNrIH0pIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBjaGF0LWlucHV0LXBpY2tlci1pdGVtIHZpYmV4LXBpY2tlci1ob3N0XCIpO1xuICBjb25zdCBzcGxpdCA9IGVsKFwiZGl2XCIsIFwiYWN0aW9uLWxhYmVsIG1vZGVsLXBpY2tlci1zcGxpdFwiKTtcbiAgY29uc3Qgc2VjdGlvbiA9IGVsKFwiYVwiLCBcIm1vZGVsLXBpY2tlci1zZWN0aW9uIG1vZGVsLXBpY2tlci1uYW1lXCIpO1xuICBzZWN0aW9uLmFwcGVuZChjb2RpY29uKFwiY2hhdC1tb2RlbC1wcm92aWRlci1nZW5lcmljXCIpKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1pbnB1dC1waWNrZXItbGFiZWxcIiwgXCJcdUFFMzBcdUJDRjggXHVCQUE4XHVCMzc4XCIpO1xuICBzZWN0aW9uLmFwcGVuZChsYWJlbFNwYW4pO1xuICBzcGxpdC5hcHBlbmQoc2VjdGlvbik7XG4gIGhvc3QuYXBwZW5kKHNwbGl0KTtcbiAgc2VjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShob3N0LCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3QsIGxhYmVsU3BhbiB9O1xufVxuXG4vKipcbiAqIEEgc2Vjb25kYXJ5LXRvb2xiYXIgb3B0aW9uIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXIgPiBkaXYuYWN0aW9uLWl0ZW0uY2hhdC1zZXNzaW9uUGlja2VyLWl0ZW0gPlxuICogICBkaXYubW9uYWNvLWRyb3Bkb3duID4gZGl2LmRyb3Bkb3duLWxhYmVsID4gYS5hY3Rpb24tbGFiZWwuY2hhdC1zZXNzaW9uLW9wdGlvbi1waWNrZXIgPlxuICogICAgIHNwYW4uY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFxuICovXG5mdW5jdGlvbiBvcHRpb25QaWNrZXJQaWxsKHsgbGFiZWwsIGl0ZW1zLCBvblBpY2sgfSkge1xuICBjb25zdCBpdGVtID0gZWwoXCJkaXZcIiwgXCJhY3Rpb24taXRlbSBjaGF0LXNlc3Npb25QaWNrZXItaXRlbSB2aWJleC1waWNrZXItaG9zdFwiKTtcbiAgY29uc3QgZHJvcGRvd24gPSBlbChcImRpdlwiLCBcIm1vbmFjby1kcm9wZG93blwiKTtcbiAgY29uc3QgZHJvcGRvd25MYWJlbCA9IGVsKFwiZGl2XCIsIFwiZHJvcGRvd24tbGFiZWxcIik7XG4gIGNvbnN0IGFuY2hvciA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjaGF0LXNlc3Npb24tb3B0aW9uLXBpY2tlclwiKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFwiLCBsYWJlbCk7XG4gIGFuY2hvci5hcHBlbmQobGFiZWxTcGFuKTtcbiAgZHJvcGRvd25MYWJlbC5hcHBlbmQoYW5jaG9yKTtcbiAgZHJvcGRvd24uYXBwZW5kKGRyb3Bkb3duTGFiZWwpO1xuICBpdGVtLmFwcGVuZChkcm9wZG93bik7XG4gIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShpdGVtLCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3Q6IGl0ZW0sIGxhYmVsU3BhbiB9O1xufVxuXG5jb25zdCBtb2RlbFBpY2tlciA9IG1vZGVsUGlja2VyUGlsbCh7XG4gIGl0ZW1zOiBtb2RlbEl0ZW1zLFxuICBvblBpY2s6IChpZCkgPT4ge1xuICAgIHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9IGlkO1xuICAgIHBvc3QoeyB0eXBlOiBcInNldE9wdGlvblwiLCBpZDogXCJtb2RlbFwiLCB2YWx1ZTogaWQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGVmZm9ydFBpY2tlciA9IG9wdGlvblBpY2tlclBpbGwoe1xuICBsYWJlbDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCIsXG4gIGl0ZW1zOiBlZmZvcnRJdGVtcyxcbiAgb25QaWNrOiAoaWQpID0+IHtcbiAgICBzdGF0ZS5vcHRpb25zLmVmZm9ydCA9IGlkID09PSBcIl9fZGVmYXVsdF9fXCIgPyBcIlwiIDogaWQ7XG4gICAgcG9zdCh7IHR5cGU6IFwic2V0T3B0aW9uXCIsIGlkOiBcImVmZm9ydFwiLCB2YWx1ZTogc3RhdGUub3B0aW9ucy5lZmZvcnQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGFwcHJvdmFsUGlja2VyID0gb3B0aW9uUGlja2VyUGlsbCh7XG4gIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIixcbiAgaXRlbXM6IGFwcHJvdmFsSXRlbXMsXG4gIG9uUGljazogKGlkKSA9PiB7XG4gICAgc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUgPSBpZDtcbiAgICBwb3N0KHsgdHlwZTogXCJzZXRPcHRpb25cIiwgaWQ6IFwiYXBwcm92YWxNb2RlXCIsIHZhbHVlOiBpZCB9KTtcbiAgICByZW5kZXJQaWNrZXJzKCk7XG4gIH0sXG59KTtcblxuLy8gXCIrIFwiIGF0dGFjaCBhY3Rpb24gXHUyMDE0IGxpLmFjdGlvbi1pdGVtLm1lbnUtZW50cnkgPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYWRkLWNvbXBhY3RcbmNvbnN0IGF0dGFjaEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeVwiKTtcbmNvbnN0IGF0dGFjaEJ1dHRvbiA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjb2RpY29uIGNvZGljb24tYWRkLWNvbXBhY3RcIik7XG5hdHRhY2hCdXR0b24udGl0bGUgPSBcIlx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOCBcdUQzMENcdUM3N0MgXHVDQ0E4XHVCRDgwXCI7XG5hdHRhY2hJdGVtLmFwcGVuZChhdHRhY2hCdXR0b24pO1xuYXR0YWNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBwb3N0KHsgdHlwZTogXCJwaWNrQXR0YWNobWVudFwiIH0pKTtcbmlucHV0VG9vbGJhci5pdGVtcy5hcHBlbmQoYXR0YWNoSXRlbSwgbW9kZWxQaWNrZXIuaG9zdCk7XG5cbi8vIFNlY29uZGFyeSByb3c6IHNlc3Npb24gdGFyZ2V0IHBpbGwgKGV4dGVuc2lvbnMgaWNvbiArIFZJQkVYKSwgdGhlbiB0aGUgdHdvXG4vLyBvcHRpb24gcGlja2VycyBpbnNpZGUgb25lIGNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXIsIGFzIGluIHRoZSBvcmlnaW5hbC5cbmNvbnN0IHNlc3Npb25QaWxsID0gZWwoXCJsaVwiLCBcImFjdGlvbi1pdGVtIGNoYXQtaW5wdXQtcGlja2VyLWl0ZW0gY2hhdC1zZXNzaW9uLXRhcmdldC1waWNrZXItaXRlbVwiKTtcbmNvbnN0IHNlc3Npb25Ecm9wZG93biA9IGVsKFwiZGl2XCIsIFwibW9uYWNvLWRyb3Bkb3duXCIpO1xuY29uc3Qgc2Vzc2lvbkRyb3Bkb3duTGFiZWwgPSBlbChcImRpdlwiLCBcImRyb3Bkb3duLWxhYmVsXCIpO1xuY29uc3Qgc2Vzc2lvbkFuY2hvciA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjb21wYWN0XCIpO1xuc2Vzc2lvbkFuY2hvci5hcHBlbmQoY29kaWNvbihcImV4dGVuc2lvbnNcIiksIGVsKFwic3BhblwiLCBcImNoYXQtaW5wdXQtcGlja2VyLWxhYmVsXCIsIFwiVklCRVhcIikpO1xuc2Vzc2lvbkRyb3Bkb3duTGFiZWwuYXBwZW5kKHNlc3Npb25BbmNob3IpO1xuc2Vzc2lvbkRyb3Bkb3duLmFwcGVuZChzZXNzaW9uRHJvcGRvd25MYWJlbCk7XG5zZXNzaW9uUGlsbC5hcHBlbmQoc2Vzc2lvbkRyb3Bkb3duKTtcblxuY29uc3Qgb3B0aW9uQ29udGFpbmVyID0gZWwoXCJsaVwiLCBcImFjdGlvbi1pdGVtIGNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXJcIik7XG5vcHRpb25Db250YWluZXIuYXBwZW5kKGVmZm9ydFBpY2tlci5ob3N0LCBhcHByb3ZhbFBpY2tlci5ob3N0KTtcbnNlY29uZGFyeUlucHV0VG9vbGJhci5pdGVtcy5hcHBlbmQoc2Vzc2lvblBpbGwsIG9wdGlvbkNvbnRhaW5lcik7XG5cbi8vIFN1Ym1pdCBcdTIwMTQgbGkuYWN0aW9uLWl0ZW0ubWVudS1lbnRyeS5jaGF0LXN1Ym1pdC1idXR0b24gPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYXJyb3ctdXAtY29tcGFjdFxuY29uc3Qgc2VuZEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeSBjaGF0LXN1Ym1pdC1idXR0b25cIik7XG5jb25zdCBzZW5kQnV0dG9uID0gZWwoXCJhXCIsIFwiYWN0aW9uLWxhYmVsIGNvZGljb24gY29kaWNvbi1hcnJvdy11cC1jb21wYWN0XCIpO1xuc2VuZEJ1dHRvbi50aXRsZSA9IFwiXHVCQ0Y0XHVCMEI0XHVBRTMwIChFbnRlcilcIjtcbnNlbmRJdGVtLmFwcGVuZChzZW5kQnV0dG9uKTtcbmV4ZWN1dGVJdGVtcy5hcHBlbmQoc2VuZEl0ZW0pO1xuc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0KTtcblxuLy8gU3RvcCBcdTIwMTQgdGhlIHdvcmtiZW5jaCBzd2FwcyB0aGUgc3VibWl0IGFjdGlvbiBmb3IgdGhpcyBvbmUgd2hpbGUgYSByZXNwb25zZSBpc1xuLy8gc3RyZWFtaW5nLCBzbyB0aGUgY29tcG9zZXIgY2FycmllcyBib3RoIGFuZCBzaG93cyBleGFjdGx5IG9uZSBhdCBhIHRpbWUuXG5jb25zdCBzdG9wSXRlbSA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBtZW51LWVudHJ5IGNoYXQtc3RvcC1idXR0b25cIik7XG5jb25zdCBzdG9wQnV0dG9uID0gZWwoXCJhXCIsIFwiYWN0aW9uLWxhYmVsIGNvZGljb24gY29kaWNvbi1zdG9wLWNpcmNsZVwiKTtcbnN0b3BCdXR0b24udGl0bGUgPSBcIlx1QzBERFx1QzEzMSBcdUM5MTFcdUM5QzBcIjtcbnN0b3BJdGVtLmFwcGVuZChzdG9wQnV0dG9uKTtcbmV4ZWN1dGVJdGVtcy5hcHBlbmQoc3RvcEl0ZW0pO1xuc3RvcEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICBpZiAoIXN0YXRlLmJ1c3kpIHJldHVybjtcbiAgc3RvcEl0ZW0uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICBzdG9wQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgcG9zdCh7IHR5cGU6IFwiY2FuY2VsXCIgfSk7XG59KTtcblxuLy8gTmF0aXZlIHN1Ym1pdCBidXR0b24gZ3JleXMgb3V0IHdoaWxlIHRoZXJlIGlzIG5vdGhpbmcgdG8gc2VuZCBcdTIwMTQgdGhlXG4vLyB3b3JrYmVuY2ggcHV0cyAuZGlzYWJsZWQgb24gYm90aCB0aGUgaXRlbSBhbmQgdGhlIGxhYmVsLlxuZnVuY3Rpb24gc3luY1NlbmRFbmFibGVkKCkge1xuICBzZW5kSXRlbS5zdHlsZS5kaXNwbGF5ID0gc3RhdGUuYnVzeSA/IFwibm9uZVwiIDogXCJcIjtcbiAgc3RvcEl0ZW0uc3R5bGUuZGlzcGxheSA9IHN0YXRlLmJ1c3kgPyBcIlwiIDogXCJub25lXCI7XG4gIGlmICghc3RhdGUuYnVzeSkge1xuICAgIHN0b3BJdGVtLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcbiAgICBzdG9wQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcbiAgfVxuICBjb25zdCBkaXNhYmxlZCA9ICF0ZXh0YXJlYS52YWx1ZS50cmltKCkgfHwgc3RhdGUuYnVzeTtcbiAgc2VuZEl0ZW0uY2xhc3NMaXN0LnRvZ2dsZShcImRpc2FibGVkXCIsIGRpc2FibGVkKTtcbiAgc2VuZEJ1dHRvbi5jbGFzc0xpc3QudG9nZ2xlKFwiZGlzYWJsZWRcIiwgZGlzYWJsZWQpO1xufVxudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHN5bmNTZW5kRW5hYmxlZCk7XG5zeW5jU2VuZEVuYWJsZWQoKTtcblxuZnVuY3Rpb24gc2VsZWN0ZWRBZ2VudCgpIHtcbiAgY29uc3QgW2FnZW50SWRdID0gU3RyaW5nKHN0YXRlLm9wdGlvbnMubW9kZWxJZCB8fCBcIlwiKS5zcGxpdChcIjo6XCIpO1xuICByZXR1cm4gc3RhdGUuYWdlbnRzLmZpbmQoKGFnZW50KSA9PiBhZ2VudC5hZ2VudElkID09PSBhZ2VudElkKTtcbn1cblxuZnVuY3Rpb24gbW9kZWxJdGVtcygpIHtcbiAgY29uc3QgaXRlbXMgPSBbXTtcbiAgZm9yIChjb25zdCBhZ2VudCBvZiBzdGF0ZS5hZ2VudHMpIHtcbiAgICBpZiAoIWFnZW50LnVzYWJsZSkgY29udGludWU7XG4gICAgaXRlbXMucHVzaCh7IGdyb3VwOiBhZ2VudC5kaXNwbGF5TmFtZSB9KTtcbiAgICBjb25zdCBtb2RlbHMgPSBhZ2VudC5tb2RlbHM/Lmxlbmd0aCA/IGFnZW50Lm1vZGVscyA6IFt7IHZhbHVlOiBcIlwiLCBsYWJlbDogYWdlbnQuZGlzcGxheU5hbWUgfV07XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgIGNvbnN0IGlkID0gYCR7YWdlbnQuYWdlbnRJZH06OiR7bW9kZWwudmFsdWUgfHwgXCJcIn1gO1xuICAgICAgaXRlbXMucHVzaCh7IGlkLCBsYWJlbDogbW9kZWwubGFiZWwsIGNoZWNrZWQ6IHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9PT0gaWQgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpdGVtcztcbn1cblxuZnVuY3Rpb24gZWZmb3J0SXRlbXMoKSB7XG4gIGNvbnN0IGFnZW50ID0gc2VsZWN0ZWRBZ2VudCgpO1xuICBjb25zdCBpdGVtcyA9IFt7IGlkOiBcIl9fZGVmYXVsdF9fXCIsIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUNEOTRcdUI4NjBcIiwgY2hlY2tlZDogIXN0YXRlLm9wdGlvbnMuZWZmb3J0IH1dO1xuICBmb3IgKGNvbnN0IGVmZm9ydCBvZiBhZ2VudD8uZWZmb3J0cyB8fCBbXSkge1xuICAgIGlmICghZWZmb3J0LnZhbHVlKSBjb250aW51ZTtcbiAgICBpdGVtcy5wdXNoKHsgaWQ6IGVmZm9ydC52YWx1ZSwgbGFiZWw6IGVmZm9ydC5sYWJlbCwgY2hlY2tlZDogc3RhdGUub3B0aW9ucy5lZmZvcnQgPT09IGVmZm9ydC52YWx1ZSB9KTtcbiAgfVxuICByZXR1cm4gaXRlbXM7XG59XG5cbmZ1bmN0aW9uIGFwcHJvdmFsSXRlbXMoKSB7XG4gIHJldHVybiBbXG4gICAgeyBpZDogXCJkZWZhdWx0XCIsIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIiB9LFxuICAgIHsgaWQ6IFwiYnlwYXNzXCIsIGxhYmVsOiBcIlx1QzJCOVx1Qzc3OCBcdUM1QzZcdUM3NzQgXHVDOUM0XHVENTg5XCIgfSxcbiAgICB7IGlkOiBcImF1dG9waWxvdFwiLCBsYWJlbDogXCJcdUM2MjRcdUQxQTBcdUQzMENcdUM3N0NcdUI3RkZcIiB9LFxuICBdLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgY2hlY2tlZDogc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUgPT09IGl0ZW0uaWQgfSkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJQaWNrZXJzKCkge1xuICBjb25zdCBbYWdlbnRJZCwgbW9kZWxdID0gU3RyaW5nKHN0YXRlLm9wdGlvbnMubW9kZWxJZCB8fCBcIlwiKS5zcGxpdChcIjo6XCIpO1xuICBjb25zdCBhZ2VudCA9IHN0YXRlLmFnZW50cy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS5hZ2VudElkID09PSBhZ2VudElkKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGFnZW50XG4gICAgPyAoYWdlbnQubW9kZWxzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLnZhbHVlID09PSAobW9kZWwgfHwgXCJcIikpPy5sYWJlbCB8fCBhZ2VudC5kaXNwbGF5TmFtZSlcbiAgICA6IFwiXHVBRTMwXHVCQ0Y4IFx1QkFBOFx1QjM3OFwiO1xuICBtb2RlbFBpY2tlci5sYWJlbFNwYW4udGV4dENvbnRlbnQgPSBtb2RlbExhYmVsO1xuICBjb25zdCBlZmZvcnRMYWJlbCA9IHN0YXRlLm9wdGlvbnMuZWZmb3J0XG4gICAgPyAoc2VsZWN0ZWRBZ2VudCgpPy5lZmZvcnRzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLnZhbHVlID09PSBzdGF0ZS5vcHRpb25zLmVmZm9ydCk/LmxhYmVsIHx8IHN0YXRlLm9wdGlvbnMuZWZmb3J0KVxuICAgIDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCI7XG4gIGVmZm9ydFBpY2tlci5sYWJlbFNwYW4udGV4dENvbnRlbnQgPSBlZmZvcnRMYWJlbDtcbiAgYXBwcm92YWxQaWNrZXIubGFiZWxTcGFuLnRleHRDb250ZW50ID1cbiAgICB7IGRlZmF1bHQ6IFwiXHVBRTMwXHVCQ0Y4IFx1QzJCOVx1Qzc3OFwiLCBieXBhc3M6IFwiXHVDMkI5XHVDNzc4IFx1QzVDNlx1Qzc3NCBcdUM5QzRcdUQ1ODlcIiwgYXV0b3BpbG90OiBcIlx1QzYyNFx1RDFBMFx1RDMwQ1x1Qzc3Q1x1QjdGRlwiIH1bc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGVdIHx8IFwiXHVBRTMwXHVCQ0Y4IFx1QzJCOVx1Qzc3OFwiO1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gVHJhbnNjcmlwdCByZW5kZXJpbmdcblxuZnVuY3Rpb24gZm9ybWF0VG9rZW5zKGNvdW50KSB7XG4gIGNvbnN0IHZhbHVlID0gTnVtYmVyKGNvdW50KSB8fCAwO1xuICBpZiAodmFsdWUgPj0gMTAwMCkgcmV0dXJuIGAkeyh2YWx1ZSAvIDEwMDApLnRvRml4ZWQodmFsdWUgPj0gMTBfMDAwID8gMCA6IDEpfWtgO1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWV0YUxpbmUodGFzaykge1xuICBjb25zdCBwYXJ0cyA9IFtdO1xuICBjb25zdCBhZ2VudCA9IEFHRU5UX05BTUVTW3Rhc2suYWdlbnRJZF0gfHwgdGFzay5hZ2VudElkO1xuICBpZiAoYWdlbnQpIHBhcnRzLnB1c2godGFzay5hZ2VudE1vZGVsID8gYCR7YWdlbnR9IFx1MDBCNyAke3Rhc2suYWdlbnRNb2RlbH1gIDogYWdlbnQpO1xuICBjb25zdCB1c2FnZSA9IHRhc2sudXNhZ2U7XG4gIGlmICh1c2FnZSAmJiAodXNhZ2UuaW5wdXRUb2tlbnMgfHwgdXNhZ2Uub3V0cHV0VG9rZW5zIHx8IHVzYWdlLnRvdGFsVG9rZW5zKSkge1xuICAgIGNvbnN0IHRvdGFsID0gdXNhZ2UudG90YWxUb2tlbnMgfHwgKHVzYWdlLmlucHV0VG9rZW5zIHx8IDApICsgKHVzYWdlLm91dHB1dFRva2VucyB8fCAwKTtcbiAgICBwYXJ0cy5wdXNoKGAke2Zvcm1hdFRva2Vucyh1c2FnZS5pbnB1dFRva2Vucyl9XHUyMTkxICR7Zm9ybWF0VG9rZW5zKHVzYWdlLm91dHB1dFRva2Vucyl9XHUyMTkzIChcdUNEMUQgJHtmb3JtYXRUb2tlbnModG90YWwpfSBcdUQxQTBcdUQwNzApYCk7XG4gIH1cbiAgaWYgKHVzYWdlPy5jb3N0VXNkICE9IG51bGwpIHBhcnRzLnB1c2goYCQke051bWJlcih1c2FnZS5jb3N0VXNkKS50b0ZpeGVkKDQpfWApO1xuICBjb25zdCB0aW1lID0gdGFzay5jb21wbGV0ZWRBdCB8fCB0YXNrLnVwZGF0ZWRBdDtcbiAgaWYgKHRpbWUpIHtcbiAgICBjb25zdCBhdCA9IG5ldyBEYXRlKHRpbWUpO1xuICAgIGlmICghTnVtYmVyLmlzTmFOKGF0LmdldFRpbWUoKSkpIHtcbiAgICAgIHBhcnRzLnB1c2goYXQudG9Mb2NhbGVUaW1lU3RyaW5nKFwia28tS1JcIiwgeyBob3VyOiBcIm51bWVyaWNcIiwgbWludXRlOiBcIjItZGlnaXRcIiB9KSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFx1MDBCNyBcIik7XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RSb3codGV4dCkge1xuICBjb25zdCByb3cgPSBlbChcImRpdlwiLCBcImludGVyYWN0aXZlLWl0ZW0tY29udGFpbmVyIGludGVyYWN0aXZlLXJlcXVlc3RcIik7XG4gIGNvbnN0IHZhbHVlID0gZWwoXCJkaXZcIiwgXCJ2YWx1ZVwiKTtcbiAgdmFsdWUuYXBwZW5kKHJlbmRlck1hcmtkb3duKHRleHQpKTtcbiAgcm93LmFwcGVuZCh2YWx1ZSk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHJlc3BvbnNlUm93KHRhc2ssIHsgaXNMYXN0IH0pIHtcbiAgY29uc3Qgcm93ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pdGVtLWNvbnRhaW5lciBpbnRlcmFjdGl2ZS1yZXNwb25zZVwiKTtcbiAgaWYgKGlzTGFzdCkgcm93LmNsYXNzTGlzdC5hZGQoXCJjaGF0LW1vc3QtcmVjZW50LXJlc3BvbnNlXCIpO1xuICBjb25zdCB2YWx1ZSA9IGVsKFwiZGl2XCIsIFwidmFsdWVcIik7XG4gIHJvdy5hcHBlbmQodmFsdWUpO1xuXG4gIGNvbnN0IGFjdGl2ZSA9IEFDVElWRV9TVEFUVVNFUy5oYXModGFzay5zdGF0dXMpO1xuICBpZiAoYWN0aXZlKSByb3cuY2xhc3NMaXN0LmFkZChcImNoYXQtcmVzcG9uc2UtbG9hZGluZ1wiKTtcblxuICAvLyBSZWFzb25pbmcgXHUyMDE0IG5hdGl2ZSB0aGlua2luZyBib3ggc3RydWN0dXJlLlxuICBjb25zdCByZWFzb25pbmcgPSAodGFzay5hY3Rpdml0eUl0ZW1zIHx8IFtdKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0udHlwZSA9PT0gXCJyZWFzb25pbmdcIiAmJiAoaXRlbS50ZXh0IHx8IFwiXCIpLnRyaW0oKSk7XG4gIGlmIChyZWFzb25pbmcubGVuZ3RoKSB7XG4gICAgY29uc3QgYm94ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXRoaW5raW5nLWJveFwiKTtcbiAgICBjb25zdCBsaXN0SG9zdCA9IGVsKFwiZGl2XCIsIFwiY2hhdC11c2VkLWNvbnRleHQtbGlzdCBjaGF0LXRoaW5raW5nLWl0ZW1zXCIpO1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiByZWFzb25pbmcpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXRoaW5raW5nLWl0ZW0gbWFya2Rvd24tY29udGVudFwiKTtcbiAgICAgIGVudHJ5LmFwcGVuZChyZW5kZXJNYXJrZG93bihpdGVtLnRleHQpKTtcbiAgICAgIGxpc3RIb3N0LmFwcGVuZChlbnRyeSk7XG4gICAgfVxuICAgIGJveC5hcHBlbmQobGlzdEhvc3QpO1xuICAgIHZhbHVlLmFwcGVuZChib3gpO1xuICB9XG5cbiAgLy8gTm9uLXJlYXNvbmluZyBhY3Rpdml0eSBcdTIwMTQgb25lIGxhYmVsIHJvdyBwZXIgaXRlbSwgbmF0aXZlIHVzZWQtY29udGV4dCBsYWJlbCBzdHlsaW5nLlxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGFzay5hY3Rpdml0eUl0ZW1zIHx8IFtdKSB7XG4gICAgaWYgKGl0ZW0udHlwZSA9PT0gXCJyZWFzb25pbmdcIikgY29udGludWU7XG4gICAgY29uc3QgbGFiZWwgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxhYmVsXCIpO1xuICAgIGNvbnN0IGtpbmQgPSBpdGVtLnR5cGU7XG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGlmIChraW5kID09PSBcImNvbW1hbmRFeGVjdXRpb25cIiB8fCBraW5kID09PSBcImNvbW1hbmRcIikge1xuICAgICAgY29uc3QgY29tbWFuZCA9IEFycmF5LmlzQXJyYXkoaXRlbS5kYXRhPy5jb21tYW5kKSA/IGl0ZW0uZGF0YS5jb21tYW5kLmpvaW4oXCIgXCIpIDogaXRlbS5kYXRhPy5jb21tYW5kO1xuICAgICAgdGV4dCA9IGNvbW1hbmQgPyBTdHJpbmcoY29tbWFuZCkgOiBcIlx1QkE4NVx1QjgzOVx1Qzc0NCBcdUMyRTRcdUQ1ODlcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTRcIjtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwidGVybWluYWxcIikpO1xuICAgIH0gZWxzZSBpZiAoa2luZCA9PT0gXCJmaWxlQ2hhbmdlXCIpIHtcbiAgICAgIGNvbnN0IHBhdGhzID0gKGl0ZW0uZGF0YT8uY2hhbmdlcyB8fCBbXSkubWFwKChjaGFuZ2UpID0+IGNoYW5nZT8ucGF0aCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgdGV4dCA9IHBhdGhzLmxlbmd0aCA9PT0gMSA/IHBhdGhzWzBdIDogYCR7cGF0aHMubGVuZ3RofVx1QUMxQyBcdUQzMENcdUM3N0NcdUM3NDQgXHVDMjE4XHVDODE1XHVENTg4XHVDMkI1XHVCMkM4XHVCMkU0YDtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwiZWRpdFwiKSk7XG4gICAgfSBlbHNlIGlmIChraW5kID09PSBcIndlYlNlYXJjaFwiKSB7XG4gICAgICB0ZXh0ID0gaXRlbS50ZXh0IHx8IFwiXHVDNkY5XHVDNzQ0IFx1QUM4MFx1QzBDOVx1RDU4OFx1QzJCNVx1QjJDOFx1QjJFNFwiO1xuICAgICAgbGFiZWwuYXBwZW5kKGNvZGljb24oXCJzZWFyY2hcIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZXh0ID0gaXRlbS50ZXh0IHx8IGl0ZW0uZGF0YT8udG9vbCB8fCBcIlx1Qzc5MVx1QzVDNVx1Qzc0NCBcdUM5QzRcdUQ1ODlcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTRcIjtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwidG9vbHNcIikpO1xuICAgIH1cbiAgICBjb25zdCBjb2RlID0gZWwoXCJjb2RlXCIsIHVuZGVmaW5lZCwgdGV4dCk7XG4gICAgbGFiZWwuYXBwZW5kKGNvZGUpO1xuICAgIHZhbHVlLmFwcGVuZChsYWJlbCk7XG4gIH1cblxuICAvLyBDbGFyaWZpY2F0aW9uIHR1cm5zIChxdWVzdGlvbiBcdTIxOTIgYW5zd2VyKSBpbiBvcmlnaW5hbCBvcmRlci5cbiAgZm9yIChjb25zdCBjbGFyaWZpY2F0aW9uIG9mIHRhc2suY2xhcmlmaWNhdGlvblR1cm5zIHx8IFtdKSB7XG4gICAgY29uc3QgcmVwbHkgPSAoY2xhcmlmaWNhdGlvbi5hc3Npc3RhbnRSZXBseSB8fCBjbGFyaWZpY2F0aW9uLnF1ZXN0aW9uPy50ZXh0IHx8IFwiXCIpLnRyaW0oKTtcbiAgICBpZiAocmVwbHkpIHZhbHVlLmFwcGVuZChyZW5kZXJNYXJrZG93bihyZXBseSkpO1xuICAgIGNvbnN0IGFuc3dlciA9IChjbGFyaWZpY2F0aW9uLmFuc3dlciB8fCBcIlwiKS50cmltKCk7XG4gICAgaWYgKGFuc3dlcikge1xuICAgICAgY29uc3QgYW5zd2VyUm93ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pdGVtLWNvbnRhaW5lciBpbnRlcmFjdGl2ZS1yZXF1ZXN0XCIpO1xuICAgICAgY29uc3QgYW5zd2VyVmFsdWUgPSBlbChcImRpdlwiLCBcInZhbHVlXCIpO1xuICAgICAgYW5zd2VyVmFsdWUuYXBwZW5kKHJlbmRlck1hcmtkb3duKGFuc3dlcikpO1xuICAgICAgYW5zd2VyUm93LmFwcGVuZChhbnN3ZXJWYWx1ZSk7XG4gICAgICB2YWx1ZS5hcHBlbmQoYW5zd2VyUm93KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByZXBseSA9ICh0YXNrLmFnZW50UmVwbHkgfHwgXCJcIikudHJpbSgpO1xuICBpZiAocmVwbHkpIHZhbHVlLmFwcGVuZChyZW5kZXJNYXJrZG93bihyZXBseSkpO1xuXG4gIGlmIChhY3RpdmUpIHtcbiAgICBjb25zdCBwcm9ncmVzcyA9IGVsKFwiZGl2XCIsIFwiY2hhdC11c2VkLWNvbnRleHQtbGFiZWxcIik7XG4gICAgcHJvZ3Jlc3MuYXBwZW5kKGNvZGljb24oXCJsb2FkaW5nIGNvZGljb24tbW9kaWZpZXItc3BpblwiKSk7XG4gICAgcHJvZ3Jlc3MuYXBwZW5kKGVsKFwic3BhblwiLCB1bmRlZmluZWQsIGAgJHtTVEFUVVNfTUVTU0FHRVNbdGFzay5zdGF0dXNdIHx8IFwiXHVDOUM0XHVENTg5IFx1QzkxMVx1Qzc4NVx1QjJDOFx1QjJFNC5cIn1gKSk7XG4gICAgdmFsdWUuYXBwZW5kKHByb2dyZXNzKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qgd2FybmluZyBvZiB0YXNrLndhcm5pbmdzIHx8IFtdKSB7XG4gICAgY29uc3Qgd2lkZ2V0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LW5vdGlmaWNhdGlvbi13aWRnZXRcIik7XG4gICAgd2lkZ2V0LmFwcGVuZChjb2RpY29uKFwid2FybmluZ1wiKSwgZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgU3RyaW5nKHdhcm5pbmcpKSk7XG4gICAgdmFsdWUuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRlc3Qgb2YgdGFzay50ZXN0UmVzdWx0cyB8fCBbXSkge1xuICAgIGNvbnN0IGxhYmVsID0gZWwoXCJkaXZcIiwgXCJjaGF0LXVzZWQtY29udGV4dC1sYWJlbFwiKTtcbiAgICBsYWJlbC5hcHBlbmQoY29kaWNvbih0ZXN0LnN0YXR1cyA9PT0gXCJwYXNzZWRcIiA/IFwiY2hlY2tcIiA6IHRlc3Quc3RhdHVzID09PSBcImZhaWxlZFwiID8gXCJlcnJvclwiIDogXCJjaXJjbGUtc2xhc2hcIikpO1xuICAgIGxhYmVsLmFwcGVuZChlbChcImNvZGVcIiwgdW5kZWZpbmVkLCBgICR7dGVzdC5jb21tYW5kfSR7dGVzdC5zdW1tYXJ5ID8gYCBcdTIwMTQgJHt0ZXN0LnN1bW1hcnl9YCA6IFwiXCJ9YCkpO1xuICAgIHZhbHVlLmFwcGVuZChsYWJlbCk7XG4gIH1cblxuICBpZiAodGFzay5lcnJvcikge1xuICAgIGNvbnN0IHdpZGdldCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1ub3RpZmljYXRpb24td2lkZ2V0XCIpO1xuICAgIHdpZGdldC5hcHBlbmQoY29kaWNvbihcImVycm9yXCIpLCBlbChcInNwYW5cIiwgdW5kZWZpbmVkLCBTdHJpbmcodGFzay5lcnJvcikpKTtcbiAgICB2YWx1ZS5hcHBlbmQod2lkZ2V0KTtcbiAgfVxuXG4gIGlmICghYWN0aXZlKSB7XG4gICAgY29uc3QgZm9vdGVyID0gZWwoXCJkaXZcIiwgXCJjaGF0LXVzZWQtY29udGV4dC1sYWJlbCB2aWJleC1tZXRhXCIpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSBbXTtcbiAgICBpZiAodGFzay5yZXZpZXdBdmFpbGFibGUpIHtcbiAgICAgIGNvbnN0IHJldmlldyA9IGVsKFwiYVwiLCB1bmRlZmluZWQsIFwiXHVCQ0MwXHVBQ0JEIFx1QzBBQ1x1RDU2RCBcdUFDODBcdUQxQTBcIik7XG4gICAgICByZXZpZXcuaHJlZiA9IFwiI1wiO1xuICAgICAgcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcG9zdCh7IHR5cGU6IFwib3BlblJldmlld1wiLCB0YXNrSWQ6IHRhc2sudGFza0lkIH0pO1xuICAgICAgfSk7XG4gICAgICBhY3Rpb25zLnB1c2gocmV2aWV3KTtcbiAgICB9XG4gICAgY29uc3QgbWV0YSA9IG1ldGFMaW5lKHRhc2spO1xuICAgIGlmIChtZXRhKSBmb290ZXIuYXBwZW5kKGVsKFwic3BhblwiLCB1bmRlZmluZWQsIG1ldGEpKTtcbiAgICBpZiAoYWN0aW9ucy5sZW5ndGggJiYgbWV0YSkgZm9vdGVyLmFwcGVuZChlbChcInNwYW5cIiwgdW5kZWZpbmVkLCBcIiBcdTAwQjcgXCIpKTtcbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiBhY3Rpb25zKSBmb290ZXIuYXBwZW5kKGFjdGlvbik7XG4gICAgaWYgKGZvb3Rlci5jaGlsZE5vZGVzLmxlbmd0aCkgdmFsdWUuYXBwZW5kKGZvb3Rlcik7XG4gIH1cblxuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiB3ZWxjb21lVmlldygpIHtcbiAgLy8gTWF0Y2ggVlMgQ29kZSdzIG5hdGl2ZSBibGFuayBDaGF0IFNlc3Npb24gaGllcmFyY2h5LiBUaGUgY29udGFpbmVyIG93bnNcbiAgLy8gdGhlIGF2YWlsYWJsZSB0cmFuc2NyaXB0IGhlaWdodCBhbmQgY2VudGVycyB0aGUgd2VsY29tZSBtYXJrIGFib3ZlIHRoZVxuICAvLyBjb21wb3NlcjsgdGhlIGlubmVyIHZpZXcgc3VwcGxpZXMgdGhlIG5hdGl2ZSB0aXRsZS9tZXNzYWdlIHNwYWNpbmcuXG4gIGNvbnN0IGNvbnRhaW5lciA9IGVsKFwiZGl2XCIsIFwiY2hhdC13ZWxjb21lLXZpZXctY29udGFpbmVyXCIpO1xuICBjb25zdCBob3N0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXdlbGNvbWUtdmlld1wiKTtcbiAgY29uc3QgaWNvbkhvc3QgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3LWljb24gbGFyZ2UtaWNvblwiKTtcbiAgaWNvbkhvc3QuYXBwZW5kKHZpYmV4TWFyaygpKTtcbiAgY29uc3QgdGl0bGVIb3N0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXdlbGNvbWUtdmlldy10aXRsZVwiLCBcIlZJQkVYXCIpO1xuICBjb25zdCBtZXNzYWdlID0gZWwoXCJkaXZcIiwgXCJjaGF0LXdlbGNvbWUtdmlldy1tZXNzYWdlXCIpO1xuICBtZXNzYWdlLmFwcGVuZChyZW5kZXJNYXJrZG93bihcImlQYWRcdUM2NDAgVlMgQ29kZVx1QUMwMCBcdUFDMTlcdUM3NDAgXHVCMzAwXHVENjU0XHVCOTdDIFx1QUNGNVx1QzcyMFx1RDU2OVx1QjJDOFx1QjJFNC4gXHVCQUE4XHVCMzc4IFx1QzEyMFx1RDBERFx1QUUzMFx1Qjg1QyBDb2RleFx1QzY0MCBDbGF1ZGUgQ29kZVx1Qjk3QyB0dXJuXHVCOUM4XHVCMkU0IFx1QkMxNFx1QUZENCBcdUM0RjggXHVDMjE4IFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIikpO1xuICBob3N0LmFwcGVuZChpY29uSG9zdCwgdGl0bGVIb3N0LCBtZXNzYWdlKTtcbiAgY29udGFpbmVyLmFwcGVuZChob3N0KTtcbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHJhbnNjcmlwdCgpIHtcbiAgY29uc3Qgc3RpY2tUb0JvdHRvbSA9XG4gICAgbGlzdC5zY3JvbGxIZWlnaHQgLSBsaXN0LnNjcm9sbFRvcCAtIGxpc3QuY2xpZW50SGVpZ2h0IDwgNjA7XG4gIGxpc3QucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgaWYgKHN0YXRlLmNvbm5lY3Rpb25FcnJvcikge1xuICAgIGNvbnN0IHdpZGdldCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1ub3RpZmljYXRpb24td2lkZ2V0XCIpO1xuICAgIHdpZGdldC5hcHBlbmQoY29kaWNvbihcImRlYnVnLWRpc2Nvbm5lY3RcIiksIGVsKFwic3BhblwiLCB1bmRlZmluZWQsIHN0YXRlLmNvbm5lY3Rpb25FcnJvcikpO1xuICAgIGxpc3QuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBpZiAoIXN0YXRlLnRhc2tzLmxlbmd0aCkge1xuICAgIGxpc3QuYXBwZW5kKHdlbGNvbWVWaWV3KCkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN0YXRlLnRhc2tzLmZvckVhY2goKHRhc2ssIGluZGV4KSA9PiB7XG4gICAgaWYgKHRhc2sudXNlck1lc3NhZ2UpIGxpc3QuYXBwZW5kKHJlcXVlc3RSb3codGFzay51c2VyTWVzc2FnZSkpO1xuICAgIGxpc3QuYXBwZW5kKHJlc3BvbnNlUm93KHRhc2ssIHsgaXNMYXN0OiBpbmRleCA9PT0gc3RhdGUudGFza3MubGVuZ3RoIC0gMSB9KSk7XG4gIH0pO1xuXG4gIGlmIChzdGlja1RvQm90dG9tKSBsaXN0LnNjcm9sbFRvcCA9IGxpc3Quc2Nyb2xsSGVpZ2h0O1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTWVzc2FnaW5nXG5cbmZ1bmN0aW9uIHN1Ym1pdCgpIHtcbiAgY29uc3QgdGV4dCA9IHRleHRhcmVhLnZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0ZXh0IHx8IHN0YXRlLmJ1c3kpIHJldHVybjtcbiAgY2xvc2VBc3Npc3QoKTtcbiAgdGV4dGFyZWEudmFsdWUgPSBcIlwiO1xuICByZWZyZXNoQ29tcG9zZXIoKTtcbiAgcG9zdCh7XG4gICAgdHlwZTogXCJzZW5kXCIsXG4gICAgdGV4dCxcbiAgICBtb2RlbElkOiBzdGF0ZS5vcHRpb25zLm1vZGVsSWQsXG4gICAgZWZmb3J0OiBzdGF0ZS5vcHRpb25zLmVmZm9ydCxcbiAgICBhcHByb3ZhbE1vZGU6IHN0YXRlLm9wdGlvbnMuYXBwcm92YWxNb2RlLFxuICB9KTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICBjb25zdCBtZXNzYWdlID0gZXZlbnQuZGF0YTtcbiAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICBjYXNlIFwic3RhdGVcIjoge1xuICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZSwge1xuICAgICAgICBhZ2VudHM6IG1lc3NhZ2UuYWdlbnRzID8/IHN0YXRlLmFnZW50cyxcbiAgICAgICAgcHJvamVjdHM6IG1lc3NhZ2UucHJvamVjdHMgPz8gc3RhdGUucHJvamVjdHMsXG4gICAgICAgIGNvbnZlcnNhdGlvbnM6IG1lc3NhZ2UuY29udmVyc2F0aW9ucyA/PyBzdGF0ZS5jb252ZXJzYXRpb25zLFxuICAgICAgICBzZWxlY3RlZENvbnZlcnNhdGlvbklkOiBtZXNzYWdlLnNlbGVjdGVkQ29udmVyc2F0aW9uSWQgPz8gc3RhdGUuc2VsZWN0ZWRDb252ZXJzYXRpb25JZCxcbiAgICAgICAgc2VsZWN0ZWRQcm9qZWN0SWQ6IG1lc3NhZ2Uuc2VsZWN0ZWRQcm9qZWN0SWQgPz8gc3RhdGUuc2VsZWN0ZWRQcm9qZWN0SWQsXG4gICAgICAgIHRhc2tzOiBtZXNzYWdlLnRhc2tzID8/IHN0YXRlLnRhc2tzLFxuICAgICAgICBoZWFsdGg6IG1lc3NhZ2UuaGVhbHRoID8/IHN0YXRlLmhlYWx0aCxcbiAgICAgICAgYnVzeTogQm9vbGVhbihtZXNzYWdlLmJ1c3kpLFxuICAgICAgICBjb25uZWN0aW9uRXJyb3I6IG1lc3NhZ2UuY29ubmVjdGlvbkVycm9yID8/IG51bGwsXG4gICAgICB9KTtcbiAgICAgIGlmIChtZXNzYWdlLm9wdGlvbnMpIE9iamVjdC5hc3NpZ24oc3RhdGUub3B0aW9ucywgbWVzc2FnZS5vcHRpb25zKTtcbiAgICAgIGlmICghc3RhdGUub3B0aW9ucy5tb2RlbElkKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gc3RhdGUuYWdlbnRzLmZpbmQoKGFnZW50KSA9PiBhZ2VudC51c2FibGUpO1xuICAgICAgICBpZiAoZmlyc3QpIHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9IGAke2ZpcnN0LmFnZW50SWR9Ojoke2ZpcnN0Lm1vZGVscz8uWzBdPy52YWx1ZSB8fCBcIlwifWA7XG4gICAgICB9XG4gICAgICAvLyBcdUM1NDhcdUIwQjQgXHVCQjM4XHVBRDZDXHVCMjk0IFx1QjQ1MFx1QzlDMCBcdUM1NEFcdUIyOTRcdUIyRTQuIGAvYFx1MDBCN2BAYCBcdUIyOTQgXHVDNzg1XHVCODI1XHVENTU4XHVCMjk0IFx1QzIxQ1x1QUMwNCBcdUM3OTBcdUIzRDlcdUM2NDRcdUMxMzFcdUM3NzQgXHVCNzJDXHVCMkU0LlxuICAgICAgcmVuZGVyUGlja2VycygpO1xuICAgICAgcmVuZGVyVHJhbnNjcmlwdCgpO1xuICAgICAgc3luY1NlbmRFbmFibGVkKCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcIm1lbnRpb25SZXN1bHRzXCI6IHtcbiAgICAgIGlmIChtZXNzYWdlLnJlcXVlc3RJZCAhPT0gc3RhdGUubWVudGlvblJlcXVlc3RJZCkgYnJlYWs7IC8vIFx1QjJBNlx1QUM4QyBcdUIzQzRcdUNDMjlcdUQ1NUMgXHVDNzUxXHVCMkY1XG4gICAgICBzdGF0ZS5tZW50aW9uRmlsZXMgPSBBcnJheS5pc0FycmF5KG1lc3NhZ2UuZmlsZXMpID8gbWVzc2FnZS5maWxlcyA6IFtdO1xuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIHN0YXRlLm1lbnRpb25GaWxlcykgcmVtZW1iZXJGaWxlKGZpbGUpO1xuICAgICAgLy8gUmUtcmVuZGVyIGZyb20gdGhlIHJlZnJlc2hlZCBjYWNoZSBvbmx5IFx1MjAxNCBnb2luZyB0aHJvdWdoIHVwZGF0ZUFzc2lzdCgpXG4gICAgICAvLyBoZXJlIHdvdWxkIHBvc3QgYW5vdGhlciBzZWFyY2ggYW5kIGxvb3AuXG4gICAgICBjb25zdCByYW5nZSA9IGFzc2lzdFRva2VuQXRDYXJldCgpO1xuICAgICAgaWYgKCFyYW5nZSB8fCAhcmFuZ2UudG9rZW4uc3RhcnRzV2l0aChcIkBcIikpIGJyZWFrO1xuICAgICAgc3RhdGUuYXNzaXN0UmFuZ2UgPSByYW5nZTtcbiAgICAgIHN0YXRlLmFzc2lzdEl0ZW1zID0gbWVudGlvbkl0ZW1zKHJhbmdlLnRva2VuLnNsaWNlKDEpKTtcbiAgICAgIHJlbmRlckFzc2lzdCgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJpbnNlcnRNZW50aW9uXCI6IHtcbiAgICAgIHJlbWVtYmVyRmlsZSh7XG4gICAgICAgIHJlbGF0aXZlUGF0aDogbWVzc2FnZS5yZWxhdGl2ZVBhdGgsXG4gICAgICAgIG5hbWU6IG1lc3NhZ2UucmVsYXRpdmVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbWVudGlvbiA9IGBAJHttZXNzYWdlLnJlbGF0aXZlUGF0aH0gYDtcbiAgICAgIGNvbnN0IGF0ID0gdGV4dGFyZWEuc2VsZWN0aW9uU3RhcnQgPz8gdGV4dGFyZWEudmFsdWUubGVuZ3RoO1xuICAgICAgdGV4dGFyZWEudmFsdWUgPSB0ZXh0YXJlYS52YWx1ZS5zbGljZSgwLCBhdCkgKyBtZW50aW9uICsgdGV4dGFyZWEudmFsdWUuc2xpY2UoYXQpO1xuICAgICAgdGV4dGFyZWEuZm9jdXMoKTtcbiAgICAgIHJlZnJlc2hDb21wb3NlcigpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJ0YXNrVXBkYXRlXCI6IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gc3RhdGUudGFza3MuZmluZEluZGV4KCh0YXNrKSA9PiB0YXNrLnRhc2tJZCA9PT0gbWVzc2FnZS50YXNrLnRhc2tJZCk7XG4gICAgICBpZiAoaW5kZXggPj0gMCkgc3RhdGUudGFza3NbaW5kZXhdID0gbWVzc2FnZS50YXNrO1xuICAgICAgZWxzZSBzdGF0ZS50YXNrcy5wdXNoKG1lc3NhZ2UudGFzayk7XG4gICAgICBzdGF0ZS5idXN5ID0gQUNUSVZFX1NUQVRVU0VTLmhhcyhtZXNzYWdlLnRhc2suc3RhdHVzKTtcbiAgICAgIHJlbmRlclRyYW5zY3JpcHQoKTtcbiAgICAgIHN5bmNTZW5kRW5hYmxlZCgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59KTtcblxucG9zdCh7IHR5cGU6IFwicmVhZHlcIiB9KTtcblxuLy8gI2VuZHJlZ2lvblxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBSUEsVUFBTSxjQUFjLENBQUM7QUFFckIsZUFBUyxlQUFnQixTQUFTO0FBQ2hDLFlBQUksUUFBUSxZQUFZLE9BQU87QUFDL0IsWUFBSSxPQUFPO0FBQUUsaUJBQU87QUFBQSxRQUFNO0FBRTFCLGdCQUFRLFlBQVksT0FBTyxJQUFJLENBQUM7QUFFaEMsaUJBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxLQUFLO0FBQzVCLGdCQUFNLEtBQUssT0FBTyxhQUFhLENBQUM7QUFDaEMsZ0JBQU0sS0FBSyxFQUFFO0FBQUEsUUFDZjtBQUVBLGlCQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ3ZDLGdCQUFNLEtBQUssUUFBUSxXQUFXLENBQUM7QUFDL0IsZ0JBQU0sRUFBRSxJQUFJLE9B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LFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsWUFBVyxHQUFFLE1BQUssR0FBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxNQUFLLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLElBQUcsU0FBUyxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxhQUFhLEdBQUUsQ0FBQyxLQUFJLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLE1BQUssUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsaUJBQWdCLEdBQUUsTUFBSyxHQUFFLGVBQWMsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLHdCQUF3QixHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsNEJBQTRCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGFBQVksR0FBRSxLQUFJLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsVUFBUyxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGVBQWMsR0FBRSxNQUFLLEdBQUUsWUFBVyxDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxNQUFLLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsTUFBSyxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsUUFBTyxHQUFFLEtBQUksR0FBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsT0FBTSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHFCQUFvQixDQUFDLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxNQUFLLEdBQUUsZ0JBQWUsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLG9CQUFtQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHNCQUFxQixDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLE9BQU0sR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHVCQUFzQixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHdCQUF1QixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSx5QkFBeUIsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSwwQkFBMEIsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHlCQUF5QixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxhQUFZLEdBQUUsS0FBSSxHQUFFLGFBQVksQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxLQUFJLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsV0FBVyxHQUFFLENBQUMsSUFBRyxjQUFjLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLElBQUcsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksWUFBWSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSx3QkFBd0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsS0FBSSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsSUFBRyxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSw0QkFBNEIsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxLQUFJLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsc0JBQXNCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUscUJBQW9CLEdBQUUsS0FBSSxHQUFFLHVCQUFzQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxzQkFBcUIsR0FBRSxLQUFJLEdBQUUsd0JBQXVCLENBQUMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsSUFBRyxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLEtBQUksR0FBRSxhQUFZLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsS0FBSSxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsY0FBYSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxjQUFhLEdBQUUsS0FBSSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsc0JBQXFCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLG9CQUFtQixHQUFFLEtBQUksR0FBRSw0QkFBMkIsQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxPQUFNLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsT0FBTSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxtQkFBa0IsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxNQUFLLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxPQUFNLEVBQUMsR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxPQUFNLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdB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O0FBQ0ksYUFBQSxlQUFBLFNBQUEsYUFBQSxFQUFBLFlBQUEsTUFBQSxLQUFBLFdBQUE7QUFBQSxlQUFBLFlBQUE7TUFBUyxFQUFBLENBQUE7QUFDVCxhQUFBLGVBQUEsU0FBQSxVQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFBQTtNQUFNLEVBQUEsQ0FBQTtBQUNOLGFBQUEsZUFBQSxTQUFBLGNBQUEsRUFBQSxZQUFBLE1BQUEsS0FBQSxXQUFBO0FBQUEsZUFBQSxZQUFBO01BQVUsRUFBQSxDQUFBO0FBQ1YsYUFBQSxlQUFBLFNBQUEsbUJBQUEsRUFBQSxZQUFBLE1BQUEsS0FBQSxXQUFBO0FBQUEsZUFBQSxZQUFBO01BQWUsRUFBQSxDQUFBO0FBQ2YsYUFBQSxlQUFBLFNBQUEsY0FBQSxFQUFBLFlBQUEsTUFBQSxLQUFBLFdBQUE7QUFBQSxlQUFBLFlBQUE7TUFBVSxFQUFBLENBQUE7QUFHZCxVQUFBLGNBQUE7QUFDSSxhQUFBLGVBQUEsU0FBQSxjQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFBQTtNQUFVLEVBQUEsQ0FBQTtBQUNWLGFBQUEsZUFBQSxTQUFBLHNCQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFBQTtNQUFrQixFQUFBLENBQUE7QUFFbEIsYUFBQSxlQUFBLFNBQUEsZUFBQSxFQUFBLFlBQUEsTUFBQSxLQUFBLFdBQUE7QUFBQSxlQUFBLFlBQUE7TUFBVSxFQUFBLENBQUE7QUFDVixhQUFBLGVBQUEsU0FBQSxlQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFBQTtNQUFVLEVBQUEsQ0FBQTtBQUdkLFVBQUEsY0FBQTtBQUNJLGFBQUEsZUFBQSxTQUFBLGlCQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFBQTtNQUFhLEVBQUEsQ0FBQTtBQUNiLGFBQUEsZUFBQSxTQUFBLGdCQUFBLEVBQUEsWUFBQSxNQUFBLEtBQUEsV0FBQTtBQUFBLGVBQUEsWUFB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aW5UcmllRmxhZ3MiLCAiRW50aXR5RGVjb2RlclN0YXRlIiwgIkRlY29kaW5nTW9kZSIsICJFbnRpdHlEZWNvZGVyIiwgIkVudGl0eUxldmVsIiwgIkVuY29kaW5nTW9kZSIsICJyZXF1aXJlX2luZGV4X2NqcyIsICJtYXRjaCIsICJsaXN0IiwgImVsIiwgImNvZGUiLCAiZW50aXR5IiwgInVjbWljcm8iLCAic3RhdGUiLCAibGlzdCIsICJtZCIsICJpc0xpbmtPcGVuIiwgImlzTGlua0Nsb3NlIiwgImxpbmtpZnkiLCAidGV4dCIsICJfcnVsZXMiLCAicl9ub3JtYWxpemUiLCAicl9ibG9jayIsICJyX2lubGluZSIsICJyX2xpbmtpZnkiLCAicl9yZXBsYWNlbWVudHMiLCAicl9zbWFydHF1b3RlcyIsICJyX3RleHRfam9pbiIsICJuZXh0TGluZSIsICJwb3MiLCAibWF4IiwgImJsb2NrX25hbWVzIiwgInJfdGFibGUiLCAicl9jb2RlIiwgInJfZmVuY2UiLCAicl9ibG9ja3F1b3RlIiwgInJfaHIiLCAicl9saXN0IiwgInJfcmVmZXJlbmNlIiwgInJfaHRtbF9ibG9jayIsICJyX2hlYWRpbmciLCAicl9saGVhZGluZyIsICJyX3BhcmFncmFwaCIsICJsaW5rIiwgInBvc3RQcm9jZXNzIiwgInJfdGV4dCIsICJyX25ld2xpbmUiLCAicl9lc2NhcGUiLCAicl9iYWNrdGlja3MiLCAicl9zdHJpa2V0aHJvdWdoIiwgInJfZW1waGFzaXMiLCAicl9saW5rIiwgInJfaW1hZ2UiLCAicl9hdXRvbGluayIsICJyX2h0bWxfaW5saW5lIiwgInJfZW50aXR5IiwgInJfYmFsYW5jZV9wYWlycyIsICJyX2ZyYWdtZW50c19qb2luIiwgImNmZ19kZWZhdWx0IiwgImNmZ196ZXJvIiwgImNmZ19jb21tb25tYXJrIiwgInB1bnljb2RlIiwgIk1hcmtkb3duSXQiLCAidXRpbHMuaXNTdHJpbmciLCAiUGFyc2VyQ29yZSIsICJMaW5raWZ5SXQiLCAidXRpbHMiLCAidXRpbHMuYXNzaWduIiwgImhlbHBlcnMiLCAicmVwbHkiXQp9Cg==
