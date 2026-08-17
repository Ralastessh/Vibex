"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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
      var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      } : function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      } : function(o, v) {
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
        function() {
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
        }()
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
        re.src_pseudo_letter = "(?:(?!" + text_separators + "|" + re.src_ZPCc + ")" + re.src_Any + ")";
        re.src_ip4 = "(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
        re.src_auth = "(?:(?:(?!" + re.src_ZCc + "|[@/\\[\\]()]).)+@)?";
        re.src_port = "(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?";
        re.src_host_terminator = "(?=$|" + text_separators + "|" + re.src_ZPCc + ")(?!" + (opts["---"] ? "-(?!--)|" : "-|") + "_|:\\d|\\.-|\\.(?!$|" + re.src_ZPCc + "))";
        re.src_path = "(?:[/?#](?:(?!" + re.src_ZCc + "|" + text_separators + `|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!` + re.src_ZCc + "|\\]).)*\\]|\\((?:(?!" + re.src_ZCc + "|[)]).)*\\)|\\{(?:(?!" + re.src_ZCc + '|[}]).)*\\}|\\"(?:(?!' + re.src_ZCc + `|["]).)+\\"|\\'(?:(?!` + re.src_ZCc + "|[']).)+\\'|\\'(?=" + re.src_pseudo_letter + "|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!" + re.src_ZCc + "|[.]|$)|" + (opts["---"] ? "\\-(?!--(?:[^-]|$))(?:-*)|" : "\\-+|") + // allow `,,,` in paths
        ",(?!" + re.src_ZCc + "|$)|;(?!" + re.src_ZCc + "|$)|\\!+(?!" + re.src_ZCc + "|[!]|$)|\\?(?!" + re.src_ZCc + "|[?]|$))+|\\/)?";
        re.src_email_name = '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';
        re.src_xn = "xn--[a-z0-9\\-]{1,59}";
        re.src_domain_root = // Allow letters & digits (http://test1)
        "(?:" + re.src_xn + "|" + re.src_pseudo_letter + "{1,63})";
        re.src_domain = "(?:" + re.src_xn + "|(?:" + re.src_pseudo_letter + ")|(?:" + re.src_pseudo_letter + "(?:-|" + re.src_pseudo_letter + "){0,61}" + re.src_pseudo_letter + "))";
        re.src_host = "(?:(?:(?:(?:" + re.src_domain + ")\\.)*" + re.src_domain + "))";
        re.tpl_host_fuzzy = "(?:" + re.src_ip4 + "|(?:(?:(?:" + re.src_domain + ")\\.)+(?:%TLDS%)))";
        re.tpl_host_no_ip_fuzzy = "(?:(?:(?:" + re.src_domain + ")\\.)+(?:%TLDS%))";
        re.src_host_strict = re.src_host + re.src_host_terminator;
        re.tpl_host_fuzzy_strict = re.tpl_host_fuzzy + re.src_host_terminator;
        re.src_host_port_strict = re.src_host + re.src_port + re.src_host_terminator;
        re.tpl_host_port_fuzzy_strict = re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;
        re.tpl_host_port_no_ip_fuzzy_strict = re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;
        re.tpl_host_fuzzy_test = "localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:" + re.src_ZPCc + "|>|$))";
        re.tpl_email_fuzzy = "(^|" + text_separators + '|"|\\(|' + re.src_ZCc + ")(" + re.src_email_name + "@" + re.tpl_host_fuzzy_strict + ")";
        re.tpl_link_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        "(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|" + re.src_ZPCc + "))((?![$+<=>^`|\uFF5C])" + re.tpl_host_port_fuzzy_strict + re.src_path + ")";
        re.tpl_link_no_ip_fuzzy = // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        "(^|(?![.:/\\-_@])(?:[$+<=>^`|\uFF5C]|" + re.src_ZPCc + "))((?![$+<=>^`|\uFF5C])" + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ")";
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
                "^\\/\\/" + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path,
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
                "(?:localhost|(?:(?:" + self.re.src_domain + ")\\.)+" + self.re.src_domain_root + ")" + self.re.src_port + self.re.src_host_terminator + self.re.src_path,
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
                "^" + self.re.src_email_name + "@" + self.re.src_host_strict,
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
      function resetScanCache(self) {
        self.__index__ = -1;
        self.__text_cache__ = "";
      }
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
        re.link_fuzzy = RegExp(untpl(re.tpl_link_fuzzy), "i");
        re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), "i");
        re.host_fuzzy_test = RegExp(untpl(re.tpl_host_fuzzy_test), "i");
        const aliases = [];
        self.__compiled__ = {};
        function schemaError(name, val) {
          throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
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
        self.re.schema_test = RegExp("(^|(?!_)(?:[><\uFF5C]|" + re.src_ZPCc + "))(" + slist + ")", "i");
        self.re.schema_search = RegExp("(^|(?!_)(?:[><\uFF5C]|" + re.src_ZPCc + "))(" + slist + ")", "ig");
        self.re.schema_at_start = RegExp("^" + self.re.schema_search.source, "i");
        self.re.pretest = RegExp(
          "(" + self.re.schema_test.source + ")|(" + self.re.host_fuzzy_test.source + ")|@",
          "i"
        );
        resetScanCache(self);
      }
      function Match(self, shift) {
        const start = self.__index__;
        const end = self.__last_index__;
        const text = self.__text_cache__.slice(start, end);
        this.schema = self.__schema__.toLowerCase();
        this.index = start + shift;
        this.lastIndex = end + shift;
        this.raw = text;
        this.text = text;
        this.url = text;
      }
      function createMatch(self, shift) {
        const match = new Match(self, shift);
        self.__compiled__[match.schema].normalize(match, self);
        return match;
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
        this.__index__ = -1;
        this.__last_index__ = -1;
        this.__schema__ = "";
        this.__text_cache__ = "";
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
        this.__text_cache__ = text;
        this.__index__ = -1;
        if (!text.length) {
          return false;
        }
        let m, ml, me, len, shift, next, re, tld_pos, at_pos;
        if (this.re.schema_test.test(text)) {
          re = this.re.schema_search;
          re.lastIndex = 0;
          while ((m = re.exec(text)) !== null) {
            len = this.testSchemaAt(text, m[2], re.lastIndex);
            if (len) {
              this.__schema__ = m[2];
              this.__index__ = m.index + m[1].length;
              this.__last_index__ = m.index + m[0].length + len;
              break;
            }
          }
        }
        if (this.__opts__.fuzzyLink && this.__compiled__["http:"]) {
          tld_pos = text.search(this.re.host_fuzzy_test);
          if (tld_pos >= 0) {
            if (this.__index__ < 0 || tld_pos < this.__index__) {
              if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {
                shift = ml.index + ml[1].length;
                if (this.__index__ < 0 || shift < this.__index__) {
                  this.__schema__ = "";
                  this.__index__ = shift;
                  this.__last_index__ = ml.index + ml[0].length;
                }
              }
            }
          }
        }
        if (this.__opts__.fuzzyEmail && this.__compiled__["mailto:"]) {
          at_pos = text.indexOf("@");
          if (at_pos >= 0) {
            if ((me = text.match(this.re.email_fuzzy)) !== null) {
              shift = me.index + me[1].length;
              next = me.index + me[0].length;
              if (this.__index__ < 0 || shift < this.__index__ || shift === this.__index__ && next > this.__last_index__) {
                this.__schema__ = "mailto:";
                this.__index__ = shift;
                this.__last_index__ = next;
              }
            }
          }
        }
        return this.__index__ >= 0;
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
        let shift = 0;
        if (this.__index__ >= 0 && this.__text_cache__ === text) {
          result.push(createMatch(this, shift));
          shift = this.__last_index__;
        }
        let tail = shift ? text.slice(shift) : text;
        while (this.test(tail)) {
          result.push(createMatch(this, shift));
          tail = tail.slice(this.__last_index__);
          shift += this.__last_index__;
        }
        if (result.length) {
          return result;
        }
        return null;
      };
      LinkifyIt.prototype.matchAtStart = function matchAtStart(text) {
        this.__text_cache__ = text;
        this.__index__ = -1;
        if (!text.length) return null;
        const m = this.re.schema_at_start.exec(text);
        if (!m) return null;
        const len = this.testSchemaAt(text, m[2], m[0].length);
        if (!len) return null;
        this.__schema__ = m[2];
        this.__index__ = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        return createMatch(this, 0);
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
          match.url = "http://" + match.url;
        }
        if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) {
          match.url = "mailto:" + match.url;
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
      "use strict";
      var mdurl = require_index_cjs();
      var ucmicro = require_index_cjs2();
      var entities = require_lib();
      var LinkifyIt = require_index_cjs3();
      var punycode = require_punycode();
      function _interopNamespaceDefault(e) {
        var n = /* @__PURE__ */ Object.create(null);
        if (e) {
          Object.keys(e).forEach(function(k) {
            if (k !== "default") {
              var d = Object.getOwnPropertyDescriptor(e, k);
              Object.defineProperty(n, k, d.get ? d : {
                enumerable: true,
                get: function() {
                  return e[k];
                }
              });
            }
          });
        }
        n.default = e;
        return Object.freeze(n);
      }
      var mdurl__namespace = /* @__PURE__ */ _interopNamespaceDefault(mdurl);
      var ucmicro__namespace = /* @__PURE__ */ _interopNamespaceDefault(ucmicro);
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
        const sources = Array.prototype.slice.call(arguments, 1);
        sources.forEach(function(source) {
          if (!source) {
            return;
          }
          if (typeof source !== "object") {
            throw new TypeError(source + "must be object");
          }
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
        if (c >= 55296 && c <= 57343) {
          return false;
        }
        if (c >= 64976 && c <= 65007) {
          return false;
        }
        if ((c & 65535) === 65535 || (c & 65535) === 65534) {
          return false;
        }
        if (c >= 0 && c <= 8) {
          return false;
        }
        if (c === 11) {
          return false;
        }
        if (c >= 14 && c <= 31) {
          return false;
        }
        if (c >= 127 && c <= 159) {
          return false;
        }
        if (c > 1114111) {
          return false;
        }
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
      var ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
      var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + "|" + ENTITY_RE.source, "gi");
      var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;
      function replaceEntityPattern(match, name) {
        if (name.charCodeAt(0) === 35 && DIGITAL_ENTITY_TEST_RE.test(name)) {
          const code2 = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
          if (isValidEntityCode(code2)) {
            return fromCodePoint(code2);
          }
          return match;
        }
        const decoded = entities.decodeHTML(match);
        if (decoded !== match) {
          return decoded;
        }
        return match;
      }
      function unescapeMd(str) {
        if (str.indexOf("\\") < 0) {
          return str;
        }
        return str.replace(UNESCAPE_MD_RE, "$1");
      }
      function unescapeAll(str) {
        if (str.indexOf("\\") < 0 && str.indexOf("&") < 0) {
          return str;
        }
        return str.replace(UNESCAPE_ALL_RE, function(match, escaped, entity2) {
          if (escaped) {
            return escaped;
          }
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
        if (HTML_ESCAPE_TEST_RE.test(str)) {
          return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
        }
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
        if (code2 >= 8192 && code2 <= 8202) {
          return true;
        }
        switch (code2) {
          case 9:
          // \t
          case 10:
          // \n
          case 11:
          // \v
          case 12:
          // \f
          case 13:
          // \r
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
        return ucmicro__namespace.P.test(ch) || ucmicro__namespace.S.test(ch);
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
        if ("\u1E9E".toLowerCase() === "\u1E7E") {
          str = str.replace(/ẞ/g, "\xDF");
        }
        return str.toLowerCase().toUpperCase();
      }
      var lib = {
        mdurl: mdurl__namespace,
        ucmicro: ucmicro__namespace
      };
      var utils = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        arrayReplaceAt,
        assign,
        escapeHtml,
        escapeRE,
        fromCodePoint,
        has,
        isMdAsciiPunct,
        isPunctChar,
        isSpace,
        isString,
        isValidEntityCode,
        isWhiteSpace,
        lib,
        normalizeReference,
        unescapeAll,
        unescapeMd
      });
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
            if (prevPos === state2.pos - 1) {
              level++;
            } else if (disableNested) {
              state2.pos = oldPos;
              return -1;
            }
          }
        }
        let labelEnd = -1;
        if (found) {
          labelEnd = state2.pos;
        }
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
            if (code2 === 10) {
              return result;
            }
            if (code2 === 60) {
              return result;
            }
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
          if (code2 === 32) {
            break;
          }
          if (code2 < 32 || code2 === 127) {
            break;
          }
          if (code2 === 92 && pos + 1 < max) {
            if (str.charCodeAt(pos + 1) === 32) {
              break;
            }
            pos += 2;
            continue;
          }
          if (code2 === 40) {
            level++;
            if (level > 32) {
              return result;
            }
          }
          if (code2 === 41) {
            if (level === 0) {
              break;
            }
            level--;
          }
          pos++;
        }
        if (start === pos) {
          return result;
        }
        if (level !== 0) {
          return result;
        }
        result.str = unescapeAll(str.slice(start, pos));
        result.pos = pos;
        result.ok = true;
        return result;
      }
      function parseLinkTitle(str, start, max, prev_state) {
        let code2;
        let pos = start;
        const state2 = {
          // if `true`, this is a valid link title
          ok: false,
          // if `true`, this link can be continued on the next line
          can_continue: false,
          // if `ok`, it's the position of the first character after the closing marker
          pos: 0,
          // if `ok`, it's the unescaped title
          str: "",
          // expected closing marker character code
          marker: 0
        };
        if (prev_state) {
          state2.str = prev_state.str;
          state2.marker = prev_state.marker;
        } else {
          if (pos >= max) {
            return state2;
          }
          let marker = str.charCodeAt(pos);
          if (marker !== 34 && marker !== 39 && marker !== 40) {
            return state2;
          }
          start++;
          pos++;
          if (marker === 40) {
            marker = 41;
          }
          state2.marker = marker;
        }
        while (pos < max) {
          code2 = str.charCodeAt(pos);
          if (code2 === state2.marker) {
            state2.pos = pos + 1;
            state2.str += unescapeAll(str.slice(start, pos));
            state2.ok = true;
            return state2;
          } else if (code2 === 40 && state2.marker === 41) {
            return state2;
          } else if (code2 === 92 && pos + 1 < max) {
            pos++;
          }
          pos++;
        }
        state2.can_continue = true;
        state2.str += unescapeAll(str.slice(start, pos));
        return state2;
      }
      var helpers = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        parseLinkDestination,
        parseLinkLabel,
        parseLinkTitle
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
        if (options.highlight) {
          highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
        } else {
          highlighted = escapeHtml(token.content);
        }
        if (highlighted.indexOf("<pre") === 0) {
          return highlighted + "\n";
        }
        if (info) {
          const i = token.attrIndex("class");
          const tmpAttrs = token.attrs ? token.attrs.slice() : [];
          if (i < 0) {
            tmpAttrs.push(["class", options.langPrefix + langName]);
          } else {
            tmpAttrs[i] = tmpAttrs[i].slice();
            tmpAttrs[i][1] += " " + options.langPrefix + langName;
          }
          const tmpToken = {
            attrs: tmpAttrs
          };
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
        if (!token.attrs) {
          return "";
        }
        result = "";
        for (i = 0, l = token.attrs.length; i < l; i++) {
          result += " " + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
        }
        return result;
      };
      Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
        const token = tokens[idx];
        let result = "";
        if (token.hidden) {
          return "";
        }
        if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
          result += "\n";
        }
        result += (token.nesting === -1 ? "</" : "<") + token.tag;
        result += this.renderAttrs(token);
        if (token.nesting === 0 && options.xhtmlOut) {
          result += " /";
        }
        let needLf = false;
        if (token.block) {
          needLf = true;
          if (token.nesting === 1) {
            if (idx + 1 < tokens.length) {
              const nextToken = tokens[idx + 1];
              if (nextToken.type === "inline" || nextToken.hidden) {
                needLf = false;
              } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
                needLf = false;
              }
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
          if (typeof rules[type] !== "undefined") {
            result += rules[type](tokens, i, options, env, this);
          } else {
            result += this.renderToken(tokens, i, options);
          }
        }
        return result;
      };
      Renderer.prototype.renderInlineAsText = function(tokens, options, env) {
        let result = "";
        for (let i = 0, len = tokens.length; i < len; i++) {
          switch (tokens[i].type) {
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
          }
        }
        return result;
      };
      Renderer.prototype.render = function(tokens, options, env) {
        let result = "";
        const rules = this.rules;
        for (let i = 0, len = tokens.length; i < len; i++) {
          const type = tokens[i].type;
          if (type === "inline") {
            result += this.renderInline(tokens[i].children, options, env);
          } else if (typeof rules[type] !== "undefined") {
            result += rules[type](tokens, i, options, env, this);
          } else {
            result += this.renderToken(tokens, i, options, env);
          }
        }
        return result;
      };
      function Ruler() {
        this.__rules__ = [];
        this.__cache__ = null;
      }
      Ruler.prototype.__find__ = function(name) {
        for (let i = 0; i < this.__rules__.length; i++) {
          if (this.__rules__[i].name === name) {
            return i;
          }
        }
        return -1;
      };
      Ruler.prototype.__compile__ = function() {
        const self = this;
        const chains = [""];
        self.__rules__.forEach(function(rule) {
          if (!rule.enabled) {
            return;
          }
          rule.alt.forEach(function(altName) {
            if (chains.indexOf(altName) < 0) {
              chains.push(altName);
            }
          });
        });
        self.__cache__ = {};
        chains.forEach(function(chain) {
          self.__cache__[chain] = [];
          self.__rules__.forEach(function(rule) {
            if (!rule.enabled) {
              return;
            }
            if (chain && rule.alt.indexOf(chain) < 0) {
              return;
            }
            self.__cache__[chain].push(rule.fn);
          });
        });
      };
      Ruler.prototype.at = function(name, fn, options) {
        const index = this.__find__(name);
        const opt = options || {};
        if (index === -1) {
          throw new Error("Parser rule not found: " + name);
        }
        this.__rules__[index].fn = fn;
        this.__rules__[index].alt = opt.alt || [];
        this.__cache__ = null;
      };
      Ruler.prototype.before = function(beforeName, ruleName, fn, options) {
        const index = this.__find__(beforeName);
        const opt = options || {};
        if (index === -1) {
          throw new Error("Parser rule not found: " + beforeName);
        }
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
        if (index === -1) {
          throw new Error("Parser rule not found: " + afterName);
        }
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
        if (!Array.isArray(list3)) {
          list3 = [list3];
        }
        const result = [];
        list3.forEach(function(name) {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) {
              return;
            }
            throw new Error("Rules manager: invalid rule name " + name);
          }
          this.__rules__[idx].enabled = true;
          result.push(name);
        }, this);
        this.__cache__ = null;
        return result;
      };
      Ruler.prototype.enableOnly = function(list3, ignoreInvalid) {
        if (!Array.isArray(list3)) {
          list3 = [list3];
        }
        this.__rules__.forEach(function(rule) {
          rule.enabled = false;
        });
        this.enable(list3, ignoreInvalid);
      };
      Ruler.prototype.disable = function(list3, ignoreInvalid) {
        if (!Array.isArray(list3)) {
          list3 = [list3];
        }
        const result = [];
        list3.forEach(function(name) {
          const idx = this.__find__(name);
          if (idx < 0) {
            if (ignoreInvalid) {
              return;
            }
            throw new Error("Rules manager: invalid rule name " + name);
          }
          this.__rules__[idx].enabled = false;
          result.push(name);
        }, this);
        this.__cache__ = null;
        return result;
      };
      Ruler.prototype.getRules = function(chainName) {
        if (this.__cache__ === null) {
          this.__compile__();
        }
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
        if (!this.attrs) {
          return -1;
        }
        const attrs = this.attrs;
        for (let i = 0, len = attrs.length; i < len; i++) {
          if (attrs[i][0] === name) {
            return i;
          }
        }
        return -1;
      };
      Token.prototype.attrPush = function attrPush(attrData) {
        if (this.attrs) {
          this.attrs.push(attrData);
        } else {
          this.attrs = [attrData];
        }
      };
      Token.prototype.attrSet = function attrSet(name, value) {
        const idx = this.attrIndex(name);
        const attrData = [name, value];
        if (idx < 0) {
          this.attrPush(attrData);
        } else {
          this.attrs[idx] = attrData;
        }
      };
      Token.prototype.attrGet = function attrGet(name) {
        const idx = this.attrIndex(name);
        let value = null;
        if (idx >= 0) {
          value = this.attrs[idx][1];
        }
        return value;
      };
      Token.prototype.attrJoin = function attrJoin(name, value) {
        const idx = this.attrIndex(name);
        if (idx < 0) {
          this.attrPush([name, value]);
        } else {
          this.attrs[idx][1] = this.attrs[idx][1] + " " + value;
        }
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
        } else {
          state2.md.block.parse(state2.src, state2.md, state2.env, state2.tokens);
        }
      }
      function inline(state2) {
        const tokens = state2.tokens;
        for (let i = 0, l = tokens.length; i < l; i++) {
          const tok = tokens[i];
          if (tok.type === "inline") {
            state2.md.inline.parse(tok.content, state2.md, state2.env, tok.children);
          }
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
        if (!state2.md.options.linkify) {
          return;
        }
        for (let j = 0, l = blockTokens.length; j < l; j++) {
          if (blockTokens[j].type !== "inline" || !state2.md.linkify.pretest(blockTokens[j].content)) {
            continue;
          }
          let tokens = blockTokens[j].children;
          let htmlLinkLevel = 0;
          for (let i = tokens.length - 1; i >= 0; i--) {
            const currentToken = tokens[i];
            if (currentToken.type === "link_close") {
              i--;
              while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") {
                i--;
              }
              continue;
            }
            if (currentToken.type === "html_inline") {
              if (isLinkOpen$1(currentToken.content) && htmlLinkLevel > 0) {
                htmlLinkLevel--;
              }
              if (isLinkClose$1(currentToken.content)) {
                htmlLinkLevel++;
              }
            }
            if (htmlLinkLevel > 0) {
              continue;
            }
            if (currentToken.type === "text" && state2.md.linkify.test(currentToken.content)) {
              const text2 = currentToken.content;
              let links = state2.md.linkify.match(text2);
              const nodes = [];
              let level = currentToken.level;
              let lastPos = 0;
              if (links.length > 0 && links[0].index === 0 && i > 0 && tokens[i - 1].type === "text_special") {
                links = links.slice(1);
              }
              for (let ln = 0; ln < links.length; ln++) {
                const url = links[ln].url;
                const fullUrl = state2.md.normalizeLink(url);
                if (!state2.md.validateLink(fullUrl)) {
                  continue;
                }
                let urlText = links[ln].text;
                if (!links[ln].schema) {
                  urlText = state2.md.normalizeLinkText("http://" + urlText).replace(/^http:\/\//, "");
                } else if (links[ln].schema === "mailto:" && !/^mailto:/i.test(urlText)) {
                  urlText = state2.md.normalizeLinkText("mailto:" + urlText).replace(/^mailto:/, "");
                } else {
                  urlText = state2.md.normalizeLinkText(urlText);
                }
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
      var SCOPED_ABBR_RE = /\((c|tm|r)\)/ig;
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
          if (token.type === "text" && !inside_autolink) {
            token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
          }
          if (token.type === "link_open" && token.info === "auto") {
            inside_autolink--;
          }
          if (token.type === "link_close" && token.info === "auto") {
            inside_autolink++;
          }
        }
      }
      function replace_rare(inlineTokens) {
        let inside_autolink = 0;
        for (let i = inlineTokens.length - 1; i >= 0; i--) {
          const token = inlineTokens[i];
          if (token.type === "text" && !inside_autolink) {
            if (RARE_RE.test(token.content)) {
              token.content = token.content.replace(/\+-/g, "\xB1").replace(/\.{2,}/g, "\u2026").replace(/([?!])…/g, "$1..").replace(/([?!]){4,}/g, "$1$1$1").replace(/,{2,}/g, ",").replace(/(^|[^-])---(?=[^-]|$)/mg, "$1\u2014").replace(/(^|\s)--(?=\s|$)/mg, "$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, "$1\u2013");
            }
          }
          if (token.type === "link_open" && token.info === "auto") {
            inside_autolink--;
          }
          if (token.type === "link_close" && token.info === "auto") {
            inside_autolink++;
          }
        }
      }
      function replace(state2) {
        let blkIdx;
        if (!state2.md.options.typographer) {
          return;
        }
        for (blkIdx = state2.tokens.length - 1; blkIdx >= 0; blkIdx--) {
          if (state2.tokens[blkIdx].type !== "inline") {
            continue;
          }
          if (SCOPED_ABBR_TEST_RE.test(state2.tokens[blkIdx].content)) {
            replace_scoped(state2.tokens[blkIdx].children);
          }
          if (RARE_RE.test(state2.tokens[blkIdx].content)) {
            replace_rare(state2.tokens[blkIdx].children);
          }
        }
      }
      var QUOTE_TEST_RE = /['"]/;
      var QUOTE_RE = /['"]/g;
      var APOSTROPHE = "\u2019";
      function replaceAt(str, index, ch) {
        return str.slice(0, index) + ch + str.slice(index + 1);
      }
      function process_inlines(tokens, state2) {
        let j;
        const stack = [];
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          const thisLevel = tokens[i].level;
          for (j = stack.length - 1; j >= 0; j--) {
            if (stack[j].level <= thisLevel) {
              break;
            }
          }
          stack.length = j + 1;
          if (token.type !== "text") {
            continue;
          }
          let text2 = token.content;
          let pos = 0;
          let max = text2.length;
          OUTER: while (pos < max) {
            QUOTE_RE.lastIndex = pos;
            const t = QUOTE_RE.exec(text2);
            if (!t) {
              break;
            }
            let canOpen = true;
            let canClose = true;
            pos = t.index + 1;
            const isSingle = t[0] === "'";
            let lastChar = 32;
            if (t.index - 1 >= 0) {
              lastChar = text2.charCodeAt(t.index - 1);
            } else {
              for (j = i - 1; j >= 0; j--) {
                if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
                if (!tokens[j].content) continue;
                lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
                break;
              }
            }
            let nextChar = 32;
            if (pos < max) {
              nextChar = text2.charCodeAt(pos);
            } else {
              for (j = i + 1; j < tokens.length; j++) {
                if (tokens[j].type === "softbreak" || tokens[j].type === "hardbreak") break;
                if (!tokens[j].content) continue;
                nextChar = tokens[j].content.charCodeAt(0);
                break;
              }
            }
            const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
            const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
            const isLastWhiteSpace = isWhiteSpace(lastChar);
            const isNextWhiteSpace = isWhiteSpace(nextChar);
            if (isNextWhiteSpace) {
              canOpen = false;
            } else if (isNextPunctChar) {
              if (!(isLastWhiteSpace || isLastPunctChar)) {
                canOpen = false;
              }
            }
            if (isLastWhiteSpace) {
              canClose = false;
            } else if (isLastPunctChar) {
              if (!(isNextWhiteSpace || isNextPunctChar)) {
                canClose = false;
              }
            }
            if (nextChar === 34 && t[0] === '"') {
              if (lastChar >= 48 && lastChar <= 57) {
                canClose = canOpen = false;
              }
            }
            if (canOpen && canClose) {
              canOpen = isLastPunctChar;
              canClose = isNextPunctChar;
            }
            if (!canOpen && !canClose) {
              if (isSingle) {
                token.content = replaceAt(token.content, t.index, APOSTROPHE);
              }
              continue;
            }
            if (canClose) {
              for (j = stack.length - 1; j >= 0; j--) {
                let item = stack[j];
                if (stack[j].level < thisLevel) {
                  break;
                }
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
                  token.content = replaceAt(token.content, t.index, closeQuote);
                  tokens[item.token].content = replaceAt(tokens[item.token].content, item.pos, openQuote);
                  pos += closeQuote.length - 1;
                  if (item.token === i) {
                    pos += openQuote.length - 1;
                  }
                  text2 = token.content;
                  max = text2.length;
                  stack.length = j;
                  continue OUTER;
                }
              }
            }
            if (canOpen) {
              stack.push({
                token: i,
                pos: t.index,
                single: isSingle,
                level: thisLevel
              });
            } else if (canClose && isSingle) {
              token.content = replaceAt(token.content, t.index, APOSTROPHE);
            }
          }
        }
      }
      function smartquotes(state2) {
        if (!state2.md.options.typographer) {
          return;
        }
        for (let blkIdx = state2.tokens.length - 1; blkIdx >= 0; blkIdx--) {
          if (state2.tokens[blkIdx].type !== "inline" || !QUOTE_TEST_RE.test(state2.tokens[blkIdx].content)) {
            continue;
          }
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
          for (curr = 0; curr < max; curr++) {
            if (tokens[curr].type === "text_special") {
              tokens[curr].type = "text";
            }
          }
          for (curr = last = 0; curr < max; curr++) {
            if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
              tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
            } else {
              if (curr !== last) {
                tokens[last] = tokens[curr];
              }
              last++;
            }
          }
          if (curr !== last) {
            tokens.length = last;
          }
        }
      }
      var _rules$2 = [
        ["normalize", normalize],
        ["block", block],
        ["inline", inline],
        ["linkify", linkify$1],
        ["replacements", replace],
        ["smartquotes", smartquotes],
        // `text_join` finds `text_special` tokens (for escape sequences)
        // and joins them with the rest of the text
        ["text_join", text_join]
      ];
      function Core() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules$2.length; i++) {
          this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
        }
      }
      Core.prototype.process = function(state2) {
        const rules = this.ruler.getRules("");
        for (let i = 0, l = rules.length; i < l; i++) {
          rules[i](state2);
        }
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
          if (!indent_found) {
            if (isSpace(ch)) {
              indent++;
              if (ch === 9) {
                offset += 4 - offset % 4;
              } else {
                offset++;
              }
              continue;
            } else {
              indent_found = true;
            }
          }
          if (ch === 10 || pos === len - 1) {
            if (ch !== 10) {
              pos++;
            }
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
        for (let max = this.lineMax; from < max; from++) {
          if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
            break;
          }
        }
        return from;
      };
      StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
        for (let max = this.src.length; pos < max; pos++) {
          const ch = this.src.charCodeAt(pos);
          if (!isSpace(ch)) {
            break;
          }
        }
        return pos;
      };
      StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
        if (pos <= min) {
          return pos;
        }
        while (pos > min) {
          if (!isSpace(this.src.charCodeAt(--pos))) {
            return pos + 1;
          }
        }
        return pos;
      };
      StateBlock.prototype.skipChars = function skipChars(pos, code2) {
        for (let max = this.src.length; pos < max; pos++) {
          if (this.src.charCodeAt(pos) !== code2) {
            break;
          }
        }
        return pos;
      };
      StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code2, min) {
        if (pos <= min) {
          return pos;
        }
        while (pos > min) {
          if (code2 !== this.src.charCodeAt(--pos)) {
            return pos + 1;
          }
        }
        return pos;
      };
      StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
        if (begin >= end) {
          return "";
        }
        const queue = new Array(end - begin);
        for (let i = 0, line = begin; line < end; line++, i++) {
          let lineIndent = 0;
          const lineStart = this.bMarks[line];
          let first = lineStart;
          let last;
          if (line + 1 < end || keepLastLF) {
            last = this.eMarks[line] + 1;
          } else {
            last = this.eMarks[line];
          }
          while (first < last && lineIndent < indent) {
            const ch = this.src.charCodeAt(first);
            if (isSpace(ch)) {
              if (ch === 9) {
                lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
              } else {
                lineIndent++;
              }
            } else if (first - lineStart < this.tShift[line]) {
              lineIndent++;
            } else {
              break;
            }
            first++;
          }
          if (lineIndent > indent) {
            queue[i] = new Array(lineIndent - indent + 1).join(" ") + this.src.slice(first, last);
          } else {
            queue[i] = this.src.slice(first, last);
          }
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
          if (ch === 124) {
            if (!isEscaped) {
              result.push(current + str.substring(lastPos, pos));
              current = "";
              lastPos = pos + 1;
            } else {
              current += str.substring(lastPos, pos - 1);
              lastPos = pos;
            }
          }
          isEscaped = ch === 92;
          pos++;
          ch = str.charCodeAt(pos);
        }
        result.push(current + str.substring(lastPos));
        return result;
      }
      function table(state2, startLine, endLine, silent) {
        if (startLine + 2 > endLine) {
          return false;
        }
        let nextLine = startLine + 1;
        if (state2.sCount[nextLine] < state2.blkIndent) {
          return false;
        }
        if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
          return false;
        }
        let pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
        if (pos >= state2.eMarks[nextLine]) {
          return false;
        }
        const firstCh = state2.src.charCodeAt(pos++);
        if (firstCh !== 124 && firstCh !== 45 && firstCh !== 58) {
          return false;
        }
        if (pos >= state2.eMarks[nextLine]) {
          return false;
        }
        const secondCh = state2.src.charCodeAt(pos++);
        if (secondCh !== 124 && secondCh !== 45 && secondCh !== 58 && !isSpace(secondCh)) {
          return false;
        }
        if (firstCh === 45 && isSpace(secondCh)) {
          return false;
        }
        while (pos < state2.eMarks[nextLine]) {
          const ch = state2.src.charCodeAt(pos);
          if (ch !== 124 && ch !== 45 && ch !== 58 && !isSpace(ch)) {
            return false;
          }
          pos++;
        }
        let lineText = getLine(state2, startLine + 1);
        let columns = lineText.split("|");
        const aligns = [];
        for (let i = 0; i < columns.length; i++) {
          const t = columns[i].trim();
          if (!t) {
            if (i === 0 || i === columns.length - 1) {
              continue;
            } else {
              return false;
            }
          }
          if (!/^:?-+:?$/.test(t)) {
            return false;
          }
          if (t.charCodeAt(t.length - 1) === 58) {
            aligns.push(t.charCodeAt(0) === 58 ? "center" : "right");
          } else if (t.charCodeAt(0) === 58) {
            aligns.push("left");
          } else {
            aligns.push("");
          }
        }
        lineText = getLine(state2, startLine).trim();
        if (lineText.indexOf("|") === -1) {
          return false;
        }
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        columns = escapedSplit(lineText);
        if (columns.length && columns[0] === "") columns.shift();
        if (columns.length && columns[columns.length - 1] === "") columns.pop();
        const columnCount = columns.length;
        if (columnCount === 0 || columnCount !== aligns.length) {
          return false;
        }
        if (silent) {
          return true;
        }
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
          if (aligns[i]) {
            token_ho.attrs = [["style", "text-align:" + aligns[i]]];
          }
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
          if (state2.sCount[nextLine] < state2.blkIndent) {
            break;
          }
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state2, nextLine, endLine, true)) {
              terminate = true;
              break;
            }
          }
          if (terminate) {
            break;
          }
          lineText = getLine(state2, nextLine).trim();
          if (!lineText) {
            break;
          }
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
            break;
          }
          columns = escapedSplit(lineText);
          if (columns.length && columns[0] === "") columns.shift();
          if (columns.length && columns[columns.length - 1] === "") columns.pop();
          autocompletedCells += columnCount - columns.length;
          if (autocompletedCells > MAX_AUTOCOMPLETED_CELLS) {
            break;
          }
          if (nextLine === startLine + 2) {
            const token_tbo = state2.push("tbody_open", "tbody", 1);
            token_tbo.map = tbodyLines = [startLine + 2, 0];
          }
          const token_tro = state2.push("tr_open", "tr", 1);
          token_tro.map = [nextLine, nextLine + 1];
          for (let i = 0; i < columnCount; i++) {
            const token_tdo = state2.push("td_open", "td", 1);
            if (aligns[i]) {
              token_tdo.attrs = [["style", "text-align:" + aligns[i]]];
            }
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
        if (state2.sCount[startLine] - state2.blkIndent < 4) {
          return false;
        }
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
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        if (pos + 3 > max) {
          return false;
        }
        const marker = state2.src.charCodeAt(pos);
        if (marker !== 126 && marker !== 96) {
          return false;
        }
        let mem = pos;
        pos = state2.skipChars(pos, marker);
        let len = pos - mem;
        if (len < 3) {
          return false;
        }
        const markup = state2.src.slice(mem, pos);
        const params = state2.src.slice(pos, max);
        if (marker === 96) {
          if (params.indexOf(String.fromCharCode(marker)) >= 0) {
            return false;
          }
        }
        if (silent) {
          return true;
        }
        let nextLine = startLine;
        let haveEndMarker = false;
        for (; ; ) {
          nextLine++;
          if (nextLine >= endLine) {
            break;
          }
          pos = mem = state2.bMarks[nextLine] + state2.tShift[nextLine];
          max = state2.eMarks[nextLine];
          if (pos < max && state2.sCount[nextLine] < state2.blkIndent) {
            break;
          }
          if (state2.src.charCodeAt(pos) !== marker) {
            continue;
          }
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
            continue;
          }
          pos = state2.skipChars(pos, marker);
          if (pos - mem < len) {
            continue;
          }
          pos = state2.skipSpaces(pos);
          if (pos < max) {
            continue;
          }
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
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        if (state2.src.charCodeAt(pos) !== 62) {
          return false;
        }
        if (silent) {
          return true;
        }
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
          if (pos >= max) {
            break;
          }
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
              } else {
                adjustTab = true;
              }
            } else {
              spaceAfterMarker = false;
            }
            let offset = initial;
            oldBMarks.push(state2.bMarks[nextLine]);
            state2.bMarks[nextLine] = pos;
            while (pos < max) {
              const ch = state2.src.charCodeAt(pos);
              if (isSpace(ch)) {
                if (ch === 9) {
                  offset += 4 - (offset + state2.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
                } else {
                  offset++;
                }
              } else {
                break;
              }
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
          if (lastLineEmpty) {
            break;
          }
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state2, nextLine, endLine, true)) {
              terminate = true;
              break;
            }
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
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        const marker = state2.src.charCodeAt(pos++);
        if (marker !== 42 && marker !== 45 && marker !== 95) {
          return false;
        }
        let cnt = 1;
        while (pos < max) {
          const ch = state2.src.charCodeAt(pos++);
          if (ch !== marker && !isSpace(ch)) {
            return false;
          }
          if (ch === marker) {
            cnt++;
          }
        }
        if (cnt < 3) {
          return false;
        }
        if (silent) {
          return true;
        }
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
        if (marker !== 42 && marker !== 45 && marker !== 43) {
          return -1;
        }
        if (pos < max) {
          const ch = state2.src.charCodeAt(pos);
          if (!isSpace(ch)) {
            return -1;
          }
        }
        return pos;
      }
      function skipOrderedListMarker(state2, startLine) {
        const start = state2.bMarks[startLine] + state2.tShift[startLine];
        const max = state2.eMarks[startLine];
        let pos = start;
        if (pos + 1 >= max) {
          return -1;
        }
        let ch = state2.src.charCodeAt(pos++);
        if (ch < 48 || ch > 57) {
          return -1;
        }
        for (; ; ) {
          if (pos >= max) {
            return -1;
          }
          ch = state2.src.charCodeAt(pos++);
          if (ch >= 48 && ch <= 57) {
            if (pos - start >= 10) {
              return -1;
            }
            continue;
          }
          if (ch === 41 || ch === 46) {
            break;
          }
          return -1;
        }
        if (pos < max) {
          ch = state2.src.charCodeAt(pos);
          if (!isSpace(ch)) {
            return -1;
          }
        }
        return pos;
      }
      function markTightParagraphs(state2, idx) {
        const level = state2.level + 2;
        for (let i = idx + 2, l = state2.tokens.length - 2; i < l; i++) {
          if (state2.tokens[i].level === level && state2.tokens[i].type === "paragraph_open") {
            state2.tokens[i + 2].hidden = true;
            state2.tokens[i].hidden = true;
            i += 2;
          }
        }
      }
      function list2(state2, startLine, endLine, silent) {
        let max, pos, start, token;
        let nextLine = startLine;
        let tight = true;
        if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
          return false;
        }
        if (state2.listIndent >= 0 && state2.sCount[nextLine] - state2.listIndent >= 4 && state2.sCount[nextLine] < state2.blkIndent) {
          return false;
        }
        let isTerminatingParagraph = false;
        if (silent && state2.parentType === "paragraph") {
          if (state2.sCount[nextLine] >= state2.blkIndent) {
            isTerminatingParagraph = true;
          }
        }
        let isOrdered;
        let markerValue;
        let posAfterMarker;
        if ((posAfterMarker = skipOrderedListMarker(state2, nextLine)) >= 0) {
          isOrdered = true;
          start = state2.bMarks[nextLine] + state2.tShift[nextLine];
          markerValue = Number(state2.src.slice(start, posAfterMarker - 1));
          if (isTerminatingParagraph && markerValue !== 1) return false;
        } else if ((posAfterMarker = skipBulletListMarker(state2, nextLine)) >= 0) {
          isOrdered = false;
        } else {
          return false;
        }
        if (isTerminatingParagraph) {
          if (state2.skipSpaces(posAfterMarker) >= state2.eMarks[nextLine]) return false;
        }
        if (silent) {
          return true;
        }
        const markerCharCode = state2.src.charCodeAt(posAfterMarker - 1);
        const listTokIdx = state2.tokens.length;
        if (isOrdered) {
          token = state2.push("ordered_list_open", "ol", 1);
          if (markerValue !== 1) {
            token.attrs = [["start", markerValue]];
          }
        } else {
          token = state2.push("bullet_list_open", "ul", 1);
        }
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
            if (ch === 9) {
              offset += 4 - (offset + state2.bsCount[nextLine]) % 4;
            } else if (ch === 32) {
              offset++;
            } else {
              break;
            }
            pos++;
          }
          const contentStart = pos;
          let indentAfterMarker;
          if (contentStart >= max) {
            indentAfterMarker = 1;
          } else {
            indentAfterMarker = offset - initial;
          }
          if (indentAfterMarker > 4) {
            indentAfterMarker = 1;
          }
          const indent = initial + indentAfterMarker;
          token = state2.push("list_item_open", "li", 1);
          token.markup = String.fromCharCode(markerCharCode);
          const itemLines = [nextLine, 0];
          token.map = itemLines;
          if (isOrdered) {
            token.info = state2.src.slice(start, posAfterMarker - 1);
          }
          const oldTight = state2.tight;
          const oldTShift = state2.tShift[nextLine];
          const oldSCount = state2.sCount[nextLine];
          const oldListIndent = state2.listIndent;
          state2.listIndent = state2.blkIndent;
          state2.blkIndent = indent;
          state2.tight = true;
          state2.tShift[nextLine] = contentStart - state2.bMarks[nextLine];
          state2.sCount[nextLine] = offset;
          if (contentStart >= max && state2.isEmpty(nextLine + 1)) {
            state2.line = Math.min(state2.line + 2, endLine);
          } else {
            state2.md.block.tokenize(state2, nextLine, endLine, true);
          }
          if (!state2.tight || prevEmptyEnd) {
            tight = false;
          }
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
          if (nextLine >= endLine) {
            break;
          }
          if (state2.sCount[nextLine] < state2.blkIndent) {
            break;
          }
          if (state2.sCount[nextLine] - state2.blkIndent >= 4) {
            break;
          }
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state2, nextLine, endLine, true)) {
              terminate = true;
              break;
            }
          }
          if (terminate) {
            break;
          }
          if (isOrdered) {
            posAfterMarker = skipOrderedListMarker(state2, nextLine);
            if (posAfterMarker < 0) {
              break;
            }
            start = state2.bMarks[nextLine] + state2.tShift[nextLine];
          } else {
            posAfterMarker = skipBulletListMarker(state2, nextLine);
            if (posAfterMarker < 0) {
              break;
            }
          }
          if (markerCharCode !== state2.src.charCodeAt(posAfterMarker - 1)) {
            break;
          }
        }
        if (isOrdered) {
          token = state2.push("ordered_list_close", "ol", -1);
        } else {
          token = state2.push("bullet_list_close", "ul", -1);
        }
        token.markup = String.fromCharCode(markerCharCode);
        listLines[1] = nextLine;
        state2.line = nextLine;
        state2.parentType = oldParentType;
        if (tight) {
          markTightParagraphs(state2, listTokIdx);
        }
        return true;
      }
      function reference(state2, startLine, _endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        let nextLine = startLine + 1;
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        if (state2.src.charCodeAt(pos) !== 91) {
          return false;
        }
        function getNextLine(nextLine2) {
          const endLine = state2.lineMax;
          if (nextLine2 >= endLine || state2.isEmpty(nextLine2)) {
            return null;
          }
          let isContinuation = false;
          if (state2.sCount[nextLine2] - state2.blkIndent > 3) {
            isContinuation = true;
          }
          if (state2.sCount[nextLine2] < 0) {
            isContinuation = true;
          }
          if (!isContinuation) {
            const terminatorRules = state2.md.block.ruler.getRules("reference");
            const oldParentType = state2.parentType;
            state2.parentType = "reference";
            let terminate = false;
            for (let i = 0, l = terminatorRules.length; i < l; i++) {
              if (terminatorRules[i](state2, nextLine2, endLine, true)) {
                terminate = true;
                break;
              }
            }
            state2.parentType = oldParentType;
            if (terminate) {
              return null;
            }
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
          if (ch === 91) {
            return false;
          } else if (ch === 93) {
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
        if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 58) {
          return false;
        }
        for (pos = labelEnd + 2; pos < max; pos++) {
          const ch = str.charCodeAt(pos);
          if (ch === 10) {
            const lineContent = getNextLine(nextLine);
            if (lineContent !== null) {
              str += lineContent;
              max = str.length;
              nextLine++;
            }
          } else if (isSpace(ch)) ;
          else {
            break;
          }
        }
        const destRes = state2.md.helpers.parseLinkDestination(str, pos, max);
        if (!destRes.ok) {
          return false;
        }
        const href = state2.md.normalizeLink(destRes.str);
        if (!state2.md.validateLink(href)) {
          return false;
        }
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
          } else if (isSpace(ch)) ;
          else {
            break;
          }
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
          const ch = str.charCodeAt(pos);
          if (!isSpace(ch)) {
            break;
          }
          pos++;
        }
        if (pos < max && str.charCodeAt(pos) !== 10) {
          if (title) {
            title = "";
            pos = destEndPos;
            nextLine = destEndLineNo;
            while (pos < max) {
              const ch = str.charCodeAt(pos);
              if (!isSpace(ch)) {
                break;
              }
              pos++;
            }
          }
        }
        if (pos < max && str.charCodeAt(pos) !== 10) {
          return false;
        }
        const label = normalizeReference(str.slice(1, labelEnd));
        if (!label) {
          return false;
        }
        if (silent) {
          return true;
        }
        if (typeof state2.env.references === "undefined") {
          state2.env.references = {};
        }
        if (typeof state2.env.references[label] === "undefined") {
          state2.env.references[label] = {
            title,
            href
          };
        }
        state2.line = nextLine;
        return true;
      }
      var block_names = ["address", "article", "aside", "base", "basefont", "blockquote", "body", "caption", "center", "col", "colgroup", "dd", "details", "dialog", "dir", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "iframe", "legend", "li", "link", "main", "menu", "menuitem", "nav", "noframes", "ol", "optgroup", "option", "p", "param", "search", "section", "summary", "table", "tbody", "td", "tfoot", "th", "thead", "title", "tr", "track", "ul"];
      var attr_name = "[a-zA-Z_:][a-zA-Z0-9:._-]*";
      var unquoted = "[^\"'=<>`\\x00-\\x20]+";
      var single_quoted = "'[^']*'";
      var double_quoted = '"[^"]*"';
      var attr_value = "(?:" + unquoted + "|" + single_quoted + "|" + double_quoted + ")";
      var attribute = "(?:\\s+" + attr_name + "(?:\\s*=\\s*" + attr_value + ")?)";
      var open_tag = "<[A-Za-z][A-Za-z0-9\\-]*" + attribute + "*\\s*\\/?>";
      var close_tag = "<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>";
      var comment = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->";
      var processing = "<[?][\\s\\S]*?[?]>";
      var declaration = "<![A-Za-z][^>]*>";
      var cdata = "<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";
      var HTML_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + "|" + comment + "|" + processing + "|" + declaration + "|" + cdata + ")");
      var HTML_OPEN_CLOSE_TAG_RE = new RegExp("^(?:" + open_tag + "|" + close_tag + ")");
      var HTML_SEQUENCES = [[/^<(script|pre|style|textarea)(?=(\s|>|$))/i, /<\/(script|pre|style|textarea)>/i, true], [/^<!--/, /-->/, true], [/^<\?/, /\?>/, true], [/^<![A-Z]/, />/, true], [/^<!\[CDATA\[/, /\]\]>/, true], [new RegExp("^</?(" + block_names.join("|") + ")(?=(\\s|/?>|$))", "i"), /^$/, true], [new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + "\\s*$"), /^$/, false]];
      function html_block(state2, startLine, endLine, silent) {
        let pos = state2.bMarks[startLine] + state2.tShift[startLine];
        let max = state2.eMarks[startLine];
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        if (!state2.md.options.html) {
          return false;
        }
        if (state2.src.charCodeAt(pos) !== 60) {
          return false;
        }
        let lineText = state2.src.slice(pos, max);
        let i = 0;
        for (; i < HTML_SEQUENCES.length; i++) {
          if (HTML_SEQUENCES[i][0].test(lineText)) {
            break;
          }
        }
        if (i === HTML_SEQUENCES.length) {
          return false;
        }
        if (silent) {
          return HTML_SEQUENCES[i][2];
        }
        let nextLine = startLine + 1;
        if (!HTML_SEQUENCES[i][1].test(lineText)) {
          for (; nextLine < endLine; nextLine++) {
            if (state2.sCount[nextLine] < state2.blkIndent) {
              break;
            }
            pos = state2.bMarks[nextLine] + state2.tShift[nextLine];
            max = state2.eMarks[nextLine];
            lineText = state2.src.slice(pos, max);
            if (HTML_SEQUENCES[i][1].test(lineText)) {
              if (lineText.length !== 0) {
                nextLine++;
              }
              break;
            }
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
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        let ch = state2.src.charCodeAt(pos);
        if (ch !== 35 || pos >= max) {
          return false;
        }
        let level = 1;
        ch = state2.src.charCodeAt(++pos);
        while (ch === 35 && pos < max && level <= 6) {
          level++;
          ch = state2.src.charCodeAt(++pos);
        }
        if (level > 6 || pos < max && !isSpace(ch)) {
          return false;
        }
        if (silent) {
          return true;
        }
        max = state2.skipSpacesBack(max, pos);
        const tmp = state2.skipCharsBack(max, 35, pos);
        if (tmp > pos && isSpace(state2.src.charCodeAt(tmp - 1))) {
          max = tmp;
        }
        state2.line = startLine + 1;
        const token_o = state2.push("heading_open", "h" + String(level), 1);
        token_o.markup = "########".slice(0, level);
        token_o.map = [startLine, state2.line];
        const token_i = state2.push("inline", "", 0);
        token_i.content = state2.src.slice(pos, max).trim();
        token_i.map = [startLine, state2.line];
        token_i.children = [];
        const token_c = state2.push("heading_close", "h" + String(level), -1);
        token_c.markup = "########".slice(0, level);
        return true;
      }
      function lheading(state2, startLine, endLine) {
        const terminatorRules = state2.md.block.ruler.getRules("paragraph");
        if (state2.sCount[startLine] - state2.blkIndent >= 4) {
          return false;
        }
        const oldParentType = state2.parentType;
        state2.parentType = "paragraph";
        let level = 0;
        let marker;
        let nextLine = startLine + 1;
        for (; nextLine < endLine && !state2.isEmpty(nextLine); nextLine++) {
          if (state2.sCount[nextLine] - state2.blkIndent > 3) {
            continue;
          }
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
          if (state2.sCount[nextLine] < 0) {
            continue;
          }
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state2, nextLine, endLine, true)) {
              terminate = true;
              break;
            }
          }
          if (terminate) {
            break;
          }
        }
        if (!level) {
          return false;
        }
        const content = state2.getLines(startLine, nextLine, state2.blkIndent, false).trim();
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
          if (state2.sCount[nextLine] - state2.blkIndent > 3) {
            continue;
          }
          if (state2.sCount[nextLine] < 0) {
            continue;
          }
          let terminate = false;
          for (let i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state2, nextLine, endLine, true)) {
              terminate = true;
              break;
            }
          }
          if (terminate) {
            break;
          }
        }
        const content = state2.getLines(startLine, nextLine, state2.blkIndent, false).trim();
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
        // First 2 params - rule name & source. Secondary array - list of rules,
        // which can be terminated by this one.
        ["table", table, ["paragraph", "reference"]],
        ["code", code],
        ["fence", fence, ["paragraph", "reference", "blockquote", "list"]],
        ["blockquote", blockquote, ["paragraph", "reference", "blockquote", "list"]],
        ["hr", hr, ["paragraph", "reference", "blockquote", "list"]],
        ["list", list2, ["paragraph", "reference", "blockquote"]],
        ["reference", reference],
        ["html_block", html_block, ["paragraph", "reference", "blockquote"]],
        ["heading", heading, ["paragraph", "reference", "blockquote"]],
        ["lheading", lheading],
        ["paragraph", paragraph]
      ];
      function ParserBlock() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules$1.length; i++) {
          this.ruler.push(_rules$1[i][0], _rules$1[i][1], {
            alt: (_rules$1[i][2] || []).slice()
          });
        }
      }
      ParserBlock.prototype.tokenize = function(state2, startLine, endLine) {
        const rules = this.ruler.getRules("");
        const len = rules.length;
        const maxNesting = state2.md.options.maxNesting;
        let line = startLine;
        let hasEmptyLines = false;
        while (line < endLine) {
          state2.line = line = state2.skipEmptyLines(line);
          if (line >= endLine) {
            break;
          }
          if (state2.sCount[line] < state2.blkIndent) {
            break;
          }
          if (state2.level >= maxNesting) {
            state2.line = endLine;
            break;
          }
          const prevLine = state2.line;
          let ok = false;
          for (let i = 0; i < len; i++) {
            ok = rules[i](state2, line, endLine, false);
            if (ok) {
              if (prevLine >= state2.line) {
                throw new Error("block rule didn't increment state.line");
              }
              break;
            }
          }
          if (!ok) throw new Error("none of the block rules matched");
          state2.tight = !hasEmptyLines;
          if (state2.isEmpty(state2.line - 1)) {
            hasEmptyLines = true;
          }
          line = state2.line;
          if (line < endLine && state2.isEmpty(line)) {
            hasEmptyLines = true;
            line++;
            state2.line = line;
          }
        }
      };
      ParserBlock.prototype.parse = function(src, md2, env, outTokens) {
        if (!src) {
          return;
        }
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
        if (this.pending) {
          this.pushPending();
        }
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
          token_meta = {
            delimiters: this.delimiters
          };
        }
        this.pendingLevel = this.level;
        this.tokens.push(token);
        this.tokens_meta.push(token_meta);
        return token;
      };
      StateInline.prototype.scanDelims = function(start, canSplitWord) {
        const max = this.posMax;
        const marker = this.src.charCodeAt(start);
        const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 32;
        let pos = start;
        while (pos < max && this.src.charCodeAt(pos) === marker) {
          pos++;
        }
        const count = pos - start;
        const nextChar = pos < max ? this.src.charCodeAt(pos) : 32;
        const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
        const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));
        const isLastWhiteSpace = isWhiteSpace(lastChar);
        const isNextWhiteSpace = isWhiteSpace(nextChar);
        const left_flanking = !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar);
        const right_flanking = !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar);
        const can_open = left_flanking && (canSplitWord || !right_flanking || isLastPunctChar);
        const can_close = right_flanking && (canSplitWord || !left_flanking || isNextPunctChar);
        return {
          can_open,
          can_close,
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
        while (pos < state2.posMax && !isTerminatorChar(state2.src.charCodeAt(pos))) {
          pos++;
        }
        if (pos === state2.pos) {
          return false;
        }
        if (!silent) {
          state2.pending += state2.src.slice(state2.pos, pos);
        }
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
        while (urlEnd > 0 && url.charCodeAt(urlEnd - 1) === 42) {
          urlEnd--;
        }
        if (urlEnd !== url.length) {
          url = url.slice(0, urlEnd);
        }
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
        if (state2.src.charCodeAt(pos) !== 10) {
          return false;
        }
        const pmax = state2.pending.length - 1;
        const max = state2.posMax;
        if (!silent) {
          if (pmax >= 0 && state2.pending.charCodeAt(pmax) === 32) {
            if (pmax >= 1 && state2.pending.charCodeAt(pmax - 1) === 32) {
              let ws = pmax - 1;
              while (ws >= 1 && state2.pending.charCodeAt(ws - 1) === 32) ws--;
              state2.pending = state2.pending.slice(0, ws);
              state2.push("hardbreak", "br", 0);
            } else {
              state2.pending = state2.pending.slice(0, -1);
              state2.push("softbreak", "br", 0);
            }
          } else {
            state2.push("softbreak", "br", 0);
          }
        }
        pos++;
        while (pos < max && isSpace(state2.src.charCodeAt(pos))) {
          pos++;
        }
        state2.pos = pos;
        return true;
      }
      var ESCAPED = [];
      for (let i = 0; i < 256; i++) {
        ESCAPED.push(0);
      }
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
          if (!silent) {
            state2.push("hardbreak", "br", 0);
          }
          pos++;
          while (pos < max) {
            ch1 = state2.src.charCodeAt(pos);
            if (!isSpace(ch1)) break;
            pos++;
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
          if (ch1 < 256 && ESCAPED[ch1] !== 0) {
            token.content = escapedStr;
          } else {
            token.content = origStr;
          }
          token.markup = origStr;
          token.info = "escape";
        }
        state2.pos = pos + 1;
        return true;
      }
      function backtick(state2, silent) {
        let pos = state2.pos;
        const ch = state2.src.charCodeAt(pos);
        if (ch !== 96) {
          return false;
        }
        const start = pos;
        pos++;
        const max = state2.posMax;
        while (pos < max && state2.src.charCodeAt(pos) === 96) {
          pos++;
        }
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
          while (matchEnd < max && state2.src.charCodeAt(matchEnd) === 96) {
            matchEnd++;
          }
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
        if (silent) {
          return false;
        }
        if (marker !== 126) {
          return false;
        }
        const scanned = state2.scanDelims(state2.pos, true);
        let len = scanned.length;
        const ch = String.fromCharCode(marker);
        if (len < 2) {
          return false;
        }
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
            // disable "rule of 3" length checks meant for emphasis
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
          if (startDelim.marker !== 126) {
            continue;
          }
          if (startDelim.end === -1) {
            continue;
          }
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
          if (state2.tokens[endDelim.token - 1].type === "text" && state2.tokens[endDelim.token - 1].content === "~") {
            loneMarkers.push(endDelim.token - 1);
          }
        }
        while (loneMarkers.length) {
          const i = loneMarkers.pop();
          let j = i + 1;
          while (j < state2.tokens.length && state2.tokens[j].type === "s_close") {
            j++;
          }
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
        for (let curr = 0; curr < max; curr++) {
          if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
            postProcess$1(state2, tokens_meta[curr].delimiters);
          }
        }
      }
      var r_strikethrough = {
        tokenize: strikethrough_tokenize,
        postProcess: strikethrough_postProcess
      };
      function emphasis_tokenize(state2, silent) {
        const start = state2.pos;
        const marker = state2.src.charCodeAt(start);
        if (silent) {
          return false;
        }
        if (marker !== 95 && marker !== 42) {
          return false;
        }
        const scanned = state2.scanDelims(state2.pos, marker === 42);
        for (let i = 0; i < scanned.length; i++) {
          const token = state2.push("text", "", 0);
          token.content = String.fromCharCode(marker);
          state2.delimiters.push({
            // Char code of the starting marker (number).
            //
            marker,
            // Total length of these series of delimiters.
            //
            length: scanned.length,
            // A position of the token this delimiter corresponds to.
            //
            token: state2.tokens.length - 1,
            // If this delimiter is matched as a valid opener, `end` will be
            // equal to its position, otherwise it's `-1`.
            //
            end: -1,
            // Boolean flags that determine if this delimiter could open or close
            // an emphasis.
            //
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
          if (startDelim.marker !== 95 && startDelim.marker !== 42) {
            continue;
          }
          if (startDelim.end === -1) {
            continue;
          }
          const endDelim = delimiters[startDelim.end];
          const isStrong = i > 0 && delimiters[i - 1].end === startDelim.end + 1 && // check that first two markers match and adjacent
          delimiters[i - 1].marker === startDelim.marker && delimiters[i - 1].token === startDelim.token - 1 && // check that last two markers are adjacent (we can safely assume they match)
          delimiters[startDelim.end + 1].token === endDelim.token + 1;
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
        for (let curr = 0; curr < max; curr++) {
          if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
            postProcess(state2, tokens_meta[curr].delimiters);
          }
        }
      }
      var r_emphasis = {
        tokenize: emphasis_tokenize,
        postProcess: emphasis_post_process
      };
      function link(state2, silent) {
        let code2, label, res, ref;
        let href = "";
        let title = "";
        let start = state2.pos;
        let parseReference = true;
        if (state2.src.charCodeAt(state2.pos) !== 91) {
          return false;
        }
        const oldPos = state2.pos;
        const max = state2.posMax;
        const labelStart = state2.pos + 1;
        const labelEnd = state2.md.helpers.parseLinkLabel(state2, state2.pos, true);
        if (labelEnd < 0) {
          return false;
        }
        let pos = labelEnd + 1;
        if (pos < max && state2.src.charCodeAt(pos) === 40) {
          parseReference = false;
          pos++;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) {
              break;
            }
          }
          if (pos >= max) {
            return false;
          }
          start = pos;
          res = state2.md.helpers.parseLinkDestination(state2.src, pos, state2.posMax);
          if (res.ok) {
            href = state2.md.normalizeLink(res.str);
            if (state2.md.validateLink(href)) {
              pos = res.pos;
            } else {
              href = "";
            }
            start = pos;
            for (; pos < max; pos++) {
              code2 = state2.src.charCodeAt(pos);
              if (!isSpace(code2) && code2 !== 10) {
                break;
              }
            }
            res = state2.md.helpers.parseLinkTitle(state2.src, pos, state2.posMax);
            if (pos < max && start !== pos && res.ok) {
              title = res.str;
              pos = res.pos;
              for (; pos < max; pos++) {
                code2 = state2.src.charCodeAt(pos);
                if (!isSpace(code2) && code2 !== 10) {
                  break;
                }
              }
            }
          }
          if (pos >= max || state2.src.charCodeAt(pos) !== 41) {
            parseReference = true;
          }
          pos++;
        }
        if (parseReference) {
          if (typeof state2.env.references === "undefined") {
            return false;
          }
          if (pos < max && state2.src.charCodeAt(pos) === 91) {
            start = pos + 1;
            pos = state2.md.helpers.parseLinkLabel(state2, pos);
            if (pos >= 0) {
              label = state2.src.slice(start, pos++);
            } else {
              pos = labelEnd + 1;
            }
          } else {
            pos = labelEnd + 1;
          }
          if (!label) {
            label = state2.src.slice(labelStart, labelEnd);
          }
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
          if (title) {
            attrs.push(["title", title]);
          }
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
        if (state2.src.charCodeAt(state2.pos) !== 33) {
          return false;
        }
        if (state2.src.charCodeAt(state2.pos + 1) !== 91) {
          return false;
        }
        const labelStart = state2.pos + 2;
        const labelEnd = state2.md.helpers.parseLinkLabel(state2, state2.pos + 1, false);
        if (labelEnd < 0) {
          return false;
        }
        pos = labelEnd + 1;
        if (pos < max && state2.src.charCodeAt(pos) === 40) {
          pos++;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) {
              break;
            }
          }
          if (pos >= max) {
            return false;
          }
          start = pos;
          res = state2.md.helpers.parseLinkDestination(state2.src, pos, state2.posMax);
          if (res.ok) {
            href = state2.md.normalizeLink(res.str);
            if (state2.md.validateLink(href)) {
              pos = res.pos;
            } else {
              href = "";
            }
          }
          start = pos;
          for (; pos < max; pos++) {
            code2 = state2.src.charCodeAt(pos);
            if (!isSpace(code2) && code2 !== 10) {
              break;
            }
          }
          res = state2.md.helpers.parseLinkTitle(state2.src, pos, state2.posMax);
          if (pos < max && start !== pos && res.ok) {
            title = res.str;
            pos = res.pos;
            for (; pos < max; pos++) {
              code2 = state2.src.charCodeAt(pos);
              if (!isSpace(code2) && code2 !== 10) {
                break;
              }
            }
          } else {
            title = "";
          }
          if (pos >= max || state2.src.charCodeAt(pos) !== 41) {
            state2.pos = oldPos;
            return false;
          }
          pos++;
        } else {
          if (typeof state2.env.references === "undefined") {
            return false;
          }
          if (pos < max && state2.src.charCodeAt(pos) === 91) {
            start = pos + 1;
            pos = state2.md.helpers.parseLinkLabel(state2, pos);
            if (pos >= 0) {
              label = state2.src.slice(start, pos++);
            } else {
              pos = labelEnd + 1;
            }
          } else {
            pos = labelEnd + 1;
          }
          if (!label) {
            label = state2.src.slice(labelStart, labelEnd);
          }
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
          if (title) {
            attrs.push(["title", title]);
          }
        }
        state2.pos = pos;
        state2.posMax = max;
        return true;
      }
      var EMAIL_RE = /^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
      var AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;
      function autolink(state2, silent) {
        let pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 60) {
          return false;
        }
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
          if (!state2.md.validateLink(fullUrl)) {
            return false;
          }
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
          if (!state2.md.validateLink(fullUrl)) {
            return false;
          }
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
        if (!state2.md.options.html) {
          return false;
        }
        const max = state2.posMax;
        const pos = state2.pos;
        if (state2.src.charCodeAt(pos) !== 60 || pos + 2 >= max) {
          return false;
        }
        const ch = state2.src.charCodeAt(pos + 1);
        if (ch !== 33 && ch !== 63 && ch !== 47 && !isLetter(ch)) {
          return false;
        }
        const match = state2.src.slice(pos).match(HTML_TAG_RE);
        if (!match) {
          return false;
        }
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
        const ch = state2.src.charCodeAt(pos + 1);
        if (ch === 35) {
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
            const decoded = entities.decodeHTML(match[0]);
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
          if (delimiters[headerIdx].marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
            headerIdx = closerIdx;
          }
          lastTokenIdx = closer.token;
          closer.length = closer.length || 0;
          if (!closer.close) continue;
          if (!openersBottom.hasOwnProperty(closer.marker)) {
            openersBottom[closer.marker] = [-1, -1, -1, -1, -1, -1];
          }
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
                  if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
                    isOddMatch = true;
                  }
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
          if (newMinOpenerIdx !== -1) {
            openersBottom[closer.marker][(closer.open ? 3 : 0) + (closer.length || 0) % 3] = newMinOpenerIdx;
          }
        }
      }
      function link_pairs(state2) {
        const tokens_meta = state2.tokens_meta;
        const max = state2.tokens_meta.length;
        processDelimiters(state2.delimiters);
        for (let curr = 0; curr < max; curr++) {
          if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
            processDelimiters(tokens_meta[curr].delimiters);
          }
        }
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
          if (tokens[curr].type === "text" && curr + 1 < max && tokens[curr + 1].type === "text") {
            tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
          } else {
            if (curr !== last) {
              tokens[last] = tokens[curr];
            }
            last++;
          }
        }
        if (curr !== last) {
          tokens.length = last;
        }
      }
      var _rules = [["text", text], ["linkify", linkify], ["newline", newline], ["escape", escape], ["backticks", backtick], ["strikethrough", r_strikethrough.tokenize], ["emphasis", r_emphasis.tokenize], ["link", link], ["image", image], ["autolink", autolink], ["html_inline", html_inline], ["entity", entity]];
      var _rules2 = [
        ["balance_pairs", link_pairs],
        ["strikethrough", r_strikethrough.postProcess],
        ["emphasis", r_emphasis.postProcess],
        // rules for pairs separate '**' into its own text tokens, which may be left unused,
        // rule below merges unused segments back with the rest of the text
        ["fragments_join", fragments_join]
      ];
      function ParserInline() {
        this.ruler = new Ruler();
        for (let i = 0; i < _rules.length; i++) {
          this.ruler.push(_rules[i][0], _rules[i][1]);
        }
        this.ruler2 = new Ruler();
        for (let i = 0; i < _rules2.length; i++) {
          this.ruler2.push(_rules2[i][0], _rules2[i][1]);
        }
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
        if (state2.level < maxNesting) {
          for (let i = 0; i < len; i++) {
            state2.level++;
            ok = rules[i](state2, true);
            state2.level--;
            if (ok) {
              if (pos >= state2.pos) {
                throw new Error("inline rule didn't increment state.pos");
              }
              break;
            }
          }
        } else {
          state2.pos = state2.posMax;
        }
        if (!ok) {
          state2.pos++;
        }
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
          if (state2.level < maxNesting) {
            for (let i = 0; i < len; i++) {
              ok = rules[i](state2, false);
              if (ok) {
                if (prevPos >= state2.pos) {
                  throw new Error("inline rule didn't increment state.pos");
                }
                break;
              }
            }
          }
          if (ok) {
            if (state2.pos >= end) {
              break;
            }
            continue;
          }
          state2.pending += state2.src[state2.pos++];
        }
        if (state2.pending) {
          state2.pushPending();
        }
      };
      ParserInline.prototype.parse = function(str, md2, env, outTokens) {
        const state2 = new this.State(str, md2, env, outTokens);
        this.tokenize(state2);
        const rules = this.ruler2.getRules("");
        const len = rules.length;
        for (let i = 0; i < len; i++) {
          rules[i](state2);
        }
      };
      ParserInline.prototype.State = StateInline;
      var cfg_default = {
        options: {
          // Enable HTML tags in source
          html: false,
          // Use '/' to close single tags (<br />)
          xhtmlOut: false,
          // Convert '\n' in paragraphs into <br>
          breaks: false,
          // CSS language prefix for fenced blocks
          langPrefix: "language-",
          // autoconvert URL-like texts to links
          linkify: false,
          // Enable some language-neutral replacements + quotes beautification
          typographer: false,
          // Double + single quotes replacement pairs, when typographer enabled,
          // and smartquotes on. Could be either a String or an Array.
          //
          // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
          // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
          quotes: "\u201C\u201D\u2018\u2019",
          /* “”‘’ */
          // Highlighter function. Should return escaped HTML,
          // or '' if the source string is not changed and should be escaped externaly.
          // If result starts with <pre... internal wrapper is skipped.
          //
          // function (/*str, lang*/) { return ''; }
          //
          highlight: null,
          // Internal protection, recursion limit
          maxNesting: 100
        },
        components: {
          core: {},
          block: {},
          inline: {}
        }
      };
      var cfg_zero = {
        options: {
          // Enable HTML tags in source
          html: false,
          // Use '/' to close single tags (<br />)
          xhtmlOut: false,
          // Convert '\n' in paragraphs into <br>
          breaks: false,
          // CSS language prefix for fenced blocks
          langPrefix: "language-",
          // autoconvert URL-like texts to links
          linkify: false,
          // Enable some language-neutral replacements + quotes beautification
          typographer: false,
          // Double + single quotes replacement pairs, when typographer enabled,
          // and smartquotes on. Could be either a String or an Array.
          //
          // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
          // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
          quotes: "\u201C\u201D\u2018\u2019",
          /* “”‘’ */
          // Highlighter function. Should return escaped HTML,
          // or '' if the source string is not changed and should be escaped externaly.
          // If result starts with <pre... internal wrapper is skipped.
          //
          // function (/*str, lang*/) { return ''; }
          //
          highlight: null,
          // Internal protection, recursion limit
          maxNesting: 20
        },
        components: {
          core: {
            rules: ["normalize", "block", "inline", "text_join"]
          },
          block: {
            rules: ["paragraph"]
          },
          inline: {
            rules: ["text"],
            rules2: ["balance_pairs", "fragments_join"]
          }
        }
      };
      var cfg_commonmark = {
        options: {
          // Enable HTML tags in source
          html: true,
          // Use '/' to close single tags (<br />)
          xhtmlOut: true,
          // Convert '\n' in paragraphs into <br>
          breaks: false,
          // CSS language prefix for fenced blocks
          langPrefix: "language-",
          // autoconvert URL-like texts to links
          linkify: false,
          // Enable some language-neutral replacements + quotes beautification
          typographer: false,
          // Double + single quotes replacement pairs, when typographer enabled,
          // and smartquotes on. Could be either a String or an Array.
          //
          // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
          // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
          quotes: "\u201C\u201D\u2018\u2019",
          /* “”‘’ */
          // Highlighter function. Should return escaped HTML,
          // or '' if the source string is not changed and should be escaped externaly.
          // If result starts with <pre... internal wrapper is skipped.
          //
          // function (/*str, lang*/) { return ''; }
          //
          highlight: null,
          // Internal protection, recursion limit
          maxNesting: 20
        },
        components: {
          core: {
            rules: ["normalize", "block", "inline", "text_join"]
          },
          block: {
            rules: ["blockquote", "code", "fence", "heading", "hr", "html_block", "lheading", "list", "reference", "paragraph"]
          },
          inline: {
            rules: ["autolink", "backticks", "emphasis", "entity", "escape", "html_inline", "image", "link", "newline", "text"],
            rules2: ["balance_pairs", "emphasis", "fragments_join"]
          }
        }
      };
      var config = {
        default: cfg_default,
        zero: cfg_zero,
        commonmark: cfg_commonmark
      };
      var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
      var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;
      function validateLink(url) {
        const str = url.trim().toLowerCase();
        return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
      }
      var RECODE_HOSTNAME_FOR = ["http:", "https:", "mailto:"];
      function normalizeLink(url) {
        const parsed = mdurl__namespace.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
            try {
              parsed.hostname = punycode.toASCII(parsed.hostname);
            } catch (er) {
            }
          }
        }
        return mdurl__namespace.encode(mdurl__namespace.format(parsed));
      }
      function normalizeLinkText(url) {
        const parsed = mdurl__namespace.parse(url, true);
        if (parsed.hostname) {
          if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
            try {
              parsed.hostname = punycode.toUnicode(parsed.hostname);
            } catch (er) {
            }
          }
        }
        return mdurl__namespace.decode(mdurl__namespace.format(parsed), mdurl__namespace.decode.defaultChars + "%");
      }
      function MarkdownIt2(presetName, options) {
        if (!(this instanceof MarkdownIt2)) {
          return new MarkdownIt2(presetName, options);
        }
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
        this.linkify = new LinkifyIt();
        this.validateLink = validateLink;
        this.normalizeLink = normalizeLink;
        this.normalizeLinkText = normalizeLinkText;
        this.utils = utils;
        this.helpers = assign({}, helpers);
        this.options = {};
        this.configure(presetName);
        if (options) {
          this.set(options);
        }
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
          if (!presets) {
            throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name');
          }
        }
        if (!presets) {
          throw new Error("Wrong `markdown-it` preset, can't be empty");
        }
        if (presets.options) {
          self.set(presets.options);
        }
        if (presets.components) {
          Object.keys(presets.components).forEach(function(name) {
            if (presets.components[name].rules) {
              self[name].ruler.enableOnly(presets.components[name].rules);
            }
            if (presets.components[name].rules2) {
              self[name].ruler2.enableOnly(presets.components[name].rules2);
            }
          });
        }
        return this;
      };
      MarkdownIt2.prototype.enable = function(list3, ignoreInvalid) {
        let result = [];
        if (!Array.isArray(list3)) {
          list3 = [list3];
        }
        ["core", "block", "inline"].forEach(function(chain) {
          result = result.concat(this[chain].ruler.enable(list3, true));
        }, this);
        result = result.concat(this.inline.ruler2.enable(list3, true));
        const missed = list3.filter(function(name) {
          return result.indexOf(name) < 0;
        });
        if (missed.length && !ignoreInvalid) {
          throw new Error("MarkdownIt. Failed to enable unknown rule(s): " + missed);
        }
        return this;
      };
      MarkdownIt2.prototype.disable = function(list3, ignoreInvalid) {
        let result = [];
        if (!Array.isArray(list3)) {
          list3 = [list3];
        }
        ["core", "block", "inline"].forEach(function(chain) {
          result = result.concat(this[chain].ruler.disable(list3, true));
        }, this);
        result = result.concat(this.inline.ruler2.disable(list3, true));
        const missed = list3.filter(function(name) {
          return result.indexOf(name) < 0;
        });
        if (missed.length && !ignoreInvalid) {
          throw new Error("MarkdownIt. Failed to disable unknown rule(s): " + missed);
        }
        return this;
      };
      MarkdownIt2.prototype.use = function(plugin) {
        const args = [this].concat(Array.prototype.slice.call(arguments, 1));
        plugin.apply(plugin, args);
        return this;
      };
      MarkdownIt2.prototype.parse = function(src, env) {
        if (typeof src !== "string") {
          throw new Error("Input data should be a String");
        }
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

  // vibex-extension/webview/main.js
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
    connectionError: null
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
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function codicon(name) {
    return el("span", `codicon codicon-${name}`);
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
  var textarea = document.createElement("textarea");
  textarea.className = "vibex-input";
  textarea.rows = 1;
  editorHost.append(textarea);
  editorContainer.append(editorHost);
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
  textarea.addEventListener("input", autoGrow);
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit();
    }
  });
  function autoGrow() {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
  }
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
  function syncSendEnabled() {
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
    const host = el("div", "chat-welcome-view");
    const iconHost = el("div", "chat-welcome-view-icon");
    iconHost.append(codicon("sparkle"));
    const titleHost = el("div", "chat-welcome-view-title", "VIBEX");
    const message = el("div", "chat-welcome-view-message");
    message.append(renderMarkdown("iPad\uC640 VS Code\uAC00 \uAC19\uC740 \uB300\uD654\uB97C \uACF5\uC720\uD569\uB2C8\uB2E4. \uBAA8\uB378 \uC120\uD0DD\uAE30\uB85C Codex\uC640 Claude Code\uB97C turn\uB9C8\uB2E4 \uBC14\uAFD4 \uC4F8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
    host.append(iconHost, titleHost, message);
    return host;
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
    textarea.value = "";
    autoGrow();
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
        textarea.placeholder = "VIBEX\uC5D0 \uC694\uCCAD\uD558\uC138\uC694. `@\uACBD\uB85C`\uB85C \uD504\uB85C\uC81D\uD2B8 \uD30C\uC77C\uC744 \uCC38\uC870\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
        renderPickers();
        renderTranscript();
        break;
      }
      case "insertMention": {
        const mention = `@${message.relativePath} `;
        const at = textarea.selectionStart ?? textarea.value.length;
        textarea.value = textarea.value.slice(0, at) + mention + textarea.value.slice(at);
        textarea.focus();
        autoGrow();
        break;
      }
      case "taskUpdate": {
        const index = state.tasks.findIndex((task) => task.taskId === message.task.taskId);
        if (index >= 0) state.tasks[index] = message.task;
        else state.tasks.push(message.task);
        state.busy = ACTIVE_STATUSES.has(message.task.status);
        renderTranscript();
        break;
      }
    }
  });
  post({ type: "ready" });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL21kdXJsL2J1aWxkL2luZGV4LmNqcy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvdWMubWljcm8vYnVpbGQvaW5kZXguY2pzLmpzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2dlbmVyYXRlZC9kZWNvZGUtZGF0YS1odG1sLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2dlbmVyYXRlZC9kZWNvZGUtZGF0YS14bWwudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZGVjb2RlX2NvZGVwb2ludC50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9kZWNvZGUudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvZ2VuZXJhdGVkL2VuY29kZS1odG1sLnRzIiwgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9mYjU1L2VudGl0aWVzLzYxYWZkNDcwMWVhYTczNjk3OGIxM2M3MzUxY2QzZGU5YTk2YjA0YmMvc3JjL2VzY2FwZS50cyIsICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZmI1NS9lbnRpdGllcy82MWFmZDQ3MDFlYWE3MzY5NzhiMTNjNzM1MWNkM2RlOWE5NmIwNGJjL3NyYy9lbmNvZGUudHMiLCAiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2ZiNTUvZW50aXRpZXMvNjFhZmQ0NzAxZWFhNzM2OTc4YjEzYzczNTFjZDNkZTlhOTZiMDRiYy9zcmMvaW5kZXgudHMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2xpbmtpZnktaXQvYnVpbGQvaW5kZXguY2pzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9wdW55Y29kZS5qcy9wdW55Y29kZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvbWFya2Rvd24taXQvZGlzdC9pbmRleC5janMuanMiLCAiLi4vd2Vidmlldy9tYWluLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWJpdHdpc2UgKi9cblxuY29uc3QgZGVjb2RlQ2FjaGUgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RGVjb2RlQ2FjaGUgKGV4Y2x1ZGUpIHtcbiAgbGV0IGNhY2hlID0gZGVjb2RlQ2FjaGVbZXhjbHVkZV07XG4gIGlmIChjYWNoZSkgeyByZXR1cm4gY2FjaGUgfVxuXG4gIGNhY2hlID0gZGVjb2RlQ2FjaGVbZXhjbHVkZV0gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEyODsgaSsrKSB7XG4gICAgY29uc3QgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpO1xuICAgIGNhY2hlLnB1c2goY2gpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBleGNsdWRlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2ggPSBleGNsdWRlLmNoYXJDb2RlQXQoaSk7XG4gICAgY2FjaGVbY2hdID0gJyUnICsgKCcwJyArIGNoLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpKS5zbGljZSgtMik7XG4gIH1cblxuICByZXR1cm4gY2FjaGVcbn1cblxuLy8gRGVjb2RlIHBlcmNlbnQtZW5jb2RlZCBzdHJpbmcuXG4vL1xuZnVuY3Rpb24gZGVjb2RlIChzdHJpbmcsIGV4Y2x1ZGUpIHtcbiAgaWYgKHR5cGVvZiBleGNsdWRlICE9PSAnc3RyaW5nJykge1xuICAgIGV4Y2x1ZGUgPSBkZWNvZGUuZGVmYXVsdENoYXJzO1xuICB9XG5cbiAgY29uc3QgY2FjaGUgPSBnZXREZWNvZGVDYWNoZShleGNsdWRlKTtcblxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyglW2EtZjAtOV17Mn0pKy9naSwgZnVuY3Rpb24gKHNlcSkge1xuICAgIGxldCByZXN1bHQgPSAnJztcblxuICAgIGZvciAobGV0IGkgPSAwLCBsID0gc2VxLmxlbmd0aDsgaSA8IGw7IGkgKz0gMykge1xuICAgICAgY29uc3QgYjEgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDEsIGkgKyAzKSwgMTYpO1xuXG4gICAgICBpZiAoYjEgPCAweDgwKSB7XG4gICAgICAgIHJlc3VsdCArPSBjYWNoZVtiMV07XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmICgoYjEgJiAweEUwKSA9PT0gMHhDMCAmJiAoaSArIDMgPCBsKSkge1xuICAgICAgICAvLyAxMTB4eHh4eCAxMHh4eHh4eFxuICAgICAgICBjb25zdCBiMiA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNCwgaSArIDYpLCAxNik7XG5cbiAgICAgICAgaWYgKChiMiAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgY29uc3QgY2hyID0gKChiMSA8PCA2KSAmIDB4N0MwKSB8IChiMiAmIDB4M0YpO1xuXG4gICAgICAgICAgaWYgKGNociA8IDB4ODApIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZFxcdWZmZmQnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaHIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGkgKz0gMztcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoYjEgJiAweEYwKSA9PT0gMHhFMCAmJiAoaSArIDYgPCBsKSkge1xuICAgICAgICAvLyAxMTEweHh4eCAxMHh4eHh4eCAxMHh4eHh4eFxuICAgICAgICBjb25zdCBiMiA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNCwgaSArIDYpLCAxNik7XG4gICAgICAgIGNvbnN0IGIzID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA3LCBpICsgOSksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODAgJiYgKGIzICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBjb25zdCBjaHIgPSAoKGIxIDw8IDEyKSAmIDB4RjAwMCkgfCAoKGIyIDw8IDYpICYgMHhGQzApIHwgKGIzICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHg4MDAgfHwgKGNociA+PSAweEQ4MDAgJiYgY2hyIDw9IDB4REZGRikpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZFxcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDY7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGIxICYgMHhGOCkgPT09IDB4RjAgJiYgKGkgKyA5IDwgbCkpIHtcbiAgICAgICAgLy8gMTExMTEweHggMTB4eHh4eHggMTB4eHh4eHggMTB4eHh4eHhcbiAgICAgICAgY29uc3QgYjIgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDQsIGkgKyA2KSwgMTYpO1xuICAgICAgICBjb25zdCBiMyA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNywgaSArIDkpLCAxNik7XG4gICAgICAgIGNvbnN0IGI0ID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyAxMCwgaSArIDEyKSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjMgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjQgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGxldCBjaHIgPSAoKGIxIDw8IDE4KSAmIDB4MUMwMDAwKSB8ICgoYjIgPDwgMTIpICYgMHgzRjAwMCkgfCAoKGIzIDw8IDYpICYgMHhGQzApIHwgKGI0ICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHgxMDAwMCB8fCBjaHIgPiAweDEwRkZGRikge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZFxcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2hyIC09IDB4MTAwMDA7XG4gICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgweEQ4MDAgKyAoY2hyID4+IDEwKSwgMHhEQzAwICsgKGNociAmIDB4M0ZGKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaSArPSA5O1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkJztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0pXG59XG5cbmRlY29kZS5kZWZhdWx0Q2hhcnMgPSAnOy8/OkAmPSskLCMnO1xuZGVjb2RlLmNvbXBvbmVudENoYXJzID0gJyc7XG5cbmNvbnN0IGVuY29kZUNhY2hlID0ge307XG5cbi8vIENyZWF0ZSBhIGxvb2t1cCBhcnJheSB3aGVyZSBhbnl0aGluZyBidXQgY2hhcmFjdGVycyBpbiBgY2hhcnNgIHN0cmluZ1xuLy8gYW5kIGFscGhhbnVtZXJpYyBjaGFycyBpcyBwZXJjZW50LWVuY29kZWQuXG4vL1xuZnVuY3Rpb24gZ2V0RW5jb2RlQ2FjaGUgKGV4Y2x1ZGUpIHtcbiAgbGV0IGNhY2hlID0gZW5jb2RlQ2FjaGVbZXhjbHVkZV07XG4gIGlmIChjYWNoZSkgeyByZXR1cm4gY2FjaGUgfVxuXG4gIGNhY2hlID0gZW5jb2RlQ2FjaGVbZXhjbHVkZV0gPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEyODsgaSsrKSB7XG4gICAgY29uc3QgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpO1xuXG4gICAgaWYgKC9eWzAtOWEtel0kL2kudGVzdChjaCkpIHtcbiAgICAgIC8vIGFsd2F5cyBhbGxvdyB1bmVuY29kZWQgYWxwaGFudW1lcmljIGNoYXJhY3RlcnNcbiAgICAgIGNhY2hlLnB1c2goY2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWNoZS5wdXNoKCclJyArICgnMCcgKyBpLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpKS5zbGljZSgtMikpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhjbHVkZS5sZW5ndGg7IGkrKykge1xuICAgIGNhY2hlW2V4Y2x1ZGUuY2hhckNvZGVBdChpKV0gPSBleGNsdWRlW2ldO1xuICB9XG5cbiAgcmV0dXJuIGNhY2hlXG59XG5cbi8vIEVuY29kZSB1bnNhZmUgY2hhcmFjdGVycyB3aXRoIHBlcmNlbnQtZW5jb2RpbmcsIHNraXBwaW5nIGFscmVhZHlcbi8vIGVuY29kZWQgc2VxdWVuY2VzLlxuLy9cbi8vICAtIHN0cmluZyAgICAgICAtIHN0cmluZyB0byBlbmNvZGVcbi8vICAtIGV4Y2x1ZGUgICAgICAtIGxpc3Qgb2YgY2hhcmFjdGVycyB0byBpZ25vcmUgKGluIGFkZGl0aW9uIHRvIGEtekEtWjAtOSlcbi8vICAtIGtlZXBFc2NhcGVkICAtIGRvbid0IGVuY29kZSAnJScgaW4gYSBjb3JyZWN0IGVzY2FwZSBzZXF1ZW5jZSAoZGVmYXVsdDogdHJ1ZSlcbi8vXG5mdW5jdGlvbiBlbmNvZGUgKHN0cmluZywgZXhjbHVkZSwga2VlcEVzY2FwZWQpIHtcbiAgaWYgKHR5cGVvZiBleGNsdWRlICE9PSAnc3RyaW5nJykge1xuICAgIC8vIGVuY29kZShzdHJpbmcsIGtlZXBFc2NhcGVkKVxuICAgIGtlZXBFc2NhcGVkID0gZXhjbHVkZTtcbiAgICBleGNsdWRlID0gZW5jb2RlLmRlZmF1bHRDaGFycztcbiAgfVxuXG4gIGlmICh0eXBlb2Yga2VlcEVzY2FwZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAga2VlcEVzY2FwZWQgPSB0cnVlO1xuICB9XG5cbiAgY29uc3QgY2FjaGUgPSBnZXRFbmNvZGVDYWNoZShleGNsdWRlKTtcbiAgbGV0IHJlc3VsdCA9ICcnO1xuXG4gIGZvciAobGV0IGkgPSAwLCBsID0gc3RyaW5nLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGNvZGUgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcblxuICAgIGlmIChrZWVwRXNjYXBlZCAmJiBjb2RlID09PSAweDI1IC8qICUgKi8gJiYgaSArIDIgPCBsKSB7XG4gICAgICBpZiAoL15bMC05YS1mXXsyfSQvaS50ZXN0KHN0cmluZy5zbGljZShpICsgMSwgaSArIDMpKSkge1xuICAgICAgICByZXN1bHQgKz0gc3RyaW5nLnNsaWNlKGksIGkgKyAzKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlIDwgMTI4KSB7XG4gICAgICByZXN1bHQgKz0gY2FjaGVbY29kZV07XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChjb2RlID49IDB4RDgwMCAmJiBjb2RlIDw9IDB4REZGRikge1xuICAgICAgaWYgKGNvZGUgPj0gMHhEODAwICYmIGNvZGUgPD0gMHhEQkZGICYmIGkgKyAxIDwgbCkge1xuICAgICAgICBjb25zdCBuZXh0Q29kZSA9IHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgaWYgKG5leHRDb2RlID49IDB4REMwMCAmJiBuZXh0Q29kZSA8PSAweERGRkYpIHtcbiAgICAgICAgICByZXN1bHQgKz0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ1tpXSArIHN0cmluZ1tpICsgMV0pO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQgKz0gJyVFRiVCRiVCRCc7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIHJlc3VsdCArPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5nW2ldKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuZW5jb2RlLmRlZmF1bHRDaGFycyA9IFwiOy8/OkAmPSskLC1fLiF+KicoKSNcIjtcbmVuY29kZS5jb21wb25lbnRDaGFycyA9IFwiLV8uIX4qJygpXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdCAodXJsKSB7XG4gIGxldCByZXN1bHQgPSAnJztcblxuICByZXN1bHQgKz0gdXJsLnByb3RvY29sIHx8ICcnO1xuICByZXN1bHQgKz0gdXJsLnNsYXNoZXMgPyAnLy8nIDogJyc7XG4gIHJlc3VsdCArPSB1cmwuYXV0aCA/IHVybC5hdXRoICsgJ0AnIDogJyc7XG5cbiAgaWYgKHVybC5ob3N0bmFtZSAmJiB1cmwuaG9zdG5hbWUuaW5kZXhPZignOicpICE9PSAtMSkge1xuICAgIC8vIGlwdjYgYWRkcmVzc1xuICAgIHJlc3VsdCArPSAnWycgKyB1cmwuaG9zdG5hbWUgKyAnXSc7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ICs9IHVybC5ob3N0bmFtZSB8fCAnJztcbiAgfVxuXG4gIHJlc3VsdCArPSB1cmwucG9ydCA/ICc6JyArIHVybC5wb3J0IDogJyc7XG4gIHJlc3VsdCArPSB1cmwucGF0aG5hbWUgfHwgJyc7XG4gIHJlc3VsdCArPSB1cmwuc2VhcmNoIHx8ICcnO1xuICByZXN1bHQgKz0gdXJsLmhhc2ggfHwgJyc7XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy9cbi8vIENoYW5nZXMgZnJvbSBqb3llbnQvbm9kZTpcbi8vXG4vLyAxLiBObyBsZWFkaW5nIHNsYXNoIGluIHBhdGhzLFxuLy8gICAgZS5nLiBpbiBgdXJsLnBhcnNlKCdodHRwOi8vZm9vP2JhcicpYCBwYXRobmFtZSBpcyBgYCwgbm90IGAvYFxuLy9cbi8vIDIuIEJhY2tzbGFzaGVzIGFyZSBub3QgcmVwbGFjZWQgd2l0aCBzbGFzaGVzLFxuLy8gICAgc28gYGh0dHA6XFxcXGV4YW1wbGUub3JnXFxgIGlzIHRyZWF0ZWQgbGlrZSBhIHJlbGF0aXZlIHBhdGhcbi8vXG4vLyAzLiBUcmFpbGluZyBjb2xvbiBpcyB0cmVhdGVkIGxpa2UgYSBwYXJ0IG9mIHRoZSBwYXRoLFxuLy8gICAgaS5lLiBpbiBgaHR0cDovL2V4YW1wbGUub3JnOmZvb2AgcGF0aG5hbWUgaXMgYDpmb29gXG4vL1xuLy8gNC4gTm90aGluZyBpcyBVUkwtZW5jb2RlZCBpbiB0aGUgcmVzdWx0aW5nIG9iamVjdCxcbi8vICAgIChpbiBqb3llbnQvbm9kZSBzb21lIGNoYXJzIGluIGF1dGggYW5kIHBhdGhzIGFyZSBlbmNvZGVkKVxuLy9cbi8vIDUuIGB1cmwucGFyc2UoKWAgZG9lcyBub3QgaGF2ZSBgcGFyc2VRdWVyeVN0cmluZ2AgYXJndW1lbnRcbi8vXG4vLyA2LiBSZW1vdmVkIGV4dHJhbmVvdXMgcmVzdWx0IHByb3BlcnRpZXM6IGBob3N0YCwgYHBhdGhgLCBgcXVlcnlgLCBldGMuLFxuLy8gICAgd2hpY2ggY2FuIGJlIGNvbnN0cnVjdGVkIHVzaW5nIG90aGVyIHBhcnRzIG9mIHRoZSB1cmwuXG4vL1xuXG5mdW5jdGlvbiBVcmwgKCkge1xuICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgdGhpcy5hdXRoID0gbnVsbDtcbiAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgdGhpcy5ob3N0bmFtZSA9IG51bGw7XG4gIHRoaXMuaGFzaCA9IG51bGw7XG4gIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgdGhpcy5wYXRobmFtZSA9IG51bGw7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG5jb25zdCBwcm90b2NvbFBhdHRlcm4gPSAvXihbYS16MC05ListXSs6KS9pO1xuY29uc3QgcG9ydFBhdHRlcm4gPSAvOlswLTldKiQvO1xuXG4vLyBTcGVjaWFsIGNhc2UgZm9yIGEgc2ltcGxlIHBhdGggVVJMXG4vKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cbmNvbnN0IHNpbXBsZVBhdGhQYXR0ZXJuID0gL14oXFwvXFwvPyg/IVxcLylbXlxcP1xcc10qKShcXD9bXlxcc10qKT8kLztcblxuLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbi8vIFdlIGFjdHVhbGx5IGp1c3QgYXV0by1lc2NhcGUgdGhlc2UuXG5jb25zdCBkZWxpbXMgPSBbJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnXTtcblxuLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgbm90IGFsbG93ZWQgZm9yIHZhcmlvdXMgcmVhc29ucy5cbmNvbnN0IHVud2lzZSA9IFsneycsICd9JywgJ3wnLCAnXFxcXCcsICdeJywgJ2AnXS5jb25jYXQoZGVsaW1zKTtcblxuLy8gQWxsb3dlZCBieSBSRkNzLCBidXQgY2F1c2Ugb2YgWFNTIGF0dGFja3MuICBBbHdheXMgZXNjYXBlIHRoZXNlLlxuY29uc3QgYXV0b0VzY2FwZSA9IFsnXFwnJ10uY29uY2F0KHVud2lzZSk7XG4vLyBDaGFyYWN0ZXJzIHRoYXQgYXJlIG5ldmVyIGV2ZXIgYWxsb3dlZCBpbiBhIGhvc3RuYW1lLlxuLy8gTm90ZSB0aGF0IGFueSBpbnZhbGlkIGNoYXJzIGFyZSBhbHNvIGhhbmRsZWQsIGJ1dCB0aGVzZVxuLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4vLyB0aGVtLlxuY29uc3Qgbm9uSG9zdENoYXJzID0gWyclJywgJy8nLCAnPycsICc7JywgJyMnXS5jb25jYXQoYXV0b0VzY2FwZSk7XG5jb25zdCBob3N0RW5kaW5nQ2hhcnMgPSBbJy8nLCAnPycsICcjJ107XG5jb25zdCBob3N0bmFtZU1heExlbiA9IDI1NTtcbmNvbnN0IGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlsrYS16MC05QS1aXy1dezAsNjN9JC87XG5jb25zdCBob3N0bmFtZVBhcnRTdGFydCA9IC9eKFsrYS16MC05QS1aXy1dezAsNjN9KSguKikkLztcbi8vIHByb3RvY29scyB0aGF0IGNhbiBhbGxvdyBcInVuc2FmZVwiIGFuZCBcInVud2lzZVwiIGNoYXJzLlxuLy8gcHJvdG9jb2xzIHRoYXQgbmV2ZXIgaGF2ZSBhIGhvc3RuYW1lLlxuY29uc3QgaG9zdGxlc3NQcm90b2NvbCA9IHtcbiAgamF2YXNjcmlwdDogdHJ1ZSxcbiAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxufTtcbi8vIHByb3RvY29scyB0aGF0IGFsd2F5cyBjb250YWluIGEgLy8gYml0LlxuY29uc3Qgc2xhc2hlZFByb3RvY29sID0ge1xuICBodHRwOiB0cnVlLFxuICBodHRwczogdHJ1ZSxcbiAgZnRwOiB0cnVlLFxuICBnb3BoZXI6IHRydWUsXG4gIGZpbGU6IHRydWUsXG4gICdodHRwOic6IHRydWUsXG4gICdodHRwczonOiB0cnVlLFxuICAnZnRwOic6IHRydWUsXG4gICdnb3BoZXI6JzogdHJ1ZSxcbiAgJ2ZpbGU6JzogdHJ1ZVxufTtcblxuZnVuY3Rpb24gdXJsUGFyc2UgKHVybCwgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKHVybCAmJiB1cmwgaW5zdGFuY2VvZiBVcmwpIHJldHVybiB1cmxcblxuICBjb25zdCB1ID0gbmV3IFVybCgpO1xuICB1LnBhcnNlKHVybCwgc2xhc2hlc0Rlbm90ZUhvc3QpO1xuICByZXR1cm4gdVxufVxuXG5VcmwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHVybCwgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgbGV0IGxvd2VyUHJvdG8sIGhlYywgc2xhc2hlcztcbiAgbGV0IHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiB1cmwuc3BsaXQoJyMnKS5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUcnkgZmFzdCBwYXRoIHJlZ2V4cFxuICAgIGNvbnN0IHNpbXBsZVBhdGggPSBzaW1wbGVQYXRoUGF0dGVybi5leGVjKHJlc3QpO1xuICAgIGlmIChzaW1wbGVQYXRoKSB7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICB9XG5cbiAgbGV0IHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgbG93ZXJQcm90byA9IHByb3RvLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlbGVzcy1lc2NhcGUgKi9cbiAgaWYgKHNsYXNoZXNEZW5vdGVIb3N0IHx8IHByb3RvIHx8IHJlc3QubWF0Y2goL15cXC9cXC9bXkBcXC9dK0BbXkBcXC9dKy8pKSB7XG4gICAgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG4gICAgLy8gdGhlcmUncyBhIGhvc3RuYW1lLlxuICAgIC8vIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiAvLCA/LCA7LCBvciAjIGVuZHMgdGhlIGhvc3QuXG4gICAgLy9cbiAgICAvLyBJZiB0aGVyZSBpcyBhbiBAIGluIHRoZSBob3N0bmFtZSwgdGhlbiBub24taG9zdCBjaGFycyAqYXJlKiBhbGxvd2VkXG4gICAgLy8gdG8gdGhlIGxlZnQgb2YgdGhlIGxhc3QgQCBzaWduLCB1bmxlc3Mgc29tZSBob3N0LWVuZGluZyBjaGFyYWN0ZXJcbiAgICAvLyBjb21lcyAqYmVmb3JlKiB0aGUgQC1zaWduLlxuICAgIC8vIFVSTHMgYXJlIG9ibm94aW91cy5cbiAgICAvL1xuICAgIC8vIGV4OlxuICAgIC8vIGh0dHA6Ly9hQGJAYy8gPT4gdXNlcjphQGIgaG9zdDpjXG4gICAgLy8gaHR0cDovL2FAYj9AYyA9PiB1c2VyOmEgaG9zdDpjIHBhdGg6Lz9AY1xuXG4gICAgLy8gdjAuMTIgVE9ETyhpc2FhY3MpOiBUaGlzIGlzIG5vdCBxdWl0ZSBob3cgQ2hyb21lIGRvZXMgdGhpbmdzLlxuICAgIC8vIFJldmlldyBvdXIgdGVzdCBjYXNlIGFnYWluc3QgYnJvd3NlcnMgbW9yZSBjb21wcmVoZW5zaXZlbHkuXG5cbiAgICAvLyBmaW5kIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiBhbnkgaG9zdEVuZGluZ0NoYXJzXG4gICAgbGV0IGhvc3RFbmQgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhvc3RFbmRpbmdDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpIHtcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBlaXRoZXIgd2UgaGF2ZSBhbiBleHBsaWNpdCBwb2ludCB3aGVyZSB0aGVcbiAgICAvLyBhdXRoIHBvcnRpb24gY2Fubm90IGdvIHBhc3QsIG9yIHRoZSBsYXN0IEAgY2hhciBpcyB0aGUgZGVjaWRlci5cbiAgICBsZXQgYXV0aCwgYXRTaWduO1xuICAgIGlmIChob3N0RW5kID09PSAtMSkge1xuICAgICAgLy8gYXRTaWduIGNhbiBiZSBhbnl3aGVyZS5cbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXRTaWduIG11c3QgYmUgaW4gYXV0aCBwb3J0aW9uLlxuICAgICAgLy8gaHR0cDovL2FAYi9jQGQgPT4gaG9zdDpiIGF1dGg6YSBwYXRoOi9jQGRcbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnLCBob3N0RW5kKTtcbiAgICB9XG5cbiAgICAvLyBOb3cgd2UgaGF2ZSBhIHBvcnRpb24gd2hpY2ggaXMgZGVmaW5pdGVseSB0aGUgYXV0aC5cbiAgICAvLyBQdWxsIHRoYXQgb2ZmLlxuICAgIGlmIChhdFNpZ24gIT09IC0xKSB7XG4gICAgICBhdXRoID0gcmVzdC5zbGljZSgwLCBhdFNpZ24pO1xuICAgICAgcmVzdCA9IHJlc3Quc2xpY2UoYXRTaWduICsgMSk7XG4gICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhlYyA9IHJlc3QuaW5kZXhPZihub25Ib3N0Q2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKSB7XG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIHdlIHN0aWxsIGhhdmUgbm90IGhpdCBpdCwgdGhlbiB0aGUgZW50aXJlIHRoaW5nIGlzIGEgaG9zdC5cbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICBpZiAocmVzdFtob3N0RW5kIC0gMV0gPT09ICc6JykgeyBob3N0RW5kLS07IH1cbiAgICBjb25zdCBob3N0ID0gcmVzdC5zbGljZSgwLCBob3N0RW5kKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZShob3N0RW5kKTtcblxuICAgIC8vIHB1bGwgb3V0IHBvcnQuXG4gICAgdGhpcy5wYXJzZUhvc3QoaG9zdCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIGNvbnN0IGlwdjZIb3N0bmFtZSA9IHRoaXMuaG9zdG5hbWVbMF0gPT09ICdbJyAmJlxuICAgICAgICB0aGlzLmhvc3RuYW1lW3RoaXMuaG9zdG5hbWUubGVuZ3RoIC0gMV0gPT09ICddJztcblxuICAgIC8vIHZhbGlkYXRlIGEgbGl0dGxlLlxuICAgIGlmICghaXB2Nkhvc3RuYW1lKSB7XG4gICAgICBjb25zdCBob3N0cGFydHMgPSB0aGlzLmhvc3RuYW1lLnNwbGl0KC9cXC4vKTtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gaG9zdHBhcnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb25zdCBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIHsgY29udGludWUgfVxuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICBsZXQgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAobGV0IGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRQYXJ0cyA9IGhvc3RwYXJ0cy5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIGNvbnN0IG5vdEhvc3QgPSBob3N0cGFydHMuc2xpY2UoaSArIDEpO1xuICAgICAgICAgICAgY29uc3QgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5ob3N0bmFtZS5sZW5ndGggPiBob3N0bmFtZU1heExlbikge1xuICAgICAgdGhpcy5ob3N0bmFtZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIHN0cmlwIFsgYW5kIF0gZnJvbSB0aGUgaG9zdG5hbWVcbiAgICAvLyB0aGUgaG9zdCBmaWVsZCBzdGlsbCByZXRhaW5zIHRoZW0sIHRob3VnaFxuICAgIGlmIChpcHY2SG9zdG5hbWUpIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnN1YnN0cigxLCB0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNob3Agb2ZmIGZyb20gdGhlIHRhaWwgZmlyc3QuXG4gIGNvbnN0IGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIGNvbnN0IHFtID0gcmVzdC5pbmRleE9mKCc/Jyk7XG4gIGlmIChxbSAhPT0gLTEpIHtcbiAgICB0aGlzLnNlYXJjaCA9IHJlc3Quc3Vic3RyKHFtKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBxbSk7XG4gIH1cbiAgaWYgKHJlc3QpIHsgdGhpcy5wYXRobmFtZSA9IHJlc3Q7IH1cbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnJztcbiAgfVxuXG4gIHJldHVybiB0aGlzXG59O1xuXG5VcmwucHJvdG90eXBlLnBhcnNlSG9zdCA9IGZ1bmN0aW9uIChob3N0KSB7XG4gIGxldCBwb3J0ID0gcG9ydFBhdHRlcm4uZXhlYyhob3N0KTtcbiAgaWYgKHBvcnQpIHtcbiAgICBwb3J0ID0gcG9ydFswXTtcbiAgICBpZiAocG9ydCAhPT0gJzonKSB7XG4gICAgICB0aGlzLnBvcnQgPSBwb3J0LnN1YnN0cigxKTtcbiAgICB9XG4gICAgaG9zdCA9IGhvc3Quc3Vic3RyKDAsIGhvc3QubGVuZ3RoIC0gcG9ydC5sZW5ndGgpO1xuICB9XG4gIGlmIChob3N0KSB7IHRoaXMuaG9zdG5hbWUgPSBob3N0OyB9XG59O1xuXG5leHBvcnRzLmRlY29kZSA9IGRlY29kZTtcbmV4cG9ydHMuZW5jb2RlID0gZW5jb2RlO1xuZXhwb3J0cy5mb3JtYXQgPSBmb3JtYXQ7XG5leHBvcnRzLnBhcnNlID0gdXJsUGFyc2U7XG4iLCAiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVnZXgkNSA9IC9bXFwwLVxcdUQ3RkZcXHVFMDAwLVxcdUZGRkZdfFtcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl18W1xcdUQ4MDAtXFx1REJGRl0oPyFbXFx1REMwMC1cXHVERkZGXSl8KD86W15cXHVEODAwLVxcdURCRkZdfF4pW1xcdURDMDAtXFx1REZGRl0vO1xuXG52YXIgcmVnZXgkNCA9IC9bXFwwLVxceDFGXFx4N0YtXFx4OUZdLztcblxudmFyIHJlZ2V4JDMgPSAvW1xceEFEXFx1MDYwMC1cXHUwNjA1XFx1MDYxQ1xcdTA2RERcXHUwNzBGXFx1MDg5MFxcdTA4OTFcXHUwOEUyXFx1MTgwRVxcdTIwMEItXFx1MjAwRlxcdTIwMkEtXFx1MjAyRVxcdTIwNjAtXFx1MjA2NFxcdTIwNjYtXFx1MjA2RlxcdUZFRkZcXHVGRkY5LVxcdUZGRkJdfFxcdUQ4MDRbXFx1RENCRFxcdURDQ0RdfFxcdUQ4MERbXFx1REMzMC1cXHVEQzNGXXxcXHVEODJGW1xcdURDQTAtXFx1RENBM118XFx1RDgzNFtcXHVERDczLVxcdUREN0FdfFxcdURCNDBbXFx1REMwMVxcdURDMjAtXFx1REM3Rl0vO1xuXG52YXIgcmVnZXgkMiA9IC9bIS0jJS1cXCosLVxcLzo7XFw/QFxcWy1cXF1fXFx7XFx9XFx4QTFcXHhBN1xceEFCXFx4QjZcXHhCN1xceEJCXFx4QkZcXHUwMzdFXFx1MDM4N1xcdTA1NUEtXFx1MDU1RlxcdTA1ODlcXHUwNThBXFx1MDVCRVxcdTA1QzBcXHUwNUMzXFx1MDVDNlxcdTA1RjNcXHUwNUY0XFx1MDYwOVxcdTA2MEFcXHUwNjBDXFx1MDYwRFxcdTA2MUJcXHUwNjFELVxcdTA2MUZcXHUwNjZBLVxcdTA2NkRcXHUwNkQ0XFx1MDcwMC1cXHUwNzBEXFx1MDdGNy1cXHUwN0Y5XFx1MDgzMC1cXHUwODNFXFx1MDg1RVxcdTA5NjRcXHUwOTY1XFx1MDk3MFxcdTA5RkRcXHUwQTc2XFx1MEFGMFxcdTBDNzdcXHUwQzg0XFx1MERGNFxcdTBFNEZcXHUwRTVBXFx1MEU1QlxcdTBGMDQtXFx1MEYxMlxcdTBGMTRcXHUwRjNBLVxcdTBGM0RcXHUwRjg1XFx1MEZEMC1cXHUwRkQ0XFx1MEZEOVxcdTBGREFcXHUxMDRBLVxcdTEwNEZcXHUxMEZCXFx1MTM2MC1cXHUxMzY4XFx1MTQwMFxcdTE2NkVcXHUxNjlCXFx1MTY5Q1xcdTE2RUItXFx1MTZFRFxcdTE3MzVcXHUxNzM2XFx1MTdENC1cXHUxN0Q2XFx1MTdEOC1cXHUxN0RBXFx1MTgwMC1cXHUxODBBXFx1MTk0NFxcdTE5NDVcXHUxQTFFXFx1MUExRlxcdTFBQTAtXFx1MUFBNlxcdTFBQTgtXFx1MUFBRFxcdTFCNUEtXFx1MUI2MFxcdTFCN0RcXHUxQjdFXFx1MUJGQy1cXHUxQkZGXFx1MUMzQi1cXHUxQzNGXFx1MUM3RVxcdTFDN0ZcXHUxQ0MwLVxcdTFDQzdcXHUxQ0QzXFx1MjAxMC1cXHUyMDI3XFx1MjAzMC1cXHUyMDQzXFx1MjA0NS1cXHUyMDUxXFx1MjA1My1cXHUyMDVFXFx1MjA3RFxcdTIwN0VcXHUyMDhEXFx1MjA4RVxcdTIzMDgtXFx1MjMwQlxcdTIzMjlcXHUyMzJBXFx1Mjc2OC1cXHUyNzc1XFx1MjdDNVxcdTI3QzZcXHUyN0U2LVxcdTI3RUZcXHUyOTgzLVxcdTI5OThcXHUyOUQ4LVxcdTI5REJcXHUyOUZDXFx1MjlGRFxcdTJDRjktXFx1MkNGQ1xcdTJDRkVcXHUyQ0ZGXFx1MkQ3MFxcdTJFMDAtXFx1MkUyRVxcdTJFMzAtXFx1MkU0RlxcdTJFNTItXFx1MkU1RFxcdTMwMDEtXFx1MzAwM1xcdTMwMDgtXFx1MzAxMVxcdTMwMTQtXFx1MzAxRlxcdTMwMzBcXHUzMDNEXFx1MzBBMFxcdTMwRkJcXHVBNEZFXFx1QTRGRlxcdUE2MEQtXFx1QTYwRlxcdUE2NzNcXHVBNjdFXFx1QTZGMi1cXHVBNkY3XFx1QTg3NC1cXHVBODc3XFx1QThDRVxcdUE4Q0ZcXHVBOEY4LVxcdUE4RkFcXHVBOEZDXFx1QTkyRVxcdUE5MkZcXHVBOTVGXFx1QTlDMS1cXHVBOUNEXFx1QTlERVxcdUE5REZcXHVBQTVDLVxcdUFBNUZcXHVBQURFXFx1QUFERlxcdUFBRjBcXHVBQUYxXFx1QUJFQlxcdUZEM0VcXHVGRDNGXFx1RkUxMC1cXHVGRTE5XFx1RkUzMC1cXHVGRTUyXFx1RkU1NC1cXHVGRTYxXFx1RkU2M1xcdUZFNjhcXHVGRTZBXFx1RkU2QlxcdUZGMDEtXFx1RkYwM1xcdUZGMDUtXFx1RkYwQVxcdUZGMEMtXFx1RkYwRlxcdUZGMUFcXHVGRjFCXFx1RkYxRlxcdUZGMjBcXHVGRjNCLVxcdUZGM0RcXHVGRjNGXFx1RkY1QlxcdUZGNURcXHVGRjVGLVxcdUZGNjVdfFxcdUQ4MDBbXFx1REQwMC1cXHVERDAyXFx1REY5RlxcdURGRDBdfFxcdUQ4MDFcXHVERDZGfFxcdUQ4MDJbXFx1REM1N1xcdUREMUZcXHVERDNGXFx1REU1MC1cXHVERTU4XFx1REU3RlxcdURFRjAtXFx1REVGNlxcdURGMzktXFx1REYzRlxcdURGOTktXFx1REY5Q118XFx1RDgwM1tcXHVERUFEXFx1REY1NS1cXHVERjU5XFx1REY4Ni1cXHVERjg5XXxcXHVEODA0W1xcdURDNDctXFx1REM0RFxcdURDQkJcXHVEQ0JDXFx1RENCRS1cXHVEQ0MxXFx1REQ0MC1cXHVERDQzXFx1REQ3NFxcdURENzVcXHVEREM1LVxcdUREQzhcXHVERENEXFx1REREQlxcdUREREQtXFx1RERERlxcdURFMzgtXFx1REUzRFxcdURFQTldfFxcdUQ4MDVbXFx1REM0Qi1cXHVEQzRGXFx1REM1QVxcdURDNUJcXHVEQzVEXFx1RENDNlxcdUREQzEtXFx1REREN1xcdURFNDEtXFx1REU0M1xcdURFNjAtXFx1REU2Q1xcdURFQjlcXHVERjNDLVxcdURGM0VdfFxcdUQ4MDZbXFx1REMzQlxcdURENDQtXFx1REQ0NlxcdURERTJcXHVERTNGLVxcdURFNDZcXHVERTlBLVxcdURFOUNcXHVERTlFLVxcdURFQTJcXHVERjAwLVxcdURGMDldfFxcdUQ4MDdbXFx1REM0MS1cXHVEQzQ1XFx1REM3MFxcdURDNzFcXHVERUY3XFx1REVGOFxcdURGNDMtXFx1REY0RlxcdURGRkZdfFxcdUQ4MDlbXFx1REM3MC1cXHVEQzc0XXxcXHVEODBCW1xcdURGRjFcXHVERkYyXXxcXHVEODFBW1xcdURFNkVcXHVERTZGXFx1REVGNVxcdURGMzctXFx1REYzQlxcdURGNDRdfFxcdUQ4MUJbXFx1REU5Ny1cXHVERTlBXFx1REZFMl18XFx1RDgyRlxcdURDOUZ8XFx1RDgzNltcXHVERTg3LVxcdURFOEJdfFxcdUQ4M0FbXFx1REQ1RVxcdURENUZdLztcblxudmFyIHJlZ2V4JDEgPSAvW1xcJFxcKzwtPlxcXmBcXHx+XFx4QTItXFx4QTZcXHhBOFxceEE5XFx4QUNcXHhBRS1cXHhCMVxceEI0XFx4QjhcXHhEN1xceEY3XFx1MDJDMi1cXHUwMkM1XFx1MDJEMi1cXHUwMkRGXFx1MDJFNS1cXHUwMkVCXFx1MDJFRFxcdTAyRUYtXFx1MDJGRlxcdTAzNzVcXHUwMzg0XFx1MDM4NVxcdTAzRjZcXHUwNDgyXFx1MDU4RC1cXHUwNThGXFx1MDYwNi1cXHUwNjA4XFx1MDYwQlxcdTA2MEVcXHUwNjBGXFx1MDZERVxcdTA2RTlcXHUwNkZEXFx1MDZGRVxcdTA3RjZcXHUwN0ZFXFx1MDdGRlxcdTA4ODhcXHUwOUYyXFx1MDlGM1xcdTA5RkFcXHUwOUZCXFx1MEFGMVxcdTBCNzBcXHUwQkYzLVxcdTBCRkFcXHUwQzdGXFx1MEQ0RlxcdTBENzlcXHUwRTNGXFx1MEYwMS1cXHUwRjAzXFx1MEYxM1xcdTBGMTUtXFx1MEYxN1xcdTBGMUEtXFx1MEYxRlxcdTBGMzRcXHUwRjM2XFx1MEYzOFxcdTBGQkUtXFx1MEZDNVxcdTBGQzctXFx1MEZDQ1xcdTBGQ0VcXHUwRkNGXFx1MEZENS1cXHUwRkQ4XFx1MTA5RVxcdTEwOUZcXHUxMzkwLVxcdTEzOTlcXHUxNjZEXFx1MTdEQlxcdTE5NDBcXHUxOURFLVxcdTE5RkZcXHUxQjYxLVxcdTFCNkFcXHUxQjc0LVxcdTFCN0NcXHUxRkJEXFx1MUZCRi1cXHUxRkMxXFx1MUZDRC1cXHUxRkNGXFx1MUZERC1cXHUxRkRGXFx1MUZFRC1cXHUxRkVGXFx1MUZGRFxcdTFGRkVcXHUyMDQ0XFx1MjA1MlxcdTIwN0EtXFx1MjA3Q1xcdTIwOEEtXFx1MjA4Q1xcdTIwQTAtXFx1MjBDMFxcdTIxMDBcXHUyMTAxXFx1MjEwMy1cXHUyMTA2XFx1MjEwOFxcdTIxMDlcXHUyMTE0XFx1MjExNi1cXHUyMTE4XFx1MjExRS1cXHUyMTIzXFx1MjEyNVxcdTIxMjdcXHUyMTI5XFx1MjEyRVxcdTIxM0FcXHUyMTNCXFx1MjE0MC1cXHUyMTQ0XFx1MjE0QS1cXHUyMTREXFx1MjE0RlxcdTIxOEFcXHUyMThCXFx1MjE5MC1cXHUyMzA3XFx1MjMwQy1cXHUyMzI4XFx1MjMyQi1cXHUyNDI2XFx1MjQ0MC1cXHUyNDRBXFx1MjQ5Qy1cXHUyNEU5XFx1MjUwMC1cXHUyNzY3XFx1Mjc5NC1cXHUyN0M0XFx1MjdDNy1cXHUyN0U1XFx1MjdGMC1cXHUyOTgyXFx1Mjk5OS1cXHUyOUQ3XFx1MjlEQy1cXHUyOUZCXFx1MjlGRS1cXHUyQjczXFx1MkI3Ni1cXHUyQjk1XFx1MkI5Ny1cXHUyQkZGXFx1MkNFNS1cXHUyQ0VBXFx1MkU1MFxcdTJFNTFcXHUyRTgwLVxcdTJFOTlcXHUyRTlCLVxcdTJFRjNcXHUyRjAwLVxcdTJGRDVcXHUyRkYwLVxcdTJGRkZcXHUzMDA0XFx1MzAxMlxcdTMwMTNcXHUzMDIwXFx1MzAzNlxcdTMwMzdcXHUzMDNFXFx1MzAzRlxcdTMwOUJcXHUzMDlDXFx1MzE5MFxcdTMxOTFcXHUzMTk2LVxcdTMxOUZcXHUzMUMwLVxcdTMxRTNcXHUzMUVGXFx1MzIwMC1cXHUzMjFFXFx1MzIyQS1cXHUzMjQ3XFx1MzI1MFxcdTMyNjAtXFx1MzI3RlxcdTMyOEEtXFx1MzJCMFxcdTMyQzAtXFx1MzNGRlxcdTREQzAtXFx1NERGRlxcdUE0OTAtXFx1QTRDNlxcdUE3MDAtXFx1QTcxNlxcdUE3MjBcXHVBNzIxXFx1QTc4OVxcdUE3OEFcXHVBODI4LVxcdUE4MkJcXHVBODM2LVxcdUE4MzlcXHVBQTc3LVxcdUFBNzlcXHVBQjVCXFx1QUI2QVxcdUFCNkJcXHVGQjI5XFx1RkJCMi1cXHVGQkMyXFx1RkQ0MC1cXHVGRDRGXFx1RkRDRlxcdUZERkMtXFx1RkRGRlxcdUZFNjJcXHVGRTY0LVxcdUZFNjZcXHVGRTY5XFx1RkYwNFxcdUZGMEJcXHVGRjFDLVxcdUZGMUVcXHVGRjNFXFx1RkY0MFxcdUZGNUNcXHVGRjVFXFx1RkZFMC1cXHVGRkU2XFx1RkZFOC1cXHVGRkVFXFx1RkZGQ1xcdUZGRkRdfFxcdUQ4MDBbXFx1REQzNy1cXHVERDNGXFx1REQ3OS1cXHVERDg5XFx1REQ4Qy1cXHVERDhFXFx1REQ5MC1cXHVERDlDXFx1RERBMFxcdURERDAtXFx1RERGQ118XFx1RDgwMltcXHVEQzc3XFx1REM3OFxcdURFQzhdfFxcdUQ4MDVcXHVERjNGfFxcdUQ4MDdbXFx1REZENS1cXHVERkYxXXxcXHVEODFBW1xcdURGM0MtXFx1REYzRlxcdURGNDVdfFxcdUQ4MkZcXHVEQzlDfFxcdUQ4MzNbXFx1REY1MC1cXHVERkMzXXxcXHVEODM0W1xcdURDMDAtXFx1RENGNVxcdUREMDAtXFx1REQyNlxcdUREMjktXFx1REQ2NFxcdURENkEtXFx1REQ2Q1xcdUREODNcXHVERDg0XFx1REQ4Qy1cXHVEREE5XFx1RERBRS1cXHVEREVBXFx1REUwMC1cXHVERTQxXFx1REU0NVxcdURGMDAtXFx1REY1Nl18XFx1RDgzNVtcXHVERUMxXFx1REVEQlxcdURFRkJcXHVERjE1XFx1REYzNVxcdURGNEZcXHVERjZGXFx1REY4OVxcdURGQTlcXHVERkMzXXxcXHVEODM2W1xcdURDMDAtXFx1RERGRlxcdURFMzctXFx1REUzQVxcdURFNkQtXFx1REU3NFxcdURFNzYtXFx1REU4M1xcdURFODVcXHVERTg2XXxcXHVEODM4W1xcdURENEZcXHVERUZGXXxcXHVEODNCW1xcdURDQUNcXHVEQ0IwXFx1REQyRVxcdURFRjBcXHVERUYxXXxcXHVEODNDW1xcdURDMDAtXFx1REMyQlxcdURDMzAtXFx1REM5M1xcdURDQTAtXFx1RENBRVxcdURDQjEtXFx1RENCRlxcdURDQzEtXFx1RENDRlxcdURDRDEtXFx1RENGNVxcdUREMEQtXFx1RERBRFxcdURERTYtXFx1REUwMlxcdURFMTAtXFx1REUzQlxcdURFNDAtXFx1REU0OFxcdURFNTBcXHVERTUxXFx1REU2MC1cXHVERTY1XFx1REYwMC1cXHVERkZGXXxcXHVEODNEW1xcdURDMDAtXFx1REVEN1xcdURFREMtXFx1REVFQ1xcdURFRjAtXFx1REVGQ1xcdURGMDAtXFx1REY3NlxcdURGN0ItXFx1REZEOVxcdURGRTAtXFx1REZFQlxcdURGRjBdfFxcdUQ4M0VbXFx1REMwMC1cXHVEQzBCXFx1REMxMC1cXHVEQzQ3XFx1REM1MC1cXHVEQzU5XFx1REM2MC1cXHVEQzg3XFx1REM5MC1cXHVEQ0FEXFx1RENCMFxcdURDQjFcXHVERDAwLVxcdURFNTNcXHVERTYwLVxcdURFNkRcXHVERTcwLVxcdURFN0NcXHVERTgwLVxcdURFODhcXHVERTkwLVxcdURFQkRcXHVERUJGLVxcdURFQzVcXHVERUNFLVxcdURFREJcXHVERUUwLVxcdURFRThcXHVERUYwLVxcdURFRjhcXHVERjAwLVxcdURGOTJcXHVERjk0LVxcdURGQ0FdLztcblxudmFyIHJlZ2V4ID0gL1sgXFx4QTBcXHUxNjgwXFx1MjAwMC1cXHUyMDBBXFx1MjAyOFxcdTIwMjlcXHUyMDJGXFx1MjA1RlxcdTMwMDBdLztcblxuZXhwb3J0cy5BbnkgPSByZWdleCQ1O1xuZXhwb3J0cy5DYyA9IHJlZ2V4JDQ7XG5leHBvcnRzLkNmID0gcmVnZXgkMztcbmV4cG9ydHMuUCA9IHJlZ2V4JDI7XG5leHBvcnRzLlMgPSByZWdleCQxO1xuZXhwb3J0cy5aID0gcmVnZXg7XG4iLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCAiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdWNfbWljcm8gPSByZXF1aXJlKCd1Yy5taWNybycpO1xuXG5mdW5jdGlvbiByZUZhY3RvcnkgKG9wdHMpIHtcbiAgY29uc3QgcmUgPSB7fTtcbiAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgcmUuc3JjX0FueSA9IHVjX21pY3JvLkFueS5zb3VyY2U7XG4gIHJlLnNyY19DYyA9IHVjX21pY3JvLkNjLnNvdXJjZTtcbiAgcmUuc3JjX1ogPSB1Y19taWNyby5aLnNvdXJjZTtcbiAgcmUuc3JjX1AgPSB1Y19taWNyby5QLnNvdXJjZTtcblxuICAvLyBcXHB7XFxaXFxQXFxDY1xcQ0Z9ICh3aGl0ZSBzcGFjZXMgKyBjb250cm9sICsgZm9ybWF0ICsgcHVuY3R1YXRpb24pXG4gIHJlLnNyY19aUENjID0gW3JlLnNyY19aLCByZS5zcmNfUCwgcmUuc3JjX0NjXS5qb2luKCd8Jyk7XG5cbiAgLy8gXFxwe1xcWlxcQ2N9ICh3aGl0ZSBzcGFjZXMgKyBjb250cm9sKVxuICByZS5zcmNfWkNjID0gW3JlLnNyY19aLCByZS5zcmNfQ2NdLmpvaW4oJ3wnKTtcblxuICAvLyBFeHBlcmltZW50YWwuIExpc3Qgb2YgY2hhcnMsIGNvbXBsZXRlbHkgcHJvaGliaXRlZCBpbiBsaW5rc1xuICAvLyBiZWNhdXNlIGNhbiBzZXBhcmF0ZSBpdCBmcm9tIG90aGVyIHBhcnQgb2YgdGV4dFxuICBjb25zdCB0ZXh0X3NlcGFyYXRvcnMgPSAnWz48XFx1ZmY1Y10nO1xuXG4gIC8vIEFsbCBwb3NzaWJsZSB3b3JkIGNoYXJhY3RlcnMgKGV2ZXJ5dGhpbmcgd2l0aG91dCBwdW5jdHVhdGlvbiwgc3BhY2VzICYgY29udHJvbHMpXG4gIC8vIERlZmluZWQgdmlhIHB1bmN0dWF0aW9uICYgc3BhY2VzIHRvIHNhdmUgc3BhY2VcbiAgLy8gU2hvdWxkIGJlIHNvbWV0aGluZyBsaWtlIFxccHtcXExcXE5cXFNcXE19IChcXHcgYnV0IHdpdGhvdXQgYF9gKVxuICByZS5zcmNfcHNldWRvX2xldHRlciA9ICcoPzooPyEnICsgdGV4dF9zZXBhcmF0b3JzICsgJ3wnICsgcmUuc3JjX1pQQ2MgKyAnKScgKyByZS5zcmNfQW55ICsgJyknO1xuICAvLyBUaGUgc2FtZSBhcyBhYm90aGUgYnV0IHdpdGhvdXQgWzAtOV1cbiAgLy8gdmFyIHNyY19wc2V1ZG9fbGV0dGVyX25vbl9kID0gJyg/Oig/IVswLTldfCcgKyBzcmNfWlBDYyArICcpJyArIHNyY19BbnkgKyAnKSc7XG5cbiAgcmUuc3JjX2lwNCA9XG5cbiAgICAnKD86KDI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXFxcLil7M30oMjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KSc7XG5cbiAgLy8gUHJvaGliaXQgYW55IG9mIFwiQC9bXSgpXCIgaW4gdXNlci9wYXNzIHRvIGF2b2lkIHdyb25nIGRvbWFpbiBmZXRjaC5cbiAgcmUuc3JjX2F1dGggPSAnKD86KD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFtAL1xcXFxbXFxcXF0oKV0pLikrQCk/JztcblxuICByZS5zcmNfcG9ydCA9XG5cbiAgICAnKD86Oig/OjYoPzpbMC00XVxcXFxkezN9fDUoPzpbMC00XVxcXFxkezJ9fDUoPzpbMC0yXVxcXFxkfDNbMC01XSkpKXxbMS01XT9cXFxcZHsxLDR9KSk/JztcblxuICByZS5zcmNfaG9zdF90ZXJtaW5hdG9yID1cblxuICAgICcoPz0kfCcgKyB0ZXh0X3NlcGFyYXRvcnMgKyAnfCcgKyByZS5zcmNfWlBDYyArICcpJyArXG4gICAgJyg/IScgKyAob3B0c1snLS0tJ10gPyAnLSg/IS0tKXwnIDogJy18JykgKyAnX3w6XFxcXGR8XFxcXC4tfFxcXFwuKD8hJHwnICsgcmUuc3JjX1pQQ2MgKyAnKSknO1xuXG4gIHJlLnNyY19wYXRoID1cblxuICAgICcoPzonICtcbiAgICAgICdbLz8jXScgK1xuICAgICAgICAnKD86JyArXG4gICAgICAgICAgJyg/IScgKyByZS5zcmNfWkNjICsgJ3wnICsgdGV4dF9zZXBhcmF0b3JzICsgJ3xbKClbXFxcXF17fS4sXCJcXCc/IVxcXFwtO10pLnwnICtcbiAgICAgICAgICAnXFxcXFsoPzooPyEnICsgcmUuc3JjX1pDYyArICd8XFxcXF0pLikqXFxcXF18JyArXG4gICAgICAgICAgJ1xcXFwoKD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFspXSkuKSpcXFxcKXwnICtcbiAgICAgICAgICAnXFxcXHsoPzooPyEnICsgcmUuc3JjX1pDYyArICd8W31dKS4pKlxcXFx9fCcgK1xuICAgICAgICAgICdcXFxcXCIoPzooPyEnICsgcmUuc3JjX1pDYyArICd8W1wiXSkuKStcXFxcXCJ8JyArXG4gICAgICAgICAgXCJcXFxcJyg/Oig/IVwiICsgcmUuc3JjX1pDYyArIFwifFsnXSkuKStcXFxcJ3xcIiArXG5cbiAgICAgICAgICAvLyBhbGxvdyBgSSdtX2tpbmdgIGlmIG5vIHBhaXIgZm91bmRcbiAgICAgICAgICBcIlxcXFwnKD89XCIgKyByZS5zcmNfcHNldWRvX2xldHRlciArICd8Wy1dKXwnICtcblxuICAgICAgICAgIC8vIGdvb2dsZSBoYXMgbWFueSBkb3RzIGluIFwiZ29vZ2xlIHNlYXJjaFwiIGxpbmtzICgjNjYsICM4MSkuXG4gICAgICAgICAgLy8gZ2l0aHViIGhhcyAuLi4gaW4gY29tbWl0IHJhbmdlIGxpbmtzLFxuICAgICAgICAgIC8vIFJlc3RyaWN0IHRvXG4gICAgICAgICAgLy8gLSBlbmdsaXNoXG4gICAgICAgICAgLy8gLSBwZXJjZW50LWVuY29kZWRcbiAgICAgICAgICAvLyAtIHBhcnRzIG9mIGZpbGUgcGF0aFxuICAgICAgICAgIC8vIC0gcGFyYW1zIHNlcGFyYXRvclxuICAgICAgICAgIC8vIHVudGlsIG1vcmUgZXhhbXBsZXMgZm91bmQuXG4gICAgICAgICAgJ1xcXFwuezIsfVthLXpBLVowLTklLyZdfCcgK1xuXG4gICAgICAgICAgJ1xcXFwuKD8hJyArIHJlLnNyY19aQ2MgKyAnfFsuXXwkKXwnICtcbiAgICAgICAgICAob3B0c1snLS0tJ11cbiAgICAgICAgICAgID8gJ1xcXFwtKD8hLS0oPzpbXi1dfCQpKSg/Oi0qKXwnIC8vIGAtLS1gID0+IGxvbmcgZGFzaCwgdGVybWluYXRlXG4gICAgICAgICAgICA6ICdcXFxcLSt8J1xuICAgICAgICAgICkgK1xuICAgICAgICAgIC8vIGFsbG93IGAsLCxgIGluIHBhdGhzXG4gICAgICAgICAgJywoPyEnICsgcmUuc3JjX1pDYyArICd8JCl8JyArXG5cbiAgICAgICAgICAvLyBhbGxvdyBgO2AgaWYgbm90IGZvbGxvd2VkIGJ5IHNwYWNlLWxpa2UgY2hhclxuICAgICAgICAgICc7KD8hJyArIHJlLnNyY19aQ2MgKyAnfCQpfCcgK1xuXG4gICAgICAgICAgLy8gYWxsb3cgYCEhIWAgaW4gcGF0aHMsIGJ1dCBub3QgYXQgdGhlIGVuZFxuICAgICAgICAgICdcXFxcISsoPyEnICsgcmUuc3JjX1pDYyArICd8WyFdfCQpfCcgK1xuXG4gICAgICAgICAgJ1xcXFw/KD8hJyArIHJlLnNyY19aQ2MgKyAnfFs/XXwkKScgK1xuICAgICAgICAnKSsnICtcbiAgICAgICd8XFxcXC8nICtcbiAgICAnKT8nO1xuXG4gIC8vIEFsbG93IGFueXRoaW5nIGluIG1hcmtkb3duIHNwZWMsIGZvcmJpZCBxdW90ZSAoXCIpIGF0IHRoZSBmaXJzdCBwb3NpdGlvblxuICAvLyBiZWNhdXNlIGVtYWlscyBlbmNsb3NlZCBpbiBxdW90ZXMgYXJlIGZhciBtb3JlIGNvbW1vblxuICByZS5zcmNfZW1haWxfbmFtZSA9XG5cbiAgICAnW1xcXFwtOzomPVxcXFwrXFxcXCQsXFxcXC5hLXpBLVowLTlfXVtcXFxcLTs6Jj1cXFxcK1xcXFwkLFxcXFxcIlxcXFwuYS16QS1aMC05X10qJztcblxuICByZS5zcmNfeG4gPVxuXG4gICAgJ3huLS1bYS16MC05XFxcXC1dezEsNTl9JztcblxuICAvLyBNb3JlIHRvIHJlYWQgYWJvdXQgZG9tYWluIG5hbWVzXG4gIC8vIGh0dHA6Ly9zZXJ2ZXJmYXVsdC5jb20vcXVlc3Rpb25zLzYzODI2MC9cblxuICByZS5zcmNfZG9tYWluX3Jvb3QgPVxuXG4gICAgLy8gQWxsb3cgbGV0dGVycyAmIGRpZ2l0cyAoaHR0cDovL3Rlc3QxKVxuICAgICcoPzonICtcbiAgICAgIHJlLnNyY194biArXG4gICAgICAnfCcgK1xuICAgICAgcmUuc3JjX3BzZXVkb19sZXR0ZXIgKyAnezEsNjN9JyArXG4gICAgJyknO1xuXG4gIHJlLnNyY19kb21haW4gPVxuXG4gICAgJyg/OicgK1xuICAgICAgcmUuc3JjX3huICtcbiAgICAgICd8JyArXG4gICAgICAnKD86JyArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJyknICtcbiAgICAgICd8JyArXG4gICAgICAnKD86JyArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJyg/Oi18JyArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJyl7MCw2MX0nICsgcmUuc3JjX3BzZXVkb19sZXR0ZXIgKyAnKScgK1xuICAgICcpJztcblxuICByZS5zcmNfaG9zdCA9XG5cbiAgICAnKD86JyArXG4gICAgLy8gRG9uJ3QgbmVlZCBJUCBjaGVjaywgYmVjYXVzZSBkaWdpdHMgYXJlIGFscmVhZHkgYWxsb3dlZCBpbiBub3JtYWwgZG9tYWluIG5hbWVzXG4gICAgLy8gICBzcmNfaXA0ICtcbiAgICAvLyAnfCcgK1xuICAgICAgJyg/Oig/Oig/OicgKyByZS5zcmNfZG9tYWluICsgJylcXFxcLikqJyArIHJlLnNyY19kb21haW4vKiBfcm9vdCAqLyArICcpJyArXG4gICAgJyknO1xuXG4gIHJlLnRwbF9ob3N0X2Z1enp5ID1cblxuICAgICcoPzonICtcbiAgICAgIHJlLnNyY19pcDQgK1xuICAgICd8JyArXG4gICAgICAnKD86KD86KD86JyArIHJlLnNyY19kb21haW4gKyAnKVxcXFwuKSsoPzolVExEUyUpKScgK1xuICAgICcpJztcblxuICByZS50cGxfaG9zdF9ub19pcF9mdXp6eSA9XG5cbiAgICAnKD86KD86KD86JyArIHJlLnNyY19kb21haW4gKyAnKVxcXFwuKSsoPzolVExEUyUpKSc7XG5cbiAgcmUuc3JjX2hvc3Rfc3RyaWN0ID1cblxuICAgIHJlLnNyY19ob3N0ICsgcmUuc3JjX2hvc3RfdGVybWluYXRvcjtcblxuICByZS50cGxfaG9zdF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3RfZnV6enkgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnNyY19ob3N0X3BvcnRfc3RyaWN0ID1cblxuICAgIHJlLnNyY19ob3N0ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X3BvcnRfZnV6enlfc3RyaWN0ID1cblxuICAgIHJlLnRwbF9ob3N0X2Z1enp5ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X3BvcnRfbm9faXBfZnV6enlfc3RyaWN0ID1cblxuICAgIHJlLnRwbF9ob3N0X25vX2lwX2Z1enp5ICsgcmUuc3JjX3BvcnQgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIC8vXG4gIC8vIE1haW4gcnVsZXNcbiAgLy9cblxuICAvLyBSdWRlIHRlc3QgZnV6enkgbGlua3MgYnkgaG9zdCwgZm9yIHF1aWNrIGRlbnlcbiAgcmUudHBsX2hvc3RfZnV6enlfdGVzdCA9XG5cbiAgICAnbG9jYWxob3N0fHd3d1xcXFwufFxcXFwuXFxcXGR7MSwzfVxcXFwufCg/OlxcXFwuKD86JVRMRFMlKSg/OicgKyByZS5zcmNfWlBDYyArICd8PnwkKSknO1xuXG4gIHJlLnRwbF9lbWFpbF9mdXp6eSA9XG5cbiAgICAgICcoXnwnICsgdGV4dF9zZXBhcmF0b3JzICsgJ3xcInxcXFxcKHwnICsgcmUuc3JjX1pDYyArICcpJyArXG4gICAgICAnKCcgKyByZS5zcmNfZW1haWxfbmFtZSArICdAJyArIHJlLnRwbF9ob3N0X2Z1enp5X3N0cmljdCArICcpJztcblxuICByZS50cGxfbGlua19mdXp6eSA9XG4gICAgICAvLyBGdXp6eSBsaW5rIGNhbid0IGJlIHByZXBlbmRlZCB3aXRoIC46L1xcLSBhbmQgbm9uIHB1bmN0dWF0aW9uLlxuICAgICAgLy8gYnV0IGNhbiBzdGFydCB3aXRoID4gKG1hcmtkb3duIGJsb2NrcXVvdGUpXG4gICAgICAnKF58KD8hWy46L1xcXFwtX0BdKSg/OlskKzw9Pl5gfFxcdWZmNWNdfCcgKyByZS5zcmNfWlBDYyArICcpKScgK1xuICAgICAgJygoPyFbJCs8PT5eYHxcXHVmZjVjXSknICsgcmUudHBsX2hvc3RfcG9ydF9mdXp6eV9zdHJpY3QgKyByZS5zcmNfcGF0aCArICcpJztcblxuICByZS50cGxfbGlua19ub19pcF9mdXp6eSA9XG4gICAgICAvLyBGdXp6eSBsaW5rIGNhbid0IGJlIHByZXBlbmRlZCB3aXRoIC46L1xcLSBhbmQgbm9uIHB1bmN0dWF0aW9uLlxuICAgICAgLy8gYnV0IGNhbiBzdGFydCB3aXRoID4gKG1hcmtkb3duIGJsb2NrcXVvdGUpXG4gICAgICAnKF58KD8hWy46L1xcXFwtX0BdKSg/OlskKzw9Pl5gfFxcdWZmNWNdfCcgKyByZS5zcmNfWlBDYyArICcpKScgK1xuICAgICAgJygoPyFbJCs8PT5eYHxcXHVmZjVjXSknICsgcmUudHBsX2hvc3RfcG9ydF9ub19pcF9mdXp6eV9zdHJpY3QgKyByZS5zcmNfcGF0aCArICcpJztcblxuICByZXR1cm4gcmVcbn1cblxuLy9cbi8vIEhlbHBlcnNcbi8vXG5cbi8vIE1lcmdlIG9iamVjdHNcbi8vXG5mdW5jdGlvbiBhc3NpZ24gKG9iaiAvKiBmcm9tMSwgZnJvbTIsIGZyb20zLCAuLi4gKi8pIHtcbiAgY29uc3Qgc291cmNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoIXNvdXJjZSkgeyByZXR1cm4gfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmpcbn1cblxuZnVuY3Rpb24gX2NsYXNzIChvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopIH1cbmZ1bmN0aW9uIGlzU3RyaW5nIChvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJyB9XG5mdW5jdGlvbiBpc09iamVjdCAob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgfVxuZnVuY3Rpb24gaXNSZWdFeHAgKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nIH1cbmZ1bmN0aW9uIGlzRnVuY3Rpb24gKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScgfVxuXG5mdW5jdGlvbiBlc2NhcGVSRSAoc3RyKSB7IHJldHVybiBzdHIucmVwbGFjZSgvWy4/KiteJFtcXF1cXFxcKCl7fXwtXS9nLCAnXFxcXCQmJykgfVxuXG4vL1xuXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgZnV6enlMaW5rOiB0cnVlLFxuICBmdXp6eUVtYWlsOiB0cnVlLFxuICBmdXp6eUlQOiBmYWxzZVxufTtcblxuZnVuY3Rpb24gaXNPcHRpb25zT2JqIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaiB8fCB7fSkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGspIHtcbiAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zICovXG4gICAgcmV0dXJuIGFjYyB8fCBkZWZhdWx0T3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKVxuICB9LCBmYWxzZSlcbn1cblxuY29uc3QgZGVmYXVsdFNjaGVtYXMgPSB7XG4gICdodHRwOic6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLmh0dHApIHtcbiAgICAgICAgLy8gY29tcGlsZSBsYXppbHksIGJlY2F1c2UgXCJob3N0XCItY29udGFpbmluZyB2YXJpYWJsZXMgY2FuIGNoYW5nZSBvbiB0bGRzIHVwZGF0ZS5cbiAgICAgICAgc2VsZi5yZS5odHRwID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXlxcXFwvXFxcXC8nICsgc2VsZi5yZS5zcmNfYXV0aCArIHNlbGYucmUuc3JjX2hvc3RfcG9ydF9zdHJpY3QgKyBzZWxmLnJlLnNyY19wYXRoLCAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLnJlLmh0dHAudGVzdCh0YWlsKSkge1xuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLmh0dHApWzBdLmxlbmd0aFxuICAgICAgfVxuICAgICAgcmV0dXJuIDBcbiAgICB9XG4gIH0sXG4gICdodHRwczonOiAnaHR0cDonLFxuICAnZnRwOic6ICdodHRwOicsXG4gICcvLyc6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgY29uc3QgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLm5vX2h0dHApIHtcbiAgICAgIC8vIGNvbXBpbGUgbGF6aWx5LCBiZWNhdXNlIFwiaG9zdFwiLWNvbnRhaW5pbmcgdmFyaWFibGVzIGNhbiBjaGFuZ2Ugb24gdGxkcyB1cGRhdGUuXG4gICAgICAgIHNlbGYucmUubm9faHR0cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14nICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19hdXRoICtcbiAgICAgICAgICAvLyBEb24ndCBhbGxvdyBzaW5nbGUtbGV2ZWwgZG9tYWlucywgYmVjYXVzZSBvZiBmYWxzZSBwb3NpdGl2ZXMgbGlrZSAnLy90ZXN0J1xuICAgICAgICAgIC8vIHdpdGggY29kZSBjb21tZW50c1xuICAgICAgICAgICcoPzpsb2NhbGhvc3R8KD86KD86JyArIHNlbGYucmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKycgKyBzZWxmLnJlLnNyY19kb21haW5fcm9vdCArICcpJyArXG4gICAgICAgICAgc2VsZi5yZS5zcmNfcG9ydCArXG4gICAgICAgICAgc2VsZi5yZS5zcmNfaG9zdF90ZXJtaW5hdG9yICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19wYXRoLFxuXG4gICAgICAgICAgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxmLnJlLm5vX2h0dHAudGVzdCh0YWlsKSkge1xuICAgICAgICAvLyBzaG91bGQgbm90IGJlIGA6Ly9gICYgYC8vL2AsIHRoYXQgcHJvdGVjdHMgZnJvbSBlcnJvcnMgaW4gcHJvdG9jb2wgbmFtZVxuICAgICAgICBpZiAocG9zID49IDMgJiYgdGV4dFtwb3MgLSAzXSA9PT0gJzonKSB7IHJldHVybiAwIH1cbiAgICAgICAgaWYgKHBvcyA+PSAzICYmIHRleHRbcG9zIC0gM10gPT09ICcvJykgeyByZXR1cm4gMCB9XG4gICAgICAgIHJldHVybiB0YWlsLm1hdGNoKHNlbGYucmUubm9faHR0cClbMF0ubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgfSxcbiAgJ21haWx0bzonOiB7XG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uICh0ZXh0LCBwb3MsIHNlbGYpIHtcbiAgICAgIGNvbnN0IHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICAgIGlmICghc2VsZi5yZS5tYWlsdG8pIHtcbiAgICAgICAgc2VsZi5yZS5tYWlsdG8gPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeJyArIHNlbGYucmUuc3JjX2VtYWlsX25hbWUgKyAnQCcgKyBzZWxmLnJlLnNyY19ob3N0X3N0cmljdCwgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5yZS5tYWlsdG8udGVzdCh0YWlsKSkge1xuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLm1haWx0bylbMF0ubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgfVxufTtcblxuLy8gUkUgcGF0dGVybiBmb3IgMi1jaGFyYWN0ZXIgdGxkcyAoYXV0b2dlbmVyYXRlZCBieSAuL3N1cHBvcnQvdGxkc18yY2hhcl9nZW4uanMpXG4vKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlbiAqL1xuY29uc3QgdGxkc18yY2hfc3JjX3JlID0gJ2FbY2RlZmdpbG1ub3Fyc3R1d3h6XXxiW2FiZGVmZ2hpam1ub3JzdHZ3eXpdfGNbYWNkZmdoaWtsbW5vcnV2d3h5el18ZFtlamttb3pdfGVbY2VncnN0dV18Zltpamttb3JdfGdbYWJkZWZnaGlsbW5wcXJzdHV3eV18aFtrbW5ydHVdfGlbZGVsbW5vcXJzdF18altlbW9wXXxrW2VnaGltbnByd3l6XXxsW2FiY2lrcnN0dXZ5XXxtW2FjZGVnaGtsbW5vcHFyc3R1dnd4eXpdfG5bYWNlZmdpbG9wcnV6XXxvbXxwW2FlZmdoa2xtbnJzdHd5XXxxYXxyW2Vvc3V3XXxzW2FiY2RlZ2hpamtsbW5vcnR1dnh5el18dFtjZGZnaGprbG1ub3J0dnd6XXx1W2Fna3N5el18dlthY2VnaW51XXx3W2ZzXXx5W2V0XXx6W2Ftd10nO1xuXG4vLyBET04nVCB0cnkgdG8gbWFrZSBQUnMgd2l0aCBjaGFuZ2VzLiBFeHRlbmQgVExEcyB3aXRoIExpbmtpZnlJdC50bGRzKCkgaW5zdGVhZFxuY29uc3QgdGxkc19kZWZhdWx0ID0gJ2Jpenxjb218ZWR1fGdvdnxuZXR8b3JnfHByb3x3ZWJ8eHh4fGFlcm98YXNpYXxjb29wfGluZm98bXVzZXVtfG5hbWV8c2hvcHxcdTA0NDBcdTA0NDQnLnNwbGl0KCd8Jyk7XG5cbmZ1bmN0aW9uIHJlc2V0U2NhbkNhY2hlIChzZWxmKSB7XG4gIHNlbGYuX19pbmRleF9fID0gLTE7XG4gIHNlbGYuX190ZXh0X2NhY2hlX18gPSAnJztcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmFsaWRhdG9yIChyZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHRleHQsIHBvcykge1xuICAgIGNvbnN0IHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICBpZiAocmUudGVzdCh0YWlsKSkge1xuICAgICAgcmV0dXJuIHRhaWwubWF0Y2gocmUpWzBdLmxlbmd0aFxuICAgIH1cbiAgICByZXR1cm4gMFxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vcm1hbGl6ZXIgKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKG1hdGNoLCBzZWxmKSB7XG4gICAgc2VsZi5ub3JtYWxpemUobWF0Y2gpO1xuICB9XG59XG5cbi8vIFNjaGVtYXMgY29tcGlsZXIuIEJ1aWxkIHJlZ2V4cHMuXG4vL1xuZnVuY3Rpb24gY29tcGlsZSAoc2VsZikge1xuICAvLyBMb2FkICYgY2xvbmUgUkUgcGF0dGVybnMuXG4gIGNvbnN0IHJlID0gc2VsZi5yZSA9IHJlRmFjdG9yeShzZWxmLl9fb3B0c19fKTtcblxuICAvLyBEZWZpbmUgZHluYW1pYyBwYXR0ZXJuc1xuICBjb25zdCB0bGRzID0gc2VsZi5fX3RsZHNfXy5zbGljZSgpO1xuXG4gIHNlbGYub25Db21waWxlKCk7XG5cbiAgaWYgKCFzZWxmLl9fdGxkc19yZXBsYWNlZF9fKSB7XG4gICAgdGxkcy5wdXNoKHRsZHNfMmNoX3NyY19yZSk7XG4gIH1cbiAgdGxkcy5wdXNoKHJlLnNyY194bik7XG5cbiAgcmUuc3JjX3RsZHMgPSB0bGRzLmpvaW4oJ3wnKTtcblxuICBmdW5jdGlvbiB1bnRwbCAodHBsKSB7IHJldHVybiB0cGwucmVwbGFjZSgnJVRMRFMlJywgcmUuc3JjX3RsZHMpIH1cblxuICByZS5lbWFpbF9mdXp6eSA9IFJlZ0V4cCh1bnRwbChyZS50cGxfZW1haWxfZnV6enkpLCAnaScpO1xuICByZS5saW5rX2Z1enp5ID0gUmVnRXhwKHVudHBsKHJlLnRwbF9saW5rX2Z1enp5KSwgJ2knKTtcbiAgcmUubGlua19ub19pcF9mdXp6eSA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19ub19pcF9mdXp6eSksICdpJyk7XG4gIHJlLmhvc3RfZnV6enlfdGVzdCA9IFJlZ0V4cCh1bnRwbChyZS50cGxfaG9zdF9mdXp6eV90ZXN0KSwgJ2knKTtcblxuICAvL1xuICAvLyBDb21waWxlIGVhY2ggc2NoZW1hXG4gIC8vXG5cbiAgY29uc3QgYWxpYXNlcyA9IFtdO1xuXG4gIHNlbGYuX19jb21waWxlZF9fID0ge307IC8vIFJlc2V0IGNvbXBpbGVkIGRhdGFcblxuICBmdW5jdGlvbiBzY2hlbWFFcnJvciAobmFtZSwgdmFsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCcoTGlua2lmeUl0KSBJbnZhbGlkIHNjaGVtYSBcIicgKyBuYW1lICsgJ1wiOiAnICsgdmFsKVxuICB9XG5cbiAgT2JqZWN0LmtleXMoc2VsZi5fX3NjaGVtYXNfXykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGNvbnN0IHZhbCA9IHNlbGYuX19zY2hlbWFzX19bbmFtZV07XG5cbiAgICAvLyBza2lwIGRpc2FibGVkIG1ldGhvZHNcbiAgICBpZiAodmFsID09PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBjb21waWxlZCA9IHsgdmFsaWRhdGU6IG51bGwsIGxpbms6IG51bGwgfTtcblxuICAgIHNlbGYuX19jb21waWxlZF9fW25hbWVdID0gY29tcGlsZWQ7XG5cbiAgICBpZiAoaXNPYmplY3QodmFsKSkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbC52YWxpZGF0ZSkpIHtcbiAgICAgICAgY29tcGlsZWQudmFsaWRhdGUgPSBjcmVhdGVWYWxpZGF0b3IodmFsLnZhbGlkYXRlKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWwudmFsaWRhdGUpKSB7XG4gICAgICAgIGNvbXBpbGVkLnZhbGlkYXRlID0gdmFsLnZhbGlkYXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRnVuY3Rpb24odmFsLm5vcm1hbGl6ZSkpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gdmFsLm5vcm1hbGl6ZTtcbiAgICAgIH0gZWxzZSBpZiAoIXZhbC5ub3JtYWxpemUpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gY3JlYXRlTm9ybWFsaXplcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGlzU3RyaW5nKHZhbCkpIHtcbiAgICAgIGFsaWFzZXMucHVzaChuYW1lKTtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHNjaGVtYUVycm9yKG5hbWUsIHZhbCk7XG4gIH0pO1xuXG4gIC8vXG4gIC8vIENvbXBpbGUgcG9zdHBvbmVkIGFsaWFzZXNcbiAgLy9cblxuICBhbGlhc2VzLmZvckVhY2goZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgaWYgKCFzZWxmLl9fY29tcGlsZWRfX1tzZWxmLl9fc2NoZW1hc19fW2FsaWFzXV0pIHtcbiAgICAgIC8vIFNpbGVudGx5IGZhaWwgb24gbWlzc2VkIHNjaGVtYXMgdG8gYXZvaWQgZXJyb25zIG9uIGRpc2FibGUuXG4gICAgICAvLyBzY2hlbWFFcnJvcihhbGlhcywgc2VsZi5fX3NjaGVtYXNfX1thbGlhc10pO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc2VsZi5fX2NvbXBpbGVkX19bYWxpYXNdLnZhbGlkYXRlID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS52YWxpZGF0ZTtcbiAgICBzZWxmLl9fY29tcGlsZWRfX1thbGlhc10ubm9ybWFsaXplID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS5ub3JtYWxpemU7XG4gIH0pO1xuXG4gIC8vXG4gIC8vIEZha2UgcmVjb3JkIGZvciBndWVzc2VkIGxpbmtzXG4gIC8vXG4gIHNlbGYuX19jb21waWxlZF9fWycnXSA9IHsgdmFsaWRhdGU6IG51bGwsIG5vcm1hbGl6ZTogY3JlYXRlTm9ybWFsaXplcigpIH07XG5cbiAgLy9cbiAgLy8gQnVpbGQgc2NoZW1hIGNvbmRpdGlvblxuICAvL1xuICBjb25zdCBzbGlzdCA9IE9iamVjdC5rZXlzKHNlbGYuX19jb21waWxlZF9fKVxuICAgIC5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIC8vIEZpbHRlciBkaXNhYmxlZCAmIGZha2Ugc2NoZW1hc1xuICAgICAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiBzZWxmLl9fY29tcGlsZWRfX1tuYW1lXVxuICAgIH0pXG4gICAgLm1hcChlc2NhcGVSRSlcbiAgICAuam9pbignfCcpO1xuICAvLyAoPyFfKSBjYXVzZSAxLjV4IHNsb3dkb3duXG4gIHNlbGYucmUuc2NoZW1hX3Rlc3QgPSBSZWdFeHAoJyhefCg/IV8pKD86Wz48XFx1ZmY1Y118JyArIHJlLnNyY19aUENjICsgJykpKCcgKyBzbGlzdCArICcpJywgJ2knKTtcbiAgc2VsZi5yZS5zY2hlbWFfc2VhcmNoID0gUmVnRXhwKCcoXnwoPyFfKSg/Ols+PFxcdWZmNWNdfCcgKyByZS5zcmNfWlBDYyArICcpKSgnICsgc2xpc3QgKyAnKScsICdpZycpO1xuICBzZWxmLnJlLnNjaGVtYV9hdF9zdGFydCA9IFJlZ0V4cCgnXicgKyBzZWxmLnJlLnNjaGVtYV9zZWFyY2guc291cmNlLCAnaScpO1xuXG4gIHNlbGYucmUucHJldGVzdCA9IFJlZ0V4cChcbiAgICAnKCcgKyBzZWxmLnJlLnNjaGVtYV90ZXN0LnNvdXJjZSArICcpfCgnICsgc2VsZi5yZS5ob3N0X2Z1enp5X3Rlc3Quc291cmNlICsgJyl8QCcsXG4gICAgJ2knXG4gICk7XG5cbiAgLy9cbiAgLy8gQ2xlYW51cFxuICAvL1xuXG4gIHJlc2V0U2NhbkNhY2hlKHNlbGYpO1xufVxuXG4vKipcbiAqIGNsYXNzIE1hdGNoXG4gKlxuICogTWF0Y2ggcmVzdWx0LiBTaW5nbGUgZWxlbWVudCBvZiBhcnJheSwgcmV0dXJuZWQgYnkgW1tMaW5raWZ5SXQjbWF0Y2hdXVxuICoqL1xuZnVuY3Rpb24gTWF0Y2ggKHNlbGYsIHNoaWZ0KSB7XG4gIGNvbnN0IHN0YXJ0ID0gc2VsZi5fX2luZGV4X187XG4gIGNvbnN0IGVuZCA9IHNlbGYuX19sYXN0X2luZGV4X187XG4gIGNvbnN0IHRleHQgPSBzZWxmLl9fdGV4dF9jYWNoZV9fLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gIC8qKlxuICAgKiBNYXRjaCNzY2hlbWEgLT4gU3RyaW5nXG4gICAqXG4gICAqIFByZWZpeCAocHJvdG9jb2wpIGZvciBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnNjaGVtYSA9IHNlbGYuX19zY2hlbWFfXy50b0xvd2VyQ2FzZSgpO1xuICAvKipcbiAgICogTWF0Y2gjaW5kZXggLT4gTnVtYmVyXG4gICAqXG4gICAqIEZpcnN0IHBvc2l0aW9uIG9mIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMuaW5kZXggPSBzdGFydCArIHNoaWZ0O1xuICAvKipcbiAgICogTWF0Y2gjbGFzdEluZGV4IC0+IE51bWJlclxuICAgKlxuICAgKiBOZXh0IHBvc2l0aW9uIGFmdGVyIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMubGFzdEluZGV4ID0gZW5kICsgc2hpZnQ7XG4gIC8qKlxuICAgKiBNYXRjaCNyYXcgLT4gU3RyaW5nXG4gICAqXG4gICAqIE1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMucmF3ID0gdGV4dDtcbiAgLyoqXG4gICAqIE1hdGNoI3RleHQgLT4gU3RyaW5nXG4gICAqXG4gICAqIE5vdG1hbGl6ZWQgdGV4dCBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnRleHQgPSB0ZXh0O1xuICAvKipcbiAgICogTWF0Y2gjdXJsIC0+IFN0cmluZ1xuICAgKlxuICAgKiBOb3JtYWxpemVkIHVybCBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnVybCA9IHRleHQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoIChzZWxmLCBzaGlmdCkge1xuICBjb25zdCBtYXRjaCA9IG5ldyBNYXRjaChzZWxmLCBzaGlmdCk7XG5cbiAgc2VsZi5fX2NvbXBpbGVkX19bbWF0Y2guc2NoZW1hXS5ub3JtYWxpemUobWF0Y2gsIHNlbGYpO1xuXG4gIHJldHVybiBtYXRjaFxufVxuXG4vKipcbiAqIGNsYXNzIExpbmtpZnlJdFxuICoqL1xuXG4vKipcbiAqIG5ldyBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucylcbiAqIC0gc2NoZW1hcyAoT2JqZWN0KTogT3B0aW9uYWwuIEFkZGl0aW9uYWwgc2NoZW1hcyB0byB2YWxpZGF0ZSAocHJlZml4L3ZhbGlkYXRvcilcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogeyBmdXp6eUxpbmt8ZnV6enlFbWFpbHxmdXp6eUlQOiB0cnVlfGZhbHNlIH1cbiAqXG4gKiBDcmVhdGVzIG5ldyBsaW5raWZpZXIgaW5zdGFuY2Ugd2l0aCBvcHRpb25hbCBhZGRpdGlvbmFsIHNjaGVtYXMuXG4gKiBDYW4gYmUgY2FsbGVkIHdpdGhvdXQgYG5ld2Aga2V5d29yZCBmb3IgY29udmVuaWVuY2UuXG4gKlxuICogQnkgZGVmYXVsdCB1bmRlcnN0YW5kczpcbiAqXG4gKiAtIGBodHRwKHMpOi8vLi4uYCAsIGBmdHA6Ly8uLi5gLCBgbWFpbHRvOi4uLmAgJiBgLy8uLi5gIGxpbmtzXG4gKiAtIFwiZnV6enlcIiBsaW5rcyBhbmQgZW1haWxzIChleGFtcGxlLmNvbSwgZm9vQGJhci5jb20pLlxuICpcbiAqIGBzY2hlbWFzYCBpcyBhbiBvYmplY3QsIHdoZXJlIGVhY2gga2V5L3ZhbHVlIGRlc2NyaWJlcyBwcm90b2NvbC9ydWxlOlxuICpcbiAqIC0gX19rZXlfXyAtIGxpbmsgcHJlZml4ICh1c3VhbGx5LCBwcm90b2NvbCBuYW1lIHdpdGggYDpgIGF0IHRoZSBlbmQsIGBza3lwZTpgXG4gKiAgIGZvciBleGFtcGxlKS4gYGxpbmtpZnktaXRgIG1ha2VzIHNodXJlIHRoYXQgcHJlZml4IGlzIG5vdCBwcmVjZWVkZWQgd2l0aFxuICogICBhbHBoYW51bWVyaWMgY2hhciBhbmQgc3ltYm9scy4gT25seSB3aGl0ZXNwYWNlcyBhbmQgcHVuY3R1YXRpb24gYWxsb3dlZC5cbiAqIC0gX192YWx1ZV9fIC0gcnVsZSB0byBjaGVjayB0YWlsIGFmdGVyIGxpbmsgcHJlZml4XG4gKiAgIC0gX1N0cmluZ18gLSBqdXN0IGFsaWFzIHRvIGV4aXN0aW5nIHJ1bGVcbiAqICAgLSBfT2JqZWN0X1xuICogICAgIC0gX3ZhbGlkYXRlXyAtIHZhbGlkYXRvciBmdW5jdGlvbiAoc2hvdWxkIHJldHVybiBtYXRjaGVkIGxlbmd0aCBvbiBzdWNjZXNzKSxcbiAqICAgICAgIG9yIGBSZWdFeHBgLlxuICogICAgIC0gX25vcm1hbGl6ZV8gLSBvcHRpb25hbCBmdW5jdGlvbiB0byBub3JtYWxpemUgdGV4dCAmIHVybCBvZiBtYXRjaGVkIHJlc3VsdFxuICogICAgICAgKGZvciBleGFtcGxlLCBmb3IgQHR3aXR0ZXIgbWVudGlvbnMpLlxuICpcbiAqIGBvcHRpb25zYDpcbiAqXG4gKiAtIF9fZnV6enlMaW5rX18gLSByZWNvZ25pZ2UgVVJMLXMgd2l0aG91dCBgaHR0cChzKTpgIHByZWZpeC4gRGVmYXVsdCBgdHJ1ZWAuXG4gKiAtIF9fZnV6enlJUF9fIC0gYWxsb3cgSVBzIGluIGZ1enp5IGxpbmtzIGFib3ZlLiBDYW4gY29uZmxpY3Qgd2l0aCBzb21lIHRleHRzXG4gKiAgIGxpa2UgdmVyc2lvbiBudW1iZXJzLiBEZWZhdWx0IGBmYWxzZWAuXG4gKiAtIF9fZnV6enlFbWFpbF9fIC0gcmVjb2duaXplIGVtYWlscyB3aXRob3V0IGBtYWlsdG86YCBwcmVmaXguXG4gKlxuICoqL1xuZnVuY3Rpb24gTGlua2lmeUl0IChzY2hlbWFzLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMaW5raWZ5SXQpKSB7XG4gICAgcmV0dXJuIG5ldyBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucylcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIGlmIChpc09wdGlvbnNPYmooc2NoZW1hcykpIHtcbiAgICAgIG9wdGlvbnMgPSBzY2hlbWFzO1xuICAgICAgc2NoZW1hcyA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuX19vcHRzX18gPSBhc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAvLyBDYWNoZSBsYXN0IHRlc3RlZCByZXN1bHQuIFVzZWQgdG8gc2tpcCByZXBlYXRpbmcgc3RlcHMgb24gbmV4dCBgbWF0Y2hgIGNhbGwuXG4gIHRoaXMuX19pbmRleF9fID0gLTE7XG4gIHRoaXMuX19sYXN0X2luZGV4X18gPSAtMTsgLy8gTmV4dCBzY2FuIHBvc2l0aW9uXG4gIHRoaXMuX19zY2hlbWFfXyA9ICcnO1xuICB0aGlzLl9fdGV4dF9jYWNoZV9fID0gJyc7XG5cbiAgdGhpcy5fX3NjaGVtYXNfXyA9IGFzc2lnbih7fSwgZGVmYXVsdFNjaGVtYXMsIHNjaGVtYXMpO1xuICB0aGlzLl9fY29tcGlsZWRfXyA9IHt9O1xuXG4gIHRoaXMuX190bGRzX18gPSB0bGRzX2RlZmF1bHQ7XG4gIHRoaXMuX190bGRzX3JlcGxhY2VkX18gPSBmYWxzZTtcblxuICB0aGlzLnJlID0ge307XG5cbiAgY29tcGlsZSh0aGlzKTtcbn1cblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I2FkZChzY2hlbWEsIGRlZmluaXRpb24pXG4gKiAtIHNjaGVtYSAoU3RyaW5nKTogcnVsZSBuYW1lIChmaXhlZCBwYXR0ZXJuIHByZWZpeClcbiAqIC0gZGVmaW5pdGlvbiAoU3RyaW5nfFJlZ0V4cHxPYmplY3QpOiBzY2hlbWEgZGVmaW5pdGlvblxuICpcbiAqIEFkZCBuZXcgcnVsZSBkZWZpbml0aW9uLiBTZWUgY29uc3RydWN0b3IgZGVzY3JpcHRpb24gZm9yIGRldGFpbHMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoc2NoZW1hLCBkZWZpbml0aW9uKSB7XG4gIHRoaXMuX19zY2hlbWFzX19bc2NoZW1hXSA9IGRlZmluaXRpb247XG4gIGNvbXBpbGUodGhpcyk7XG4gIHJldHVybiB0aGlzXG59O1xuXG4vKiogY2hhaW5hYmxlXG4gKiBMaW5raWZ5SXQjc2V0KG9wdGlvbnMpXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHsgZnV6enlMaW5rfGZ1enp5RW1haWx8ZnV6enlJUDogdHJ1ZXxmYWxzZSB9XG4gKlxuICogU2V0IHJlY29nbml0aW9uIG9wdGlvbnMgZm9yIGxpbmtzIHdpdGhvdXQgc2NoZW1hLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKG9wdGlvbnMpIHtcbiAgdGhpcy5fX29wdHNfXyA9IGFzc2lnbih0aGlzLl9fb3B0c19fLCBvcHRpb25zKTtcbiAgcmV0dXJuIHRoaXNcbn07XG5cbi8qKlxuICogTGlua2lmeUl0I3Rlc3QodGV4dCkgLT4gQm9vbGVhblxuICpcbiAqIFNlYXJjaGVzIGxpbmtpZmlhYmxlIHBhdHRlcm4gYW5kIHJldHVybnMgYHRydWVgIG9uIHN1Y2Nlc3Mgb3IgYGZhbHNlYCBvbiBmYWlsLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24gdGVzdCAodGV4dCkge1xuICAvLyBSZXNldCBzY2FuIGNhY2hlXG4gIHRoaXMuX190ZXh0X2NhY2hlX18gPSB0ZXh0O1xuICB0aGlzLl9faW5kZXhfXyA9IC0xO1xuXG4gIGlmICghdGV4dC5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBsZXQgbSwgbWwsIG1lLCBsZW4sIHNoaWZ0LCBuZXh0LCByZSwgdGxkX3BvcywgYXRfcG9zO1xuXG4gIC8vIHRyeSB0byBzY2FuIGZvciBsaW5rIHdpdGggc2NoZW1hIC0gdGhhdCdzIHRoZSBtb3N0IHNpbXBsZSBydWxlXG4gIGlmICh0aGlzLnJlLnNjaGVtYV90ZXN0LnRlc3QodGV4dCkpIHtcbiAgICByZSA9IHRoaXMucmUuc2NoZW1hX3NlYXJjaDtcbiAgICByZS5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IHJlLmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgICBsZW4gPSB0aGlzLnRlc3RTY2hlbWFBdCh0ZXh0LCBtWzJdLCByZS5sYXN0SW5kZXgpO1xuICAgICAgaWYgKGxlbikge1xuICAgICAgICB0aGlzLl9fc2NoZW1hX18gPSBtWzJdO1xuICAgICAgICB0aGlzLl9faW5kZXhfXyA9IG0uaW5kZXggKyBtWzFdLmxlbmd0aDtcbiAgICAgICAgdGhpcy5fX2xhc3RfaW5kZXhfXyA9IG0uaW5kZXggKyBtWzBdLmxlbmd0aCArIGxlbjtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUxpbmsgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ2h0dHA6J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGxpbmtzXG4gICAgdGxkX3BvcyA9IHRleHQuc2VhcmNoKHRoaXMucmUuaG9zdF9mdXp6eV90ZXN0KTtcbiAgICBpZiAodGxkX3BvcyA+PSAwKSB7XG4gICAgICAvLyBpZiB0bGQgaXMgbG9jYXRlZCBhZnRlciBmb3VuZCBsaW5rIC0gbm8gbmVlZCB0byBjaGVjayBmdXp6eSBwYXR0ZXJuXG4gICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHRsZF9wb3MgPCB0aGlzLl9faW5kZXhfXykge1xuICAgICAgICBpZiAoKG1sID0gdGV4dC5tYXRjaCh0aGlzLl9fb3B0c19fLmZ1enp5SVAgPyB0aGlzLnJlLmxpbmtfZnV6enkgOiB0aGlzLnJlLmxpbmtfbm9faXBfZnV6enkpKSAhPT0gbnVsbCkge1xuICAgICAgICAgIHNoaWZ0ID0gbWwuaW5kZXggKyBtbFsxXS5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHNoaWZ0IDwgdGhpcy5fX2luZGV4X18pIHtcbiAgICAgICAgICAgIHRoaXMuX19zY2hlbWFfXyA9ICcnO1xuICAgICAgICAgICAgdGhpcy5fX2luZGV4X18gPSBzaGlmdDtcbiAgICAgICAgICAgIHRoaXMuX19sYXN0X2luZGV4X18gPSBtbC5pbmRleCArIG1sWzBdLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUVtYWlsICYmIHRoaXMuX19jb21waWxlZF9fWydtYWlsdG86J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGVtYWlsc1xuICAgIGF0X3BvcyA9IHRleHQuaW5kZXhPZignQCcpO1xuICAgIGlmIChhdF9wb3MgPj0gMCkge1xuICAgICAgLy8gV2UgY2FuJ3Qgc2tpcCB0aGlzIGNoZWNrLCBiZWNhdXNlIHRoaXMgY2FzZXMgYXJlIHBvc3NpYmxlOlxuICAgICAgLy8gMTkyLjE2OC4xLjFAZ21haWwuY29tLCBteS5pbkBleGFtcGxlLmNvbVxuICAgICAgaWYgKChtZSA9IHRleHQubWF0Y2godGhpcy5yZS5lbWFpbF9mdXp6eSkpICE9PSBudWxsKSB7XG4gICAgICAgIHNoaWZ0ID0gbWUuaW5kZXggKyBtZVsxXS5sZW5ndGg7XG4gICAgICAgIG5leHQgPSBtZS5pbmRleCArIG1lWzBdLmxlbmd0aDtcblxuICAgICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHNoaWZ0IDwgdGhpcy5fX2luZGV4X18gfHxcbiAgICAgICAgICAgIChzaGlmdCA9PT0gdGhpcy5fX2luZGV4X18gJiYgbmV4dCA+IHRoaXMuX19sYXN0X2luZGV4X18pKSB7XG4gICAgICAgICAgdGhpcy5fX3NjaGVtYV9fID0gJ21haWx0bzonO1xuICAgICAgICAgIHRoaXMuX19pbmRleF9fID0gc2hpZnQ7XG4gICAgICAgICAgdGhpcy5fX2xhc3RfaW5kZXhfXyA9IG5leHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5fX2luZGV4X18gPj0gMFxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjcHJldGVzdCh0ZXh0KSAtPiBCb29sZWFuXG4gKlxuICogVmVyeSBxdWljayBjaGVjaywgdGhhdCBjYW4gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMuIFJldHVybnMgdHJ1ZSBpZiBsaW5rIE1BWSBCRVxuICogY2FuIGV4aXN0cy4gQ2FuIGJlIHVzZWQgZm9yIHNwZWVkIG9wdGltaXphdGlvbiwgd2hlbiB5b3UgbmVlZCB0byBjaGVjayB0aGF0XG4gKiBsaW5rIE5PVCBleGlzdHMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnByZXRlc3QgPSBmdW5jdGlvbiBwcmV0ZXN0ICh0ZXh0KSB7XG4gIHJldHVybiB0aGlzLnJlLnByZXRlc3QudGVzdCh0ZXh0KVxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjdGVzdFNjaGVtYUF0KHRleHQsIG5hbWUsIHBvc2l0aW9uKSAtPiBOdW1iZXJcbiAqIC0gdGV4dCAoU3RyaW5nKTogdGV4dCB0byBzY2FuXG4gKiAtIG5hbWUgKFN0cmluZyk6IHJ1bGUgKHNjaGVtYSkgbmFtZVxuICogLSBwb3NpdGlvbiAoTnVtYmVyKTogdGV4dCBvZmZzZXQgdG8gY2hlY2sgZnJvbVxuICpcbiAqIFNpbWlsYXIgdG8gW1tMaW5raWZ5SXQjdGVzdF1dIGJ1dCBjaGVja3Mgb25seSBzcGVjaWZpYyBwcm90b2NvbCB0YWlsIGV4YWN0bHlcbiAqIGF0IGdpdmVuIHBvc2l0aW9uLiBSZXR1cm5zIGxlbmd0aCBvZiBmb3VuZCBwYXR0ZXJuICgwIG9uIGZhaWwpLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50ZXN0U2NoZW1hQXQgPSBmdW5jdGlvbiB0ZXN0U2NoZW1hQXQgKHRleHQsIHNjaGVtYSwgcG9zKSB7XG4gIC8vIElmIG5vdCBzdXBwb3J0ZWQgc2NoZW1hIGNoZWNrIHJlcXVlc3RlZCAtIHRlcm1pbmF0ZVxuICBpZiAoIXRoaXMuX19jb21waWxlZF9fW3NjaGVtYS50b0xvd2VyQ2FzZSgpXSkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgcmV0dXJuIHRoaXMuX19jb21waWxlZF9fW3NjaGVtYS50b0xvd2VyQ2FzZSgpXS52YWxpZGF0ZSh0ZXh0LCBwb3MsIHRoaXMpXG59O1xuXG4vKipcbiAqIExpbmtpZnlJdCNtYXRjaCh0ZXh0KSAtPiBBcnJheXxudWxsXG4gKlxuICogUmV0dXJucyBhcnJheSBvZiBmb3VuZCBsaW5rIGRlc2NyaXB0aW9ucyBvciBgbnVsbGAgb24gZmFpbC4gV2Ugc3Ryb25nbHlcbiAqIHJlY29tbWVuZCB0byB1c2UgW1tMaW5raWZ5SXQjdGVzdF1dIGZpcnN0LCBmb3IgYmVzdCBzcGVlZC5cbiAqXG4gKiAjIyMjIyBSZXN1bHQgbWF0Y2ggZGVzY3JpcHRpb25cbiAqXG4gKiAtIF9fc2NoZW1hX18gLSBsaW5rIHNjaGVtYSwgY2FuIGJlIGVtcHR5IGZvciBmdXp6eSBsaW5rcywgb3IgYC8vYCBmb3JcbiAqICAgcHJvdG9jb2wtbmV1dHJhbCAgbGlua3MuXG4gKiAtIF9faW5kZXhfXyAtIG9mZnNldCBvZiBtYXRjaGVkIHRleHRcbiAqIC0gX19sYXN0SW5kZXhfXyAtIGluZGV4IG9mIG5leHQgY2hhciBhZnRlciBtYXRoY2ggZW5kXG4gKiAtIF9fcmF3X18gLSBtYXRjaGVkIHRleHRcbiAqIC0gX190ZXh0X18gLSBub3JtYWxpemVkIHRleHRcbiAqIC0gX191cmxfXyAtIGxpbmssIGdlbmVyYXRlZCBmcm9tIG1hdGNoZWQgdGV4dFxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uIG1hdGNoICh0ZXh0KSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBsZXQgc2hpZnQgPSAwO1xuXG4gIC8vIFRyeSB0byB0YWtlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSBjYWNoZSwgaWYgLnRlc3QoKSBjYWxsZWQgYmVmb3JlXG4gIGlmICh0aGlzLl9faW5kZXhfXyA+PSAwICYmIHRoaXMuX190ZXh0X2NhY2hlX18gPT09IHRleHQpIHtcbiAgICByZXN1bHQucHVzaChjcmVhdGVNYXRjaCh0aGlzLCBzaGlmdCkpO1xuICAgIHNoaWZ0ID0gdGhpcy5fX2xhc3RfaW5kZXhfXztcbiAgfVxuXG4gIC8vIEN1dCBoZWFkIGlmIGNhY2hlIHdhcyB1c2VkXG4gIGxldCB0YWlsID0gc2hpZnQgPyB0ZXh0LnNsaWNlKHNoaWZ0KSA6IHRleHQ7XG5cbiAgLy8gU2NhbiBzdHJpbmcgdW50aWwgZW5kIHJlYWNoZWRcbiAgd2hpbGUgKHRoaXMudGVzdCh0YWlsKSkge1xuICAgIHJlc3VsdC5wdXNoKGNyZWF0ZU1hdGNoKHRoaXMsIHNoaWZ0KSk7XG5cbiAgICB0YWlsID0gdGFpbC5zbGljZSh0aGlzLl9fbGFzdF9pbmRleF9fKTtcbiAgICBzaGlmdCArPSB0aGlzLl9fbGFzdF9pbmRleF9fO1xuICB9XG5cbiAgaWYgKHJlc3VsdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICByZXR1cm4gbnVsbFxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjbWF0Y2hBdFN0YXJ0KHRleHQpIC0+IE1hdGNofG51bGxcbiAqXG4gKiBSZXR1cm5zIGZ1bGx5LWZvcm1lZCAobm90IGZ1enp5KSBsaW5rIGlmIGl0IHN0YXJ0cyBhdCB0aGUgYmVnaW5uaW5nXG4gKiBvZiB0aGUgc3RyaW5nLCBhbmQgbnVsbCBvdGhlcndpc2UuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm1hdGNoQXRTdGFydCA9IGZ1bmN0aW9uIG1hdGNoQXRTdGFydCAodGV4dCkge1xuICAvLyBSZXNldCBzY2FuIGNhY2hlXG4gIHRoaXMuX190ZXh0X2NhY2hlX18gPSB0ZXh0O1xuICB0aGlzLl9faW5kZXhfXyA9IC0xO1xuXG4gIGlmICghdGV4dC5sZW5ndGgpIHJldHVybiBudWxsXG5cbiAgY29uc3QgbSA9IHRoaXMucmUuc2NoZW1hX2F0X3N0YXJ0LmV4ZWModGV4dCk7XG4gIGlmICghbSkgcmV0dXJuIG51bGxcblxuICBjb25zdCBsZW4gPSB0aGlzLnRlc3RTY2hlbWFBdCh0ZXh0LCBtWzJdLCBtWzBdLmxlbmd0aCk7XG4gIGlmICghbGVuKSByZXR1cm4gbnVsbFxuXG4gIHRoaXMuX19zY2hlbWFfXyA9IG1bMl07XG4gIHRoaXMuX19pbmRleF9fID0gbS5pbmRleCArIG1bMV0ubGVuZ3RoO1xuICB0aGlzLl9fbGFzdF9pbmRleF9fID0gbS5pbmRleCArIG1bMF0ubGVuZ3RoICsgbGVuO1xuXG4gIHJldHVybiBjcmVhdGVNYXRjaCh0aGlzLCAwKVxufTtcblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I3RsZHMobGlzdCBbLCBrZWVwT2xkXSkgLT4gdGhpc1xuICogLSBsaXN0IChBcnJheSk6IGxpc3Qgb2YgdGxkc1xuICogLSBrZWVwT2xkIChCb29sZWFuKTogbWVyZ2Ugd2l0aCBjdXJyZW50IGxpc3QgaWYgYHRydWVgIChgZmFsc2VgIGJ5IGRlZmF1bHQpXG4gKlxuICogTG9hZCAob3IgbWVyZ2UpIG5ldyB0bGRzIGxpc3QuIFRob3NlIGFyZSB1c2VyIGZvciBmdXp6eSBsaW5rcyAod2l0aG91dCBwcmVmaXgpXG4gKiB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZXMuIEJ5IGRlZmF1bHQgdGhpcyBhbGdvcnl0aG0gdXNlZDpcbiAqXG4gKiAtIGhvc3RuYW1lIHdpdGggYW55IDItbGV0dGVyIHJvb3Qgem9uZXMgYXJlIG9rLlxuICogLSBiaXp8Y29tfGVkdXxnb3Z8bmV0fG9yZ3xwcm98d2VifHh4eHxhZXJvfGFzaWF8Y29vcHxpbmZvfG11c2V1bXxuYW1lfHNob3B8XHUwNDQwXHUwNDQ0XG4gKiAgIGFyZSBvay5cbiAqIC0gZW5jb2RlZCAoYHhuLS0uLi5gKSByb290IHpvbmVzIGFyZSBvay5cbiAqXG4gKiBJZiBsaXN0IGlzIHJlcGxhY2VkLCB0aGVuIGV4YWN0IG1hdGNoIGZvciAyLWNoYXJzIHJvb3Qgem9uZXMgd2lsbCBiZSBjaGVja2VkLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50bGRzID0gZnVuY3Rpb24gdGxkcyAobGlzdCwga2VlcE9sZCkge1xuICBsaXN0ID0gQXJyYXkuaXNBcnJheShsaXN0KSA/IGxpc3QgOiBbbGlzdF07XG5cbiAgaWYgKCFrZWVwT2xkKSB7XG4gICAgdGhpcy5fX3RsZHNfXyA9IGxpc3Quc2xpY2UoKTtcbiAgICB0aGlzLl9fdGxkc19yZXBsYWNlZF9fID0gdHJ1ZTtcbiAgICBjb21waWxlKHRoaXMpO1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICB0aGlzLl9fdGxkc19fID0gdGhpcy5fX3RsZHNfXy5jb25jYXQobGlzdClcbiAgICAuc29ydCgpXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoZWwsIGlkeCwgYXJyKSB7XG4gICAgICByZXR1cm4gZWwgIT09IGFycltpZHggLSAxXVxuICAgIH0pXG4gICAgLnJldmVyc2UoKTtcblxuICBjb21waWxlKHRoaXMpO1xuICByZXR1cm4gdGhpc1xufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjbm9ybWFsaXplKG1hdGNoKVxuICpcbiAqIERlZmF1bHQgbm9ybWFsaXplciAoaWYgc2NoZW1hIGRvZXMgbm90IGRlZmluZSBpdCdzIG93bikuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSAobWF0Y2gpIHtcbiAgLy8gRG8gbWluaW1hbCBwb3NzaWJsZSBjaGFuZ2VzIGJ5IGRlZmF1bHQuIE5lZWQgdG8gY29sbGVjdCBmZWVkYmFjayBwcmlvclxuICAvLyB0byBtb3ZlIGZvcndhcmQgaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L2xpbmtpZnktaXQvaXNzdWVzLzFcblxuICBpZiAoIW1hdGNoLnNjaGVtYSkgeyBtYXRjaC51cmwgPSAnaHR0cDovLycgKyBtYXRjaC51cmw7IH1cblxuICBpZiAobWF0Y2guc2NoZW1hID09PSAnbWFpbHRvOicgJiYgIS9ebWFpbHRvOi9pLnRlc3QobWF0Y2gudXJsKSkge1xuICAgIG1hdGNoLnVybCA9ICdtYWlsdG86JyArIG1hdGNoLnVybDtcbiAgfVxufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjb25Db21waWxlKClcbiAqXG4gKiBPdmVycmlkZSB0byBtb2RpZnkgYmFzaWMgUmVnRXhwLXMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm9uQ29tcGlsZSA9IGZ1bmN0aW9uIG9uQ29tcGlsZSAoKSB7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmtpZnlJdDtcbiIsICIndXNlIHN0cmljdCc7XG5cbi8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cbmNvbnN0IG1heEludCA9IDIxNDc0ODM2NDc7IC8vIGFrYS4gMHg3RkZGRkZGRiBvciAyXjMxLTFcblxuLyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuY29uc3QgYmFzZSA9IDM2O1xuY29uc3QgdE1pbiA9IDE7XG5jb25zdCB0TWF4ID0gMjY7XG5jb25zdCBza2V3ID0gMzg7XG5jb25zdCBkYW1wID0gNzAwO1xuY29uc3QgaW5pdGlhbEJpYXMgPSA3MjtcbmNvbnN0IGluaXRpYWxOID0gMTI4OyAvLyAweDgwXG5jb25zdCBkZWxpbWl0ZXIgPSAnLSc7IC8vICdcXHgyRCdcblxuLyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cbmNvbnN0IHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vO1xuY29uc3QgcmVnZXhOb25BU0NJSSA9IC9bXlxcMC1cXHg3Rl0vOyAvLyBOb3RlOiBVKzAwN0YgREVMIGlzIGV4Y2x1ZGVkIHRvby5cbmNvbnN0IHJlZ2V4U2VwYXJhdG9ycyA9IC9bXFx4MkVcXHUzMDAyXFx1RkYwRVxcdUZGNjFdL2c7IC8vIFJGQyAzNDkwIHNlcGFyYXRvcnNcblxuLyoqIEVycm9yIG1lc3NhZ2VzICovXG5jb25zdCBlcnJvcnMgPSB7XG5cdCdvdmVyZmxvdyc6ICdPdmVyZmxvdzogaW5wdXQgbmVlZHMgd2lkZXIgaW50ZWdlcnMgdG8gcHJvY2VzcycsXG5cdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG59O1xuXG4vKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5jb25zdCBiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW47XG5jb25zdCBmbG9vciA9IE1hdGguZmxvb3I7XG5jb25zdCBzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuLyoqXG4gKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXJyb3IgdHlwZS5cbiAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gZXJyb3IodHlwZSkge1xuXHR0aHJvdyBuZXcgUmFuZ2VFcnJvcihlcnJvcnNbdHlwZV0pO1xufVxuXG4vKipcbiAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCB1dGlsaXR5IGZ1bmN0aW9uLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnkgYXJyYXlcbiAqIGl0ZW0uXG4gKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG1hcChhcnJheSwgY2FsbGJhY2spIHtcblx0Y29uc3QgcmVzdWx0ID0gW107XG5cdGxldCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdHJlc3VsdFtsZW5ndGhdID0gY2FsbGJhY2soYXJyYXlbbGVuZ3RoXSk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBBIHNpbXBsZSBgQXJyYXkjbWFwYC1saWtlIHdyYXBwZXIgdG8gd29yayB3aXRoIGRvbWFpbiBuYW1lIHN0cmluZ3Mgb3IgZW1haWxcbiAqIGFkZHJlc3Nlcy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG4gKiBjaGFyYWN0ZXIuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcbiAqIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtYXBEb21haW4oZG9tYWluLCBjYWxsYmFjaykge1xuXHRjb25zdCBwYXJ0cyA9IGRvbWFpbi5zcGxpdCgnQCcpO1xuXHRsZXQgcmVzdWx0ID0gJyc7XG5cdGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0Ly8gSW4gZW1haWwgYWRkcmVzc2VzLCBvbmx5IHRoZSBkb21haW4gbmFtZSBzaG91bGQgYmUgcHVueWNvZGVkLiBMZWF2ZVxuXHRcdC8vIHRoZSBsb2NhbCBwYXJ0IChpLmUuIGV2ZXJ5dGhpbmcgdXAgdG8gYEBgKSBpbnRhY3QuXG5cdFx0cmVzdWx0ID0gcGFydHNbMF0gKyAnQCc7XG5cdFx0ZG9tYWluID0gcGFydHNbMV07XG5cdH1cblx0Ly8gQXZvaWQgYHNwbGl0KHJlZ2V4KWAgZm9yIElFOCBjb21wYXRpYmlsaXR5LiBTZWUgIzE3LlxuXHRkb21haW4gPSBkb21haW4ucmVwbGFjZShyZWdleFNlcGFyYXRvcnMsICdcXHgyRScpO1xuXHRjb25zdCBsYWJlbHMgPSBkb21haW4uc3BsaXQoJy4nKTtcblx0Y29uc3QgZW5jb2RlZCA9IG1hcChsYWJlbHMsIGNhbGxiYWNrKS5qb2luKCcuJyk7XG5cdHJldHVybiByZXN1bHQgKyBlbmNvZGVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcbiAqIGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBXaGlsZSBKYXZhU2NyaXB0IHVzZXMgVUNTLTIgaW50ZXJuYWxseSxcbiAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG4gKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcbiAqIG1hdGNoaW5nIFVURi0xNi5cbiAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG4gKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuICogQG5hbWUgZGVjb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuICogQHJldHVybnMge0FycmF5fSBUaGUgbmV3IGFycmF5IG9mIGNvZGUgcG9pbnRzLlxuICovXG5mdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRjb25zdCBvdXRwdXQgPSBbXTtcblx0bGV0IGNvdW50ZXIgPSAwO1xuXHRjb25zdCBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdGNvbnN0IHZhbHVlID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHQvLyBJdCdzIGEgaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyLlxuXHRcdFx0Y29uc3QgZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKChleHRyYSAmIDB4RkMwMCkgPT0gMHhEQzAwKSB7IC8vIExvdyBzdXJyb2dhdGUuXG5cdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBJdCdzIGFuIHVubWF0Y2hlZCBzdXJyb2dhdGU7IG9ubHkgYXBwZW5kIHRoaXMgY29kZSB1bml0LCBpbiBjYXNlIHRoZVxuXHRcdFx0XHQvLyBuZXh0IGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpci5cblx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG4gKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcbiAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG4gKiBAbmFtZSBlbmNvZGVcbiAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmV3IFVuaWNvZGUgc3RyaW5nIChVQ1MtMikuXG4gKi9cbmNvbnN0IHVjczJlbmNvZGUgPSBjb2RlUG9pbnRzID0+IFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLmNvZGVQb2ludHMpO1xuXG4vKipcbiAqIENvbnZlcnRzIGEgYmFzaWMgY29kZSBwb2ludCBpbnRvIGEgZGlnaXQvaW50ZWdlci5cbiAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlUG9pbnQgVGhlIGJhc2ljIG51bWVyaWMgY29kZSBwb2ludCB2YWx1ZS5cbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuICogdGhlIGNvZGUgcG9pbnQgZG9lcyBub3QgcmVwcmVzZW50IGEgdmFsdWUuXG4gKi9cbmNvbnN0IGJhc2ljVG9EaWdpdCA9IGZ1bmN0aW9uKGNvZGVQb2ludCkge1xuXHRpZiAoY29kZVBvaW50ID49IDB4MzAgJiYgY29kZVBvaW50IDwgMHgzQSkge1xuXHRcdHJldHVybiAyNiArIChjb2RlUG9pbnQgLSAweDMwKTtcblx0fVxuXHRpZiAoY29kZVBvaW50ID49IDB4NDEgJiYgY29kZVBvaW50IDwgMHg1Qikge1xuXHRcdHJldHVybiBjb2RlUG9pbnQgLSAweDQxO1xuXHR9XG5cdGlmIChjb2RlUG9pbnQgPj0gMHg2MSAmJiBjb2RlUG9pbnQgPCAweDdCKSB7XG5cdFx0cmV0dXJuIGNvZGVQb2ludCAtIDB4NjE7XG5cdH1cblx0cmV0dXJuIGJhc2U7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cbiAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpcyBgZGlnaXRgLCB3aGljaCBuZWVkcyB0byBiZSBpbiB0aGUgcmFuZ2VcbiAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcbiAqIGlmIGBmbGFnYCBpcyBub24temVybyBhbmQgYGRpZ2l0YCBoYXMgbm8gdXBwZXJjYXNlIGZvcm0uXG4gKi9cbmNvbnN0IGRpZ2l0VG9CYXNpYyA9IGZ1bmN0aW9uKGRpZ2l0LCBmbGFnKSB7XG5cdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdC8vIDI2Li4zNSBtYXAgdG8gQVNDSUkgMC4uOVxuXHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xufTtcblxuLyoqXG4gKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuICogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM0OTIjc2VjdGlvbi0zLjRcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IGFkYXB0ID0gZnVuY3Rpb24oZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdGxldCBrID0gMDtcblx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRmb3IgKC8qIG5vIGluaXRpYWxpemF0aW9uICovOyBkZWx0YSA+IGJhc2VNaW51c1RNaW4gKiB0TWF4ID4+IDE7IGsgKz0gYmFzZSkge1xuXHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0fVxuXHRyZXR1cm4gZmxvb3IoayArIChiYXNlTWludXNUTWluICsgMSkgKiBkZWx0YSAvIChkZWx0YSArIHNrZXcpKTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcbiAqIHN5bWJvbHMuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cbiAqL1xuY29uc3QgZGVjb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0Ly8gRG9uJ3QgdXNlIFVDUy0yLlxuXHRjb25zdCBvdXRwdXQgPSBbXTtcblx0Y29uc3QgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGg7XG5cdGxldCBpID0gMDtcblx0bGV0IG4gPSBpbml0aWFsTjtcblx0bGV0IGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzOiBsZXQgYGJhc2ljYCBiZSB0aGUgbnVtYmVyIG9mIGlucHV0IGNvZGVcblx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0bGV0IGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdGJhc2ljID0gMDtcblx0fVxuXG5cdGZvciAobGV0IGogPSAwOyBqIDwgYmFzaWM7ICsraikge1xuXHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdGVycm9yKCdub3QtYmFzaWMnKTtcblx0XHR9XG5cdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdH1cblxuXHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0Zm9yIChsZXQgaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0Ly8gRGVjb2RlIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXIgaW50byBgZGVsdGFgLFxuXHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHQvLyB2YWx1ZSBhdCB0aGUgZW5kIHRvIG9idGFpbiBgZGVsdGFgLlxuXHRcdGNvbnN0IG9sZGkgPSBpO1xuXHRcdGZvciAobGV0IHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdGVycm9yKCdpbnZhbGlkLWlucHV0Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRpZiAoZGlnaXQgPj0gYmFzZSkge1xuXHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0Y29uc3QgdCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cblx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdH1cblxuXHRcdGNvbnN0IG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0Ly8gYGlgIHdhcyBzdXBwb3NlZCB0byB3cmFwIGFyb3VuZCBmcm9tIGBvdXRgIHRvIGAwYCxcblx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdH1cblxuXHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0aSAlPSBvdXQ7XG5cblx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0LlxuXHRcdG91dHB1dC5zcGxpY2UoaSsrLCAwLCBuKTtcblxuXHR9XG5cblx0cmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KC4uLm91dHB1dCk7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG4gKiBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuICogQG1lbWJlck9mIHB1bnljb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG4gKi9cbmNvbnN0IGVuY29kZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXG5cdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIGFuIGFycmF5IG9mIFVuaWNvZGUgY29kZSBwb2ludHMuXG5cdGlucHV0ID0gdWNzMmRlY29kZShpbnB1dCk7XG5cblx0Ly8gQ2FjaGUgdGhlIGxlbmd0aC5cblx0Y29uc3QgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGg7XG5cblx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGUuXG5cdGxldCBuID0gaW5pdGlhbE47XG5cdGxldCBkZWx0YSA9IDA7XG5cdGxldCBiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50cy5cblx0Zm9yIChjb25zdCBjdXJyZW50VmFsdWUgb2YgaW5wdXQpIHtcblx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGJhc2ljTGVuZ3RoID0gb3V0cHV0Lmxlbmd0aDtcblx0bGV0IGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGg7XG5cblx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdC8vIGBiYXNpY0xlbmd0aGAgaXMgdGhlIG51bWJlciBvZiBiYXNpYyBjb2RlIHBvaW50cy5cblxuXHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyB3aXRoIGEgZGVsaW1pdGVyIHVubGVzcyBpdCdzIGVtcHR5LlxuXHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHR9XG5cblx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0Ly8gQWxsIG5vbi1iYXNpYyBjb2RlIHBvaW50cyA8IG4gaGF2ZSBiZWVuIGhhbmRsZWQgYWxyZWFkeS4gRmluZCB0aGUgbmV4dFxuXHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0bGV0IG0gPSBtYXhJbnQ7XG5cdFx0Zm9yIChjb25zdCBjdXJyZW50VmFsdWUgb2YgaW5wdXQpIHtcblx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdG0gPSBjdXJyZW50VmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSW5jcmVhc2UgYGRlbHRhYCBlbm91Z2ggdG8gYWR2YW5jZSB0aGUgZGVjb2RlcidzIDxuLGk+IHN0YXRlIHRvIDxtLDA+LFxuXHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93LlxuXHRcdGNvbnN0IGhhbmRsZWRDUENvdW50UGx1c09uZSA9IGhhbmRsZWRDUENvdW50ICsgMTtcblx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0fVxuXG5cdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRuID0gbTtcblxuXHRcdGZvciAoY29uc3QgY3VycmVudFZhbHVlIG9mIGlucHV0KSB7XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PT0gbikge1xuXHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlci5cblx0XHRcdFx0bGV0IHEgPSBkZWx0YTtcblx0XHRcdFx0Zm9yIChsZXQgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0Y29uc3QgdCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29uc3QgcU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdGNvbnN0IGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRvdXRwdXQucHVzaChcblx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHEgPSBmbG9vcihxTWludXNUIC8gYmFzZU1pbnVzVCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdGJpYXMgPSBhZGFwdChkZWx0YSwgaGFuZGxlZENQQ291bnRQbHVzT25lLCBoYW5kbGVkQ1BDb3VudCA9PT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdCsraGFuZGxlZENQQ291bnQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0KytkZWx0YTtcblx0XHQrK247XG5cblx0fVxuXHRyZXR1cm4gb3V0cHV0LmpvaW4oJycpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG4gKiB0byBVbmljb2RlLiBPbmx5IHRoZSBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGlucHV0IHdpbGwgYmUgY29udmVydGVkLCBpLmUuXG4gKiBpdCBkb2Vzbid0IG1hdHRlciBpZiB5b3UgY2FsbCBpdCBvbiBhIHN0cmluZyB0aGF0IGhhcyBhbHJlYWR5IGJlZW5cbiAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuICogQG1lbWJlck9mIHB1bnljb2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlZCBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzIHRvXG4gKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgVW5pY29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gUHVueWNvZGVcbiAqIHN0cmluZy5cbiAqL1xuY29uc3QgdG9Vbmljb2RlID0gZnVuY3Rpb24oaW5wdXQpIHtcblx0cmV0dXJuIG1hcERvbWFpbihpbnB1dCwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHJlZ2V4UHVueWNvZGUudGVzdChzdHJpbmcpXG5cdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdDogc3RyaW5nO1xuXHR9KTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG4gKiBQdW55Y29kZS4gT25seSB0aGUgbm9uLUFTQ0lJIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCxcbiAqIGkuZS4gaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0J3MgYWxyZWFkeSBpblxuICogQVNDSUkuXG4gKiBAbWVtYmVyT2YgcHVueWNvZGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0byBjb252ZXJ0LCBhcyBhXG4gKiBVbmljb2RlIHN0cmluZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUgb3JcbiAqIGVtYWlsIGFkZHJlc3MuXG4gKi9cbmNvbnN0IHRvQVNDSUkgPSBmdW5jdGlvbihpbnB1dCkge1xuXHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRyZXR1cm4gcmVnZXhOb25BU0NJSS50ZXN0KHN0cmluZylcblx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdDogc3RyaW5nO1xuXHR9KTtcbn07XG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4vKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5jb25zdCBwdW55Y29kZSA9IHtcblx0LyoqXG5cdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEB0eXBlIFN0cmluZ1xuXHQgKi9cblx0J3ZlcnNpb24nOiAnMi4zLjEnLFxuXHQvKipcblx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0ICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAdHlwZSBPYmplY3Rcblx0ICovXG5cdCd1Y3MyJzoge1xuXHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdCdlbmNvZGUnOiB1Y3MyZW5jb2RlXG5cdH0sXG5cdCdkZWNvZGUnOiBkZWNvZGUsXG5cdCdlbmNvZGUnOiBlbmNvZGUsXG5cdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcbiIsICIndXNlIHN0cmljdCc7XG5cbnZhciBtZHVybCA9IHJlcXVpcmUoJ21kdXJsJyk7XG52YXIgdWNtaWNybyA9IHJlcXVpcmUoJ3VjLm1pY3JvJyk7XG52YXIgZW50aXRpZXMgPSByZXF1aXJlKCdlbnRpdGllcycpO1xudmFyIExpbmtpZnlJdCA9IHJlcXVpcmUoJ2xpbmtpZnktaXQnKTtcbnZhciBwdW55Y29kZSA9IHJlcXVpcmUoJ3B1bnljb2RlLmpzJyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wTmFtZXNwYWNlRGVmYXVsdChlKSB7XG4gIHZhciBuID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKGUpIHtcbiAgICBPYmplY3Qua2V5cyhlKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICBpZiAoayAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgIHZhciBkID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihlLCBrKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG4sIGssIGQuZ2V0ID8gZCA6IHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gZVtrXTsgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBuLmRlZmF1bHQgPSBlO1xuICByZXR1cm4gT2JqZWN0LmZyZWV6ZShuKTtcbn1cblxudmFyIG1kdXJsX19uYW1lc3BhY2UgPSAvKiNfX1BVUkVfXyovX2ludGVyb3BOYW1lc3BhY2VEZWZhdWx0KG1kdXJsKTtcbnZhciB1Y21pY3JvX19uYW1lc3BhY2UgPSAvKiNfX1BVUkVfXyovX2ludGVyb3BOYW1lc3BhY2VEZWZhdWx0KHVjbWljcm8pO1xuXG4vLyBVdGlsaXRpZXNcbi8vXG5cbmZ1bmN0aW9uIF9jbGFzcyhvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNTdHJpbmcob2JqKSB7XG4gIHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG59XG5jb25zdCBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gaGFzKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG59XG5cbi8vIE1lcmdlIG9iamVjdHNcbi8vXG5mdW5jdGlvbiBhc3NpZ24ob2JqIC8qIGZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiAqLykge1xuICBjb25zdCBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc291cmNlICsgJ211c3QgYmUgb2JqZWN0Jyk7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBvYmpba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLy8gUmVtb3ZlIGVsZW1lbnQgZnJvbSBhcnJheSBhbmQgcHV0IGFub3RoZXIgYXJyYXkgYXQgdGhvc2UgcG9zaXRpb24uXG4vLyBVc2VmdWwgZm9yIHNvbWUgb3BlcmF0aW9ucyB3aXRoIHRva2Vuc1xuZnVuY3Rpb24gYXJyYXlSZXBsYWNlQXQoc3JjLCBwb3MsIG5ld0VsZW1lbnRzKSB7XG4gIHJldHVybiBbXS5jb25jYXQoc3JjLnNsaWNlKDAsIHBvcyksIG5ld0VsZW1lbnRzLCBzcmMuc2xpY2UocG9zICsgMSkpO1xufVxuZnVuY3Rpb24gaXNWYWxpZEVudGl0eUNvZGUoYykge1xuICAvKiBlc2xpbnQgbm8tYml0d2lzZTowICovXG4gIC8vIGJyb2tlbiBzZXF1ZW5jZVxuICBpZiAoYyA+PSAweEQ4MDAgJiYgYyA8PSAweERGRkYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gbmV2ZXIgdXNlZFxuICBpZiAoYyA+PSAweEZERDAgJiYgYyA8PSAweEZERUYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKChjICYgMHhGRkZGKSA9PT0gMHhGRkZGIHx8IChjICYgMHhGRkZGKSA9PT0gMHhGRkZFKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGNvbnRyb2wgY29kZXNcbiAgaWYgKGMgPj0gMHgwMCAmJiBjIDw9IDB4MDgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGMgPT09IDB4MEIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGMgPj0gMHgwRSAmJiBjIDw9IDB4MUYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGMgPj0gMHg3RiAmJiBjIDw9IDB4OUYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gb3V0IG9mIHJhbmdlXG4gIGlmIChjID4gMHgxMEZGRkYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBmcm9tQ29kZVBvaW50KGMpIHtcbiAgLyogZXNsaW50IG5vLWJpdHdpc2U6MCAqL1xuICBpZiAoYyA+IDB4ZmZmZikge1xuICAgIGMgLT0gMHgxMDAwMDtcbiAgICBjb25zdCBzdXJyb2dhdGUxID0gMHhkODAwICsgKGMgPj4gMTApO1xuICAgIGNvbnN0IHN1cnJvZ2F0ZTIgPSAweGRjMDAgKyAoYyAmIDB4M2ZmKTtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShzdXJyb2dhdGUxLCBzdXJyb2dhdGUyKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjKTtcbn1cbmNvbnN0IFVORVNDQVBFX01EX1JFID0gL1xcXFwoWyFcIiMkJSYnKCkqKyxcXC0uLzo7PD0+P0BbXFxcXFxcXV5fYHt8fX5dKS9nO1xuY29uc3QgRU5USVRZX1JFID0gLyYoW2EteiNdW2EtejAtOV17MSwzMX0pOy9naTtcbmNvbnN0IFVORVNDQVBFX0FMTF9SRSA9IG5ldyBSZWdFeHAoVU5FU0NBUEVfTURfUkUuc291cmNlICsgJ3wnICsgRU5USVRZX1JFLnNvdXJjZSwgJ2dpJyk7XG5jb25zdCBESUdJVEFMX0VOVElUWV9URVNUX1JFID0gL14jKCg/OnhbYS1mMC05XXsxLDh9fFswLTldezEsOH0pKSQvaTtcbmZ1bmN0aW9uIHJlcGxhY2VFbnRpdHlQYXR0ZXJuKG1hdGNoLCBuYW1lKSB7XG4gIGlmIChuYW1lLmNoYXJDb2RlQXQoMCkgPT09IDB4MjMgLyogIyAqLyAmJiBESUdJVEFMX0VOVElUWV9URVNUX1JFLnRlc3QobmFtZSkpIHtcbiAgICBjb25zdCBjb2RlID0gbmFtZVsxXS50b0xvd2VyQ2FzZSgpID09PSAneCcgPyBwYXJzZUludChuYW1lLnNsaWNlKDIpLCAxNikgOiBwYXJzZUludChuYW1lLnNsaWNlKDEpLCAxMCk7XG4gICAgaWYgKGlzVmFsaWRFbnRpdHlDb2RlKGNvZGUpKSB7XG4gICAgICByZXR1cm4gZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9XG4gIGNvbnN0IGRlY29kZWQgPSBlbnRpdGllcy5kZWNvZGVIVE1MKG1hdGNoKTtcbiAgaWYgKGRlY29kZWQgIT09IG1hdGNoKSB7XG4gICAgcmV0dXJuIGRlY29kZWQ7XG4gIH1cbiAgcmV0dXJuIG1hdGNoO1xufVxuXG4vKiBmdW5jdGlvbiByZXBsYWNlRW50aXRpZXMoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignJicpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG5cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKEVOVElUWV9SRSwgcmVwbGFjZUVudGl0eVBhdHRlcm4pO1xufSAqL1xuXG5mdW5jdGlvbiB1bmVzY2FwZU1kKHN0cikge1xuICBpZiAoc3RyLmluZGV4T2YoJ1xcXFwnKSA8IDApIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9NRF9SRSwgJyQxJyk7XG59XG5mdW5jdGlvbiB1bmVzY2FwZUFsbChzdHIpIHtcbiAgaWYgKHN0ci5pbmRleE9mKCdcXFxcJykgPCAwICYmIHN0ci5pbmRleE9mKCcmJykgPCAwKSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuICByZXR1cm4gc3RyLnJlcGxhY2UoVU5FU0NBUEVfQUxMX1JFLCBmdW5jdGlvbiAobWF0Y2gsIGVzY2FwZWQsIGVudGl0eSkge1xuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICByZXR1cm4gZXNjYXBlZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlcGxhY2VFbnRpdHlQYXR0ZXJuKG1hdGNoLCBlbnRpdHkpO1xuICB9KTtcbn1cbmNvbnN0IEhUTUxfRVNDQVBFX1RFU1RfUkUgPSAvWyY8PlwiXS87XG5jb25zdCBIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFID0gL1smPD5cIl0vZztcbmNvbnN0IEhUTUxfUkVQTEFDRU1FTlRTID0ge1xuICAnJic6ICcmYW1wOycsXG4gICc8JzogJyZsdDsnLFxuICAnPic6ICcmZ3Q7JyxcbiAgJ1wiJzogJyZxdW90Oydcbn07XG5mdW5jdGlvbiByZXBsYWNlVW5zYWZlQ2hhcihjaCkge1xuICByZXR1cm4gSFRNTF9SRVBMQUNFTUVOVFNbY2hdO1xufVxuZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHtcbiAgaWYgKEhUTUxfRVNDQVBFX1RFU1RfUkUudGVzdChzdHIpKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKEhUTUxfRVNDQVBFX1JFUExBQ0VfUkUsIHJlcGxhY2VVbnNhZmVDaGFyKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuY29uc3QgUkVHRVhQX0VTQ0FQRV9SRSA9IC9bLj8qK14kW1xcXVxcXFwoKXt9fC1dL2c7XG5mdW5jdGlvbiBlc2NhcGVSRShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFJFR0VYUF9FU0NBUEVfUkUsICdcXFxcJCYnKTtcbn1cbmZ1bmN0aW9uIGlzU3BhY2UoY29kZSkge1xuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6XG4gICAgY2FzZSAweDIwOlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBacyAodW5pY29kZSBjbGFzcykgfHwgW1xcdFxcZlxcdlxcclxcbl1cbmZ1bmN0aW9uIGlzV2hpdGVTcGFjZShjb2RlKSB7XG4gIGlmIChjb2RlID49IDB4MjAwMCAmJiBjb2RlIDw9IDB4MjAwQSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHN3aXRjaCAoY29kZSkge1xuICAgIGNhc2UgMHgwOTogLy8gXFx0XG4gICAgY2FzZSAweDBBOiAvLyBcXG5cbiAgICBjYXNlIDB4MEI6IC8vIFxcdlxuICAgIGNhc2UgMHgwQzogLy8gXFxmXG4gICAgY2FzZSAweDBEOiAvLyBcXHJcbiAgICBjYXNlIDB4MjA6XG4gICAgY2FzZSAweEEwOlxuICAgIGNhc2UgMHgxNjgwOlxuICAgIGNhc2UgMHgyMDJGOlxuICAgIGNhc2UgMHgyMDVGOlxuICAgIGNhc2UgMHgzMDAwOlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbi8vIEN1cnJlbnRseSB3aXRob3V0IGFzdHJhbCBjaGFyYWN0ZXJzIHN1cHBvcnQuXG5mdW5jdGlvbiBpc1B1bmN0Q2hhcihjaCkge1xuICByZXR1cm4gdWNtaWNyb19fbmFtZXNwYWNlLlAudGVzdChjaCkgfHwgdWNtaWNyb19fbmFtZXNwYWNlLlMudGVzdChjaCk7XG59XG5cbi8vIE1hcmtkb3duIEFTQ0lJIHB1bmN0dWF0aW9uIGNoYXJhY3RlcnMuXG4vL1xuLy8gISwgXCIsICMsICQsICUsICYsICcsICgsICksICosICssICwsIC0sIC4sIC8sIDosIDssIDwsID0sID4sID8sIEAsIFssIFxcLCBdLCBeLCBfLCBgLCB7LCB8LCB9LCBvciB+XG4vLyBodHRwOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjE1LyNhc2NpaS1wdW5jdHVhdGlvbi1jaGFyYWN0ZXJcbi8vXG4vLyBEb24ndCBjb25mdXNlIHdpdGggdW5pY29kZSBwdW5jdHVhdGlvbiAhISEgSXQgbGFja3Mgc29tZSBjaGFycyBpbiBhc2NpaSByYW5nZS5cbi8vXG5mdW5jdGlvbiBpc01kQXNjaWlQdW5jdChjaCkge1xuICBzd2l0Y2ggKGNoKSB7XG4gICAgY2FzZSAweDIxIC8qICEgKi86XG4gICAgY2FzZSAweDIyIC8qIFwiICovOlxuICAgIGNhc2UgMHgyMyAvKiAjICovOlxuICAgIGNhc2UgMHgyNCAvKiAkICovOlxuICAgIGNhc2UgMHgyNSAvKiAlICovOlxuICAgIGNhc2UgMHgyNiAvKiAmICovOlxuICAgIGNhc2UgMHgyNyAvKiAnICovOlxuICAgIGNhc2UgMHgyOCAvKiAoICovOlxuICAgIGNhc2UgMHgyOSAvKiApICovOlxuICAgIGNhc2UgMHgyQSAvKiAqICovOlxuICAgIGNhc2UgMHgyQiAvKiArICovOlxuICAgIGNhc2UgMHgyQyAvKiAsICovOlxuICAgIGNhc2UgMHgyRCAvKiAtICovOlxuICAgIGNhc2UgMHgyRSAvKiAuICovOlxuICAgIGNhc2UgMHgyRiAvKiAvICovOlxuICAgIGNhc2UgMHgzQSAvKiA6ICovOlxuICAgIGNhc2UgMHgzQiAvKiA7ICovOlxuICAgIGNhc2UgMHgzQyAvKiA8ICovOlxuICAgIGNhc2UgMHgzRCAvKiA9ICovOlxuICAgIGNhc2UgMHgzRSAvKiA+ICovOlxuICAgIGNhc2UgMHgzRiAvKiA/ICovOlxuICAgIGNhc2UgMHg0MCAvKiBAICovOlxuICAgIGNhc2UgMHg1QiAvKiBbICovOlxuICAgIGNhc2UgMHg1QyAvKiBcXCAqLzpcbiAgICBjYXNlIDB4NUQgLyogXSAqLzpcbiAgICBjYXNlIDB4NUUgLyogXiAqLzpcbiAgICBjYXNlIDB4NUYgLyogXyAqLzpcbiAgICBjYXNlIDB4NjAgLyogYCAqLzpcbiAgICBjYXNlIDB4N0IgLyogeyAqLzpcbiAgICBjYXNlIDB4N0MgLyogfCAqLzpcbiAgICBjYXNlIDB4N0QgLyogfSAqLzpcbiAgICBjYXNlIDB4N0UgLyogfiAqLzpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLy8gSGVwbGVyIHRvIHVuaWZ5IFtyZWZlcmVuY2UgbGFiZWxzXS5cbi8vXG5mdW5jdGlvbiBub3JtYWxpemVSZWZlcmVuY2Uoc3RyKSB7XG4gIC8vIFRyaW0gYW5kIGNvbGxhcHNlIHdoaXRlc3BhY2VcbiAgLy9cbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG5cbiAgLy8gSW4gbm9kZSB2MTAgJ1x1MUU5RScudG9Mb3dlckNhc2UoKSA9PT0gJ1x1MUU3RScsIHdoaWNoIGlzIHByZXN1bWVkIHRvIGJlIGEgYnVnXG4gIC8vIGZpeGVkIGluIHYxMiAoY291bGRuJ3QgZmluZCBhbnkgZGV0YWlscykuXG4gIC8vXG4gIC8vIFNvIHRyZWF0IHRoaXMgb25lIGFzIGEgc3BlY2lhbCBjYXNlXG4gIC8vIChyZW1vdmUgdGhpcyB3aGVuIG5vZGUgdjEwIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQpLlxuICAvL1xuICBpZiAoJ1x1MUU5RScudG9Mb3dlckNhc2UoKSA9PT0gJ1x1MUU3RScpIHtcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvXHUxRTlFL2csICdcdTAwREYnKTtcbiAgfVxuXG4gIC8vIC50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKCkgc2hvdWxkIGdldCByaWQgb2YgYWxsIGRpZmZlcmVuY2VzXG4gIC8vIGJldHdlZW4gbGV0dGVyIHZhcmlhbnRzLlxuICAvL1xuICAvLyBTaW1wbGUgLnRvTG93ZXJDYXNlKCkgZG9lc24ndCBub3JtYWxpemUgMTI1IGNvZGUgcG9pbnRzIGNvcnJlY3RseSxcbiAgLy8gYW5kIC50b1VwcGVyQ2FzZSBkb2Vzbid0IG5vcm1hbGl6ZSA2IG9mIHRoZW0gKGxpc3Qgb2YgZXhjZXB0aW9uczpcbiAgLy8gXHUwMTMwLCBcdTAzRjQsIFx1MUU5RSwgXHUyMTI2LCBcdTIxMkEsIFx1MjEyQiAtIHRob3NlIGFyZSBhbHJlYWR5IHVwcGVyY2FzZWQsIGJ1dCBoYXZlIGRpZmZlcmVudGx5XG4gIC8vIHVwcGVyY2FzZWQgdmVyc2lvbnMpLlxuICAvL1xuICAvLyBIZXJlJ3MgYW4gZXhhbXBsZSBzaG93aW5nIGhvdyBpdCBoYXBwZW5zLiBMZXRzIHRha2UgZ3JlZWsgbGV0dGVyIG9tZWdhOlxuICAvLyB1cHBlcmNhc2UgVSswMzk4IChcdTAzOTgpLCBVKzAzZjQgKFx1MDNGNCkgYW5kIGxvd2VyY2FzZSBVKzAzYjggKFx1MDNCOCksIFUrMDNkMSAoXHUwM0QxKVxuICAvL1xuICAvLyBVbmljb2RlIGVudHJpZXM6XG4gIC8vIDAzOTg7R1JFRUsgQ0FQSVRBTCBMRVRURVIgVEhFVEE7THU7MDtMOzs7OztOOzs7OzAzQjg7XG4gIC8vIDAzQjg7R1JFRUsgU01BTEwgTEVUVEVSIFRIRVRBO0xsOzA7TDs7Ozs7Tjs7OzAzOTg7OzAzOThcbiAgLy8gMDNEMTtHUkVFSyBUSEVUQSBTWU1CT0w7TGw7MDtMOzxjb21wYXQ+IDAzQjg7Ozs7TjtHUkVFSyBTTUFMTCBMRVRURVIgU0NSSVBUIFRIRVRBOzswMzk4OzswMzk4XG4gIC8vIDAzRjQ7R1JFRUsgQ0FQSVRBTCBUSEVUQSBTWU1CT0w7THU7MDtMOzxjb21wYXQ+IDAzOTg7Ozs7Tjs7OzswM0I4O1xuICAvL1xuICAvLyBDYXNlLWluc2Vuc2l0aXZlIGNvbXBhcmlzb24gc2hvdWxkIHRyZWF0IGFsbCBvZiB0aGVtIGFzIGVxdWl2YWxlbnQuXG4gIC8vXG4gIC8vIEJ1dCAudG9Mb3dlckNhc2UoKSBkb2Vzbid0IGNoYW5nZSBcdTAzRDEgKGl0J3MgYWxyZWFkeSBsb3dlcmNhc2UpLFxuICAvLyBhbmQgLnRvVXBwZXJDYXNlKCkgZG9lc24ndCBjaGFuZ2UgXHUwM0Y0IChhbHJlYWR5IHVwcGVyY2FzZSkuXG4gIC8vXG4gIC8vIEFwcGx5aW5nIGZpcnN0IGxvd2VyIHRoZW4gdXBwZXIgY2FzZSBub3JtYWxpemVzIGFueSBjaGFyYWN0ZXI6XG4gIC8vICdcXHUwMzk4XFx1MDNmNFxcdTAzYjhcXHUwM2QxJy50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKCkgPT09ICdcXHUwMzk4XFx1MDM5OFxcdTAzOThcXHUwMzk4J1xuICAvL1xuICAvLyBOb3RlOiB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gdW5pY29kZSBjYXNlIGZvbGRpbmc7IHVuaWNvZGUgbm9ybWFsaXphdGlvblxuICAvLyBpcyBhIGRpZmZlcmVudCBzdGVwIHRoYXQgaXMgbm90IHJlcXVpcmVkIGhlcmUuXG4gIC8vXG4gIC8vIEZpbmFsIHJlc3VsdCBzaG91bGQgYmUgdXBwZXJjYXNlZCwgYmVjYXVzZSBpdCdzIGxhdGVyIHN0b3JlZCBpbiBhbiBvYmplY3RcbiAgLy8gKHRoaXMgYXZvaWQgYSBjb25mbGljdCB3aXRoIE9iamVjdC5wcm90b3R5cGUgbWVtYmVycyxcbiAgLy8gbW9zdCBub3RhYmx5LCBgX19wcm90b19fYClcbiAgLy9cbiAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpLnRvVXBwZXJDYXNlKCk7XG59XG5cbi8vIFJlLWV4cG9ydCBsaWJyYXJpZXMgY29tbW9ubHkgdXNlZCBpbiBib3RoIG1hcmtkb3duLWl0IGFuZCBpdHMgcGx1Z2lucyxcbi8vIHNvIHBsdWdpbnMgd29uJ3QgaGF2ZSB0byBkZXBlbmQgb24gdGhlbSBleHBsaWNpdGx5LCB3aGljaCByZWR1Y2VzIHRoZWlyXG4vLyBidW5kbGVkIHNpemUgKGUuZy4gYSBicm93c2VyIGJ1aWxkKS5cbi8vXG5jb25zdCBsaWIgPSB7XG4gIG1kdXJsOiBtZHVybF9fbmFtZXNwYWNlLFxuICB1Y21pY3JvOiB1Y21pY3JvX19uYW1lc3BhY2Vcbn07XG5cbnZhciB1dGlscyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgX19wcm90b19fOiBudWxsLFxuICBhcnJheVJlcGxhY2VBdDogYXJyYXlSZXBsYWNlQXQsXG4gIGFzc2lnbjogYXNzaWduLFxuICBlc2NhcGVIdG1sOiBlc2NhcGVIdG1sLFxuICBlc2NhcGVSRTogZXNjYXBlUkUsXG4gIGZyb21Db2RlUG9pbnQ6IGZyb21Db2RlUG9pbnQsXG4gIGhhczogaGFzLFxuICBpc01kQXNjaWlQdW5jdDogaXNNZEFzY2lpUHVuY3QsXG4gIGlzUHVuY3RDaGFyOiBpc1B1bmN0Q2hhcixcbiAgaXNTcGFjZTogaXNTcGFjZSxcbiAgaXNTdHJpbmc6IGlzU3RyaW5nLFxuICBpc1ZhbGlkRW50aXR5Q29kZTogaXNWYWxpZEVudGl0eUNvZGUsXG4gIGlzV2hpdGVTcGFjZTogaXNXaGl0ZVNwYWNlLFxuICBsaWI6IGxpYixcbiAgbm9ybWFsaXplUmVmZXJlbmNlOiBub3JtYWxpemVSZWZlcmVuY2UsXG4gIHVuZXNjYXBlQWxsOiB1bmVzY2FwZUFsbCxcbiAgdW5lc2NhcGVNZDogdW5lc2NhcGVNZFxufSk7XG5cbi8vIFBhcnNlIGxpbmsgbGFiZWxcbi8vXG4vLyB0aGlzIGZ1bmN0aW9uIGFzc3VtZXMgdGhhdCBmaXJzdCBjaGFyYWN0ZXIgKFwiW1wiKSBhbHJlYWR5IG1hdGNoZXM7XG4vLyByZXR1cm5zIHRoZSBlbmQgb2YgdGhlIGxhYmVsXG4vL1xuXG5mdW5jdGlvbiBwYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhcnQsIGRpc2FibGVOZXN0ZWQpIHtcbiAgbGV0IGxldmVsLCBmb3VuZCwgbWFya2VyLCBwcmV2UG9zO1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXg7XG4gIGNvbnN0IG9sZFBvcyA9IHN0YXRlLnBvcztcbiAgc3RhdGUucG9zID0gc3RhcnQgKyAxO1xuICBsZXZlbCA9IDE7XG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBtYXgpIHtcbiAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpO1xuICAgIGlmIChtYXJrZXIgPT09IDB4NUQgLyogXSAqLykge1xuICAgICAgbGV2ZWwtLTtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBwcmV2UG9zID0gc3RhdGUucG9zO1xuICAgIHN0YXRlLm1kLmlubGluZS5za2lwVG9rZW4oc3RhdGUpO1xuICAgIGlmIChtYXJrZXIgPT09IDB4NUIgLyogWyAqLykge1xuICAgICAgaWYgKHByZXZQb3MgPT09IHN0YXRlLnBvcyAtIDEpIHtcbiAgICAgICAgLy8gaW5jcmVhc2UgbGV2ZWwgaWYgd2UgZmluZCB0ZXh0IGBbYCwgd2hpY2ggaXMgbm90IGEgcGFydCBvZiBhbnkgdG9rZW5cbiAgICAgICAgbGV2ZWwrKztcbiAgICAgIH0gZWxzZSBpZiAoZGlzYWJsZU5lc3RlZCkge1xuICAgICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbGV0IGxhYmVsRW5kID0gLTE7XG4gIGlmIChmb3VuZCkge1xuICAgIGxhYmVsRW5kID0gc3RhdGUucG9zO1xuICB9XG5cbiAgLy8gcmVzdG9yZSBvbGQgc3RhdGVcbiAgc3RhdGUucG9zID0gb2xkUG9zO1xuICByZXR1cm4gbGFiZWxFbmQ7XG59XG5cbi8vIFBhcnNlIGxpbmsgZGVzdGluYXRpb25cbi8vXG5cbmZ1bmN0aW9uIHBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0ciwgc3RhcnQsIG1heCkge1xuICBsZXQgY29kZTtcbiAgbGV0IHBvcyA9IHN0YXJ0O1xuICBjb25zdCByZXN1bHQgPSB7XG4gICAgb2s6IGZhbHNlLFxuICAgIHBvczogMCxcbiAgICBzdHI6ICcnXG4gIH07XG4gIGlmIChzdHIuY2hhckNvZGVBdChwb3MpID09PSAweDNDIC8qIDwgKi8pIHtcbiAgICBwb3MrKztcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmIChjb2RlID09PSAweDBBIC8qIFxcbiAqLykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDB4M0MgLyogPCAqLykge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDB4M0UgLyogPiAqLykge1xuICAgICAgICByZXN1bHQucG9zID0gcG9zICsgMTtcbiAgICAgICAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCArIDEsIHBvcykpO1xuICAgICAgICByZXN1bHQub2sgPSB0cnVlO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgICBwb3MgKz0gMjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBwb3MrKztcbiAgICB9XG5cbiAgICAvLyBubyBjbG9zaW5nICc+J1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyB0aGlzIHNob3VsZCBiZSAuLi4gfSBlbHNlIHsgLi4uIGJyYW5jaFxuXG4gIGxldCBsZXZlbCA9IDA7XG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY29kZSA9PT0gMHgyMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gYXNjaWkgY29udHJvbCBjaGFyYWN0ZXJzXG4gICAgaWYgKGNvZGUgPCAweDIwIHx8IGNvZGUgPT09IDB4N0YpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICBpZiAoc3RyLmNoYXJDb2RlQXQocG9zICsgMSkgPT09IDB4MjApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwb3MgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gMHgyOCAvKiAoICovKSB7XG4gICAgICBsZXZlbCsrO1xuICAgICAgaWYgKGxldmVsID4gMzIpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IDB4MjkgLyogKSAqLykge1xuICAgICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGV2ZWwtLTtcbiAgICB9XG4gICAgcG9zKys7XG4gIH1cbiAgaWYgKHN0YXJ0ID09PSBwb3MpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGlmIChsZXZlbCAhPT0gMCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCwgcG9zKSk7XG4gIHJlc3VsdC5wb3MgPSBwb3M7XG4gIHJlc3VsdC5vayA9IHRydWU7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIFBhcnNlIGxpbmsgdGl0bGVcbi8vXG5cblxuLy8gUGFyc2UgbGluayB0aXRsZSB3aXRoaW4gYHN0cmAgaW4gW3N0YXJ0LCBtYXhdIHJhbmdlLFxuLy8gb3IgY29udGludWUgcHJldmlvdXMgcGFyc2luZyBpZiBgcHJldl9zdGF0ZWAgaXMgZGVmaW5lZCAoZXF1YWwgdG8gcmVzdWx0IG9mIGxhc3QgZXhlY3V0aW9uKS5cbi8vXG5mdW5jdGlvbiBwYXJzZUxpbmtUaXRsZShzdHIsIHN0YXJ0LCBtYXgsIHByZXZfc3RhdGUpIHtcbiAgbGV0IGNvZGU7XG4gIGxldCBwb3MgPSBzdGFydDtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgLy8gaWYgYHRydWVgLCB0aGlzIGlzIGEgdmFsaWQgbGluayB0aXRsZVxuICAgIG9rOiBmYWxzZSxcbiAgICAvLyBpZiBgdHJ1ZWAsIHRoaXMgbGluayBjYW4gYmUgY29udGludWVkIG9uIHRoZSBuZXh0IGxpbmVcbiAgICBjYW5fY29udGludWU6IGZhbHNlLFxuICAgIC8vIGlmIGBva2AsIGl0J3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGNsb3NpbmcgbWFya2VyXG4gICAgcG9zOiAwLFxuICAgIC8vIGlmIGBva2AsIGl0J3MgdGhlIHVuZXNjYXBlZCB0aXRsZVxuICAgIHN0cjogJycsXG4gICAgLy8gZXhwZWN0ZWQgY2xvc2luZyBtYXJrZXIgY2hhcmFjdGVyIGNvZGVcbiAgICBtYXJrZXI6IDBcbiAgfTtcbiAgaWYgKHByZXZfc3RhdGUpIHtcbiAgICAvLyB0aGlzIGlzIGEgY29udGludWF0aW9uIG9mIGEgcHJldmlvdXMgcGFyc2VMaW5rVGl0bGUgY2FsbCBvbiB0aGUgbmV4dCBsaW5lLFxuICAgIC8vIHVzZWQgaW4gcmVmZXJlbmNlIGxpbmtzIG9ubHlcbiAgICBzdGF0ZS5zdHIgPSBwcmV2X3N0YXRlLnN0cjtcbiAgICBzdGF0ZS5tYXJrZXIgPSBwcmV2X3N0YXRlLm1hcmtlcjtcbiAgfSBlbHNlIHtcbiAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbiAgICBsZXQgbWFya2VyID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAobWFya2VyICE9PSAweDIyIC8qIFwiICovICYmIG1hcmtlciAhPT0gMHgyNyAvKiAnICovICYmIG1hcmtlciAhPT0gMHgyOCAvKiAoICovKSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICAgIHN0YXJ0Kys7XG4gICAgcG9zKys7XG5cbiAgICAvLyBpZiBvcGVuaW5nIG1hcmtlciBpcyBcIihcIiwgc3dpdGNoIGl0IHRvIGNsb3NpbmcgbWFya2VyIFwiKVwiXG4gICAgaWYgKG1hcmtlciA9PT0gMHgyOCkge1xuICAgICAgbWFya2VyID0gMHgyOTtcbiAgICB9XG4gICAgc3RhdGUubWFya2VyID0gbWFya2VyO1xuICB9XG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY29kZSA9PT0gc3RhdGUubWFya2VyKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBwb3MgKyAxO1xuICAgICAgc3RhdGUuc3RyICs9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCwgcG9zKSk7XG4gICAgICBzdGF0ZS5vayA9IHRydWU7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAweDI4IC8qICggKi8gJiYgc3RhdGUubWFya2VyID09PSAweDI5IC8qICkgKi8pIHtcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgcG9zKys7XG4gICAgfVxuICAgIHBvcysrO1xuICB9XG5cbiAgLy8gbm8gY2xvc2luZyBtYXJrZXIgZm91bmQsIGJ1dCB0aGlzIGxpbmsgdGl0bGUgbWF5IGNvbnRpbnVlIG9uIHRoZSBuZXh0IGxpbmUgKGZvciByZWZlcmVuY2VzKVxuICBzdGF0ZS5jYW5fY29udGludWUgPSB0cnVlO1xuICBzdGF0ZS5zdHIgKz0gdW5lc2NhcGVBbGwoc3RyLnNsaWNlKHN0YXJ0LCBwb3MpKTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLyBKdXN0IGEgc2hvcnRjdXQgZm9yIGJ1bGsgZXhwb3J0XG5cbnZhciBoZWxwZXJzID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIHBhcnNlTGlua0Rlc3RpbmF0aW9uOiBwYXJzZUxpbmtEZXN0aW5hdGlvbixcbiAgcGFyc2VMaW5rTGFiZWw6IHBhcnNlTGlua0xhYmVsLFxuICBwYXJzZUxpbmtUaXRsZTogcGFyc2VMaW5rVGl0bGVcbn0pO1xuXG4vKipcbiAqIGNsYXNzIFJlbmRlcmVyXG4gKlxuICogR2VuZXJhdGVzIEhUTUwgZnJvbSBwYXJzZWQgdG9rZW4gc3RyZWFtLiBFYWNoIGluc3RhbmNlIGhhcyBpbmRlcGVuZGVudFxuICogY29weSBvZiBydWxlcy4gVGhvc2UgY2FuIGJlIHJld3JpdHRlbiB3aXRoIGVhc2UuIEFsc28sIHlvdSBjYW4gYWRkIG5ld1xuICogcnVsZXMgaWYgeW91IGNyZWF0ZSBwbHVnaW4gYW5kIGFkZHMgbmV3IHRva2VuIHR5cGVzLlxuICoqL1xuXG5jb25zdCBkZWZhdWx0X3J1bGVzID0ge307XG5kZWZhdWx0X3J1bGVzLmNvZGVfaW5saW5lID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNsZikge1xuICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuICByZXR1cm4gJzxjb2RlJyArIHNsZi5yZW5kZXJBdHRycyh0b2tlbikgKyAnPicgKyBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpICsgJzwvY29kZT4nO1xufTtcbmRlZmF1bHRfcnVsZXMuY29kZV9ibG9jayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XTtcbiAgcmV0dXJuICc8cHJlJyArIHNsZi5yZW5kZXJBdHRycyh0b2tlbikgKyAnPjxjb2RlPicgKyBlc2NhcGVIdG1sKHRva2Vuc1tpZHhdLmNvbnRlbnQpICsgJzwvY29kZT48L3ByZT5cXG4nO1xufTtcbmRlZmF1bHRfcnVsZXMuZmVuY2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF07XG4gIGNvbnN0IGluZm8gPSB0b2tlbi5pbmZvID8gdW5lc2NhcGVBbGwodG9rZW4uaW5mbykudHJpbSgpIDogJyc7XG4gIGxldCBsYW5nTmFtZSA9ICcnO1xuICBsZXQgbGFuZ0F0dHJzID0gJyc7XG4gIGlmIChpbmZvKSB7XG4gICAgY29uc3QgYXJyID0gaW5mby5zcGxpdCgvKFxccyspL2cpO1xuICAgIGxhbmdOYW1lID0gYXJyWzBdO1xuICAgIGxhbmdBdHRycyA9IGFyci5zbGljZSgyKS5qb2luKCcnKTtcbiAgfVxuICBsZXQgaGlnaGxpZ2h0ZWQ7XG4gIGlmIChvcHRpb25zLmhpZ2hsaWdodCkge1xuICAgIGhpZ2hsaWdodGVkID0gb3B0aW9ucy5oaWdobGlnaHQodG9rZW4uY29udGVudCwgbGFuZ05hbWUsIGxhbmdBdHRycykgfHwgZXNjYXBlSHRtbCh0b2tlbi5jb250ZW50KTtcbiAgfSBlbHNlIHtcbiAgICBoaWdobGlnaHRlZCA9IGVzY2FwZUh0bWwodG9rZW4uY29udGVudCk7XG4gIH1cbiAgaWYgKGhpZ2hsaWdodGVkLmluZGV4T2YoJzxwcmUnKSA9PT0gMCkge1xuICAgIHJldHVybiBoaWdobGlnaHRlZCArICdcXG4nO1xuICB9XG5cbiAgLy8gSWYgbGFuZ3VhZ2UgZXhpc3RzLCBpbmplY3QgY2xhc3MgZ2VudGx5LCB3aXRob3V0IG1vZGlmeWluZyBvcmlnaW5hbCB0b2tlbi5cbiAgLy8gTWF5IGJlLCBvbmUgZGF5IHdlIHdpbGwgYWRkIC5kZWVwQ2xvbmUoKSBmb3IgdG9rZW4gYW5kIHNpbXBsaWZ5IHRoaXMgcGFydCwgYnV0XG4gIC8vIG5vdyB3ZSBwcmVmZXIgdG8ga2VlcCB0aGluZ3MgbG9jYWwuXG4gIGlmIChpbmZvKSB7XG4gICAgY29uc3QgaSA9IHRva2VuLmF0dHJJbmRleCgnY2xhc3MnKTtcbiAgICBjb25zdCB0bXBBdHRycyA9IHRva2VuLmF0dHJzID8gdG9rZW4uYXR0cnMuc2xpY2UoKSA6IFtdO1xuICAgIGlmIChpIDwgMCkge1xuICAgICAgdG1wQXR0cnMucHVzaChbJ2NsYXNzJywgb3B0aW9ucy5sYW5nUHJlZml4ICsgbGFuZ05hbWVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wQXR0cnNbaV0gPSB0bXBBdHRyc1tpXS5zbGljZSgpO1xuICAgICAgdG1wQXR0cnNbaV1bMV0gKz0gJyAnICsgb3B0aW9ucy5sYW5nUHJlZml4ICsgbGFuZ05hbWU7XG4gICAgfVxuXG4gICAgLy8gRmFrZSB0b2tlbiBqdXN0IHRvIHJlbmRlciBhdHRyaWJ1dGVzXG4gICAgY29uc3QgdG1wVG9rZW4gPSB7XG4gICAgICBhdHRyczogdG1wQXR0cnNcbiAgICB9O1xuICAgIHJldHVybiBgPHByZT48Y29kZSR7c2xmLnJlbmRlckF0dHJzKHRtcFRva2VuKX0+JHtoaWdobGlnaHRlZH08L2NvZGU+PC9wcmU+XFxuYDtcbiAgfVxuICByZXR1cm4gYDxwcmU+PGNvZGUke3NsZi5yZW5kZXJBdHRycyh0b2tlbil9PiR7aGlnaGxpZ2h0ZWR9PC9jb2RlPjwvcHJlPlxcbmA7XG59O1xuZGVmYXVsdF9ydWxlcy5pbWFnZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgY29uc3QgdG9rZW4gPSB0b2tlbnNbaWR4XTtcblxuICAvLyBcImFsdFwiIGF0dHIgTVVTVCBiZSBzZXQsIGV2ZW4gaWYgZW1wdHkuIEJlY2F1c2UgaXQncyBtYW5kYXRvcnkgYW5kXG4gIC8vIHNob3VsZCBiZSBwbGFjZWQgb24gcHJvcGVyIHBvc2l0aW9uIGZvciB0ZXN0cy5cbiAgLy9cbiAgLy8gUmVwbGFjZSBjb250ZW50IHdpdGggYWN0dWFsIHZhbHVlXG5cbiAgdG9rZW4uYXR0cnNbdG9rZW4uYXR0ckluZGV4KCdhbHQnKV1bMV0gPSBzbGYucmVuZGVySW5saW5lQXNUZXh0KHRva2VuLmNoaWxkcmVuLCBvcHRpb25zLCBlbnYpO1xuICByZXR1cm4gc2xmLnJlbmRlclRva2VuKHRva2VucywgaWR4LCBvcHRpb25zKTtcbn07XG5kZWZhdWx0X3J1bGVzLmhhcmRicmVhayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucyAvKiwgZW52ICovKSB7XG4gIHJldHVybiBvcHRpb25zLnhodG1sT3V0ID8gJzxiciAvPlxcbicgOiAnPGJyPlxcbic7XG59O1xuZGVmYXVsdF9ydWxlcy5zb2Z0YnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy5icmVha3MgPyBvcHRpb25zLnhodG1sT3V0ID8gJzxiciAvPlxcbicgOiAnPGJyPlxcbicgOiAnXFxuJztcbn07XG5kZWZhdWx0X3J1bGVzLnRleHQgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KTtcbn07XG5kZWZhdWx0X3J1bGVzLmh0bWxfYmxvY2sgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gdG9rZW5zW2lkeF0uY29udGVudDtcbn07XG5kZWZhdWx0X3J1bGVzLmh0bWxfaW5saW5lID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIHRva2Vuc1tpZHhdLmNvbnRlbnQ7XG59O1xuXG4vKipcbiAqIG5ldyBSZW5kZXJlcigpXG4gKlxuICogQ3JlYXRlcyBuZXcgW1tSZW5kZXJlcl1dIGluc3RhbmNlIGFuZCBmaWxsIFtbUmVuZGVyZXIjcnVsZXNdXSB3aXRoIGRlZmF1bHRzLlxuICoqL1xuZnVuY3Rpb24gUmVuZGVyZXIoKSB7XG4gIC8qKlxuICAgKiBSZW5kZXJlciNydWxlcyAtPiBPYmplY3RcbiAgICpcbiAgICogQ29udGFpbnMgcmVuZGVyIHJ1bGVzIGZvciB0b2tlbnMuIENhbiBiZSB1cGRhdGVkIGFuZCBleHRlbmRlZC5cbiAgICpcbiAgICogIyMjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICpcbiAgICogbWQucmVuZGVyZXIucnVsZXMuc3Ryb25nX29wZW4gID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJzxiPic7IH07XG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzLnN0cm9uZ19jbG9zZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICc8L2I+JzsgfTtcbiAgICpcbiAgICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcklubGluZSguLi4pO1xuICAgKiBgYGBcbiAgICpcbiAgICogRWFjaCBydWxlIGlzIGNhbGxlZCBhcyBpbmRlcGVuZGVudCBzdGF0aWMgZnVuY3Rpb24gd2l0aCBmaXhlZCBzaWduYXR1cmU6XG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogZnVuY3Rpb24gbXlfdG9rZW5fcmVuZGVyKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHJlbmRlcmVyKSB7XG4gICAqICAgLy8gLi4uXG4gICAqICAgcmV0dXJuIHJlbmRlcmVkSFRNTDtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIFtzb3VyY2UgY29kZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9yZW5kZXJlci5tanMpXG4gICAqIGZvciBtb3JlIGRldGFpbHMgYW5kIGV4YW1wbGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXMgPSBhc3NpZ24oe30sIGRlZmF1bHRfcnVsZXMpO1xufVxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlckF0dHJzKHRva2VuKSAtPiBTdHJpbmdcbiAqXG4gKiBSZW5kZXIgdG9rZW4gYXR0cmlidXRlcyB0byBzdHJpbmcuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyQXR0cnMgPSBmdW5jdGlvbiByZW5kZXJBdHRycyh0b2tlbikge1xuICBsZXQgaSwgbCwgcmVzdWx0O1xuICBpZiAoIXRva2VuLmF0dHJzKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHJlc3VsdCA9ICcnO1xuICBmb3IgKGkgPSAwLCBsID0gdG9rZW4uYXR0cnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcmVzdWx0ICs9ICcgJyArIGVzY2FwZUh0bWwodG9rZW4uYXR0cnNbaV1bMF0pICsgJz1cIicgKyBlc2NhcGVIdG1sKHRva2VuLmF0dHJzW2ldWzFdKSArICdcIic7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVuZGVyZXIucmVuZGVyVG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMpIC0+IFN0cmluZ1xuICogLSB0b2tlbnMgKEFycmF5KTogbGlzdCBvZiB0b2tlbnNcbiAqIC0gaWR4IChOdW1iZWQpOiB0b2tlbiBpbmRleCB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICpcbiAqIERlZmF1bHQgdG9rZW4gcmVuZGVyZXIuIENhbiBiZSBvdmVycmlkZW4gYnkgY3VzdG9tIGZ1bmN0aW9uXG4gKiBpbiBbW1JlbmRlcmVyI3J1bGVzXV0uXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyVG9rZW4gPSBmdW5jdGlvbiByZW5kZXJUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucykge1xuICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuICBsZXQgcmVzdWx0ID0gJyc7XG5cbiAgLy8gVGlnaHQgbGlzdCBwYXJhZ3JhcGhzXG4gIGlmICh0b2tlbi5oaWRkZW4pIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBJbnNlcnQgYSBuZXdsaW5lIGJldHdlZW4gaGlkZGVuIHBhcmFncmFwaCBhbmQgc3Vic2VxdWVudCBvcGVuaW5nXG4gIC8vIGJsb2NrLWxldmVsIHRhZy5cbiAgLy9cbiAgLy8gRm9yIGV4YW1wbGUsIGhlcmUgd2Ugc2hvdWxkIGluc2VydCBhIG5ld2xpbmUgYmVmb3JlIGJsb2NrcXVvdGU6XG4gIC8vICAtIGFcbiAgLy8gICAgPlxuICAvL1xuICBpZiAodG9rZW4uYmxvY2sgJiYgdG9rZW4ubmVzdGluZyAhPT0gLTEgJiYgaWR4ICYmIHRva2Vuc1tpZHggLSAxXS5oaWRkZW4pIHtcbiAgICByZXN1bHQgKz0gJ1xcbic7XG4gIH1cblxuICAvLyBBZGQgdG9rZW4gbmFtZSwgZS5nLiBgPGltZ2BcbiAgcmVzdWx0ICs9ICh0b2tlbi5uZXN0aW5nID09PSAtMSA/ICc8LycgOiAnPCcpICsgdG9rZW4udGFnO1xuXG4gIC8vIEVuY29kZSBhdHRyaWJ1dGVzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiYFxuICByZXN1bHQgKz0gdGhpcy5yZW5kZXJBdHRycyh0b2tlbik7XG5cbiAgLy8gQWRkIGEgc2xhc2ggZm9yIHNlbGYtY2xvc2luZyB0YWdzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiIC9gXG4gIGlmICh0b2tlbi5uZXN0aW5nID09PSAwICYmIG9wdGlvbnMueGh0bWxPdXQpIHtcbiAgICByZXN1bHQgKz0gJyAvJztcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gYWRkIGEgbmV3bGluZSBhZnRlciB0aGlzIHRhZ1xuICBsZXQgbmVlZExmID0gZmFsc2U7XG4gIGlmICh0b2tlbi5ibG9jaykge1xuICAgIG5lZWRMZiA9IHRydWU7XG4gICAgaWYgKHRva2VuLm5lc3RpbmcgPT09IDEpIHtcbiAgICAgIGlmIChpZHggKyAxIDwgdG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBuZXh0VG9rZW4gPSB0b2tlbnNbaWR4ICsgMV07XG4gICAgICAgIGlmIChuZXh0VG9rZW4udHlwZSA9PT0gJ2lubGluZScgfHwgbmV4dFRva2VuLmhpZGRlbikge1xuICAgICAgICAgIC8vIEJsb2NrLWxldmVsIHRhZyBjb250YWluaW5nIGFuIGlubGluZSB0YWcuXG4gICAgICAgICAgLy9cbiAgICAgICAgICBuZWVkTGYgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0VG9rZW4ubmVzdGluZyA9PT0gLTEgJiYgbmV4dFRva2VuLnRhZyA9PT0gdG9rZW4udGFnKSB7XG4gICAgICAgICAgLy8gT3BlbmluZyB0YWcgKyBjbG9zaW5nIHRhZyBvZiB0aGUgc2FtZSB0eXBlLiBFLmcuIGA8bGk+PC9saT5gLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgbmVlZExmID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmVzdWx0ICs9IG5lZWRMZiA/ICc+XFxuJyA6ICc+JztcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVuZGVyZXIucmVuZGVySW5saW5lKHRva2Vucywgb3B0aW9ucywgZW52KSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb24gYmxvY2sgdG9rZW5zIHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKiAtIGVudiAoT2JqZWN0KTogYWRkaXRpb25hbCBkYXRhIGZyb20gcGFyc2VkIGlucHV0IChyZWZlcmVuY2VzLCBmb3IgZXhhbXBsZSlcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW1JlbmRlcmVyLnJlbmRlcl1dLCBidXQgZm9yIHNpbmdsZSB0b2tlbiBvZiBgaW5saW5lYCB0eXBlLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlcztcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IHR5cGUgPSB0b2tlbnNbaV0udHlwZTtcbiAgICBpZiAodHlwZW9mIHJ1bGVzW3R5cGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ICs9IHJ1bGVzW3R5cGVdKHRva2VucywgaSwgb3B0aW9ucywgZW52LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyVG9rZW4odG9rZW5zLCBpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKiBpbnRlcm5hbFxuICogUmVuZGVyZXIucmVuZGVySW5saW5lQXNUZXh0KHRva2Vucywgb3B0aW9ucywgZW52KSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb24gYmxvY2sgdG9rZW5zIHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKiAtIGVudiAoT2JqZWN0KTogYWRkaXRpb25hbCBkYXRhIGZyb20gcGFyc2VkIGlucHV0IChyZWZlcmVuY2VzLCBmb3IgZXhhbXBsZSlcbiAqXG4gKiBTcGVjaWFsIGtsdWRnZSBmb3IgaW1hZ2UgYGFsdGAgYXR0cmlidXRlcyB0byBjb25mb3JtIENvbW1vbk1hcmsgc3BlYy5cbiAqIERvbid0IHRyeSB0byB1c2UgaXQhIFNwZWMgcmVxdWlyZXMgdG8gc2hvdyBgYWx0YCBjb250ZW50IHdpdGggc3RyaXBwZWQgbWFya3VwLFxuICogaW5zdGVhZCBvZiBzaW1wbGUgZXNjYXBpbmcuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVySW5saW5lQXNUZXh0ID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIGxldCByZXN1bHQgPSAnJztcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHN3aXRjaCAodG9rZW5zW2ldLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICByZXN1bHQgKz0gdG9rZW5zW2ldLmNvbnRlbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJJbmxpbmVBc1RleHQodG9rZW5zW2ldLmNoaWxkcmVuLCBvcHRpb25zLCBlbnYpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2h0bWxfaW5saW5lJzpcbiAgICAgIGNhc2UgJ2h0bWxfYmxvY2snOlxuICAgICAgICByZXN1bHQgKz0gdG9rZW5zW2ldLmNvbnRlbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc29mdGJyZWFrJzpcbiAgICAgIGNhc2UgJ2hhcmRicmVhayc6XG4gICAgICAgIHJlc3VsdCArPSAnXFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBhbGwgb3RoZXIgdG9rZW5zIGFyZSBza2lwcGVkXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlcih0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogVGFrZXMgdG9rZW4gc3RyZWFtIGFuZCBnZW5lcmF0ZXMgSFRNTC4gUHJvYmFibHksIHlvdSB3aWxsIG5ldmVyIG5lZWQgdG8gY2FsbFxuICogdGhpcyBtZXRob2QgZGlyZWN0bHkuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIGxldCByZXN1bHQgPSAnJztcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVzO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgdHlwZSA9IHRva2Vuc1tpXS50eXBlO1xuICAgIGlmICh0eXBlID09PSAnaW5saW5lJykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVySW5saW5lKHRva2Vuc1tpXS5jaGlsZHJlbiwgb3B0aW9ucywgZW52KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBydWxlc1t0eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJlc3VsdCArPSBydWxlc1t0eXBlXSh0b2tlbnMsIGksIG9wdGlvbnMsIGVudiwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclRva2VuKHRva2VucywgaSwgb3B0aW9ucywgZW52KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogY2xhc3MgUnVsZXJcbiAqXG4gKiBIZWxwZXIgY2xhc3MsIHVzZWQgYnkgW1tNYXJrZG93bkl0I2NvcmVdXSwgW1tNYXJrZG93bkl0I2Jsb2NrXV0gYW5kXG4gKiBbW01hcmtkb3duSXQjaW5saW5lXV0gdG8gbWFuYWdlIHNlcXVlbmNlcyBvZiBmdW5jdGlvbnMgKHJ1bGVzKTpcbiAqXG4gKiAtIGtlZXAgcnVsZXMgaW4gZGVmaW5lZCBvcmRlclxuICogLSBhc3NpZ24gdGhlIG5hbWUgdG8gZWFjaCBydWxlXG4gKiAtIGVuYWJsZS9kaXNhYmxlIHJ1bGVzXG4gKiAtIGFkZC9yZXBsYWNlIHJ1bGVzXG4gKiAtIGFsbG93IGFzc2lnbiBydWxlcyB0byBhZGRpdGlvbmFsIG5hbWVkIGNoYWlucyAoaW4gdGhlIHNhbWUpXG4gKiAtIGNhY2hlaW5nIGxpc3RzIG9mIGFjdGl2ZSBydWxlc1xuICpcbiAqIFlvdSB3aWxsIG5vdCBuZWVkIHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5IHVudGlsIHdyaXRlIHBsdWdpbnMuIEZvciBzaW1wbGVcbiAqIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0sIFtbTWFya2Rvd25JdC5lbmFibGVdXSBhbmRcbiAqIFtbTWFya2Rvd25JdC51c2VdXS5cbiAqKi9cblxuLyoqXG4gKiBuZXcgUnVsZXIoKVxuICoqL1xuZnVuY3Rpb24gUnVsZXIoKSB7XG4gIC8vIExpc3Qgb2YgYWRkZWQgcnVsZXMuIEVhY2ggZWxlbWVudCBpczpcbiAgLy9cbiAgLy8ge1xuICAvLyAgIG5hbWU6IFhYWCxcbiAgLy8gICBlbmFibGVkOiBCb29sZWFuLFxuICAvLyAgIGZuOiBGdW5jdGlvbigpLFxuICAvLyAgIGFsdDogWyBuYW1lMiwgbmFtZTMgXVxuICAvLyB9XG4gIC8vXG4gIHRoaXMuX19ydWxlc19fID0gW107XG5cbiAgLy8gQ2FjaGVkIHJ1bGUgY2hhaW5zLlxuICAvL1xuICAvLyBGaXJzdCBsZXZlbCAtIGNoYWluIG5hbWUsICcnIGZvciBkZWZhdWx0LlxuICAvLyBTZWNvbmQgbGV2ZWwgLSBkaWdpbmFsIGFuY2hvciBmb3IgZmFzdCBmaWx0ZXJpbmcgYnkgY2hhcmNvZGVzLlxuICAvL1xuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59XG5cbi8vIEhlbHBlciBtZXRob2RzLCBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHlcblxuLy8gRmluZCBydWxlIGluZGV4IGJ5IG5hbWVcbi8vXG5SdWxlci5wcm90b3R5cGUuX19maW5kX18gPSBmdW5jdGlvbiAobmFtZSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX19ydWxlc19fLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuX19ydWxlc19fW2ldLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59O1xuXG4vLyBCdWlsZCBydWxlcyBsb29rdXAgY2FjaGVcbi8vXG5SdWxlci5wcm90b3R5cGUuX19jb21waWxlX18gPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHNlbGYgPSB0aGlzO1xuICBjb25zdCBjaGFpbnMgPSBbJyddO1xuXG4gIC8vIGNvbGxlY3QgdW5pcXVlIG5hbWVzXG4gIHNlbGYuX19ydWxlc19fLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICBpZiAoIXJ1bGUuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydWxlLmFsdC5mb3JFYWNoKGZ1bmN0aW9uIChhbHROYW1lKSB7XG4gICAgICBpZiAoY2hhaW5zLmluZGV4T2YoYWx0TmFtZSkgPCAwKSB7XG4gICAgICAgIGNoYWlucy5wdXNoKGFsdE5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbiAgc2VsZi5fX2NhY2hlX18gPSB7fTtcbiAgY2hhaW5zLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgc2VsZi5fX2NhY2hlX19bY2hhaW5dID0gW107XG4gICAgc2VsZi5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgaWYgKCFydWxlLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGNoYWluICYmIHJ1bGUuYWx0LmluZGV4T2YoY2hhaW4pIDwgMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWxmLl9fY2FjaGVfX1tjaGFpbl0ucHVzaChydWxlLmZuKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFJ1bGVyLmF0KG5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBuYW1lIChTdHJpbmcpOiBydWxlIG5hbWUgdG8gcmVwbGFjZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogbmV3IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IG5ldyBydWxlIG9wdGlvbnMgKG5vdCBtYW5kYXRvcnkpLlxuICpcbiAqIFJlcGxhY2UgcnVsZSBieSBuYW1lIHdpdGggbmV3IGZ1bmN0aW9uICYgb3B0aW9ucy4gVGhyb3dzIGVycm9yIGlmIG5hbWUgbm90XG4gKiBmb3VuZC5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIFJlcGxhY2UgZXhpc3RpbmcgdHlwb2dyYXBoZXIgcmVwbGFjZW1lbnQgcnVsZSB3aXRoIG5ldyBvbmU6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmNvcmUucnVsZXIuYXQoJ3JlcGxhY2VtZW50cycsIGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAqICAgLy8uLi5cbiAqIH0pO1xuICogYGBgXG4gKiovXG5SdWxlci5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAobmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgY29uc3QgaW5kZXggPSB0aGlzLl9fZmluZF9fKG5hbWUpO1xuICBjb25zdCBvcHQgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcbiAgfVxuICB0aGlzLl9fcnVsZXNfX1tpbmRleF0uZm4gPSBmbjtcbiAgdGhpcy5fX3J1bGVzX19baW5kZXhdLmFsdCA9IG9wdC5hbHQgfHwgW107XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogUnVsZXIuYmVmb3JlKGJlZm9yZU5hbWUsIHJ1bGVOYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gYmVmb3JlTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBiZWZvcmUgdGhpcyBvbmUuXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogQWRkIG5ldyBydWxlIHRvIGNoYWluIGJlZm9yZSBvbmUgd2l0aCBnaXZlbiBuYW1lLiBTZWUgYWxzb1xuICogW1tSdWxlci5hZnRlcl1dLCBbW1J1bGVyLnB1c2hdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5ibG9jay5ydWxlci5iZWZvcmUoJ3BhcmFncmFwaCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5iZWZvcmUgPSBmdW5jdGlvbiAoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIGNvbnN0IGluZGV4ID0gdGhpcy5fX2ZpbmRfXyhiZWZvcmVOYW1lKTtcbiAgY29uc3Qgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgYmVmb3JlTmFtZSk7XG4gIH1cbiAgdGhpcy5fX3J1bGVzX18uc3BsaWNlKGluZGV4LCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSk7XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogUnVsZXIuYWZ0ZXIoYWZ0ZXJOYW1lLCBydWxlTmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIGFmdGVyTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGlzIG9uZS5cbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgdG8gY2hhaW4gYWZ0ZXIgb25lIHdpdGggZ2l2ZW4gbmFtZS4gU2VlIGFsc29cbiAqIFtbUnVsZXIuYmVmb3JlXV0sIFtbUnVsZXIucHVzaF1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmlubGluZS5ydWxlci5hZnRlcigndGV4dCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5hZnRlciA9IGZ1bmN0aW9uIChhZnRlck5hbWUsIHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICBjb25zdCBpbmRleCA9IHRoaXMuX19maW5kX18oYWZ0ZXJOYW1lKTtcbiAgY29uc3Qgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgYWZ0ZXJOYW1lKTtcbiAgfVxuICB0aGlzLl9fcnVsZXNfXy5zcGxpY2UoaW5kZXggKyAxLCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSk7XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogUnVsZXIucHVzaChydWxlTmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogUHVzaCBuZXcgcnVsZSB0byB0aGUgZW5kIG9mIGNoYWluLiBTZWUgYWxzb1xuICogW1tSdWxlci5iZWZvcmVdXSwgW1tSdWxlci5hZnRlcl1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmNvcmUucnVsZXIucHVzaCgnbXlfcnVsZScsIGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAqICAgLy8uLi5cbiAqIH0pO1xuICogYGBgXG4gKiovXG5SdWxlci5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChydWxlTmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgY29uc3Qgb3B0ID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5fX3J1bGVzX18ucHVzaCh7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbixcbiAgICBhbHQ6IG9wdC5hbHQgfHwgW11cbiAgfSk7XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogUnVsZXIuZW5hYmxlKGxpc3QgWywgaWdub3JlSW52YWxpZF0pIC0+IEFycmF5XG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IGxpc3Qgb2YgcnVsZSBuYW1lcyB0byBlbmFibGUuXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBFbmFibGUgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgYW55IHJ1bGUgbmFtZSBub3QgZm91bmQgLSB0aHJvdyBFcnJvci5cbiAqIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFJldHVybnMgbGlzdCBvZiBmb3VuZCBydWxlIG5hbWVzIChpZiBubyBleGNlcHRpb24gaGFwcGVuZWQpLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZGlzYWJsZV1dLCBbW1J1bGVyLmVuYWJsZU9ubHldXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICBsaXN0ID0gW2xpc3RdO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gIC8vIFNlYXJjaCBieSBuYW1lIGFuZCBlbmFibGVcbiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgY29uc3QgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKTtcbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgaWYgKGlnbm9yZUludmFsaWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdWxlcyBtYW5hZ2VyOiBpbnZhbGlkIHJ1bGUgbmFtZSAnICsgbmFtZSk7XG4gICAgfVxuICAgIHRoaXMuX19ydWxlc19fW2lkeF0uZW5hYmxlZCA9IHRydWU7XG4gICAgcmVzdWx0LnB1c2gobmFtZSk7XG4gIH0sIHRoaXMpO1xuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJ1bGVyLmVuYWJsZU9ubHkobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZSAod2hpdGVsaXN0KS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIEVuYWJsZSBydWxlcyB3aXRoIGdpdmVuIG5hbWVzLCBhbmQgZGlzYWJsZSBldmVyeXRoaW5nIGVsc2UuIElmIGFueSBydWxlIG5hbWVcbiAqIG5vdCBmb3VuZCAtIHRocm93IEVycm9yLiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmRpc2FibGVdXSwgW1tSdWxlci5lbmFibGVdXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5lbmFibGVPbmx5ID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgbGlzdCA9IFtsaXN0XTtcbiAgfVxuICB0aGlzLl9fcnVsZXNfXy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgcnVsZS5lbmFibGVkID0gZmFsc2U7XG4gIH0pO1xuICB0aGlzLmVuYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKTtcbn07XG5cbi8qKlxuICogUnVsZXIuZGlzYWJsZShsaXN0IFssIGlnbm9yZUludmFsaWRdKSAtPiBBcnJheVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIERpc2FibGUgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgYW55IHJ1bGUgbmFtZSBub3QgZm91bmQgLSB0aHJvdyBFcnJvci5cbiAqIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFJldHVybnMgbGlzdCBvZiBmb3VuZCBydWxlIG5hbWVzIChpZiBubyBleGNlcHRpb24gaGFwcGVuZWQpLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZW5hYmxlXV0sIFtbUnVsZXIuZW5hYmxlT25seV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICBsaXN0ID0gW2xpc3RdO1xuICB9XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gIC8vIFNlYXJjaCBieSBuYW1lIGFuZCBkaXNhYmxlXG4gIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuX19maW5kX18obmFtZSk7XG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGlmIChpZ25vcmVJbnZhbGlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVsZXMgbWFuYWdlcjogaW52YWxpZCBydWxlIG5hbWUgJyArIG5hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9fcnVsZXNfX1tpZHhdLmVuYWJsZWQgPSBmYWxzZTtcbiAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgfSwgdGhpcyk7XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUnVsZXIuZ2V0UnVsZXMoY2hhaW5OYW1lKSAtPiBBcnJheVxuICpcbiAqIFJldHVybiBhcnJheSBvZiBhY3RpdmUgZnVuY3Rpb25zIChydWxlcykgZm9yIGdpdmVuIGNoYWluIG5hbWUuIEl0IGFuYWx5emVzXG4gKiBydWxlcyBjb25maWd1cmF0aW9uLCBjb21waWxlcyBjYWNoZXMgaWYgbm90IGV4aXN0cyBhbmQgcmV0dXJucyByZXN1bHQuXG4gKlxuICogRGVmYXVsdCBjaGFpbiBuYW1lIGlzIGAnJ2AgKGVtcHR5IHN0cmluZykuIEl0IGNhbid0IGJlIHNraXBwZWQuIFRoYXQnc1xuICogZG9uZSBpbnRlbnRpb25hbGx5LCB0byBrZWVwIHNpZ25hdHVyZSBtb25vbW9ycGhpYyBmb3IgaGlnaCBzcGVlZC5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5nZXRSdWxlcyA9IGZ1bmN0aW9uIChjaGFpbk5hbWUpIHtcbiAgaWYgKHRoaXMuX19jYWNoZV9fID09PSBudWxsKSB7XG4gICAgdGhpcy5fX2NvbXBpbGVfXygpO1xuICB9XG5cbiAgLy8gQ2hhaW4gY2FuIGJlIGVtcHR5LCBpZiBydWxlcyBkaXNhYmxlZC4gQnV0IHdlIHN0aWxsIGhhdmUgdG8gcmV0dXJuIEFycmF5LlxuICByZXR1cm4gdGhpcy5fX2NhY2hlX19bY2hhaW5OYW1lXSB8fCBbXTtcbn07XG5cbi8vIFRva2VuIGNsYXNzXG5cbi8qKlxuICogY2xhc3MgVG9rZW5cbiAqKi9cblxuLyoqXG4gKiBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKVxuICpcbiAqIENyZWF0ZSBuZXcgdG9rZW4gYW5kIGZpbGwgcGFzc2VkIHByb3BlcnRpZXMuXG4gKiovXG5mdW5jdGlvbiBUb2tlbih0eXBlLCB0YWcsIG5lc3RpbmcpIHtcbiAgLyoqXG4gICAqIFRva2VuI3R5cGUgLT4gU3RyaW5nXG4gICAqXG4gICAqIFR5cGUgb2YgdGhlIHRva2VuIChzdHJpbmcsIGUuZy4gXCJwYXJhZ3JhcGhfb3BlblwiKVxuICAgKiovXG4gIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgLyoqXG4gICAqIFRva2VuI3RhZyAtPiBTdHJpbmdcbiAgICpcbiAgICogaHRtbCB0YWcgbmFtZSwgZS5nLiBcInBcIlxuICAgKiovXG4gIHRoaXMudGFnID0gdGFnO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNhdHRycyAtPiBBcnJheVxuICAgKlxuICAgKiBIdG1sIGF0dHJpYnV0ZXMuIEZvcm1hdDogYFsgWyBuYW1lMSwgdmFsdWUxIF0sIFsgbmFtZTIsIHZhbHVlMiBdIF1gXG4gICAqKi9cbiAgdGhpcy5hdHRycyA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRva2VuI21hcCAtPiBBcnJheVxuICAgKlxuICAgKiBTb3VyY2UgbWFwIGluZm8uIEZvcm1hdDogYFsgbGluZV9iZWdpbiwgbGluZV9lbmQgXWBcbiAgICoqL1xuICB0aGlzLm1hcCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRva2VuI25lc3RpbmcgLT4gTnVtYmVyXG4gICAqXG4gICAqIExldmVsIGNoYW5nZSAobnVtYmVyIGluIHstMSwgMCwgMX0gc2V0KSwgd2hlcmU6XG4gICAqXG4gICAqIC0gIGAxYCBtZWFucyB0aGUgdGFnIGlzIG9wZW5pbmdcbiAgICogLSAgYDBgIG1lYW5zIHRoZSB0YWcgaXMgc2VsZi1jbG9zaW5nXG4gICAqIC0gYC0xYCBtZWFucyB0aGUgdGFnIGlzIGNsb3NpbmdcbiAgICoqL1xuICB0aGlzLm5lc3RpbmcgPSBuZXN0aW5nO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNsZXZlbCAtPiBOdW1iZXJcbiAgICpcbiAgICogbmVzdGluZyBsZXZlbCwgdGhlIHNhbWUgYXMgYHN0YXRlLmxldmVsYFxuICAgKiovXG4gIHRoaXMubGV2ZWwgPSAwO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNjaGlsZHJlbiAtPiBBcnJheVxuICAgKlxuICAgKiBBbiBhcnJheSBvZiBjaGlsZCBub2RlcyAoaW5saW5lIGFuZCBpbWcgdG9rZW5zKVxuICAgKiovXG4gIHRoaXMuY2hpbGRyZW4gPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNjb250ZW50IC0+IFN0cmluZ1xuICAgKlxuICAgKiBJbiBhIGNhc2Ugb2Ygc2VsZi1jbG9zaW5nIHRhZyAoY29kZSwgaHRtbCwgZmVuY2UsIGV0Yy4pLFxuICAgKiBpdCBoYXMgY29udGVudHMgb2YgdGhpcyB0YWcuXG4gICAqKi9cbiAgdGhpcy5jb250ZW50ID0gJyc7XG5cbiAgLyoqXG4gICAqIFRva2VuI21hcmt1cCAtPiBTdHJpbmdcbiAgICpcbiAgICogJyonIG9yICdfJyBmb3IgZW1waGFzaXMsIGZlbmNlIHN0cmluZyBmb3IgZmVuY2UsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm1hcmt1cCA9ICcnO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNpbmZvIC0+IFN0cmluZ1xuICAgKlxuICAgKiBBZGRpdGlvbmFsIGluZm9ybWF0aW9uOlxuICAgKlxuICAgKiAtIEluZm8gc3RyaW5nIGZvciBcImZlbmNlXCIgdG9rZW5zXG4gICAqIC0gVGhlIHZhbHVlIFwiYXV0b1wiIGZvciBhdXRvbGluayBcImxpbmtfb3BlblwiIGFuZCBcImxpbmtfY2xvc2VcIiB0b2tlbnNcbiAgICogLSBUaGUgc3RyaW5nIHZhbHVlIG9mIHRoZSBpdGVtIG1hcmtlciBmb3Igb3JkZXJlZC1saXN0IFwibGlzdF9pdGVtX29wZW5cIiB0b2tlbnNcbiAgICoqL1xuICB0aGlzLmluZm8gPSAnJztcblxuICAvKipcbiAgICogVG9rZW4jbWV0YSAtPiBPYmplY3RcbiAgICpcbiAgICogQSBwbGFjZSBmb3IgcGx1Z2lucyB0byBzdG9yZSBhbiBhcmJpdHJhcnkgZGF0YVxuICAgKiovXG4gIHRoaXMubWV0YSA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRva2VuI2Jsb2NrIC0+IEJvb2xlYW5cbiAgICpcbiAgICogVHJ1ZSBmb3IgYmxvY2stbGV2ZWwgdG9rZW5zLCBmYWxzZSBmb3IgaW5saW5lIHRva2Vucy5cbiAgICogVXNlZCBpbiByZW5kZXJlciB0byBjYWxjdWxhdGUgbGluZSBicmVha3NcbiAgICoqL1xuICB0aGlzLmJsb2NrID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRva2VuI2hpZGRlbiAtPiBCb29sZWFuXG4gICAqXG4gICAqIElmIGl0J3MgdHJ1ZSwgaWdub3JlIHRoaXMgZWxlbWVudCB3aGVuIHJlbmRlcmluZy4gVXNlZCBmb3IgdGlnaHQgbGlzdHNcbiAgICogdG8gaGlkZSBwYXJhZ3JhcGhzLlxuICAgKiovXG4gIHRoaXMuaGlkZGVuID0gZmFsc2U7XG59XG5cbi8qKlxuICogVG9rZW4uYXR0ckluZGV4KG5hbWUpIC0+IE51bWJlclxuICpcbiAqIFNlYXJjaCBhdHRyaWJ1dGUgaW5kZXggYnkgbmFtZS5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRySW5kZXggPSBmdW5jdGlvbiBhdHRySW5kZXgobmFtZSkge1xuICBpZiAoIXRoaXMuYXR0cnMpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgY29uc3QgYXR0cnMgPSB0aGlzLmF0dHJzO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXR0cnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoYXR0cnNbaV1bMF0gPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59O1xuXG4vKipcbiAqIFRva2VuLmF0dHJQdXNoKGF0dHJEYXRhKVxuICpcbiAqIEFkZCBgWyBuYW1lLCB2YWx1ZSBdYCBhdHRyaWJ1dGUgdG8gbGlzdC4gSW5pdCBhdHRycyBpZiBuZWNlc3NhcnlcbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRyUHVzaCA9IGZ1bmN0aW9uIGF0dHJQdXNoKGF0dHJEYXRhKSB7XG4gIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgdGhpcy5hdHRycy5wdXNoKGF0dHJEYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzID0gW2F0dHJEYXRhXTtcbiAgfVxufTtcblxuLyoqXG4gKiBUb2tlbi5hdHRyU2V0KG5hbWUsIHZhbHVlKVxuICpcbiAqIFNldCBgbmFtZWAgYXR0cmlidXRlIHRvIGB2YWx1ZWAuIE92ZXJyaWRlIG9sZCB2YWx1ZSBpZiBleGlzdHMuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0clNldCA9IGZ1bmN0aW9uIGF0dHJTZXQobmFtZSwgdmFsdWUpIHtcbiAgY29uc3QgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSk7XG4gIGNvbnN0IGF0dHJEYXRhID0gW25hbWUsIHZhbHVlXTtcbiAgaWYgKGlkeCA8IDApIHtcbiAgICB0aGlzLmF0dHJQdXNoKGF0dHJEYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF0gPSBhdHRyRGF0YTtcbiAgfVxufTtcblxuLyoqXG4gKiBUb2tlbi5hdHRyR2V0KG5hbWUpXG4gKlxuICogR2V0IHRoZSB2YWx1ZSBvZiBhdHRyaWJ1dGUgYG5hbWVgLCBvciBudWxsIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJHZXQgPSBmdW5jdGlvbiBhdHRyR2V0KG5hbWUpIHtcbiAgY29uc3QgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSk7XG4gIGxldCB2YWx1ZSA9IG51bGw7XG4gIGlmIChpZHggPj0gMCkge1xuICAgIHZhbHVlID0gdGhpcy5hdHRyc1tpZHhdWzFdO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbi8qKlxuICogVG9rZW4uYXR0ckpvaW4obmFtZSwgdmFsdWUpXG4gKlxuICogSm9pbiB2YWx1ZSB0byBleGlzdGluZyBhdHRyaWJ1dGUgdmlhIHNwYWNlLiBPciBjcmVhdGUgbmV3IGF0dHJpYnV0ZSBpZiBub3RcbiAqIGV4aXN0cy4gVXNlZnVsIHRvIG9wZXJhdGUgd2l0aCB0b2tlbiBjbGFzc2VzLlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJKb2luID0gZnVuY3Rpb24gYXR0ckpvaW4obmFtZSwgdmFsdWUpIHtcbiAgY29uc3QgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSk7XG4gIGlmIChpZHggPCAwKSB7XG4gICAgdGhpcy5hdHRyUHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF1bMV0gPSB0aGlzLmF0dHJzW2lkeF1bMV0gKyAnICcgKyB2YWx1ZTtcbiAgfVxufTtcblxuLy8gQ29yZSBzdGF0ZSBvYmplY3Rcbi8vXG5cbmZ1bmN0aW9uIFN0YXRlQ29yZShzcmMsIG1kLCBlbnYpIHtcbiAgdGhpcy5zcmMgPSBzcmM7XG4gIHRoaXMuZW52ID0gZW52O1xuICB0aGlzLnRva2VucyA9IFtdO1xuICB0aGlzLmlubGluZU1vZGUgPSBmYWxzZTtcbiAgdGhpcy5tZCA9IG1kOyAvLyBsaW5rIHRvIHBhcnNlciBpbnN0YW5jZVxufVxuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGNvcmUgcnVsZXNcblN0YXRlQ29yZS5wcm90b3R5cGUuVG9rZW4gPSBUb2tlbjtcblxuLy8gTm9ybWFsaXplIGlucHV0IHN0cmluZ1xuXG4vLyBodHRwczovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4yOS8jbGluZS1lbmRpbmdcbmNvbnN0IE5FV0xJTkVTX1JFID0gL1xcclxcbj98XFxuL2c7XG5jb25zdCBOVUxMX1JFID0gL1xcMC9nO1xuZnVuY3Rpb24gbm9ybWFsaXplKHN0YXRlKSB7XG4gIGxldCBzdHI7XG5cbiAgLy8gTm9ybWFsaXplIG5ld2xpbmVzXG4gIHN0ciA9IHN0YXRlLnNyYy5yZXBsYWNlKE5FV0xJTkVTX1JFLCAnXFxuJyk7XG5cbiAgLy8gUmVwbGFjZSBOVUxMIGNoYXJhY3RlcnNcbiAgc3RyID0gc3RyLnJlcGxhY2UoTlVMTF9SRSwgJ1xcdUZGRkQnKTtcbiAgc3RhdGUuc3JjID0gc3RyO1xufVxuXG5mdW5jdGlvbiBibG9jayhzdGF0ZSkge1xuICBsZXQgdG9rZW47XG4gIGlmIChzdGF0ZS5pbmxpbmVNb2RlKSB7XG4gICAgdG9rZW4gPSBuZXcgc3RhdGUuVG9rZW4oJ2lubGluZScsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUuc3JjO1xuICAgIHRva2VuLm1hcCA9IFswLCAxXTtcbiAgICB0b2tlbi5jaGlsZHJlbiA9IFtdO1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHRva2VuKTtcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5tZC5ibG9jay5wYXJzZShzdGF0ZS5zcmMsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHN0YXRlLnRva2Vucyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5saW5lKHN0YXRlKSB7XG4gIGNvbnN0IHRva2VucyA9IHN0YXRlLnRva2VucztcblxuICAvLyBQYXJzZSBpbmxpbmVzXG4gIGZvciAobGV0IGkgPSAwLCBsID0gdG9rZW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IHRvayA9IHRva2Vuc1tpXTtcbiAgICBpZiAodG9rLnR5cGUgPT09ICdpbmxpbmUnKSB7XG4gICAgICBzdGF0ZS5tZC5pbmxpbmUucGFyc2UodG9rLmNvbnRlbnQsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHRvay5jaGlsZHJlbik7XG4gICAgfVxuICB9XG59XG5cbi8vIFJlcGxhY2UgbGluay1saWtlIHRleHRzIHdpdGggbGluayBub2Rlcy5cbi8vXG4vLyBDdXJyZW50bHkgcmVzdHJpY3RlZCBieSBgbWQudmFsaWRhdGVMaW5rKClgIHRvIGh0dHAvaHR0cHMvZnRwXG4vL1xuXG5mdW5jdGlvbiBpc0xpbmtPcGVuJDEoc3RyKSB7XG4gIHJldHVybiAvXjxhWz5cXHNdL2kudGVzdChzdHIpO1xufVxuZnVuY3Rpb24gaXNMaW5rQ2xvc2UkMShzdHIpIHtcbiAgcmV0dXJuIC9ePFxcL2FcXHMqPi9pLnRlc3Qoc3RyKTtcbn1cbmZ1bmN0aW9uIGxpbmtpZnkkMShzdGF0ZSkge1xuICBjb25zdCBibG9ja1Rva2VucyA9IHN0YXRlLnRva2VucztcbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLmxpbmtpZnkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChsZXQgaiA9IDAsIGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICBpZiAoYmxvY2tUb2tlbnNbal0udHlwZSAhPT0gJ2lubGluZScgfHwgIXN0YXRlLm1kLmxpbmtpZnkucHJldGVzdChibG9ja1Rva2Vuc1tqXS5jb250ZW50KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGxldCB0b2tlbnMgPSBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbjtcbiAgICBsZXQgaHRtbExpbmtMZXZlbCA9IDA7XG5cbiAgICAvLyBXZSBzY2FuIGZyb20gdGhlIGVuZCwgdG8ga2VlcCBwb3NpdGlvbiB3aGVuIG5ldyB0YWdzIGFkZGVkLlxuICAgIC8vIFVzZSByZXZlcnNlZCBsb2dpYyBpbiBsaW5rcyBzdGFydC9lbmQgbWF0Y2hcbiAgICBmb3IgKGxldCBpID0gdG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBjdXJyZW50VG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIC8vIFNraXAgY29udGVudCBvZiBtYXJrZG93biBsaW5rc1xuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAnbGlua19jbG9zZScpIHtcbiAgICAgICAgaS0tO1xuICAgICAgICB3aGlsZSAodG9rZW5zW2ldLmxldmVsICE9PSBjdXJyZW50VG9rZW4ubGV2ZWwgJiYgdG9rZW5zW2ldLnR5cGUgIT09ICdsaW5rX29wZW4nKSB7XG4gICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTa2lwIGNvbnRlbnQgb2YgaHRtbCB0YWcgbGlua3NcbiAgICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gJ2h0bWxfaW5saW5lJykge1xuICAgICAgICBpZiAoaXNMaW5rT3BlbiQxKGN1cnJlbnRUb2tlbi5jb250ZW50KSAmJiBodG1sTGlua0xldmVsID4gMCkge1xuICAgICAgICAgIGh0bWxMaW5rTGV2ZWwtLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNMaW5rQ2xvc2UkMShjdXJyZW50VG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgICBodG1sTGlua0xldmVsKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChodG1sTGlua0xldmVsID4gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gJ3RleHQnICYmIHN0YXRlLm1kLmxpbmtpZnkudGVzdChjdXJyZW50VG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGN1cnJlbnRUb2tlbi5jb250ZW50O1xuICAgICAgICBsZXQgbGlua3MgPSBzdGF0ZS5tZC5saW5raWZ5Lm1hdGNoKHRleHQpO1xuXG4gICAgICAgIC8vIE5vdyBzcGxpdCBzdHJpbmcgdG8gbm9kZXNcbiAgICAgICAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgICAgICAgbGV0IGxldmVsID0gY3VycmVudFRva2VuLmxldmVsO1xuICAgICAgICBsZXQgbGFzdFBvcyA9IDA7XG5cbiAgICAgICAgLy8gZm9yYmlkIGVzY2FwZSBzZXF1ZW5jZSBhdCB0aGUgc3RhcnQgb2YgdGhlIHN0cmluZyxcbiAgICAgICAgLy8gdGhpcyBhdm9pZHMgaHR0cFxcOi8vZXhhbXBsZS5jb20vIGZyb20gYmVpbmcgbGlua2lmaWVkIGFzXG4gICAgICAgIC8vIGh0dHA6PGEgaHJlZj1cIi8vZXhhbXBsZS5jb20vXCI+Ly9leGFtcGxlLmNvbS88L2E+XG4gICAgICAgIGlmIChsaW5rcy5sZW5ndGggPiAwICYmIGxpbmtzWzBdLmluZGV4ID09PSAwICYmIGkgPiAwICYmIHRva2Vuc1tpIC0gMV0udHlwZSA9PT0gJ3RleHRfc3BlY2lhbCcpIHtcbiAgICAgICAgICBsaW5rcyA9IGxpbmtzLnNsaWNlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGxuID0gMDsgbG4gPCBsaW5rcy5sZW5ndGg7IGxuKyspIHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBsaW5rc1tsbl0udXJsO1xuICAgICAgICAgIGNvbnN0IGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHVybCk7XG4gICAgICAgICAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgdXJsVGV4dCA9IGxpbmtzW2xuXS50ZXh0O1xuXG4gICAgICAgICAgLy8gTGlua2lmaWVyIG1pZ2h0IHNlbmQgcmF3IGhvc3RuYW1lcyBsaWtlIFwiZXhhbXBsZS5jb21cIiwgd2hlcmUgdXJsXG4gICAgICAgICAgLy8gc3RhcnRzIHdpdGggZG9tYWluIG5hbWUuIFNvIHdlIHByZXBlbmQgaHR0cDovLyBpbiB0aG9zZSBjYXNlcyxcbiAgICAgICAgICAvLyBhbmQgcmVtb3ZlIGl0IGFmdGVyd2FyZHMuXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZiAoIWxpbmtzW2xuXS5zY2hlbWEpIHtcbiAgICAgICAgICAgIHVybFRleHQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCgnaHR0cDovLycgKyB1cmxUZXh0KS5yZXBsYWNlKC9eaHR0cDpcXC9cXC8vLCAnJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChsaW5rc1tsbl0uc2NoZW1hID09PSAnbWFpbHRvOicgJiYgIS9ebWFpbHRvOi9pLnRlc3QodXJsVGV4dCkpIHtcbiAgICAgICAgICAgIHVybFRleHQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCgnbWFpbHRvOicgKyB1cmxUZXh0KS5yZXBsYWNlKC9ebWFpbHRvOi8sICcnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KHVybFRleHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwb3MgPSBsaW5rc1tsbl0uaW5kZXg7XG4gICAgICAgICAgaWYgKHBvcyA+IGxhc3RQb3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApO1xuICAgICAgICAgICAgdG9rZW4uY29udGVudCA9IHRleHQuc2xpY2UobGFzdFBvcywgcG9zKTtcbiAgICAgICAgICAgIHRva2VuLmxldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdG9rZW5fbyA9IG5ldyBzdGF0ZS5Ub2tlbignbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICAgICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXTtcbiAgICAgICAgICB0b2tlbl9vLmxldmVsID0gbGV2ZWwrKztcbiAgICAgICAgICB0b2tlbl9vLm1hcmt1cCA9ICdsaW5raWZ5JztcbiAgICAgICAgICB0b2tlbl9vLmluZm8gPSAnYXV0byc7XG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbl9vKTtcbiAgICAgICAgICBjb25zdCB0b2tlbl90ID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApO1xuICAgICAgICAgIHRva2VuX3QuY29udGVudCA9IHVybFRleHQ7XG4gICAgICAgICAgdG9rZW5fdC5sZXZlbCA9IGxldmVsO1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW5fdCk7XG4gICAgICAgICAgY29uc3QgdG9rZW5fYyA9IG5ldyBzdGF0ZS5Ub2tlbignbGlua19jbG9zZScsICdhJywgLTEpO1xuICAgICAgICAgIHRva2VuX2MubGV2ZWwgPSAtLWxldmVsO1xuICAgICAgICAgIHRva2VuX2MubWFya3VwID0gJ2xpbmtpZnknO1xuICAgICAgICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJztcbiAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuX2MpO1xuICAgICAgICAgIGxhc3RQb3MgPSBsaW5rc1tsbl0ubGFzdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0UG9zIDwgdGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCB0b2tlbiA9IG5ldyBzdGF0ZS5Ub2tlbigndGV4dCcsICcnLCAwKTtcbiAgICAgICAgICB0b2tlbi5jb250ZW50ID0gdGV4dC5zbGljZShsYXN0UG9zKTtcbiAgICAgICAgICB0b2tlbi5sZXZlbCA9IGxldmVsO1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjZSBjdXJyZW50IG5vZGVcbiAgICAgICAgYmxvY2tUb2tlbnNbal0uY2hpbGRyZW4gPSB0b2tlbnMgPSBhcnJheVJlcGxhY2VBdCh0b2tlbnMsIGksIG5vZGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gU2ltcGxlIHR5cG9ncmFwaGljIHJlcGxhY2VtZW50c1xuLy9cbi8vIChjKSAoQykgXHUyMTkyIFx1MDBBOVxuLy8gKHRtKSAoVE0pIFx1MjE5MiBcdTIxMjJcbi8vIChyKSAoUikgXHUyMTkyIFx1MDBBRVxuLy8gKy0gXHUyMTkyIFx1MDBCMVxuLy8gLi4uIFx1MjE5MiBcdTIwMjYgKGFsc28gPy4uLi4gXHUyMTkyID8uLiwgIS4uLi4gXHUyMTkyICEuLilcbi8vID8/Pz8/Pz8/IFx1MjE5MiA/Pz8sICEhISEhIFx1MjE5MiAhISEsIGAsLGAgXHUyMTkyIGAsYFxuLy8gLS0gXHUyMTkyICZuZGFzaDssIC0tLSBcdTIxOTIgJm1kYXNoO1xuLy9cblxuLy8gVE9ETzpcbi8vIC0gZnJhY3Rpb25hbHMgMS8yLCAxLzQsIDMvNCAtPiBcdTAwQkQsIFx1MDBCQywgXHUwMEJFXG4vLyAtIG11bHRpcGxpY2F0aW9ucyAyIHggNCAtPiAyIFx1MDBENyA0XG5cbmNvbnN0IFJBUkVfUkUgPSAvXFwrLXxcXC5cXC58XFw/XFw/XFw/XFw/fCEhISF8LCx8LS0vO1xuXG4vLyBXb3JrYXJvdW5kIGZvciBwaGFudG9tanMgLSBuZWVkIHJlZ2V4IHdpdGhvdXQgL2cgZmxhZyxcbi8vIG9yIHJvb3QgY2hlY2sgd2lsbCBmYWlsIGV2ZXJ5IHNlY29uZCB0aW1lXG5jb25zdCBTQ09QRURfQUJCUl9URVNUX1JFID0gL1xcKChjfHRtfHIpXFwpL2k7XG5jb25zdCBTQ09QRURfQUJCUl9SRSA9IC9cXCgoY3x0bXxyKVxcKS9pZztcbmNvbnN0IFNDT1BFRF9BQkJSID0ge1xuICBjOiAnXHUwMEE5JyxcbiAgcjogJ1x1MDBBRScsXG4gIHRtOiAnXHUyMTIyJ1xufTtcbmZ1bmN0aW9uIHJlcGxhY2VGbihtYXRjaCwgbmFtZSkge1xuICByZXR1cm4gU0NPUEVEX0FCQlJbbmFtZS50b0xvd2VyQ2FzZSgpXTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2Vfc2NvcGVkKGlubGluZVRva2Vucykge1xuICBsZXQgaW5zaWRlX2F1dG9saW5rID0gMDtcbiAgZm9yIChsZXQgaSA9IGlubGluZVRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHRva2VuID0gaW5saW5lVG9rZW5zW2ldO1xuICAgIGlmICh0b2tlbi50eXBlID09PSAndGV4dCcgJiYgIWluc2lkZV9hdXRvbGluaykge1xuICAgICAgdG9rZW4uY29udGVudCA9IHRva2VuLmNvbnRlbnQucmVwbGFjZShTQ09QRURfQUJCUl9SRSwgcmVwbGFjZUZuKTtcbiAgICB9XG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS07XG4gICAgfVxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19jbG9zZScgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmsrKztcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHJlcGxhY2VfcmFyZShpbmxpbmVUb2tlbnMpIHtcbiAgbGV0IGluc2lkZV9hdXRvbGluayA9IDA7XG4gIGZvciAobGV0IGkgPSBpbmxpbmVUb2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBjb25zdCB0b2tlbiA9IGlubGluZVRva2Vuc1tpXTtcbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ3RleHQnICYmICFpbnNpZGVfYXV0b2xpbmspIHtcbiAgICAgIGlmIChSQVJFX1JFLnRlc3QodG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgdG9rZW4uY29udGVudCA9IHRva2VuLmNvbnRlbnQucmVwbGFjZSgvXFwrLS9nLCAnXHUwMEIxJylcbiAgICAgICAgLy8gLi4sIC4uLiwgLi4uLi4uLiAtPiBcdTIwMjZcbiAgICAgICAgLy8gYnV0ID8uLi4uLiAmICEuLi4uLiAtPiA/Li4gJiAhLi5cbiAgICAgICAgLnJlcGxhY2UoL1xcLnsyLH0vZywgJ1x1MjAyNicpLnJlcGxhY2UoLyhbPyFdKVx1MjAyNi9nLCAnJDEuLicpLnJlcGxhY2UoLyhbPyFdKXs0LH0vZywgJyQxJDEkMScpLnJlcGxhY2UoLyx7Mix9L2csICcsJylcbiAgICAgICAgLy8gZW0tZGFzaFxuICAgICAgICAucmVwbGFjZSgvKF58W14tXSktLS0oPz1bXi1dfCQpL21nLCAnJDFcXHUyMDE0JylcbiAgICAgICAgLy8gZW4tZGFzaFxuICAgICAgICAucmVwbGFjZSgvKF58XFxzKS0tKD89XFxzfCQpL21nLCAnJDFcXHUyMDEzJykucmVwbGFjZSgvKF58W14tXFxzXSktLSg/PVteLVxcc118JCkvbWcsICckMVxcdTIwMTMnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS07XG4gICAgfVxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19jbG9zZScgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmsrKztcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAgbGV0IGJsa0lkeDtcbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLnR5cG9ncmFwaGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoYmxrSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDE7IGJsa0lkeCA+PSAwOyBibGtJZHgtLSkge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbYmxrSWR4XS50eXBlICE9PSAnaW5saW5lJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChTQ09QRURfQUJCUl9URVNUX1JFLnRlc3Qoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY29udGVudCkpIHtcbiAgICAgIHJlcGxhY2Vfc2NvcGVkKHN0YXRlLnRva2Vuc1tibGtJZHhdLmNoaWxkcmVuKTtcbiAgICB9XG4gICAgaWYgKFJBUkVfUkUudGVzdChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jb250ZW50KSkge1xuICAgICAgcmVwbGFjZV9yYXJlKHN0YXRlLnRva2Vuc1tibGtJZHhdLmNoaWxkcmVuKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gQ29udmVydCBzdHJhaWdodCBxdW90YXRpb24gbWFya3MgdG8gdHlwb2dyYXBoaWMgb25lc1xuLy9cblxuY29uc3QgUVVPVEVfVEVTVF9SRSA9IC9bJ1wiXS87XG5jb25zdCBRVU9URV9SRSA9IC9bJ1wiXS9nO1xuY29uc3QgQVBPU1RST1BIRSA9ICdcXHUyMDE5JzsgLyogXHUyMDE5ICovXG5cbmZ1bmN0aW9uIHJlcGxhY2VBdChzdHIsIGluZGV4LCBjaCkge1xuICByZXR1cm4gc3RyLnNsaWNlKDAsIGluZGV4KSArIGNoICsgc3RyLnNsaWNlKGluZGV4ICsgMSk7XG59XG5mdW5jdGlvbiBwcm9jZXNzX2lubGluZXModG9rZW5zLCBzdGF0ZSkge1xuICBsZXQgajtcbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICBjb25zdCB0aGlzTGV2ZWwgPSB0b2tlbnNbaV0ubGV2ZWw7XG4gICAgZm9yIChqID0gc3RhY2subGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgIGlmIChzdGFja1tqXS5sZXZlbCA8PSB0aGlzTGV2ZWwpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHN0YWNrLmxlbmd0aCA9IGogKyAxO1xuICAgIGlmICh0b2tlbi50eXBlICE9PSAndGV4dCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBsZXQgdGV4dCA9IHRva2VuLmNvbnRlbnQ7XG4gICAgbGV0IHBvcyA9IDA7XG4gICAgbGV0IG1heCA9IHRleHQubGVuZ3RoO1xuXG4gICAgLyogZXNsaW50IG5vLWxhYmVsczowLGJsb2NrLXNjb3BlZC12YXI6MCAqL1xuICAgIE9VVEVSOiB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBRVU9URV9SRS5sYXN0SW5kZXggPSBwb3M7XG4gICAgICBjb25zdCB0ID0gUVVPVEVfUkUuZXhlYyh0ZXh0KTtcbiAgICAgIGlmICghdCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxldCBjYW5PcGVuID0gdHJ1ZTtcbiAgICAgIGxldCBjYW5DbG9zZSA9IHRydWU7XG4gICAgICBwb3MgPSB0LmluZGV4ICsgMTtcbiAgICAgIGNvbnN0IGlzU2luZ2xlID0gdFswXSA9PT0gXCInXCI7XG5cbiAgICAgIC8vIEZpbmQgcHJldmlvdXMgY2hhcmFjdGVyLFxuICAgICAgLy8gZGVmYXVsdCB0byBzcGFjZSBpZiBpdCdzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmVcbiAgICAgIC8vXG4gICAgICBsZXQgbGFzdENoYXIgPSAweDIwO1xuICAgICAgaWYgKHQuaW5kZXggLSAxID49IDApIHtcbiAgICAgICAgbGFzdENoYXIgPSB0ZXh0LmNoYXJDb2RlQXQodC5pbmRleCAtIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgaWYgKHRva2Vuc1tqXS50eXBlID09PSAnc29mdGJyZWFrJyB8fCB0b2tlbnNbal0udHlwZSA9PT0gJ2hhcmRicmVhaycpIGJyZWFrOyAvLyBsYXN0Q2hhciBkZWZhdWx0cyB0byAweDIwXG4gICAgICAgICAgaWYgKCF0b2tlbnNbal0uY29udGVudCkgY29udGludWU7IC8vIHNob3VsZCBza2lwIGFsbCB0b2tlbnMgZXhjZXB0ICd0ZXh0JywgJ2h0bWxfaW5saW5lJyBvciAnY29kZV9pbmxpbmUnXG5cbiAgICAgICAgICBsYXN0Q2hhciA9IHRva2Vuc1tqXS5jb250ZW50LmNoYXJDb2RlQXQodG9rZW5zW2pdLmNvbnRlbnQubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmluZCBuZXh0IGNoYXJhY3RlcixcbiAgICAgIC8vIGRlZmF1bHQgdG8gc3BhY2UgaWYgaXQncyB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgICAvL1xuICAgICAgbGV0IG5leHRDaGFyID0gMHgyMDtcbiAgICAgIGlmIChwb3MgPCBtYXgpIHtcbiAgICAgICAgbmV4dENoYXIgPSB0ZXh0LmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaiA9IGkgKyAxOyBqIDwgdG9rZW5zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKHRva2Vuc1tqXS50eXBlID09PSAnc29mdGJyZWFrJyB8fCB0b2tlbnNbal0udHlwZSA9PT0gJ2hhcmRicmVhaycpIGJyZWFrOyAvLyBuZXh0Q2hhciBkZWZhdWx0cyB0byAweDIwXG4gICAgICAgICAgaWYgKCF0b2tlbnNbal0uY29udGVudCkgY29udGludWU7IC8vIHNob3VsZCBza2lwIGFsbCB0b2tlbnMgZXhjZXB0ICd0ZXh0JywgJ2h0bWxfaW5saW5lJyBvciAnY29kZV9pbmxpbmUnXG5cbiAgICAgICAgICBuZXh0Q2hhciA9IHRva2Vuc1tqXS5jb250ZW50LmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGlzTGFzdFB1bmN0Q2hhciA9IGlzTWRBc2NpaVB1bmN0KGxhc3RDaGFyKSB8fCBpc1B1bmN0Q2hhcihTdHJpbmcuZnJvbUNoYXJDb2RlKGxhc3RDaGFyKSk7XG4gICAgICBjb25zdCBpc05leHRQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChuZXh0Q2hhcikgfHwgaXNQdW5jdENoYXIoU3RyaW5nLmZyb21DaGFyQ29kZShuZXh0Q2hhcikpO1xuICAgICAgY29uc3QgaXNMYXN0V2hpdGVTcGFjZSA9IGlzV2hpdGVTcGFjZShsYXN0Q2hhcik7XG4gICAgICBjb25zdCBpc05leHRXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKG5leHRDaGFyKTtcbiAgICAgIGlmIChpc05leHRXaGl0ZVNwYWNlKSB7XG4gICAgICAgIGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNOZXh0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTGFzdFdoaXRlU3BhY2UgfHwgaXNMYXN0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGlzTGFzdFdoaXRlU3BhY2UpIHtcbiAgICAgICAgY2FuQ2xvc2UgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNMYXN0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTmV4dFdoaXRlU3BhY2UgfHwgaXNOZXh0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbkNsb3NlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChuZXh0Q2hhciA9PT0gMHgyMiAvKiBcIiAqLyAmJiB0WzBdID09PSAnXCInKSB7XG4gICAgICAgIGlmIChsYXN0Q2hhciA+PSAweDMwIC8qIDAgKi8gJiYgbGFzdENoYXIgPD0gMHgzOSAvKiA5ICovKSB7XG4gICAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiAxXCJcIiAtIGNvdW50IGZpcnN0IHF1b3RlIGFzIGFuIGluY2hcbiAgICAgICAgICBjYW5DbG9zZSA9IGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNhbk9wZW4gJiYgY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gUmVwbGFjZSBxdW90ZXMgaW4gdGhlIG1pZGRsZSBvZiBwdW5jdHVhdGlvbiBzZXF1ZW5jZSwgYnV0IG5vdFxuICAgICAgICAvLyBpbiB0aGUgbWlkZGxlIG9mIHRoZSB3b3JkcywgaS5lLjpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gMS4gZm9vIFwiIGJhciBcIiBiYXogLSBub3QgcmVwbGFjZWRcbiAgICAgICAgLy8gMi4gZm9vLVwiLWJhci1cIi1iYXogLSByZXBsYWNlZFxuICAgICAgICAvLyAzLiBmb29cImJhclwiYmF6ICAgICAtIG5vdCByZXBsYWNlZFxuICAgICAgICAvL1xuICAgICAgICBjYW5PcGVuID0gaXNMYXN0UHVuY3RDaGFyO1xuICAgICAgICBjYW5DbG9zZSA9IGlzTmV4dFB1bmN0Q2hhcjtcbiAgICAgIH1cbiAgICAgIGlmICghY2FuT3BlbiAmJiAhY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gbWlkZGxlIG9mIHdvcmRcbiAgICAgICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBBUE9TVFJPUEhFKTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjYW5DbG9zZSkge1xuICAgICAgICAvLyB0aGlzIGNvdWxkIGJlIGEgY2xvc2luZyBxdW90ZSwgcmV3aW5kIHRoZSBzdGFjayB0byBnZXQgYSBtYXRjaFxuICAgICAgICBmb3IgKGogPSBzdGFjay5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgIGxldCBpdGVtID0gc3RhY2tbal07XG4gICAgICAgICAgaWYgKHN0YWNrW2pdLmxldmVsIDwgdGhpc0xldmVsKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGl0ZW0uc2luZ2xlID09PSBpc1NpbmdsZSAmJiBzdGFja1tqXS5sZXZlbCA9PT0gdGhpc0xldmVsKSB7XG4gICAgICAgICAgICBpdGVtID0gc3RhY2tbal07XG4gICAgICAgICAgICBsZXQgb3BlblF1b3RlO1xuICAgICAgICAgICAgbGV0IGNsb3NlUXVvdGU7XG4gICAgICAgICAgICBpZiAoaXNTaW5nbGUpIHtcbiAgICAgICAgICAgICAgb3BlblF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMl07XG4gICAgICAgICAgICAgIGNsb3NlUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1szXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9wZW5RdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzBdO1xuICAgICAgICAgICAgICBjbG9zZVF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdG9rZW4uY29udGVudCAqYmVmb3JlKiB0b2tlbnNbaXRlbS50b2tlbl0uY29udGVudCxcbiAgICAgICAgICAgIC8vIGJlY2F1c2UsIGlmIHRoZXkgYXJlIHBvaW50aW5nIGF0IHRoZSBzYW1lIHRva2VuLCByZXBsYWNlQXRcbiAgICAgICAgICAgIC8vIGNvdWxkIG1lc3MgdXAgaW5kaWNlcyB3aGVuIHF1b3RlIGxlbmd0aCAhPSAxXG4gICAgICAgICAgICB0b2tlbi5jb250ZW50ID0gcmVwbGFjZUF0KHRva2VuLmNvbnRlbnQsIHQuaW5kZXgsIGNsb3NlUXVvdGUpO1xuICAgICAgICAgICAgdG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQsIGl0ZW0ucG9zLCBvcGVuUXVvdGUpO1xuICAgICAgICAgICAgcG9zICs9IGNsb3NlUXVvdGUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGlmIChpdGVtLnRva2VuID09PSBpKSB7XG4gICAgICAgICAgICAgIHBvcyArPSBvcGVuUXVvdGUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgPSB0b2tlbi5jb250ZW50O1xuICAgICAgICAgICAgbWF4ID0gdGV4dC5sZW5ndGg7XG4gICAgICAgICAgICBzdGFjay5sZW5ndGggPSBqO1xuICAgICAgICAgICAgY29udGludWUgT1VURVI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY2FuT3Blbikge1xuICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICB0b2tlbjogaSxcbiAgICAgICAgICBwb3M6IHQuaW5kZXgsXG4gICAgICAgICAgc2luZ2xlOiBpc1NpbmdsZSxcbiAgICAgICAgICBsZXZlbDogdGhpc0xldmVsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChjYW5DbG9zZSAmJiBpc1NpbmdsZSkge1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gcmVwbGFjZUF0KHRva2VuLmNvbnRlbnQsIHQuaW5kZXgsIEFQT1NUUk9QSEUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuZnVuY3Rpb24gc21hcnRxdW90ZXMoc3RhdGUpIHtcbiAgLyogZXNsaW50IG1heC1kZXB0aDowICovXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy50eXBvZ3JhcGhlcikge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGxldCBibGtJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMTsgYmxrSWR4ID49IDA7IGJsa0lkeC0tKSB7XG4gICAgaWYgKHN0YXRlLnRva2Vuc1tibGtJZHhdLnR5cGUgIT09ICdpbmxpbmUnIHx8ICFRVU9URV9URVNUX1JFLnRlc3Qoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY29udGVudCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBwcm9jZXNzX2lubGluZXMoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4sIHN0YXRlKTtcbiAgfVxufVxuXG4vLyBKb2luIHJhdyB0ZXh0IHRva2VucyB3aXRoIHRoZSByZXN0IG9mIHRoZSB0ZXh0XG4vL1xuLy8gVGhpcyBpcyBzZXQgYXMgYSBzZXBhcmF0ZSBydWxlIHRvIHByb3ZpZGUgYW4gb3Bwb3J0dW5pdHkgZm9yIHBsdWdpbnNcbi8vIHRvIHJ1biB0ZXh0IHJlcGxhY2VtZW50cyBhZnRlciB0ZXh0IGpvaW4sIGJ1dCBiZWZvcmUgZXNjYXBlIGpvaW4uXG4vL1xuLy8gRm9yIGV4YW1wbGUsIGBcXDopYCBzaG91bGRuJ3QgYmUgcmVwbGFjZWQgd2l0aCBhbiBlbW9qaS5cbi8vXG5cbmZ1bmN0aW9uIHRleHRfam9pbihzdGF0ZSkge1xuICBsZXQgY3VyciwgbGFzdDtcbiAgY29uc3QgYmxvY2tUb2tlbnMgPSBzdGF0ZS50b2tlbnM7XG4gIGNvbnN0IGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7XG4gIGZvciAobGV0IGogPSAwOyBqIDwgbDsgaisrKSB7XG4gICAgaWYgKGJsb2NrVG9rZW5zW2pdLnR5cGUgIT09ICdpbmxpbmUnKSBjb250aW51ZTtcbiAgICBjb25zdCB0b2tlbnMgPSBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbjtcbiAgICBjb25zdCBtYXggPSB0b2tlbnMubGVuZ3RoO1xuICAgIGZvciAoY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dF9zcGVjaWFsJykge1xuICAgICAgICB0b2tlbnNbY3Vycl0udHlwZSA9ICd0ZXh0JztcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjdXJyID0gbGFzdCA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dCcgJiYgY3VyciArIDEgPCBtYXggJiYgdG9rZW5zW2N1cnIgKyAxXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgLy8gY29sbGFwc2UgdHdvIGFkamFjZW50IHRleHQgbm9kZXNcbiAgICAgICAgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50ID0gdG9rZW5zW2N1cnJdLmNvbnRlbnQgKyB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY3VyciAhPT0gbGFzdCkge1xuICAgICAgICAgIHRva2Vuc1tsYXN0XSA9IHRva2Vuc1tjdXJyXTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Kys7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjdXJyICE9PSBsYXN0KSB7XG4gICAgICB0b2tlbnMubGVuZ3RoID0gbGFzdDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIGludGVybmFsXG4gKiBjbGFzcyBDb3JlXG4gKlxuICogVG9wLWxldmVsIHJ1bGVzIGV4ZWN1dG9yLiBHbHVlcyBibG9jay9pbmxpbmUgcGFyc2VycyBhbmQgZG9lcyBpbnRlcm1lZGlhdGVcbiAqIHRyYW5zZm9ybWF0aW9ucy5cbiAqKi9cblxuY29uc3QgX3J1bGVzJDIgPSBbWydub3JtYWxpemUnLCBub3JtYWxpemVdLCBbJ2Jsb2NrJywgYmxvY2tdLCBbJ2lubGluZScsIGlubGluZV0sIFsnbGlua2lmeScsIGxpbmtpZnkkMV0sIFsncmVwbGFjZW1lbnRzJywgcmVwbGFjZV0sIFsnc21hcnRxdW90ZXMnLCBzbWFydHF1b3Rlc10sXG4vLyBgdGV4dF9qb2luYCBmaW5kcyBgdGV4dF9zcGVjaWFsYCB0b2tlbnMgKGZvciBlc2NhcGUgc2VxdWVuY2VzKVxuLy8gYW5kIGpvaW5zIHRoZW0gd2l0aCB0aGUgcmVzdCBvZiB0aGUgdGV4dFxuWyd0ZXh0X2pvaW4nLCB0ZXh0X2pvaW5dXTtcblxuLyoqXG4gKiBuZXcgQ29yZSgpXG4gKiovXG5mdW5jdGlvbiBDb3JlKCkge1xuICAvKipcbiAgICogQ29yZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBjb3JlIHJ1bGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBfcnVsZXMkMi5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXMkMltpXVswXSwgX3J1bGVzJDJbaV1bMV0pO1xuICB9XG59XG5cbi8qKlxuICogQ29yZS5wcm9jZXNzKHN0YXRlKVxuICpcbiAqIEV4ZWN1dGVzIGNvcmUgY2hhaW4gcnVsZXMuXG4gKiovXG5Db3JlLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlci5nZXRSdWxlcygnJyk7XG4gIGZvciAobGV0IGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuQ29yZS5wcm90b3R5cGUuU3RhdGUgPSBTdGF0ZUNvcmU7XG5cbi8vIFBhcnNlciBzdGF0ZSBjbGFzc1xuXG5mdW5jdGlvbiBTdGF0ZUJsb2NrKHNyYywgbWQsIGVudiwgdG9rZW5zKSB7XG4gIHRoaXMuc3JjID0gc3JjO1xuXG4gIC8vIGxpbmsgdG8gcGFyc2VyIGluc3RhbmNlXG4gIHRoaXMubWQgPSBtZDtcbiAgdGhpcy5lbnYgPSBlbnY7XG5cbiAgLy9cbiAgLy8gSW50ZXJuYWwgc3RhdGUgdmFydGlhYmxlc1xuICAvL1xuXG4gIHRoaXMudG9rZW5zID0gdG9rZW5zO1xuICB0aGlzLmJNYXJrcyA9IFtdOyAvLyBsaW5lIGJlZ2luIG9mZnNldHMgZm9yIGZhc3QganVtcHNcbiAgdGhpcy5lTWFya3MgPSBbXTsgLy8gbGluZSBlbmQgb2Zmc2V0cyBmb3IgZmFzdCBqdW1wc1xuICB0aGlzLnRTaGlmdCA9IFtdOyAvLyBvZmZzZXRzIG9mIHRoZSBmaXJzdCBub24tc3BhY2UgY2hhcmFjdGVycyAodGFicyBub3QgZXhwYW5kZWQpXG4gIHRoaXMuc0NvdW50ID0gW107IC8vIGluZGVudHMgZm9yIGVhY2ggbGluZSAodGFicyBleHBhbmRlZClcblxuICAvLyBBbiBhbW91bnQgb2YgdmlydHVhbCBzcGFjZXMgKHRhYnMgZXhwYW5kZWQpIGJldHdlZW4gYmVnaW5uaW5nXG4gIC8vIG9mIGVhY2ggbGluZSAoYk1hcmtzKSBhbmQgcmVhbCBiZWdpbm5pbmcgb2YgdGhhdCBsaW5lLlxuICAvL1xuICAvLyBJdCBleGlzdHMgb25seSBhcyBhIGhhY2sgYmVjYXVzZSBibG9ja3F1b3RlcyBvdmVycmlkZSBiTWFya3NcbiAgLy8gbG9zaW5nIGluZm9ybWF0aW9uIGluIHRoZSBwcm9jZXNzLlxuICAvL1xuICAvLyBJdCdzIHVzZWQgb25seSB3aGVuIGV4cGFuZGluZyB0YWJzLCB5b3UgY2FuIHRoaW5rIGFib3V0IGl0IGFzXG4gIC8vIGFuIGluaXRpYWwgdGFiIGxlbmd0aCwgZS5nLiBic0NvdW50PTIxIGFwcGxpZWQgdG8gc3RyaW5nIGBcXHQxMjNgXG4gIC8vIG1lYW5zIGZpcnN0IHRhYiBzaG91bGQgYmUgZXhwYW5kZWQgdG8gNC0yMSU0ID09PSAzIHNwYWNlcy5cbiAgLy9cbiAgdGhpcy5ic0NvdW50ID0gW107XG5cbiAgLy8gYmxvY2sgcGFyc2VyIHZhcmlhYmxlc1xuXG4gIC8vIHJlcXVpcmVkIGJsb2NrIGNvbnRlbnQgaW5kZW50IChmb3IgZXhhbXBsZSwgaWYgd2UgYXJlXG4gIC8vIGluc2lkZSBhIGxpc3QsIGl0IHdvdWxkIGJlIHBvc2l0aW9uZWQgYWZ0ZXIgbGlzdCBtYXJrZXIpXG4gIHRoaXMuYmxrSW5kZW50ID0gMDtcbiAgdGhpcy5saW5lID0gMDsgLy8gbGluZSBpbmRleCBpbiBzcmNcbiAgdGhpcy5saW5lTWF4ID0gMDsgLy8gbGluZXMgY291bnRcbiAgdGhpcy50aWdodCA9IGZhbHNlOyAvLyBsb29zZS90aWdodCBtb2RlIGZvciBsaXN0c1xuICB0aGlzLmRkSW5kZW50ID0gLTE7IC8vIGluZGVudCBvZiB0aGUgY3VycmVudCBkZCBibG9jayAoLTEgaWYgdGhlcmUgaXNuJ3QgYW55KVxuICB0aGlzLmxpc3RJbmRlbnQgPSAtMTsgLy8gaW5kZW50IG9mIHRoZSBjdXJyZW50IGxpc3QgYmxvY2sgKC0xIGlmIHRoZXJlIGlzbid0IGFueSlcblxuICAvLyBjYW4gYmUgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcsICdyb290JywgJ3BhcmFncmFwaCcgb3IgJ3JlZmVyZW5jZSdcbiAgLy8gdXNlZCBpbiBsaXN0cyB0byBkZXRlcm1pbmUgaWYgdGhleSBpbnRlcnJ1cHQgYSBwYXJhZ3JhcGhcbiAgdGhpcy5wYXJlbnRUeXBlID0gJ3Jvb3QnO1xuICB0aGlzLmxldmVsID0gMDtcblxuICAvLyBDcmVhdGUgY2FjaGVzXG4gIC8vIEdlbmVyYXRlIG1hcmtlcnMuXG4gIGNvbnN0IHMgPSB0aGlzLnNyYztcbiAgZm9yIChsZXQgc3RhcnQgPSAwLCBwb3MgPSAwLCBpbmRlbnQgPSAwLCBvZmZzZXQgPSAwLCBsZW4gPSBzLmxlbmd0aCwgaW5kZW50X2ZvdW5kID0gZmFsc2U7IHBvcyA8IGxlbjsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHMuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmICghaW5kZW50X2ZvdW5kKSB7XG4gICAgICBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgICAgaW5kZW50Kys7XG4gICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgIG9mZnNldCArPSA0IC0gb2Zmc2V0ICUgNDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGVudF9mb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaCA9PT0gMHgwQSB8fCBwb3MgPT09IGxlbiAtIDEpIHtcbiAgICAgIGlmIChjaCAhPT0gMHgwQSkge1xuICAgICAgICBwb3MrKztcbiAgICAgIH1cbiAgICAgIHRoaXMuYk1hcmtzLnB1c2goc3RhcnQpO1xuICAgICAgdGhpcy5lTWFya3MucHVzaChwb3MpO1xuICAgICAgdGhpcy50U2hpZnQucHVzaChpbmRlbnQpO1xuICAgICAgdGhpcy5zQ291bnQucHVzaChvZmZzZXQpO1xuICAgICAgdGhpcy5ic0NvdW50LnB1c2goMCk7XG4gICAgICBpbmRlbnRfZm91bmQgPSBmYWxzZTtcbiAgICAgIGluZGVudCA9IDA7XG4gICAgICBvZmZzZXQgPSAwO1xuICAgICAgc3RhcnQgPSBwb3MgKyAxO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1c2ggZmFrZSBlbnRyeSB0byBzaW1wbGlmeSBjYWNoZSBib3VuZHMgY2hlY2tzXG4gIHRoaXMuYk1hcmtzLnB1c2gocy5sZW5ndGgpO1xuICB0aGlzLmVNYXJrcy5wdXNoKHMubGVuZ3RoKTtcbiAgdGhpcy50U2hpZnQucHVzaCgwKTtcbiAgdGhpcy5zQ291bnQucHVzaCgwKTtcbiAgdGhpcy5ic0NvdW50LnB1c2goMCk7XG4gIHRoaXMubGluZU1heCA9IHRoaXMuYk1hcmtzLmxlbmd0aCAtIDE7IC8vIGRvbid0IGNvdW50IGxhc3QgZmFrZSBsaW5lXG59XG5cbi8vIFB1c2ggbmV3IHRva2VuIHRvIFwic3RyZWFtXCIuXG4vL1xuU3RhdGVCbG9jay5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh0eXBlLCB0YWcsIG5lc3RpbmcpIHtcbiAgY29uc3QgdG9rZW4gPSBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKTtcbiAgdG9rZW4uYmxvY2sgPSB0cnVlO1xuICBpZiAobmVzdGluZyA8IDApIHRoaXMubGV2ZWwtLTsgLy8gY2xvc2luZyB0YWdcbiAgdG9rZW4ubGV2ZWwgPSB0aGlzLmxldmVsO1xuICBpZiAobmVzdGluZyA+IDApIHRoaXMubGV2ZWwrKzsgLy8gb3BlbmluZyB0YWdcblxuICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKTtcbiAgcmV0dXJuIHRva2VuO1xufTtcblN0YXRlQmxvY2sucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiBpc0VtcHR5KGxpbmUpIHtcbiAgcmV0dXJuIHRoaXMuYk1hcmtzW2xpbmVdICsgdGhpcy50U2hpZnRbbGluZV0gPj0gdGhpcy5lTWFya3NbbGluZV07XG59O1xuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcEVtcHR5TGluZXMgPSBmdW5jdGlvbiBza2lwRW1wdHlMaW5lcyhmcm9tKSB7XG4gIGZvciAobGV0IG1heCA9IHRoaXMubGluZU1heDsgZnJvbSA8IG1heDsgZnJvbSsrKSB7XG4gICAgaWYgKHRoaXMuYk1hcmtzW2Zyb21dICsgdGhpcy50U2hpZnRbZnJvbV0gPCB0aGlzLmVNYXJrc1tmcm9tXSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcm9tO1xufTtcblxuLy8gU2tpcCBzcGFjZXMgZnJvbSBnaXZlbiBwb3NpdGlvbi5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXMgPSBmdW5jdGlvbiBza2lwU3BhY2VzKHBvcykge1xuICBmb3IgKGxldCBtYXggPSB0aGlzLnNyYy5sZW5ndGg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgc3BhY2VzIGZyb20gZ2l2ZW4gcG9zaXRpb24gaW4gcmV2ZXJzZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXNCYWNrID0gZnVuY3Rpb24gc2tpcFNwYWNlc0JhY2socG9zLCBtaW4pIHtcbiAgaWYgKHBvcyA8PSBtaW4pIHtcbiAgICByZXR1cm4gcG9zO1xuICB9XG4gIHdoaWxlIChwb3MgPiBtaW4pIHtcbiAgICBpZiAoIWlzU3BhY2UodGhpcy5zcmMuY2hhckNvZGVBdCgtLXBvcykpKSB7XG4gICAgICByZXR1cm4gcG9zICsgMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgY2hhciBjb2RlcyBmcm9tIGdpdmVuIHBvc2l0aW9uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnMgPSBmdW5jdGlvbiBza2lwQ2hhcnMocG9zLCBjb2RlKSB7XG4gIGZvciAobGV0IG1heCA9IHRoaXMuc3JjLmxlbmd0aDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGlmICh0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IGNvZGUpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9zO1xufTtcblxuLy8gU2tpcCBjaGFyIGNvZGVzIHJldmVyc2UgZnJvbSBnaXZlbiBwb3NpdGlvbiAtIDFcblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBDaGFyc0JhY2sgPSBmdW5jdGlvbiBza2lwQ2hhcnNCYWNrKHBvcywgY29kZSwgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7XG4gICAgcmV0dXJuIHBvcztcbiAgfVxuICB3aGlsZSAocG9zID4gbWluKSB7XG4gICAgaWYgKGNvZGUgIT09IHRoaXMuc3JjLmNoYXJDb2RlQXQoLS1wb3MpKSB7XG4gICAgICByZXR1cm4gcG9zICsgMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIGN1dCBsaW5lcyByYW5nZSBmcm9tIHNvdXJjZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLmdldExpbmVzID0gZnVuY3Rpb24gZ2V0TGluZXMoYmVnaW4sIGVuZCwgaW5kZW50LCBrZWVwTGFzdExGKSB7XG4gIGlmIChiZWdpbiA+PSBlbmQpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgY29uc3QgcXVldWUgPSBuZXcgQXJyYXkoZW5kIC0gYmVnaW4pO1xuICBmb3IgKGxldCBpID0gMCwgbGluZSA9IGJlZ2luOyBsaW5lIDwgZW5kOyBsaW5lKyssIGkrKykge1xuICAgIGxldCBsaW5lSW5kZW50ID0gMDtcbiAgICBjb25zdCBsaW5lU3RhcnQgPSB0aGlzLmJNYXJrc1tsaW5lXTtcbiAgICBsZXQgZmlyc3QgPSBsaW5lU3RhcnQ7XG4gICAgbGV0IGxhc3Q7XG4gICAgaWYgKGxpbmUgKyAxIDwgZW5kIHx8IGtlZXBMYXN0TEYpIHtcbiAgICAgIC8vIE5vIG5lZWQgZm9yIGJvdW5kcyBjaGVjayBiZWNhdXNlIHdlIGhhdmUgZmFrZSBlbnRyeSBvbiB0YWlsLlxuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdO1xuICAgIH1cbiAgICB3aGlsZSAoZmlyc3QgPCBsYXN0ICYmIGxpbmVJbmRlbnQgPCBpbmRlbnQpIHtcbiAgICAgIGNvbnN0IGNoID0gdGhpcy5zcmMuY2hhckNvZGVBdChmaXJzdCk7XG4gICAgICBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgbGluZUluZGVudCArPSA0IC0gKGxpbmVJbmRlbnQgKyB0aGlzLmJzQ291bnRbbGluZV0pICUgNDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lSW5kZW50Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZmlyc3QgLSBsaW5lU3RhcnQgPCB0aGlzLnRTaGlmdFtsaW5lXSkge1xuICAgICAgICAvLyBwYXRjaGVkIHRTaGlmdCBtYXNrZWQgY2hhcmFjdGVycyB0byBsb29rIGxpa2Ugc3BhY2VzIChibG9ja3F1b3RlcywgbGlzdCBtYXJrZXJzKVxuICAgICAgICBsaW5lSW5kZW50Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGZpcnN0Kys7XG4gICAgfVxuICAgIGlmIChsaW5lSW5kZW50ID4gaW5kZW50KSB7XG4gICAgICAvLyBwYXJ0aWFsbHkgZXhwYW5kaW5nIHRhYnMgaW4gY29kZSBibG9ja3MsIGUuZyAnXFx0XFx0Zm9vYmFyJ1xuICAgICAgLy8gd2l0aCBpbmRlbnQ9MiBiZWNvbWVzICcgIFxcdGZvb2JhcidcbiAgICAgIHF1ZXVlW2ldID0gbmV3IEFycmF5KGxpbmVJbmRlbnQgLSBpbmRlbnQgKyAxKS5qb2luKCcgJykgKyB0aGlzLnNyYy5zbGljZShmaXJzdCwgbGFzdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXVlW2ldID0gdGhpcy5zcmMuc2xpY2UoZmlyc3QsIGxhc3QpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcXVldWUuam9pbignJyk7XG59O1xuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGJsb2NrIHJ1bGVzXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuO1xuXG4vLyBHRk0gdGFibGUsIGh0dHBzOi8vZ2l0aHViLmdpdGh1Yi5jb20vZ2ZtLyN0YWJsZXMtZXh0ZW5zaW9uLVxuXG5cbi8vIExpbWl0IHRoZSBhbW91bnQgb2YgZW1wdHkgYXV0b2NvbXBsZXRlZCBjZWxscyBpbiBhIHRhYmxlLFxuLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9pc3N1ZXMvMTAwMCxcbi8vXG4vLyBCb3RoIHB1bGxkb3duLWNtYXJrIGFuZCBjb21tb25tYXJrLWhzIGxpbWl0IHRoZSBudW1iZXIgb2YgY2VsbHMgdGhpcyB3YXkgdG8gfjIwMGsuXG4vLyBXZSBzZXQgaXQgdG8gNjVrLCB3aGljaCBjYW4gZXhwYW5kIHVzZXIgaW5wdXQgYnkgYSBmYWN0b3Igb2YgeDM3MFxuLy8gKDI1NngyNTYgc3F1YXJlIGlzIDEuOGtCIGV4cGFuZGVkIGludG8gNjUwa0IpLlxuY29uc3QgTUFYX0FVVE9DT01QTEVURURfQ0VMTFMgPSAweDEwMDAwO1xuZnVuY3Rpb24gZ2V0TGluZShzdGF0ZSwgbGluZSkge1xuICBjb25zdCBwb3MgPSBzdGF0ZS5iTWFya3NbbGluZV0gKyBzdGF0ZS50U2hpZnRbbGluZV07XG4gIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tsaW5lXTtcbiAgcmV0dXJuIHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCk7XG59XG5mdW5jdGlvbiBlc2NhcGVkU3BsaXQoc3RyKSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBjb25zdCBtYXggPSBzdHIubGVuZ3RoO1xuICBsZXQgcG9zID0gMDtcbiAgbGV0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgbGV0IGlzRXNjYXBlZCA9IGZhbHNlO1xuICBsZXQgbGFzdFBvcyA9IDA7XG4gIGxldCBjdXJyZW50ID0gJyc7XG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBpZiAoY2ggPT09IDB4N2MgLyogfCAqLykge1xuICAgICAgaWYgKCFpc0VzY2FwZWQpIHtcbiAgICAgICAgLy8gcGlwZSBzZXBhcmF0aW5nIGNlbGxzLCAnfCdcbiAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCArIHN0ci5zdWJzdHJpbmcobGFzdFBvcywgcG9zKSk7XG4gICAgICAgIGN1cnJlbnQgPSAnJztcbiAgICAgICAgbGFzdFBvcyA9IHBvcyArIDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlc2NhcGVkIHBpcGUsICdcXHwnXG4gICAgICAgIGN1cnJlbnQgKz0gc3RyLnN1YnN0cmluZyhsYXN0UG9zLCBwb3MgLSAxKTtcbiAgICAgICAgbGFzdFBvcyA9IHBvcztcbiAgICAgIH1cbiAgICB9XG4gICAgaXNFc2NhcGVkID0gY2ggPT09IDB4NWMgLyogXFwgKi87XG4gICAgcG9zKys7XG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICB9XG4gIHJlc3VsdC5wdXNoKGN1cnJlbnQgKyBzdHIuc3Vic3RyaW5nKGxhc3RQb3MpKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIHRhYmxlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICAvLyBzaG91bGQgaGF2ZSBhdCBsZWFzdCB0d28gbGluZXNcbiAgaWYgKHN0YXJ0TGluZSArIDIgPiBlbmRMaW5lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG4gIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgc2Vjb25kIGxpbmUgc2hvdWxkIGJlICd8JywgJy0nLCAnOicsXG4gIC8vIGFuZCBubyBvdGhlciBjaGFyYWN0ZXJzIGFyZSBhbGxvd2VkIGJ1dCBzcGFjZXM7XG4gIC8vIGJhc2ljYWxseSwgdGhpcyBpcyB0aGUgZXF1aXZhbGVudCBvZiAvXlstOnxdWy06fFxcc10qJC8gcmVnZXhwXG5cbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICBpZiAocG9zID49IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgZmlyc3RDaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcbiAgaWYgKGZpcnN0Q2ggIT09IDB4N0MgLyogfCAqLyAmJiBmaXJzdENoICE9PSAweDJEIC8qIC0gKi8gJiYgZmlyc3RDaCAhPT0gMHgzQSAvKiA6ICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChwb3MgPj0gc3RhdGUuZU1hcmtzW25leHRMaW5lXSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBzZWNvbmRDaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcbiAgaWYgKHNlY29uZENoICE9PSAweDdDIC8qIHwgKi8gJiYgc2Vjb25kQ2ggIT09IDB4MkQgLyogLSAqLyAmJiBzZWNvbmRDaCAhPT0gMHgzQSAvKiA6ICovICYmICFpc1NwYWNlKHNlY29uZENoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGlmIGZpcnN0IGNoYXJhY3RlciBpcyAnLScsIHRoZW4gc2Vjb25kIGNoYXJhY3RlciBtdXN0IG5vdCBiZSBhIHNwYWNlXG4gIC8vIChkdWUgdG8gcGFyc2luZyBhbWJpZ3VpdHkgd2l0aCBsaXN0KVxuICBpZiAoZmlyc3RDaCA9PT0gMHgyRCAvKiAtICovICYmIGlzU3BhY2Uoc2Vjb25kQ2gpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHdoaWxlIChwb3MgPCBzdGF0ZS5lTWFya3NbbmV4dExpbmVdKSB7XG4gICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjaCAhPT0gMHg3QyAvKiB8ICovICYmIGNoICE9PSAweDJEIC8qIC0gKi8gJiYgY2ggIT09IDB4M0EgLyogOiAqLyAmJiAhaXNTcGFjZShjaCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcG9zKys7XG4gIH1cbiAgbGV0IGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgc3RhcnRMaW5lICsgMSk7XG4gIGxldCBjb2x1bW5zID0gbGluZVRleHQuc3BsaXQoJ3wnKTtcbiAgY29uc3QgYWxpZ25zID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHQgPSBjb2x1bW5zW2ldLnRyaW0oKTtcbiAgICBpZiAoIXQpIHtcbiAgICAgIC8vIGFsbG93IGVtcHR5IGNvbHVtbnMgYmVmb3JlIGFuZCBhZnRlciB0YWJsZSwgYnV0IG5vdCBpbiBiZXR3ZWVuIGNvbHVtbnM7XG4gICAgICAvLyBlLmcuIGFsbG93IGAgfC0tLXwgYCwgZGlzYWxsb3cgYCAtLS18fC0tLSBgXG4gICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSBjb2x1bW5zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghL146Py0rOj8kLy50ZXN0KHQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0LmNoYXJDb2RlQXQodC5sZW5ndGggLSAxKSA9PT0gMHgzQSAvKiA6ICovKSB7XG4gICAgICBhbGlnbnMucHVzaCh0LmNoYXJDb2RlQXQoMCkgPT09IDB4M0EgLyogOiAqLyA/ICdjZW50ZXInIDogJ3JpZ2h0Jyk7XG4gICAgfSBlbHNlIGlmICh0LmNoYXJDb2RlQXQoMCkgPT09IDB4M0EgLyogOiAqLykge1xuICAgICAgYWxpZ25zLnB1c2goJ2xlZnQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWxpZ25zLnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIHN0YXJ0TGluZSkudHJpbSgpO1xuICBpZiAobGluZVRleHQuaW5kZXhPZignfCcpID09PSAtMSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb2x1bW5zID0gZXNjYXBlZFNwbGl0KGxpbmVUZXh0KTtcbiAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbMF0gPT09ICcnKSBjb2x1bW5zLnNoaWZ0KCk7XG4gIGlmIChjb2x1bW5zLmxlbmd0aCAmJiBjb2x1bW5zW2NvbHVtbnMubGVuZ3RoIC0gMV0gPT09ICcnKSBjb2x1bW5zLnBvcCgpO1xuXG4gIC8vIGhlYWRlciByb3cgd2lsbCBkZWZpbmUgYW4gYW1vdW50IG9mIGNvbHVtbnMgaW4gdGhlIGVudGlyZSB0YWJsZSxcbiAgLy8gYW5kIGFsaWduIHJvdyBzaG91bGQgYmUgZXhhY3RseSB0aGUgc2FtZSAodGhlIHJlc3Qgb2YgdGhlIHJvd3MgY2FuIGRpZmZlcilcbiAgY29uc3QgY29sdW1uQ291bnQgPSBjb2x1bW5zLmxlbmd0aDtcbiAgaWYgKGNvbHVtbkNvdW50ID09PSAwIHx8IGNvbHVtbkNvdW50ICE9PSBhbGlnbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChzaWxlbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICd0YWJsZSc7XG5cbiAgLy8gdXNlICdibG9ja3F1b3RlJyBsaXN0cyBmb3IgdGVybWluYXRpb24gYmVjYXVzZSBpdCdzXG4gIC8vIHRoZSBtb3N0IHNpbWlsYXIgdG8gdGFibGVzXG4gIGNvbnN0IHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdibG9ja3F1b3RlJyk7XG4gIGNvbnN0IHRva2VuX3RvID0gc3RhdGUucHVzaCgndGFibGVfb3BlbicsICd0YWJsZScsIDEpO1xuICBjb25zdCB0YWJsZUxpbmVzID0gW3N0YXJ0TGluZSwgMF07XG4gIHRva2VuX3RvLm1hcCA9IHRhYmxlTGluZXM7XG4gIGNvbnN0IHRva2VuX3RobyA9IHN0YXRlLnB1c2goJ3RoZWFkX29wZW4nLCAndGhlYWQnLCAxKTtcbiAgdG9rZW5fdGhvLm1hcCA9IFtzdGFydExpbmUsIHN0YXJ0TGluZSArIDFdO1xuICBjb25zdCB0b2tlbl9odHJvID0gc3RhdGUucHVzaCgndHJfb3BlbicsICd0cicsIDEpO1xuICB0b2tlbl9odHJvLm1hcCA9IFtzdGFydExpbmUsIHN0YXJ0TGluZSArIDFdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b2tlbl9obyA9IHN0YXRlLnB1c2goJ3RoX29wZW4nLCAndGgnLCAxKTtcbiAgICBpZiAoYWxpZ25zW2ldKSB7XG4gICAgICB0b2tlbl9oby5hdHRycyA9IFtbJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXV1dO1xuICAgIH1cbiAgICBjb25zdCB0b2tlbl9pbCA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKTtcbiAgICB0b2tlbl9pbC5jb250ZW50ID0gY29sdW1uc1tpXS50cmltKCk7XG4gICAgdG9rZW5faWwuY2hpbGRyZW4gPSBbXTtcbiAgICBzdGF0ZS5wdXNoKCd0aF9jbG9zZScsICd0aCcsIC0xKTtcbiAgfVxuICBzdGF0ZS5wdXNoKCd0cl9jbG9zZScsICd0cicsIC0xKTtcbiAgc3RhdGUucHVzaCgndGhlYWRfY2xvc2UnLCAndGhlYWQnLCAtMSk7XG4gIGxldCB0Ym9keUxpbmVzO1xuICBsZXQgYXV0b2NvbXBsZXRlZENlbGxzID0gMDtcbiAgZm9yIChuZXh0TGluZSA9IHN0YXJ0TGluZSArIDI7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBuZXh0TGluZSkudHJpbSgpO1xuICAgIGlmICghbGluZVRleHQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29sdW1ucyA9IGVzY2FwZWRTcGxpdChsaW5lVGV4dCk7XG4gICAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbMF0gPT09ICcnKSBjb2x1bW5zLnNoaWZ0KCk7XG4gICAgaWYgKGNvbHVtbnMubGVuZ3RoICYmIGNvbHVtbnNbY29sdW1ucy5sZW5ndGggLSAxXSA9PT0gJycpIGNvbHVtbnMucG9wKCk7XG5cbiAgICAvLyBub3RlOiBhdXRvY29tcGxldGUgY291bnQgY2FuIGJlIG5lZ2F0aXZlIGlmIHVzZXIgc3BlY2lmaWVzIG1vcmUgY29sdW1ucyB0aGFuIGhlYWRlcixcbiAgICAvLyBidXQgdGhhdCBkb2VzIG5vdCBhZmZlY3QgaW50ZW5kZWQgdXNlICh3aGljaCBpcyBsaW1pdGluZyBleHBhbnNpb24pXG4gICAgYXV0b2NvbXBsZXRlZENlbGxzICs9IGNvbHVtbkNvdW50IC0gY29sdW1ucy5sZW5ndGg7XG4gICAgaWYgKGF1dG9jb21wbGV0ZWRDZWxscyA+IE1BWF9BVVRPQ09NUExFVEVEX0NFTExTKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKG5leHRMaW5lID09PSBzdGFydExpbmUgKyAyKSB7XG4gICAgICBjb25zdCB0b2tlbl90Ym8gPSBzdGF0ZS5wdXNoKCd0Ym9keV9vcGVuJywgJ3Rib2R5JywgMSk7XG4gICAgICB0b2tlbl90Ym8ubWFwID0gdGJvZHlMaW5lcyA9IFtzdGFydExpbmUgKyAyLCAwXTtcbiAgICB9XG4gICAgY29uc3QgdG9rZW5fdHJvID0gc3RhdGUucHVzaCgndHJfb3BlbicsICd0cicsIDEpO1xuICAgIHRva2VuX3Ryby5tYXAgPSBbbmV4dExpbmUsIG5leHRMaW5lICsgMV07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb2x1bW5Db3VudDsgaSsrKSB7XG4gICAgICBjb25zdCB0b2tlbl90ZG8gPSBzdGF0ZS5wdXNoKCd0ZF9vcGVuJywgJ3RkJywgMSk7XG4gICAgICBpZiAoYWxpZ25zW2ldKSB7XG4gICAgICAgIHRva2VuX3Rkby5hdHRycyA9IFtbJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXV1dO1xuICAgICAgfVxuICAgICAgY29uc3QgdG9rZW5faWwgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMCk7XG4gICAgICB0b2tlbl9pbC5jb250ZW50ID0gY29sdW1uc1tpXSA/IGNvbHVtbnNbaV0udHJpbSgpIDogJyc7XG4gICAgICB0b2tlbl9pbC5jaGlsZHJlbiA9IFtdO1xuICAgICAgc3RhdGUucHVzaCgndGRfY2xvc2UnLCAndGQnLCAtMSk7XG4gICAgfVxuICAgIHN0YXRlLnB1c2goJ3RyX2Nsb3NlJywgJ3RyJywgLTEpO1xuICB9XG4gIGlmICh0Ym9keUxpbmVzKSB7XG4gICAgc3RhdGUucHVzaCgndGJvZHlfY2xvc2UnLCAndGJvZHknLCAtMSk7XG4gICAgdGJvZHlMaW5lc1sxXSA9IG5leHRMaW5lO1xuICB9XG4gIHN0YXRlLnB1c2goJ3RhYmxlX2Nsb3NlJywgJ3RhYmxlJywgLTEpO1xuICB0YWJsZUxpbmVzWzFdID0gbmV4dExpbmU7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBDb2RlIGJsb2NrICg0IHNwYWNlcyBwYWRkZWQpXG5cbmZ1bmN0aW9uIGNvZGUoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSAvKiwgc2lsZW50ICovKSB7XG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA8IDQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcbiAgbGV0IGxhc3QgPSBuZXh0TGluZTtcbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIGlmIChzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkge1xuICAgICAgbmV4dExpbmUrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICBuZXh0TGluZSsrO1xuICAgICAgbGFzdCA9IG5leHRMaW5lO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGJyZWFrO1xuICB9XG4gIHN0YXRlLmxpbmUgPSBsYXN0O1xuICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ2NvZGVfYmxvY2snLCAnY29kZScsIDApO1xuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBsYXN0LCA0ICsgc3RhdGUuYmxrSW5kZW50LCBmYWxzZSkgKyAnXFxuJztcbiAgdG9rZW4ubWFwID0gW3N0YXJ0TGluZSwgc3RhdGUubGluZV07XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBmZW5jZXMgKGBgYCBsYW5nLCB+fn4gbGFuZylcblxuZnVuY3Rpb24gZmVuY2Uoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHBvcyArIDMgPiBtYXgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgaWYgKG1hcmtlciAhPT0gMHg3RSAvKiB+ICovICYmIG1hcmtlciAhPT0gMHg2MCAvKiBgICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gc2NhbiBtYXJrZXIgbGVuZ3RoXG4gIGxldCBtZW0gPSBwb3M7XG4gIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcik7XG4gIGxldCBsZW4gPSBwb3MgLSBtZW07XG4gIGlmIChsZW4gPCAzKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IG1hcmt1cCA9IHN0YXRlLnNyYy5zbGljZShtZW0sIHBvcyk7XG4gIGNvbnN0IHBhcmFtcyA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCk7XG4gIGlmIChtYXJrZXIgPT09IDB4NjAgLyogYCAqLykge1xuICAgIGlmIChwYXJhbXMuaW5kZXhPZihTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcikpID49IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvLyBTaW5jZSBzdGFydCBpcyBmb3VuZCwgd2UgY2FuIHJlcG9ydCBzdWNjZXNzIGhlcmUgaW4gdmFsaWRhdGlvbiBtb2RlXG4gIGlmIChzaWxlbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIHNlYXJjaCBlbmQgb2YgYmxvY2tcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lO1xuICBsZXQgaGF2ZUVuZE1hcmtlciA9IGZhbHNlO1xuICBmb3IgKDs7KSB7XG4gICAgbmV4dExpbmUrKztcbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkge1xuICAgICAgLy8gdW5jbG9zZWQgYmxvY2sgc2hvdWxkIGJlIGF1dG9jbG9zZWQgYnkgZW5kIG9mIGRvY3VtZW50LlxuICAgICAgLy8gYWxzbyBibG9jayBzZWVtcyB0byBiZSBhdXRvY2xvc2VkIGJ5IGVuZCBvZiBwYXJlbnRcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBwb3MgPSBtZW0gPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXTtcbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkge1xuICAgICAgLy8gbm9uLWVtcHR5IGxpbmUgd2l0aCBuZWdhdGl2ZSBpbmRlbnQgc2hvdWxkIHN0b3AgdGhlIGxpc3Q6XG4gICAgICAvLyAtIGBgYFxuICAgICAgLy8gIHRlc3RcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gbWFya2VyKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgLy8gY2xvc2luZyBmZW5jZSBzaG91bGQgYmUgaW5kZW50ZWQgbGVzcyB0aGFuIDQgc3BhY2VzXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcG9zID0gc3RhdGUuc2tpcENoYXJzKHBvcywgbWFya2VyKTtcblxuICAgIC8vIGNsb3NpbmcgY29kZSBmZW5jZSBtdXN0IGJlIGF0IGxlYXN0IGFzIGxvbmcgYXMgdGhlIG9wZW5pbmcgb25lXG4gICAgaWYgKHBvcyAtIG1lbSA8IGxlbikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gbWFrZSBzdXJlIHRhaWwgaGFzIHNwYWNlcyBvbmx5XG4gICAgcG9zID0gc3RhdGUuc2tpcFNwYWNlcyhwb3MpO1xuICAgIGlmIChwb3MgPCBtYXgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBoYXZlRW5kTWFya2VyID0gdHJ1ZTtcbiAgICAvLyBmb3VuZCFcbiAgICBicmVhaztcbiAgfVxuXG4gIC8vIElmIGEgZmVuY2UgaGFzIGhlYWRpbmcgc3BhY2VzLCB0aGV5IHNob3VsZCBiZSByZW1vdmVkIGZyb20gaXRzIGlubmVyIGJsb2NrXG4gIGxlbiA9IHN0YXRlLnNDb3VudFtzdGFydExpbmVdO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmUgKyAoaGF2ZUVuZE1hcmtlciA/IDEgOiAwKTtcbiAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdmZW5jZScsICdjb2RlJywgMCk7XG4gIHRva2VuLmluZm8gPSBwYXJhbXM7XG4gIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUgKyAxLCBuZXh0TGluZSwgbGVuLCB0cnVlKTtcbiAgdG9rZW4ubWFya3VwID0gbWFya3VwO1xuICB0b2tlbi5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIEJsb2NrIHF1b3Rlc1xuXG5mdW5jdGlvbiBibG9ja3F1b3RlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgbGV0IG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuICBjb25zdCBvbGRMaW5lTWF4ID0gc3RhdGUubGluZU1heDtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGNoZWNrIHRoZSBibG9jayBxdW90ZSBtYXJrZXJcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0UgLyogPiAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIHdlIGtub3cgdGhhdCBpdCdzIGdvaW5nIHRvIGJlIGEgdmFsaWQgYmxvY2txdW90ZSxcbiAgLy8gc28gbm8gcG9pbnQgdHJ5aW5nIHRvIGZpbmQgdGhlIGVuZCBvZiBpdCBpbiBzaWxlbnQgbW9kZVxuICBpZiAoc2lsZW50KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY29uc3Qgb2xkQk1hcmtzID0gW107XG4gIGNvbnN0IG9sZEJTQ291bnQgPSBbXTtcbiAgY29uc3Qgb2xkU0NvdW50ID0gW107XG4gIGNvbnN0IG9sZFRTaGlmdCA9IFtdO1xuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnYmxvY2txdW90ZScpO1xuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdibG9ja3F1b3RlJztcbiAgbGV0IGxhc3RMaW5lRW1wdHkgPSBmYWxzZTtcbiAgbGV0IG5leHRMaW5lO1xuXG4gIC8vIFNlYXJjaCB0aGUgZW5kIG9mIHRoZSBibG9ja1xuICAvL1xuICAvLyBCbG9jayBlbmRzIHdpdGggZWl0aGVyOlxuICAvLyAgMS4gYW4gZW1wdHkgbGluZSBvdXRzaWRlOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+IHRlc3RcbiAgLy9cbiAgLy8gICAgIGBgYFxuICAvLyAgMi4gYW4gZW1wdHkgbGluZSBpbnNpZGU6XG4gIC8vICAgICBgYGBcbiAgLy8gICAgID5cbiAgLy8gICAgIHRlc3RcbiAgLy8gICAgIGBgYFxuICAvLyAgMy4gYW5vdGhlciB0YWc6XG4gIC8vICAgICBgYGBcbiAgLy8gICAgID4gdGVzdFxuICAvLyAgICAgIC0gLSAtXG4gIC8vICAgICBgYGBcbiAgZm9yIChuZXh0TGluZSA9IHN0YXJ0TGluZTsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gY2hlY2sgaWYgaXQncyBvdXRkZW50ZWQsIGkuZS4gaXQncyBpbnNpZGUgbGlzdCBpdGVtIGFuZCBpbmRlbnRlZFxuICAgIC8vIGxlc3MgdGhhbiBzYWlkIGxpc3QgaXRlbTpcbiAgICAvL1xuICAgIC8vIGBgYFxuICAgIC8vIDEuIGFueXRoaW5nXG4gICAgLy8gICAgPiBjdXJyZW50IGJsb2NrcXVvdGVcbiAgICAvLyAyLiBjaGVja2luZyB0aGlzIGxpbmVcbiAgICAvLyBgYGBcbiAgICBjb25zdCBpc091dGRlbnRlZCA9IHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQ7XG4gICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXTtcbiAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgLy8gQ2FzZSAxOiBsaW5lIGlzIG5vdCBpbnNpZGUgdGhlIGJsb2NrcXVvdGUsIGFuZCB0aGlzIGxpbmUgaXMgZW1wdHkuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKSA9PT0gMHgzRSAvKiA+ICovICYmICFpc091dGRlbnRlZCkge1xuICAgICAgLy8gVGhpcyBsaW5lIGlzIGluc2lkZSB0aGUgYmxvY2txdW90ZS5cblxuICAgICAgLy8gc2V0IG9mZnNldCBwYXN0IHNwYWNlcyBhbmQgXCI+XCJcbiAgICAgIGxldCBpbml0aWFsID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIDE7XG4gICAgICBsZXQgc3BhY2VBZnRlck1hcmtlcjtcbiAgICAgIGxldCBhZGp1c3RUYWI7XG5cbiAgICAgIC8vIHNraXAgb25lIG9wdGlvbmFsIHNwYWNlIGFmdGVyICc+J1xuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjAgLyogc3BhY2UgKi8pIHtcbiAgICAgICAgLy8gJyA+ICAgdGVzdCAnXG4gICAgICAgIC8vICAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZTpcbiAgICAgICAgcG9zKys7XG4gICAgICAgIGluaXRpYWwrKztcbiAgICAgICAgYWRqdXN0VGFiID0gZmFsc2U7XG4gICAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDA5IC8qIHRhYiAqLykge1xuICAgICAgICBzcGFjZUFmdGVyTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgaWYgKChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIGluaXRpYWwpICUgNCA9PT0gMykge1xuICAgICAgICAgIC8vICcgID5cXHQgIHRlc3QgJ1xuICAgICAgICAgIC8vICAgICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICh0YWIgaGFzIHdpZHRoPT09MSlcbiAgICAgICAgICBwb3MrKztcbiAgICAgICAgICBpbml0aWFsKys7XG4gICAgICAgICAgYWRqdXN0VGFiID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gJyA+XFx0ICB0ZXN0ICdcbiAgICAgICAgICAvLyAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZSArIHNoaWZ0IGJzQ291bnQgc2xpZ2h0bHlcbiAgICAgICAgICAvLyAgICAgICAgIHRvIG1ha2UgZXh0cmEgc3BhY2UgYXBwZWFyXG4gICAgICAgICAgYWRqdXN0VGFiID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IG9mZnNldCA9IGluaXRpYWw7XG4gICAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKTtcbiAgICAgIHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gPSBwb3M7XG4gICAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gNCAtIChvZmZzZXQgKyBzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIChhZGp1c3RUYWIgPyAxIDogMCkpICUgNDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHBvcysrO1xuICAgICAgfVxuICAgICAgbGFzdExpbmVFbXB0eSA9IHBvcyA+PSBtYXg7XG4gICAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pO1xuICAgICAgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0gPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdICsgMSArIChzcGFjZUFmdGVyTWFya2VyID8gMSA6IDApO1xuICAgICAgb2xkU0NvdW50LnB1c2goc3RhdGUuc0NvdW50W25leHRMaW5lXSk7XG4gICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2Zmc2V0IC0gaW5pdGlhbDtcbiAgICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuICAgICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IHBvcyAtIHN0YXRlLmJNYXJrc1tuZXh0TGluZV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIDI6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoZSBsYXN0IGxpbmUgd2FzIGVtcHR5LlxuICAgIGlmIChsYXN0TGluZUVtcHR5KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBDYXNlIDM6IGFub3RoZXIgdGFnIGZvdW5kLlxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkge1xuICAgICAgLy8gUXVpcmsgdG8gZW5mb3JjZSBcImhhcmQgdGVybWluYXRpb24gbW9kZVwiIGZvciBwYXJhZ3JhcGhzO1xuICAgICAgLy8gbm9ybWFsbHkgaWYgeW91IGNhbGwgYHRva2VuaXplKHN0YXRlLCBzdGFydExpbmUsIG5leHRMaW5lKWAsXG4gICAgICAvLyBwYXJhZ3JhcGhzIHdpbGwgbG9vayBiZWxvdyBuZXh0TGluZSBmb3IgcGFyYWdyYXBoIGNvbnRpbnVhdGlvbixcbiAgICAgIC8vIGJ1dCBpZiBibG9ja3F1b3RlIGlzIHRlcm1pbmF0ZWQgYnkgYW5vdGhlciB0YWcsIHRoZXkgc2hvdWxkbid0XG4gICAgICBzdGF0ZS5saW5lTWF4ID0gbmV4dExpbmU7XG4gICAgICBpZiAoc3RhdGUuYmxrSW5kZW50ICE9PSAwKSB7XG4gICAgICAgIC8vIHN0YXRlLmJsa0luZGVudCB3YXMgbm9uLXplcm8sIHdlIG5vdyBzZXQgaXQgdG8gemVybyxcbiAgICAgICAgLy8gc28gd2UgbmVlZCB0byByZS1jYWxjdWxhdGUgYWxsIG9mZnNldHMgdG8gYXBwZWFyIGFzXG4gICAgICAgIC8vIGlmIGluZGVudCB3YXNuJ3QgY2hhbmdlZFxuICAgICAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKTtcbiAgICAgICAgb2xkQlNDb3VudC5wdXNoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKTtcbiAgICAgICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG4gICAgICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pO1xuICAgICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC09IHN0YXRlLmJsa0luZGVudDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKTtcbiAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pO1xuICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pO1xuXG4gICAgLy8gQSBuZWdhdGl2ZSBpbmRlbnRhdGlvbiBtZWFucyB0aGF0IHRoaXMgaXMgYSBwYXJhZ3JhcGggY29udGludWF0aW9uXG4gICAgLy9cbiAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gLTE7XG4gIH1cbiAgY29uc3Qgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICBzdGF0ZS5ibGtJbmRlbnQgPSAwO1xuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnYmxvY2txdW90ZV9vcGVuJywgJ2Jsb2NrcXVvdGUnLCAxKTtcbiAgdG9rZW5fby5tYXJrdXAgPSAnPic7XG4gIGNvbnN0IGxpbmVzID0gW3N0YXJ0TGluZSwgMF07XG4gIHRva2VuX28ubWFwID0gbGluZXM7XG4gIHN0YXRlLm1kLmJsb2NrLnRva2VuaXplKHN0YXRlLCBzdGFydExpbmUsIG5leHRMaW5lKTtcbiAgY29uc3QgdG9rZW5fYyA9IHN0YXRlLnB1c2goJ2Jsb2NrcXVvdGVfY2xvc2UnLCAnYmxvY2txdW90ZScsIC0xKTtcbiAgdG9rZW5fYy5tYXJrdXAgPSAnPic7XG4gIHN0YXRlLmxpbmVNYXggPSBvbGRMaW5lTWF4O1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZTtcbiAgbGluZXNbMV0gPSBzdGF0ZS5saW5lO1xuXG4gIC8vIFJlc3RvcmUgb3JpZ2luYWwgdFNoaWZ0OyB0aGlzIG1pZ2h0IG5vdCBiZSBuZWNlc3Nhcnkgc2luY2UgdGhlIHBhcnNlclxuICAvLyBoYXMgYWxyZWFkeSBiZWVuIGhlcmUsIGJ1dCBqdXN0IHRvIG1ha2Ugc3VyZSB3ZSBjYW4gZG8gdGhhdC5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvbGRUU2hpZnQubGVuZ3RoOyBpKyspIHtcbiAgICBzdGF0ZS5iTWFya3NbaSArIHN0YXJ0TGluZV0gPSBvbGRCTWFya3NbaV07XG4gICAgc3RhdGUudFNoaWZ0W2kgKyBzdGFydExpbmVdID0gb2xkVFNoaWZ0W2ldO1xuICAgIHN0YXRlLnNDb3VudFtpICsgc3RhcnRMaW5lXSA9IG9sZFNDb3VudFtpXTtcbiAgICBzdGF0ZS5ic0NvdW50W2kgKyBzdGFydExpbmVdID0gb2xkQlNDb3VudFtpXTtcbiAgfVxuICBzdGF0ZS5ibGtJbmRlbnQgPSBvbGRJbmRlbnQ7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBIb3Jpem9udGFsIHJ1bGVcblxuZnVuY3Rpb24gaHIoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGNvbnN0IG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgY29uc3QgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuXG4gIC8vIENoZWNrIGhyIG1hcmtlclxuICBpZiAobWFya2VyICE9PSAweDJBIC8qICogKi8gJiYgbWFya2VyICE9PSAweDJEIC8qIC0gKi8gJiYgbWFya2VyICE9PSAweDVGIC8qIF8gKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBtYXJrZXJzIGNhbiBiZSBtaXhlZCB3aXRoIHNwYWNlcywgYnV0IHRoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCAzIG9mIHRoZW1cblxuICBsZXQgY250ID0gMTtcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICAgIGlmIChjaCAhPT0gbWFya2VyICYmICFpc1NwYWNlKGNoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoY2ggPT09IG1hcmtlcikge1xuICAgICAgY250Kys7XG4gICAgfVxuICB9XG4gIGlmIChjbnQgPCAzKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChzaWxlbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lICsgMTtcbiAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdocicsICdocicsIDApO1xuICB0b2tlbi5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXTtcbiAgdG9rZW4ubWFya3VwID0gQXJyYXkoY250ICsgMSkuam9pbihTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcikpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gTGlzdHNcblxuXG4vLyBTZWFyY2ggYFstKypdW1xcbiBdYCwgcmV0dXJucyBuZXh0IHBvcyBhZnRlciBtYXJrZXIgb24gc3VjY2Vzc1xuLy8gb3IgLTEgb24gZmFpbC5cbmZ1bmN0aW9uIHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBzdGFydExpbmUpIHtcbiAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG4gIC8vIENoZWNrIGJ1bGxldFxuICBpZiAobWFya2VyICE9PSAweDJBIC8qICogKi8gJiYgbWFya2VyICE9PSAweDJEIC8qIC0gKi8gJiYgbWFya2VyICE9PSAweDJCIC8qICsgKi8pIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAvLyBcIiAtdGVzdCBcIiAtIGlzIG5vdCBhIGxpc3QgaXRlbVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9zO1xufVxuXG4vLyBTZWFyY2ggYFxcZCtbLildW1xcbiBdYCwgcmV0dXJucyBuZXh0IHBvcyBhZnRlciBtYXJrZXIgb24gc3VjY2Vzc1xuLy8gb3IgLTEgb24gZmFpbC5cbmZ1bmN0aW9uIHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSB7XG4gIGNvbnN0IHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG4gIGxldCBwb3MgPSBzdGFydDtcblxuICAvLyBMaXN0IG1hcmtlciBzaG91bGQgaGF2ZSBhdCBsZWFzdCAyIGNoYXJzIChkaWdpdCArIGRvdClcbiAgaWYgKHBvcyArIDEgPj0gbWF4KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGxldCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcbiAgaWYgKGNoIDwgMHgzMCAvKiAwICovIHx8IGNoID4gMHgzOSAvKiA5ICovKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGZvciAoOzspIHtcbiAgICAvLyBFT0wgLT4gZmFpbFxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICAgIGlmIChjaCA+PSAweDMwIC8qIDAgKi8gJiYgY2ggPD0gMHgzOSAvKiA5ICovKSB7XG4gICAgICAvLyBMaXN0IG1hcmtlciBzaG91bGQgaGF2ZSBubyBtb3JlIHRoYW4gOSBkaWdpdHNcbiAgICAgIC8vIChwcmV2ZW50cyBpbnRlZ2VyIG92ZXJmbG93IGluIGJyb3dzZXJzKVxuICAgICAgaWYgKHBvcyAtIHN0YXJ0ID49IDEwKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGZvdW5kIHZhbGlkIG1hcmtlclxuICAgIGlmIChjaCA9PT0gMHgyOSAvKiApICovIHx8IGNoID09PSAweDJlIC8qIC4gKi8pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAvLyBcIiAxLnRlc3QgXCIgLSBpcyBub3QgYSBsaXN0IGl0ZW1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn1cbmZ1bmN0aW9uIG1hcmtUaWdodFBhcmFncmFwaHMoc3RhdGUsIGlkeCkge1xuICBjb25zdCBsZXZlbCA9IHN0YXRlLmxldmVsICsgMjtcbiAgZm9yIChsZXQgaSA9IGlkeCArIDIsIGwgPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMjsgaSA8IGw7IGkrKykge1xuICAgIGlmIChzdGF0ZS50b2tlbnNbaV0ubGV2ZWwgPT09IGxldmVsICYmIHN0YXRlLnRva2Vuc1tpXS50eXBlID09PSAncGFyYWdyYXBoX29wZW4nKSB7XG4gICAgICBzdGF0ZS50b2tlbnNbaSArIDJdLmhpZGRlbiA9IHRydWU7XG4gICAgICBzdGF0ZS50b2tlbnNbaV0uaGlkZGVuID0gdHJ1ZTtcbiAgICAgIGkgKz0gMjtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGxpc3Qoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBtYXgsIHBvcywgc3RhcnQsIHRva2VuO1xuICBsZXQgbmV4dExpbmUgPSBzdGFydExpbmU7XG4gIGxldCB0aWdodCA9IHRydWU7XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFNwZWNpYWwgY2FzZTpcbiAgLy8gIC0gaXRlbSAxXG4gIC8vICAgLSBpdGVtIDJcbiAgLy8gICAgLSBpdGVtIDNcbiAgLy8gICAgIC0gaXRlbSA0XG4gIC8vICAgICAgLSB0aGlzIG9uZSBpcyBhIHBhcmFncmFwaCBjb250aW51YXRpb25cbiAgaWYgKHN0YXRlLmxpc3RJbmRlbnQgPj0gMCAmJiBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUubGlzdEluZGVudCA+PSA0ICYmIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IGlzVGVybWluYXRpbmdQYXJhZ3JhcGggPSBmYWxzZTtcblxuICAvLyBsaW1pdCBjb25kaXRpb25zIHdoZW4gbGlzdCBjYW4gaW50ZXJydXB0XG4gIC8vIGEgcGFyYWdyYXBoICh2YWxpZGF0aW9uIG1vZGUgb25seSlcbiAgaWYgKHNpbGVudCAmJiBzdGF0ZS5wYXJlbnRUeXBlID09PSAncGFyYWdyYXBoJykge1xuICAgIC8vIE5leHQgbGlzdCBpdGVtIHNob3VsZCBzdGlsbCB0ZXJtaW5hdGUgcHJldmlvdXMgbGlzdCBpdGVtO1xuICAgIC8vXG4gICAgLy8gVGhpcyBjb2RlIGNhbiBmYWlsIGlmIHBsdWdpbnMgdXNlIGJsa0luZGVudCBhcyB3ZWxsIGFzIGxpc3RzLFxuICAgIC8vIGJ1dCBJIGhvcGUgdGhlIHNwZWMgZ2V0cyBmaXhlZCBsb25nIGJlZm9yZSB0aGF0IGhhcHBlbnMuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA+PSBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIGlzVGVybWluYXRpbmdQYXJhZ3JhcGggPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIERldGVjdCBsaXN0IHR5cGUgYW5kIHBvc2l0aW9uIGFmdGVyIG1hcmtlclxuICBsZXQgaXNPcmRlcmVkO1xuICBsZXQgbWFya2VyVmFsdWU7XG4gIGxldCBwb3NBZnRlck1hcmtlcjtcbiAgaWYgKChwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpKSA+PSAwKSB7XG4gICAgaXNPcmRlcmVkID0gdHJ1ZTtcbiAgICBzdGFydCA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICAgIG1hcmtlclZhbHVlID0gTnVtYmVyKHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zQWZ0ZXJNYXJrZXIgLSAxKSk7XG5cbiAgICAvLyBJZiB3ZSdyZSBzdGFydGluZyBhIG5ldyBvcmRlcmVkIGxpc3QgcmlnaHQgYWZ0ZXJcbiAgICAvLyBhIHBhcmFncmFwaCwgaXQgc2hvdWxkIHN0YXJ0IHdpdGggMS5cbiAgICBpZiAoaXNUZXJtaW5hdGluZ1BhcmFncmFwaCAmJiBtYXJrZXJWYWx1ZSAhPT0gMSkgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2UgaWYgKChwb3NBZnRlck1hcmtlciA9IHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSkpID49IDApIHtcbiAgICBpc09yZGVyZWQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJZiB3ZSdyZSBzdGFydGluZyBhIG5ldyB1bm9yZGVyZWQgbGlzdCByaWdodCBhZnRlclxuICAvLyBhIHBhcmFncmFwaCwgZmlyc3QgbGluZSBzaG91bGQgbm90IGJlIGVtcHR5LlxuICBpZiAoaXNUZXJtaW5hdGluZ1BhcmFncmFwaCkge1xuICAgIGlmIChzdGF0ZS5za2lwU3BhY2VzKHBvc0FmdGVyTWFya2VyKSA+PSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdKSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBGb3IgdmFsaWRhdGlvbiBtb2RlIHdlIGNhbiB0ZXJtaW5hdGUgaW1tZWRpYXRlbHlcbiAgaWYgKHNpbGVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gV2Ugc2hvdWxkIHRlcm1pbmF0ZSBsaXN0IG9uIHN0eWxlIGNoYW5nZS4gUmVtZW1iZXIgZmlyc3Qgb25lIHRvIGNvbXBhcmUuXG4gIGNvbnN0IG1hcmtlckNoYXJDb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKTtcblxuICAvLyBTdGFydCBsaXN0XG4gIGNvbnN0IGxpc3RUb2tJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoO1xuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3Rfb3BlbicsICdvbCcsIDEpO1xuICAgIGlmIChtYXJrZXJWYWx1ZSAhPT0gMSkge1xuICAgICAgdG9rZW4uYXR0cnMgPSBbWydzdGFydCcsIG1hcmtlclZhbHVlXV07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgnYnVsbGV0X2xpc3Rfb3BlbicsICd1bCcsIDEpO1xuICB9XG4gIGNvbnN0IGxpc3RMaW5lcyA9IFtuZXh0TGluZSwgMF07XG4gIHRva2VuLm1hcCA9IGxpc3RMaW5lcztcbiAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSk7XG5cbiAgLy9cbiAgLy8gSXRlcmF0ZSBsaXN0IGl0ZW1zXG4gIC8vXG5cbiAgbGV0IHByZXZFbXB0eUVuZCA9IGZhbHNlO1xuICBjb25zdCB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnbGlzdCcpO1xuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdsaXN0JztcbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIHBvcyA9IHBvc0FmdGVyTWFya2VyO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG4gICAgY29uc3QgaW5pdGlhbCA9IHN0YXRlLnNDb3VudFtuZXh0TGluZV0gKyBwb3NBZnRlck1hcmtlciAtIChzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG4gICAgbGV0IG9mZnNldCA9IGluaXRpYWw7XG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgIG9mZnNldCArPSA0IC0gKG9mZnNldCArIHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKSAlIDQ7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAweDIwKSB7XG4gICAgICAgIG9mZnNldCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwb3MrKztcbiAgICB9XG4gICAgY29uc3QgY29udGVudFN0YXJ0ID0gcG9zO1xuICAgIGxldCBpbmRlbnRBZnRlck1hcmtlcjtcbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCkge1xuICAgICAgLy8gdHJpbW1pbmcgc3BhY2UgaW4gXCItICAgIFxcbiAgM1wiIGNhc2UsIGluZGVudCBpcyAxIGhlcmVcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZW50QWZ0ZXJNYXJrZXIgPSBvZmZzZXQgLSBpbml0aWFsO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGhhdmUgbW9yZSB0aGFuIDQgc3BhY2VzLCB0aGUgaW5kZW50IGlzIDFcbiAgICAvLyAodGhlIHJlc3QgaXMganVzdCBpbmRlbnRlZCBjb2RlIGJsb2NrKVxuICAgIGlmIChpbmRlbnRBZnRlck1hcmtlciA+IDQpIHtcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gMTtcbiAgICB9XG5cbiAgICAvLyBcIiAgLSAgdGVzdFwiXG4gICAgLy8gIF5eXl5eIC0gY2FsY3VsYXRpbmcgdG90YWwgbGVuZ3RoIG9mIHRoaXMgdGhpbmdcbiAgICBjb25zdCBpbmRlbnQgPSBpbml0aWFsICsgaW5kZW50QWZ0ZXJNYXJrZXI7XG5cbiAgICAvLyBSdW4gc3VicGFyc2VyICYgd3JpdGUgdG9rZW5zXG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdsaXN0X2l0ZW1fb3BlbicsICdsaScsIDEpO1xuICAgIHRva2VuLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyQ2hhckNvZGUpO1xuICAgIGNvbnN0IGl0ZW1MaW5lcyA9IFtuZXh0TGluZSwgMF07XG4gICAgdG9rZW4ubWFwID0gaXRlbUxpbmVzO1xuICAgIGlmIChpc09yZGVyZWQpIHtcbiAgICAgIHRva2VuLmluZm8gPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvc0FmdGVyTWFya2VyIC0gMSk7XG4gICAgfVxuXG4gICAgLy8gY2hhbmdlIGN1cnJlbnQgc3RhdGUsIHRoZW4gcmVzdG9yZSBpdCBhZnRlciBwYXJzZXIgc3ViY2FsbFxuICAgIGNvbnN0IG9sZFRpZ2h0ID0gc3RhdGUudGlnaHQ7XG4gICAgY29uc3Qgb2xkVFNoaWZ0ID0gc3RhdGUudFNoaWZ0W25leHRMaW5lXTtcbiAgICBjb25zdCBvbGRTQ291bnQgPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdO1xuXG4gICAgLy8gIC0gZXhhbXBsZSBsaXN0XG4gICAgLy8gXiBsaXN0SW5kZW50IHBvc2l0aW9uIHdpbGwgYmUgaGVyZVxuICAgIC8vICAgXiBibGtJbmRlbnQgcG9zaXRpb24gd2lsbCBiZSBoZXJlXG4gICAgLy9cbiAgICBjb25zdCBvbGRMaXN0SW5kZW50ID0gc3RhdGUubGlzdEluZGVudDtcbiAgICBzdGF0ZS5saXN0SW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICAgIHN0YXRlLmJsa0luZGVudCA9IGluZGVudDtcbiAgICBzdGF0ZS50aWdodCA9IHRydWU7XG4gICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IGNvbnRlbnRTdGFydCAtIHN0YXRlLmJNYXJrc1tuZXh0TGluZV07XG4gICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSA9IG9mZnNldDtcbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCAmJiBzdGF0ZS5pc0VtcHR5KG5leHRMaW5lICsgMSkpIHtcbiAgICAgIC8vIHdvcmthcm91bmQgZm9yIHRoaXMgY2FzZVxuICAgICAgLy8gKGxpc3QgaXRlbSBpcyBlbXB0eSwgbGlzdCB0ZXJtaW5hdGVzIGJlZm9yZSBcImZvb1wiKTpcbiAgICAgIC8vIH5+fn5+fn5+XG4gICAgICAvLyAgIC1cbiAgICAgIC8vXG4gICAgICAvLyAgICAgZm9vXG4gICAgICAvLyB+fn5+fn5+flxuICAgICAgc3RhdGUubGluZSA9IE1hdGgubWluKHN0YXRlLmxpbmUgKyAyLCBlbmRMaW5lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUubWQuYmxvY2sudG9rZW5pemUoc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbnkgb2YgbGlzdCBpdGVtIGlzIHRpZ2h0LCBtYXJrIGxpc3QgYXMgdGlnaHRcbiAgICBpZiAoIXN0YXRlLnRpZ2h0IHx8IHByZXZFbXB0eUVuZCkge1xuICAgICAgdGlnaHQgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gSXRlbSBiZWNvbWUgbG9vc2UgaWYgZmluaXNoIHdpdGggZW1wdHkgbGluZSxcbiAgICAvLyBidXQgd2Ugc2hvdWxkIGZpbHRlciBsYXN0IGVsZW1lbnQsIGJlY2F1c2UgaXQgbWVhbnMgbGlzdCBmaW5pc2hcbiAgICBwcmV2RW1wdHlFbmQgPSBzdGF0ZS5saW5lIC0gbmV4dExpbmUgPiAxICYmIHN0YXRlLmlzRW1wdHkoc3RhdGUubGluZSAtIDEpO1xuICAgIHN0YXRlLmJsa0luZGVudCA9IHN0YXRlLmxpc3RJbmRlbnQ7XG4gICAgc3RhdGUubGlzdEluZGVudCA9IG9sZExpc3RJbmRlbnQ7XG4gICAgc3RhdGUudFNoaWZ0W25leHRMaW5lXSA9IG9sZFRTaGlmdDtcbiAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2xkU0NvdW50O1xuICAgIHN0YXRlLnRpZ2h0ID0gb2xkVGlnaHQ7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdsaXN0X2l0ZW1fY2xvc2UnLCAnbGknLCAtMSk7XG4gICAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSk7XG4gICAgbmV4dExpbmUgPSBzdGF0ZS5saW5lO1xuICAgIGl0ZW1MaW5lc1sxXSA9IG5leHRMaW5lO1xuICAgIGlmIChuZXh0TGluZSA+PSBlbmRMaW5lKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFRyeSB0byBjaGVjayBpZiBsaXN0IGlzIHRlcm1pbmF0ZWQgb3IgY29udGludWVkLlxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gZmFpbCBpZiB0ZXJtaW5hdGluZyBibG9jayBmb3VuZFxuICAgIGxldCB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gZmFpbCBpZiBsaXN0IGhhcyBhbm90aGVyIHR5cGVcbiAgICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgICBwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpO1xuICAgICAgaWYgKHBvc0FmdGVyTWFya2VyIDwgMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvc0FmdGVyTWFya2VyID0gc2tpcEJ1bGxldExpc3RNYXJrZXIoc3RhdGUsIG5leHRMaW5lKTtcbiAgICAgIGlmIChwb3NBZnRlck1hcmtlciA8IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChtYXJrZXJDaGFyQ29kZSAhPT0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gRmluYWxpemUgbGlzdFxuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3RfY2xvc2UnLCAnb2wnLCAtMSk7XG4gIH0gZWxzZSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdidWxsZXRfbGlzdF9jbG9zZScsICd1bCcsIC0xKTtcbiAgfVxuICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKTtcbiAgbGlzdExpbmVzWzFdID0gbmV4dExpbmU7XG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG5cbiAgLy8gbWFyayBwYXJhZ3JhcGhzIHRpZ2h0IGlmIG5lZWRlZFxuICBpZiAodGlnaHQpIHtcbiAgICBtYXJrVGlnaHRQYXJhZ3JhcGhzKHN0YXRlLCBsaXN0VG9rSWR4KTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVmZXJlbmNlKHN0YXRlLCBzdGFydExpbmUsIF9lbmRMaW5lLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXTtcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHg1QiAvKiBbICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIGdldE5leHRMaW5lKG5leHRMaW5lKSB7XG4gICAgY29uc3QgZW5kTGluZSA9IHN0YXRlLmxpbmVNYXg7XG4gICAgaWYgKG5leHRMaW5lID49IGVuZExpbmUgfHwgc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICAgIC8vIGVtcHR5IGxpbmUgb3IgZW5kIG9mIGlucHV0XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbGV0IGlzQ29udGludWF0aW9uID0gZmFsc2U7XG5cbiAgICAvLyB0aGlzIHdvdWxkIGJlIGEgY29kZSBibG9jayBub3JtYWxseSwgYnV0IGFmdGVyIHBhcmFncmFwaFxuICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPiAzKSB7XG4gICAgICBpc0NvbnRpbnVhdGlvbiA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHtcbiAgICAgIGlzQ29udGludWF0aW9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCFpc0NvbnRpbnVhdGlvbikge1xuICAgICAgY29uc3QgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3JlZmVyZW5jZScpO1xuICAgICAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gICAgICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3JlZmVyZW5jZSc7XG5cbiAgICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgICBsZXQgdGVybWluYXRlID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgICAgdGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG4gICAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICAgIC8vIHRlcm1pbmF0ZWQgYnkgYW5vdGhlciBibG9ja1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXTtcblxuICAgIC8vIG1heCArIDEgZXhwbGljaXRseSBpbmNsdWRlcyB0aGUgbmV3bGluZVxuICAgIHJldHVybiBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXggKyAxKTtcbiAgfVxuICBsZXQgc3RyID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4ICsgMSk7XG4gIG1heCA9IHN0ci5sZW5ndGg7XG4gIGxldCBsYWJlbEVuZCA9IC0xO1xuICBmb3IgKHBvcyA9IDE7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKGNoID09PSAweDVCIC8qIFsgKi8pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVEIC8qIF0gKi8pIHtcbiAgICAgIGxhYmVsRW5kID0gcG9zO1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHgwQSAvKiBcXG4gKi8pIHtcbiAgICAgIGNvbnN0IGxpbmVDb250ZW50ID0gZ2V0TmV4dExpbmUobmV4dExpbmUpO1xuICAgICAgaWYgKGxpbmVDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgIHN0ciArPSBsaW5lQ29udGVudDtcbiAgICAgICAgbWF4ID0gc3RyLmxlbmd0aDtcbiAgICAgICAgbmV4dExpbmUrKztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVDIC8qIFxcICovKSB7XG4gICAgICBwb3MrKztcbiAgICAgIGlmIChwb3MgPCBtYXggJiYgc3RyLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgwQSkge1xuICAgICAgICBjb25zdCBsaW5lQ29udGVudCA9IGdldE5leHRMaW5lKG5leHRMaW5lKTtcbiAgICAgICAgaWYgKGxpbmVDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgc3RyICs9IGxpbmVDb250ZW50O1xuICAgICAgICAgIG1heCA9IHN0ci5sZW5ndGg7XG4gICAgICAgICAgbmV4dExpbmUrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobGFiZWxFbmQgPCAwIHx8IHN0ci5jaGFyQ29kZUF0KGxhYmVsRW5kICsgMSkgIT09IDB4M0EgLyogOiAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgXl5eIHNraXAgb3B0aW9uYWwgd2hpdGVzcGFjZSBoZXJlXG4gIGZvciAocG9zID0gbGFiZWxFbmQgKyAyOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjaCA9PT0gMHgwQSkge1xuICAgICAgY29uc3QgbGluZUNvbnRlbnQgPSBnZXROZXh0TGluZShuZXh0TGluZSk7XG4gICAgICBpZiAobGluZUNvbnRlbnQgIT09IG51bGwpIHtcbiAgICAgICAgc3RyICs9IGxpbmVDb250ZW50O1xuICAgICAgICBtYXggPSBzdHIubGVuZ3RoO1xuICAgICAgICBuZXh0TGluZSsrO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNTcGFjZShjaCkpIDsgZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgIF5eXl5eXl5eXl5eIHBhcnNlIHRoaXNcbiAgY29uc3QgZGVzdFJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RyLCBwb3MsIG1heCk7XG4gIGlmICghZGVzdFJlcy5vaykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhkZXN0UmVzLnN0cik7XG4gIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGhyZWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHBvcyA9IGRlc3RSZXMucG9zO1xuXG4gIC8vIHNhdmUgY3Vyc29yIHN0YXRlLCB3ZSBjb3VsZCByZXF1aXJlIHRvIHJvbGxiYWNrIGxhdGVyXG4gIGNvbnN0IGRlc3RFbmRQb3MgPSBwb3M7XG4gIGNvbnN0IGRlc3RFbmRMaW5lTm8gPSBuZXh0TGluZTtcblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgXl5eIHNraXBwaW5nIHRob3NlIHNwYWNlc1xuICBjb25zdCBzdGFydCA9IHBvcztcbiAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjb25zdCBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKGNoID09PSAweDBBKSB7XG4gICAgICBjb25zdCBsaW5lQ29udGVudCA9IGdldE5leHRMaW5lKG5leHRMaW5lKTtcbiAgICAgIGlmIChsaW5lQ29udGVudCAhPT0gbnVsbCkge1xuICAgICAgICBzdHIgKz0gbGluZUNvbnRlbnQ7XG4gICAgICAgIG1heCA9IHN0ci5sZW5ndGg7XG4gICAgICAgIG5leHRMaW5lKys7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1NwYWNlKGNoKSkgOyBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNlIHRoaXNcbiAgbGV0IHRpdGxlUmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4KTtcbiAgd2hpbGUgKHRpdGxlUmVzLmNhbl9jb250aW51ZSkge1xuICAgIGNvbnN0IGxpbmVDb250ZW50ID0gZ2V0TmV4dExpbmUobmV4dExpbmUpO1xuICAgIGlmIChsaW5lQ29udGVudCA9PT0gbnVsbCkgYnJlYWs7XG4gICAgc3RyICs9IGxpbmVDb250ZW50O1xuICAgIHBvcyA9IG1heDtcbiAgICBtYXggPSBzdHIubGVuZ3RoO1xuICAgIG5leHRMaW5lKys7XG4gICAgdGl0bGVSZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua1RpdGxlKHN0ciwgcG9zLCBtYXgsIHRpdGxlUmVzKTtcbiAgfVxuICBsZXQgdGl0bGU7XG4gIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiB0aXRsZVJlcy5vaykge1xuICAgIHRpdGxlID0gdGl0bGVSZXMuc3RyO1xuICAgIHBvcyA9IHRpdGxlUmVzLnBvcztcbiAgfSBlbHNlIHtcbiAgICB0aXRsZSA9ICcnO1xuICAgIHBvcyA9IGRlc3RFbmRQb3M7XG4gICAgbmV4dExpbmUgPSBkZXN0RW5kTGluZU5vO1xuICB9XG5cbiAgLy8gc2tpcCB0cmFpbGluZyBzcGFjZXMgdW50aWwgdGhlIHJlc3Qgb2YgdGhlIGxpbmVcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNvbnN0IGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcG9zKys7XG4gIH1cbiAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpICE9PSAweDBBKSB7XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICAvLyBnYXJiYWdlIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUgYWZ0ZXIgdGl0bGUsXG4gICAgICAvLyBidXQgaXQgY291bGQgc3RpbGwgYmUgYSB2YWxpZCByZWZlcmVuY2UgaWYgd2Ugcm9sbCBiYWNrXG4gICAgICB0aXRsZSA9ICcnO1xuICAgICAgcG9zID0gZGVzdEVuZFBvcztcbiAgICAgIG5leHRMaW5lID0gZGVzdEVuZExpbmVObztcbiAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgY29uc3QgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcG9zKys7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChwb3MgPCBtYXggJiYgc3RyLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgwQSkge1xuICAgIC8vIGdhcmJhZ2UgYXQgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBsYWJlbCA9IG5vcm1hbGl6ZVJlZmVyZW5jZShzdHIuc2xpY2UoMSwgbGFiZWxFbmQpKTtcbiAgaWYgKCFsYWJlbCkge1xuICAgIC8vIENvbW1vbk1hcmsgMC4yMCBkaXNhbGxvd3MgZW1wdHkgbGFiZWxzXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gUmVmZXJlbmNlIGNhbiBub3QgdGVybWluYXRlIGFueXRoaW5nLiBUaGlzIGNoZWNrIGlzIGZvciBzYWZldHkgb25seS5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChzaWxlbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLmVudi5yZWZlcmVuY2VzID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBzdGF0ZS5lbnYucmVmZXJlbmNlc1tsYWJlbF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgc3RhdGUuZW52LnJlZmVyZW5jZXNbbGFiZWxdID0ge1xuICAgICAgdGl0bGUsXG4gICAgICBocmVmXG4gICAgfTtcbiAgfVxuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBMaXN0IG9mIHZhbGlkIGh0bWwgYmxvY2tzIG5hbWVzLCBhY2NvcmRpbmcgdG8gY29tbW9ubWFyayBzcGVjXG4vLyBodHRwczovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4zMC8jaHRtbC1ibG9ja3NcblxudmFyIGJsb2NrX25hbWVzID0gWydhZGRyZXNzJywgJ2FydGljbGUnLCAnYXNpZGUnLCAnYmFzZScsICdiYXNlZm9udCcsICdibG9ja3F1b3RlJywgJ2JvZHknLCAnY2FwdGlvbicsICdjZW50ZXInLCAnY29sJywgJ2NvbGdyb3VwJywgJ2RkJywgJ2RldGFpbHMnLCAnZGlhbG9nJywgJ2RpcicsICdkaXYnLCAnZGwnLCAnZHQnLCAnZmllbGRzZXQnLCAnZmlnY2FwdGlvbicsICdmaWd1cmUnLCAnZm9vdGVyJywgJ2Zvcm0nLCAnZnJhbWUnLCAnZnJhbWVzZXQnLCAnaDEnLCAnaDInLCAnaDMnLCAnaDQnLCAnaDUnLCAnaDYnLCAnaGVhZCcsICdoZWFkZXInLCAnaHInLCAnaHRtbCcsICdpZnJhbWUnLCAnbGVnZW5kJywgJ2xpJywgJ2xpbmsnLCAnbWFpbicsICdtZW51JywgJ21lbnVpdGVtJywgJ25hdicsICdub2ZyYW1lcycsICdvbCcsICdvcHRncm91cCcsICdvcHRpb24nLCAncCcsICdwYXJhbScsICdzZWFyY2gnLCAnc2VjdGlvbicsICdzdW1tYXJ5JywgJ3RhYmxlJywgJ3Rib2R5JywgJ3RkJywgJ3Rmb290JywgJ3RoJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3RyJywgJ3RyYWNrJywgJ3VsJ107XG5cbi8vIFJlZ2V4cHMgdG8gbWF0Y2ggaHRtbCBlbGVtZW50c1xuXG5jb25zdCBhdHRyX25hbWUgPSAnW2EtekEtWl86XVthLXpBLVowLTk6Ll8tXSonO1xuY29uc3QgdW5xdW90ZWQgPSAnW15cIlxcJz08PmBcXFxceDAwLVxcXFx4MjBdKyc7XG5jb25zdCBzaW5nbGVfcXVvdGVkID0gXCInW14nXSonXCI7XG5jb25zdCBkb3VibGVfcXVvdGVkID0gJ1wiW15cIl0qXCInO1xuY29uc3QgYXR0cl92YWx1ZSA9ICcoPzonICsgdW5xdW90ZWQgKyAnfCcgKyBzaW5nbGVfcXVvdGVkICsgJ3wnICsgZG91YmxlX3F1b3RlZCArICcpJztcbmNvbnN0IGF0dHJpYnV0ZSA9ICcoPzpcXFxccysnICsgYXR0cl9uYW1lICsgJyg/OlxcXFxzKj1cXFxccyonICsgYXR0cl92YWx1ZSArICcpPyknO1xuY29uc3Qgb3Blbl90YWcgPSAnPFtBLVphLXpdW0EtWmEtejAtOVxcXFwtXSonICsgYXR0cmlidXRlICsgJypcXFxccypcXFxcLz8+JztcbmNvbnN0IGNsb3NlX3RhZyA9ICc8XFxcXC9bQS1aYS16XVtBLVphLXowLTlcXFxcLV0qXFxcXHMqPic7XG5jb25zdCBjb21tZW50ID0gJzwhLS0tPz58PCEtLSg/OlteLV18LVteLV18LS1bXj5dKSotLT4nO1xuY29uc3QgcHJvY2Vzc2luZyA9ICc8Wz9dW1xcXFxzXFxcXFNdKj9bP10+JztcbmNvbnN0IGRlY2xhcmF0aW9uID0gJzwhW0EtWmEtel1bXj5dKj4nO1xuY29uc3QgY2RhdGEgPSAnPCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qP1xcXFxdXFxcXF0+JztcbmNvbnN0IEhUTUxfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICd8JyArIGNvbW1lbnQgKyAnfCcgKyBwcm9jZXNzaW5nICsgJ3wnICsgZGVjbGFyYXRpb24gKyAnfCcgKyBjZGF0YSArICcpJyk7XG5jb25zdCBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICcpJyk7XG5cbi8vIEhUTUwgYmxvY2tcblxuXG4vLyBBbiBhcnJheSBvZiBvcGVuaW5nIGFuZCBjb3JyZXNwb25kaW5nIGNsb3Npbmcgc2VxdWVuY2VzIGZvciBodG1sIHRhZ3MsXG4vLyBsYXN0IGFyZ3VtZW50IGRlZmluZXMgd2hldGhlciBpdCBjYW4gdGVybWluYXRlIGEgcGFyYWdyYXBoIG9yIG5vdFxuLy9cbmNvbnN0IEhUTUxfU0VRVUVOQ0VTID0gW1svXjwoc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSkoPz0oXFxzfD58JCkpL2ksIC88XFwvKHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpPi9pLCB0cnVlXSwgWy9ePCEtLS8sIC8tLT4vLCB0cnVlXSwgWy9ePFxcPy8sIC9cXD8+LywgdHJ1ZV0sIFsvXjwhW0EtWl0vLCAvPi8sIHRydWVdLCBbL148IVxcW0NEQVRBXFxbLywgL1xcXVxcXT4vLCB0cnVlXSwgW25ldyBSZWdFeHAoJ148Lz8oJyArIGJsb2NrX25hbWVzLmpvaW4oJ3wnKSArICcpKD89KFxcXFxzfC8/PnwkKSknLCAnaScpLCAvXiQvLCB0cnVlXSwgW25ldyBSZWdFeHAoSFRNTF9PUEVOX0NMT1NFX1RBR19SRS5zb3VyY2UgKyAnXFxcXHMqJCcpLCAvXiQvLCBmYWxzZV1dO1xuZnVuY3Rpb24gaHRtbF9ibG9jayhzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gIGxldCBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMuaHRtbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQyAvKiA8ICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGxldCBsaW5lVGV4dCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCk7XG4gIGxldCBpID0gMDtcbiAgZm9yICg7IGkgPCBIVE1MX1NFUVVFTkNFUy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChIVE1MX1NFUVVFTkNFU1tpXVswXS50ZXN0KGxpbmVUZXh0KSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChpID09PSBIVE1MX1NFUVVFTkNFUy5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHNpbGVudCkge1xuICAgIC8vIHRydWUgaWYgdGhpcyBzZXF1ZW5jZSBjYW4gYmUgYSB0ZXJtaW5hdG9yLCBmYWxzZSBvdGhlcndpc2VcbiAgICByZXR1cm4gSFRNTF9TRVFVRU5DRVNbaV1bMl07XG4gIH1cbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcblxuICAvLyBJZiB3ZSBhcmUgaGVyZSAtIHdlIGRldGVjdGVkIEhUTUwgYmxvY2suXG4gIC8vIExldCdzIHJvbGwgZG93biB0aWxsIGJsb2NrIGVuZC5cbiAgaWYgKCFIVE1MX1NFUVVFTkNFU1tpXVsxXS50ZXN0KGxpbmVUZXh0KSkge1xuICAgIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmU7IG5leHRMaW5lKyspIHtcbiAgICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuICAgICAgbGluZVRleHQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpO1xuICAgICAgaWYgKEhUTUxfU0VRVUVOQ0VTW2ldWzFdLnRlc3QobGluZVRleHQpKSB7XG4gICAgICAgIGlmIChsaW5lVGV4dC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBuZXh0TGluZSsrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG4gIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaHRtbF9ibG9jaycsICcnLCAwKTtcbiAgdG9rZW4ubWFwID0gW3N0YXJ0TGluZSwgbmV4dExpbmVdO1xuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCB0cnVlKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIGhlYWRpbmcgKCMsICMjLCAuLi4pXG5cbmZ1bmN0aW9uIGhlYWRpbmcoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuICBsZXQgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgaWYgKGNoICE9PSAweDIzIC8qICMgKi8gfHwgcG9zID49IG1heCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGNvdW50IGhlYWRpbmcgbGV2ZWxcbiAgbGV0IGxldmVsID0gMTtcbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdCgrK3Bvcyk7XG4gIHdoaWxlIChjaCA9PT0gMHgyMyAvKiAjICovICYmIHBvcyA8IG1heCAmJiBsZXZlbCA8PSA2KSB7XG4gICAgbGV2ZWwrKztcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKTtcbiAgfVxuICBpZiAobGV2ZWwgPiA2IHx8IHBvcyA8IG1heCAmJiAhaXNTcGFjZShjaCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHNpbGVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gTGV0J3MgY3V0IHRhaWxzIGxpa2UgJyAgICAjIyMgICcgZnJvbSB0aGUgZW5kIG9mIHN0cmluZ1xuXG4gIG1heCA9IHN0YXRlLnNraXBTcGFjZXNCYWNrKG1heCwgcG9zKTtcbiAgY29uc3QgdG1wID0gc3RhdGUuc2tpcENoYXJzQmFjayhtYXgsIDB4MjMsIHBvcyk7IC8vICNcbiAgaWYgKHRtcCA+IHBvcyAmJiBpc1NwYWNlKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHRtcCAtIDEpKSkge1xuICAgIG1heCA9IHRtcDtcbiAgfVxuICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lICsgMTtcbiAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfb3BlbicsICdoJyArIFN0cmluZyhsZXZlbCksIDEpO1xuICB0b2tlbl9vLm1hcmt1cCA9ICcjIyMjIyMjIycuc2xpY2UoMCwgbGV2ZWwpO1xuICB0b2tlbl9vLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdO1xuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbl9pLmNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpLnRyaW0oKTtcbiAgdG9rZW5faS5tYXAgPSBbc3RhcnRMaW5lLCBzdGF0ZS5saW5lXTtcbiAgdG9rZW5faS5jaGlsZHJlbiA9IFtdO1xuICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnaGVhZGluZ19jbG9zZScsICdoJyArIFN0cmluZyhsZXZlbCksIC0xKTtcbiAgdG9rZW5fYy5tYXJrdXAgPSAnIyMjIyMjIyMnLnNsaWNlKDAsIGxldmVsKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIGxoZWFkaW5nICgtLS0sID09PSlcblxuZnVuY3Rpb24gbGhlYWRpbmcoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSAvKiwgc2lsZW50ICovKSB7XG4gIGNvbnN0IHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdwYXJhZ3JhcGgnKTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdwYXJhZ3JhcGgnOyAvLyB1c2UgcGFyYWdyYXBoIHRvIG1hdGNoIHRlcm1pbmF0b3JSdWxlc1xuXG4gIC8vIGp1bXAgbGluZS1ieS1saW5lIHVudGlsIGVtcHR5IG9uZSBvciBFT0ZcbiAgbGV0IGxldmVsID0gMDtcbiAgbGV0IG1hcmtlcjtcbiAgbGV0IG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcbiAgZm9yICg7IG5leHRMaW5lIDwgZW5kTGluZSAmJiAhc3RhdGUuaXNFbXB0eShuZXh0TGluZSk7IG5leHRMaW5lKyspIHtcbiAgICAvLyB0aGlzIHdvdWxkIGJlIGEgY29kZSBibG9jayBub3JtYWxseSwgYnV0IGFmdGVyIHBhcmFncmFwaFxuICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPiAzKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIENoZWNrIGZvciB1bmRlcmxpbmUgaW4gc2V0ZXh0IGhlYWRlclxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPj0gc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBsZXQgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgICBjb25zdCBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAobWFya2VyID09PSAweDJEIC8qIC0gKi8gfHwgbWFya2VyID09PSAweDNEIC8qID0gKi8pIHtcbiAgICAgICAgICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpO1xuICAgICAgICAgIHBvcyA9IHN0YXRlLnNraXBTcGFjZXMocG9zKTtcbiAgICAgICAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgICAgICAgbGV2ZWwgPSBtYXJrZXIgPT09IDB4M0QgLyogPSAqLyA/IDEgOiAyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKCFsZXZlbCkge1xuICAgIC8vIERpZG4ndCBmaW5kIHZhbGlkIHVuZGVybGluZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCBmYWxzZSkudHJpbSgpO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmUgKyAxO1xuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnaGVhZGluZ19vcGVuJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgMSk7XG4gIHRva2VuX28ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpO1xuICB0b2tlbl9vLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdO1xuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbl9pLmNvbnRlbnQgPSBjb250ZW50O1xuICB0b2tlbl9pLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmUgLSAxXTtcbiAgdG9rZW5faS5jaGlsZHJlbiA9IFtdO1xuICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnaGVhZGluZ19jbG9zZScsICdoJyArIFN0cmluZyhsZXZlbCksIC0xKTtcbiAgdG9rZW5fYy5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcik7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gUGFyYWdyYXBoXG5cbmZ1bmN0aW9uIHBhcmFncmFwaChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lKSB7XG4gIGNvbnN0IHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdwYXJhZ3JhcGgnKTtcbiAgY29uc3Qgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIGxldCBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAncGFyYWdyYXBoJztcblxuICAvLyBqdW1wIGxpbmUtYnktbGluZSB1bnRpbCBlbXB0eSBvbmUgb3IgRU9GXG4gIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmUgJiYgIXN0YXRlLmlzRW1wdHkobmV4dExpbmUpOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAvLyBpdCdzIGNvbnNpZGVyZWQgYSBsYXp5IGNvbnRpbnVhdGlvbiByZWdhcmRsZXNzIG9mIHdoYXQncyB0aGVyZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgbGV0IHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgY29uc3QgY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpLnRyaW0oKTtcbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgncGFyYWdyYXBoX29wZW4nLCAncCcsIDEpO1xuICB0b2tlbl9vLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdO1xuICBjb25zdCB0b2tlbl9pID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbl9pLmNvbnRlbnQgPSBjb250ZW50O1xuICB0b2tlbl9pLm1hcCA9IFtzdGFydExpbmUsIHN0YXRlLmxpbmVdO1xuICB0b2tlbl9pLmNoaWxkcmVuID0gW107XG4gIHN0YXRlLnB1c2goJ3BhcmFncmFwaF9jbG9zZScsICdwJywgLTEpO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBpbnRlcm5hbFxuICogY2xhc3MgUGFyc2VyQmxvY2tcbiAqXG4gKiBCbG9jay1sZXZlbCB0b2tlbml6ZXIuXG4gKiovXG5cbmNvbnN0IF9ydWxlcyQxID0gW1xuLy8gRmlyc3QgMiBwYXJhbXMgLSBydWxlIG5hbWUgJiBzb3VyY2UuIFNlY29uZGFyeSBhcnJheSAtIGxpc3Qgb2YgcnVsZXMsXG4vLyB3aGljaCBjYW4gYmUgdGVybWluYXRlZCBieSB0aGlzIG9uZS5cblsndGFibGUnLCB0YWJsZSwgWydwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJ11dLCBbJ2NvZGUnLCBjb2RlXSwgWydmZW5jZScsIGZlbmNlLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0J11dLCBbJ2Jsb2NrcXVvdGUnLCBibG9ja3F1b3RlLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0J11dLCBbJ2hyJywgaHIsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnXV0sIFsnbGlzdCcsIGxpc3QsIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJ11dLCBbJ3JlZmVyZW5jZScsIHJlZmVyZW5jZV0sIFsnaHRtbF9ibG9jaycsIGh0bWxfYmxvY2ssIFsncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJ11dLCBbJ2hlYWRpbmcnLCBoZWFkaW5nLCBbJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZSddXSwgWydsaGVhZGluZycsIGxoZWFkaW5nXSwgWydwYXJhZ3JhcGgnLCBwYXJhZ3JhcGhdXTtcblxuLyoqXG4gKiBuZXcgUGFyc2VyQmxvY2soKVxuICoqL1xuZnVuY3Rpb24gUGFyc2VyQmxvY2soKSB7XG4gIC8qKlxuICAgKiBQYXJzZXJCbG9jayNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBibG9jayBydWxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVyID0gbmV3IFJ1bGVyKCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgX3J1bGVzJDEubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyLnB1c2goX3J1bGVzJDFbaV1bMF0sIF9ydWxlcyQxW2ldWzFdLCB7XG4gICAgICBhbHQ6IChfcnVsZXMkMVtpXVsyXSB8fCBbXSkuc2xpY2UoKVxuICAgIH0pO1xuICB9XG59XG5cbi8vIEdlbmVyYXRlIHRva2VucyBmb3IgaW5wdXQgcmFuZ2Vcbi8vXG5QYXJzZXJCbG9jay5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSkge1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpO1xuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGg7XG4gIGNvbnN0IG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG4gIGxldCBsaW5lID0gc3RhcnRMaW5lO1xuICBsZXQgaGFzRW1wdHlMaW5lcyA9IGZhbHNlO1xuICB3aGlsZSAobGluZSA8IGVuZExpbmUpIHtcbiAgICBzdGF0ZS5saW5lID0gbGluZSA9IHN0YXRlLnNraXBFbXB0eUxpbmVzKGxpbmUpO1xuICAgIGlmIChsaW5lID49IGVuZExpbmUpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFRlcm1pbmF0aW9uIGNvbmRpdGlvbiBmb3IgbmVzdGVkIGNhbGxzLlxuICAgIC8vIE5lc3RlZCBjYWxscyBjdXJyZW50bHkgdXNlZCBmb3IgYmxvY2txdW90ZXMgJiBsaXN0c1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIElmIG5lc3RpbmcgbGV2ZWwgZXhjZWVkZWQgLSBza2lwIHRhaWwgdG8gdGhlIGVuZC4gVGhhdCdzIG5vdCBvcmRpbmFyeVxuICAgIC8vIHNpdHVhdGlvbiBhbmQgd2Ugc2hvdWxkIG5vdCBjYXJlIGFib3V0IGNvbnRlbnQuXG4gICAgaWYgKHN0YXRlLmxldmVsID49IG1heE5lc3RpbmcpIHtcbiAgICAgIHN0YXRlLmxpbmUgPSBlbmRMaW5lO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gVHJ5IGFsbCBwb3NzaWJsZSBydWxlcy5cbiAgICAvLyBPbiBzdWNjZXNzLCBydWxlIHNob3VsZDpcbiAgICAvL1xuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS5saW5lYFxuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS50b2tlbnNgXG4gICAgLy8gLSByZXR1cm4gdHJ1ZVxuICAgIGNvbnN0IHByZXZMaW5lID0gc3RhdGUubGluZTtcbiAgICBsZXQgb2sgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBvayA9IHJ1bGVzW2ldKHN0YXRlLCBsaW5lLCBlbmRMaW5lLCBmYWxzZSk7XG4gICAgICBpZiAob2spIHtcbiAgICAgICAgaWYgKHByZXZMaW5lID49IHN0YXRlLmxpbmUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJibG9jayBydWxlIGRpZG4ndCBpbmNyZW1lbnQgc3RhdGUubGluZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB0aGlzIGNhbiBvbmx5IGhhcHBlbiBpZiB1c2VyIGRpc2FibGVzIHBhcmFncmFwaCBydWxlXG4gICAgaWYgKCFvaykgdGhyb3cgbmV3IEVycm9yKCdub25lIG9mIHRoZSBibG9jayBydWxlcyBtYXRjaGVkJyk7XG5cbiAgICAvLyBzZXQgc3RhdGUudGlnaHQgaWYgd2UgaGFkIGFuIGVtcHR5IGxpbmUgYmVmb3JlIGN1cnJlbnQgdGFnXG4gICAgLy8gaS5lLiBsYXRlc3QgZW1wdHkgbGluZSBzaG91bGQgbm90IGNvdW50XG4gICAgc3RhdGUudGlnaHQgPSAhaGFzRW1wdHlMaW5lcztcblxuICAgIC8vIHBhcmFncmFwaCBtaWdodCBcImVhdFwiIG9uZSBuZXdsaW5lIGFmdGVyIGl0IGluIG5lc3RlZCBsaXN0c1xuICAgIGlmIChzdGF0ZS5pc0VtcHR5KHN0YXRlLmxpbmUgLSAxKSkge1xuICAgICAgaGFzRW1wdHlMaW5lcyA9IHRydWU7XG4gICAgfVxuICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuICAgIGlmIChsaW5lIDwgZW5kTGluZSAmJiBzdGF0ZS5pc0VtcHR5KGxpbmUpKSB7XG4gICAgICBoYXNFbXB0eUxpbmVzID0gdHJ1ZTtcbiAgICAgIGxpbmUrKztcbiAgICAgIHN0YXRlLmxpbmUgPSBsaW5lO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBQYXJzZXJCbG9jay5wYXJzZShzdHIsIG1kLCBlbnYsIG91dFRva2VucylcbiAqXG4gKiBQcm9jZXNzIGlucHV0IHN0cmluZyBhbmQgcHVzaCBibG9jayB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VyQmxvY2sucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHNyYywgbWQsIGVudiwgb3V0VG9rZW5zKSB7XG4gIGlmICghc3JjKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHN0YXRlID0gbmV3IHRoaXMuU3RhdGUoc3JjLCBtZCwgZW52LCBvdXRUb2tlbnMpO1xuICB0aGlzLnRva2VuaXplKHN0YXRlLCBzdGF0ZS5saW5lLCBzdGF0ZS5saW5lTWF4KTtcbn07XG5QYXJzZXJCbG9jay5wcm90b3R5cGUuU3RhdGUgPSBTdGF0ZUJsb2NrO1xuXG4vLyBJbmxpbmUgcGFyc2VyIHN0YXRlXG5cbmZ1bmN0aW9uIFN0YXRlSW5saW5lKHNyYywgbWQsIGVudiwgb3V0VG9rZW5zKSB7XG4gIHRoaXMuc3JjID0gc3JjO1xuICB0aGlzLmVudiA9IGVudjtcbiAgdGhpcy5tZCA9IG1kO1xuICB0aGlzLnRva2VucyA9IG91dFRva2VucztcbiAgdGhpcy50b2tlbnNfbWV0YSA9IEFycmF5KG91dFRva2Vucy5sZW5ndGgpO1xuICB0aGlzLnBvcyA9IDA7XG4gIHRoaXMucG9zTWF4ID0gdGhpcy5zcmMubGVuZ3RoO1xuICB0aGlzLmxldmVsID0gMDtcbiAgdGhpcy5wZW5kaW5nID0gJyc7XG4gIHRoaXMucGVuZGluZ0xldmVsID0gMDtcblxuICAvLyBTdG9yZXMgeyBzdGFydDogZW5kIH0gcGFpcnMuIFVzZWZ1bCBmb3IgYmFja3RyYWNrXG4gIC8vIG9wdGltaXphdGlvbiBvZiBwYWlycyBwYXJzZSAoZW1waGFzaXMsIHN0cmlrZXMpLlxuICB0aGlzLmNhY2hlID0ge307XG5cbiAgLy8gTGlzdCBvZiBlbXBoYXNpcy1saWtlIGRlbGltaXRlcnMgZm9yIGN1cnJlbnQgdGFnXG4gIHRoaXMuZGVsaW1pdGVycyA9IFtdO1xuXG4gIC8vIFN0YWNrIG9mIGRlbGltaXRlciBsaXN0cyBmb3IgdXBwZXIgbGV2ZWwgdGFnc1xuICB0aGlzLl9wcmV2X2RlbGltaXRlcnMgPSBbXTtcblxuICAvLyBiYWNrdGljayBsZW5ndGggPT4gbGFzdCBzZWVuIHBvc2l0aW9uXG4gIHRoaXMuYmFja3RpY2tzID0ge307XG4gIHRoaXMuYmFja3RpY2tzU2Nhbm5lZCA9IGZhbHNlO1xuXG4gIC8vIENvdW50ZXIgdXNlZCB0byBkaXNhYmxlIGlubGluZSBsaW5raWZ5LWl0IGV4ZWN1dGlvblxuICAvLyBpbnNpZGUgPGE+IGFuZCBtYXJrZG93biBsaW5rc1xuICB0aGlzLmxpbmtMZXZlbCA9IDA7XG59XG5cbi8vIEZsdXNoIHBlbmRpbmcgdGV4dFxuLy9cblN0YXRlSW5saW5lLnByb3RvdHlwZS5wdXNoUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgdG9rZW4gPSBuZXcgVG9rZW4oJ3RleHQnLCAnJywgMCk7XG4gIHRva2VuLmNvbnRlbnQgPSB0aGlzLnBlbmRpbmc7XG4gIHRva2VuLmxldmVsID0gdGhpcy5wZW5kaW5nTGV2ZWw7XG4gIHRoaXMudG9rZW5zLnB1c2godG9rZW4pO1xuICB0aGlzLnBlbmRpbmcgPSAnJztcbiAgcmV0dXJuIHRva2VuO1xufTtcblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vIElmIHBlbmRpbmcgdGV4dCBleGlzdHMgLSBmbHVzaCBpdCBhcyB0ZXh0IHRva2VuXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodHlwZSwgdGFnLCBuZXN0aW5nKSB7XG4gIGlmICh0aGlzLnBlbmRpbmcpIHtcbiAgICB0aGlzLnB1c2hQZW5kaW5nKCk7XG4gIH1cbiAgY29uc3QgdG9rZW4gPSBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKTtcbiAgbGV0IHRva2VuX21ldGEgPSBudWxsO1xuICBpZiAobmVzdGluZyA8IDApIHtcbiAgICAvLyBjbG9zaW5nIHRhZ1xuICAgIHRoaXMubGV2ZWwtLTtcbiAgICB0aGlzLmRlbGltaXRlcnMgPSB0aGlzLl9wcmV2X2RlbGltaXRlcnMucG9wKCk7XG4gIH1cbiAgdG9rZW4ubGV2ZWwgPSB0aGlzLmxldmVsO1xuICBpZiAobmVzdGluZyA+IDApIHtcbiAgICAvLyBvcGVuaW5nIHRhZ1xuICAgIHRoaXMubGV2ZWwrKztcbiAgICB0aGlzLl9wcmV2X2RlbGltaXRlcnMucHVzaCh0aGlzLmRlbGltaXRlcnMpO1xuICAgIHRoaXMuZGVsaW1pdGVycyA9IFtdO1xuICAgIHRva2VuX21ldGEgPSB7XG4gICAgICBkZWxpbWl0ZXJzOiB0aGlzLmRlbGltaXRlcnNcbiAgICB9O1xuICB9XG4gIHRoaXMucGVuZGluZ0xldmVsID0gdGhpcy5sZXZlbDtcbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbik7XG4gIHRoaXMudG9rZW5zX21ldGEucHVzaCh0b2tlbl9tZXRhKTtcbiAgcmV0dXJuIHRva2VuO1xufTtcblxuLy8gU2NhbiBhIHNlcXVlbmNlIG9mIGVtcGhhc2lzLWxpa2UgbWFya2VycywgYW5kIGRldGVybWluZSB3aGV0aGVyXG4vLyBpdCBjYW4gc3RhcnQgYW4gZW1waGFzaXMgc2VxdWVuY2Ugb3IgZW5kIGFuIGVtcGhhc2lzIHNlcXVlbmNlLlxuLy9cbi8vICAtIHN0YXJ0IC0gcG9zaXRpb24gdG8gc2NhbiBmcm9tIChpdCBzaG91bGQgcG9pbnQgYXQgYSB2YWxpZCBtYXJrZXIpO1xuLy8gIC0gY2FuU3BsaXRXb3JkIC0gZGV0ZXJtaW5lIGlmIHRoZXNlIG1hcmtlcnMgY2FuIGJlIGZvdW5kIGluc2lkZSBhIHdvcmRcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUuc2NhbkRlbGltcyA9IGZ1bmN0aW9uIChzdGFydCwgY2FuU3BsaXRXb3JkKSB7XG4gIGNvbnN0IG1heCA9IHRoaXMucG9zTWF4O1xuICBjb25zdCBtYXJrZXIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KTtcblxuICAvLyB0cmVhdCBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgYXMgYSB3aGl0ZXNwYWNlXG4gIGNvbnN0IGxhc3RDaGFyID0gc3RhcnQgPiAwID8gdGhpcy5zcmMuY2hhckNvZGVBdChzdGFydCAtIDEpIDogMHgyMDtcbiAgbGV0IHBvcyA9IHN0YXJ0O1xuICB3aGlsZSAocG9zIDwgbWF4ICYmIHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gbWFya2VyKSB7XG4gICAgcG9zKys7XG4gIH1cbiAgY29uc3QgY291bnQgPSBwb3MgLSBzdGFydDtcblxuICAvLyB0cmVhdCBlbmQgb2YgdGhlIGxpbmUgYXMgYSB3aGl0ZXNwYWNlXG4gIGNvbnN0IG5leHRDaGFyID0gcG9zIDwgbWF4ID8gdGhpcy5zcmMuY2hhckNvZGVBdChwb3MpIDogMHgyMDtcbiAgY29uc3QgaXNMYXN0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobGFzdENoYXIpIHx8IGlzUHVuY3RDaGFyKFN0cmluZy5mcm9tQ2hhckNvZGUobGFzdENoYXIpKTtcbiAgY29uc3QgaXNOZXh0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobmV4dENoYXIpIHx8IGlzUHVuY3RDaGFyKFN0cmluZy5mcm9tQ2hhckNvZGUobmV4dENoYXIpKTtcbiAgY29uc3QgaXNMYXN0V2hpdGVTcGFjZSA9IGlzV2hpdGVTcGFjZShsYXN0Q2hhcik7XG4gIGNvbnN0IGlzTmV4dFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobmV4dENoYXIpO1xuICBjb25zdCBsZWZ0X2ZsYW5raW5nID0gIWlzTmV4dFdoaXRlU3BhY2UgJiYgKCFpc05leHRQdW5jdENoYXIgfHwgaXNMYXN0V2hpdGVTcGFjZSB8fCBpc0xhc3RQdW5jdENoYXIpO1xuICBjb25zdCByaWdodF9mbGFua2luZyA9ICFpc0xhc3RXaGl0ZVNwYWNlICYmICghaXNMYXN0UHVuY3RDaGFyIHx8IGlzTmV4dFdoaXRlU3BhY2UgfHwgaXNOZXh0UHVuY3RDaGFyKTtcbiAgY29uc3QgY2FuX29wZW4gPSBsZWZ0X2ZsYW5raW5nICYmIChjYW5TcGxpdFdvcmQgfHwgIXJpZ2h0X2ZsYW5raW5nIHx8IGlzTGFzdFB1bmN0Q2hhcik7XG4gIGNvbnN0IGNhbl9jbG9zZSA9IHJpZ2h0X2ZsYW5raW5nICYmIChjYW5TcGxpdFdvcmQgfHwgIWxlZnRfZmxhbmtpbmcgfHwgaXNOZXh0UHVuY3RDaGFyKTtcbiAgcmV0dXJuIHtcbiAgICBjYW5fb3BlbixcbiAgICBjYW5fY2xvc2UsXG4gICAgbGVuZ3RoOiBjb3VudFxuICB9O1xufTtcblxuLy8gcmUtZXhwb3J0IFRva2VuIGNsYXNzIHRvIHVzZSBpbiBibG9jayBydWxlc1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLlRva2VuID0gVG9rZW47XG5cbi8vIFNraXAgdGV4dCBjaGFyYWN0ZXJzIGZvciB0ZXh0IHRva2VuLCBwbGFjZSB0aG9zZSB0byBwZW5kaW5nIGJ1ZmZlclxuLy8gYW5kIGluY3JlbWVudCBjdXJyZW50IHBvc1xuXG4vLyBSdWxlIHRvIHNraXAgcHVyZSB0ZXh0XG4vLyAne30kJUB+Kz06JyByZXNlcnZlZCBmb3IgZXh0ZW50aW9uc1xuXG4vLyAhLCBcIiwgIywgJCwgJSwgJiwgJywgKCwgKSwgKiwgKywgLCwgLSwgLiwgLywgOiwgOywgPCwgPSwgPiwgPywgQCwgWywgXFwsIF0sIF4sIF8sIGAsIHssIHwsIH0sIG9yIH5cblxuLy8gISEhISBEb24ndCBjb25mdXNlIHdpdGggXCJNYXJrZG93biBBU0NJSSBQdW5jdHVhdGlvblwiIGNoYXJzXG4vLyBodHRwOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjE1LyNhc2NpaS1wdW5jdHVhdGlvbi1jaGFyYWN0ZXJcbmZ1bmN0aW9uIGlzVGVybWluYXRvckNoYXIoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgwQSAvKiBcXG4gKi86XG4gICAgY2FzZSAweDIxIC8qICEgKi86XG4gICAgY2FzZSAweDIzIC8qICMgKi86XG4gICAgY2FzZSAweDI0IC8qICQgKi86XG4gICAgY2FzZSAweDI1IC8qICUgKi86XG4gICAgY2FzZSAweDI2IC8qICYgKi86XG4gICAgY2FzZSAweDJBIC8qICogKi86XG4gICAgY2FzZSAweDJCIC8qICsgKi86XG4gICAgY2FzZSAweDJEIC8qIC0gKi86XG4gICAgY2FzZSAweDNBIC8qIDogKi86XG4gICAgY2FzZSAweDNDIC8qIDwgKi86XG4gICAgY2FzZSAweDNEIC8qID0gKi86XG4gICAgY2FzZSAweDNFIC8qID4gKi86XG4gICAgY2FzZSAweDQwIC8qIEAgKi86XG4gICAgY2FzZSAweDVCIC8qIFsgKi86XG4gICAgY2FzZSAweDVDIC8qIFxcICovOlxuICAgIGNhc2UgMHg1RCAvKiBdICovOlxuICAgIGNhc2UgMHg1RSAvKiBeICovOlxuICAgIGNhc2UgMHg1RiAvKiBfICovOlxuICAgIGNhc2UgMHg2MCAvKiBgICovOlxuICAgIGNhc2UgMHg3QiAvKiB7ICovOlxuICAgIGNhc2UgMHg3RCAvKiB9ICovOlxuICAgIGNhc2UgMHg3RSAvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuZnVuY3Rpb24gdGV4dChzdGF0ZSwgc2lsZW50KSB7XG4gIGxldCBwb3MgPSBzdGF0ZS5wb3M7XG4gIHdoaWxlIChwb3MgPCBzdGF0ZS5wb3NNYXggJiYgIWlzVGVybWluYXRvckNoYXIoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSkpIHtcbiAgICBwb3MrKztcbiAgfVxuICBpZiAocG9zID09PSBzdGF0ZS5wb3MpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShzdGF0ZS5wb3MsIHBvcyk7XG4gIH1cbiAgc3RhdGUucG9zID0gcG9zO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gQWx0ZXJuYXRpdmUgaW1wbGVtZW50YXRpb24sIGZvciBtZW1vcnkuXG4vL1xuLy8gSXQgY29zdHMgMTAlIG9mIHBlcmZvcm1hbmNlLCBidXQgYWxsb3dzIGV4dGVuZCB0ZXJtaW5hdG9ycyBsaXN0LCBpZiBwbGFjZSBpdFxuLy8gdG8gYFBhcnNlcklubGluZWAgcHJvcGVydHkuIFByb2JhYmx5LCB3aWxsIHN3aXRjaCB0byBpdCBzb21ldGltZSwgc3VjaFxuLy8gZmxleGliaWxpdHkgcmVxdWlyZWQuXG5cbi8qXG52YXIgVEVSTUlOQVRPUl9SRSA9IC9bXFxuISMkJSYqK1xcLTo8PT5AW1xcXFxcXF1eX2B7fX5dLztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0ZXh0KHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIGlkeCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLnNlYXJjaChURVJNSU5BVE9SX1JFKTtcblxuICAvLyBmaXJzdCBjaGFyIGlzIHRlcm1pbmF0b3IgLT4gZW1wdHkgdGV4dFxuICBpZiAoaWR4ID09PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIG5vIHRlcm1pbmF0b3IgLT4gdGV4dCB0aWxsIGVuZCBvZiBzdHJpbmdcbiAgaWYgKGlkeCA8IDApIHtcbiAgICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShwb3MpOyB9XG4gICAgc3RhdGUucG9zID0gc3RhdGUuc3JjLmxlbmd0aDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHBvcywgcG9zICsgaWR4KTsgfVxuXG4gIHN0YXRlLnBvcyArPSBpZHg7XG5cbiAgcmV0dXJuIHRydWU7XG59OyAqL1xuXG4vLyBQcm9jZXNzIGxpbmtzIGxpa2UgaHR0cHM6Ly9leGFtcGxlLm9yZy9cblxuLy8gUkZDMzk4Njogc2NoZW1lID0gQUxQSEEgKiggQUxQSEEgLyBESUdJVCAvIFwiK1wiIC8gXCItXCIgLyBcIi5cIiApXG5jb25zdCBTQ0hFTUVfUkUgPSAvKD86XnxbXmEtejAtOS4rLV0pKFthLXpdW2EtejAtOS4rLV0qKSQvaTtcbmZ1bmN0aW9uIGxpbmtpZnkoc3RhdGUsIHNpbGVudCkge1xuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMubGlua2lmeSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoc3RhdGUubGlua0xldmVsID4gMCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBwb3MgPSBzdGF0ZS5wb3M7XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heDtcbiAgaWYgKHBvcyArIDMgPiBtYXgpIHJldHVybiBmYWxzZTtcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0EgLyogOiAqLykgcmV0dXJuIGZhbHNlO1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSkgIT09IDB4MkYgLyogLyAqLykgcmV0dXJuIGZhbHNlO1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMikgIT09IDB4MkYgLyogLyAqLykgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBtYXRjaCA9IHN0YXRlLnBlbmRpbmcubWF0Y2goU0NIRU1FX1JFKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBwcm90byA9IG1hdGNoWzFdO1xuICBjb25zdCBsaW5rID0gc3RhdGUubWQubGlua2lmeS5tYXRjaEF0U3RhcnQoc3RhdGUuc3JjLnNsaWNlKHBvcyAtIHByb3RvLmxlbmd0aCkpO1xuICBpZiAoIWxpbmspIHJldHVybiBmYWxzZTtcbiAgbGV0IHVybCA9IGxpbmsudXJsO1xuXG4gIC8vIGludmFsaWQgbGluaywgYnV0IHN0aWxsIGRldGVjdGVkIGJ5IGxpbmtpZnkgc29tZWhvdztcbiAgLy8gbmVlZCB0byBjaGVjayB0byBwcmV2ZW50IGluZmluaXRlIGxvb3AgYmVsb3dcbiAgaWYgKHVybC5sZW5ndGggPD0gcHJvdG8ubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gZGlzYWxsb3cgJyonIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmsgKGNvbmZsaWN0cyB3aXRoIGVtcGhhc2lzKVxuICAvLyBkbyBtYW51YWwgYmFja3NlYXJjaCB0byBhdm9pZCBwZXJmIGlzc3VlcyB3aXRoIHJlZ2V4IC9cXCorJC8gb24gXCIqKioqLi4uKioqKmFcIi5cbiAgbGV0IHVybEVuZCA9IHVybC5sZW5ndGg7XG4gIHdoaWxlICh1cmxFbmQgPiAwICYmIHVybC5jaGFyQ29kZUF0KHVybEVuZCAtIDEpID09PSAweDJBIC8qICogKi8pIHtcbiAgICB1cmxFbmQtLTtcbiAgfVxuICBpZiAodXJsRW5kICE9PSB1cmwubGVuZ3RoKSB7XG4gICAgdXJsID0gdXJsLnNsaWNlKDAsIHVybEVuZCk7XG4gIH1cbiAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsodXJsKTtcbiAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHJldHVybiBmYWxzZTtcbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5zbGljZSgwLCAtcHJvdG8ubGVuZ3RoKTtcbiAgICBjb25zdCB0b2tlbl9vID0gc3RhdGUucHVzaCgnbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXTtcbiAgICB0b2tlbl9vLm1hcmt1cCA9ICdsaW5raWZ5JztcbiAgICB0b2tlbl9vLmluZm8gPSAnYXV0byc7XG4gICAgY29uc3QgdG9rZW5fdCA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgdG9rZW5fdC5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKTtcbiAgICBjb25zdCB0b2tlbl9jID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpO1xuICAgIHRva2VuX2MubWFya3VwID0gJ2xpbmtpZnknO1xuICAgIHRva2VuX2MuaW5mbyA9ICdhdXRvJztcbiAgfVxuICBzdGF0ZS5wb3MgKz0gdXJsLmxlbmd0aCAtIHByb3RvLmxlbmd0aDtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFByb2NlZXNzICdcXG4nXG5cbmZ1bmN0aW9uIG5ld2xpbmUoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgwQSAvKiBcXG4gKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcG1heCA9IHN0YXRlLnBlbmRpbmcubGVuZ3RoIC0gMTtcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIC8vICcgIFxcbicgLT4gaGFyZGJyZWFrXG4gIC8vIExvb2t1cCBpbiBwZW5kaW5nIGNoYXJzIGlzIGJhZCBwcmFjdGljZSEgRG9uJ3QgY29weSB0byBvdGhlciBydWxlcyFcbiAgLy8gUGVuZGluZyBzdHJpbmcgaXMgc3RvcmVkIGluIGNvbmNhdCBtb2RlLCBpbmRleGVkIGxvb2t1cHMgd2lsbCBjYXVzZVxuICAvLyBjb252ZXJ0aW9uIHRvIGZsYXQgbW9kZS5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBpZiAocG1heCA+PSAwICYmIHN0YXRlLnBlbmRpbmcuY2hhckNvZGVBdChwbWF4KSA9PT0gMHgyMCkge1xuICAgICAgaWYgKHBtYXggPj0gMSAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCAtIDEpID09PSAweDIwKSB7XG4gICAgICAgIC8vIEZpbmQgd2hpdGVzcGFjZXMgdGFpbCBvZiBwZW5kaW5nIGNoYXJzLlxuICAgICAgICBsZXQgd3MgPSBwbWF4IC0gMTtcbiAgICAgICAgd2hpbGUgKHdzID49IDEgJiYgc3RhdGUucGVuZGluZy5jaGFyQ29kZUF0KHdzIC0gMSkgPT09IDB4MjApIHdzLS07XG4gICAgICAgIHN0YXRlLnBlbmRpbmcgPSBzdGF0ZS5wZW5kaW5nLnNsaWNlKDAsIHdzKTtcbiAgICAgICAgc3RhdGUucHVzaCgnaGFyZGJyZWFrJywgJ2JyJywgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5zbGljZSgwLCAtMSk7XG4gICAgICAgIHN0YXRlLnB1c2goJ3NvZnRicmVhaycsICdicicsIDApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wdXNoKCdzb2Z0YnJlYWsnLCAnYnInLCAwKTtcbiAgICB9XG4gIH1cbiAgcG9zKys7XG5cbiAgLy8gc2tpcCBoZWFkaW5nIHNwYWNlcyBmb3IgbmV4dCBsaW5lXG4gIHdoaWxlIChwb3MgPCBtYXggJiYgaXNTcGFjZShzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpKSkge1xuICAgIHBvcysrO1xuICB9XG4gIHN0YXRlLnBvcyA9IHBvcztcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFByb2Nlc3MgZXNjYXBlZCBjaGFycyBhbmQgaGFyZGJyZWFrc1xuXG5jb25zdCBFU0NBUEVEID0gW107XG5mb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIEVTQ0FQRUQucHVzaCgwKTtcbn1cbidcXFxcIVwiIyQlJlxcJygpKissLi86Ozw9Pj9AW11eX2B7fH1+LScuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGNoKSB7XG4gIEVTQ0FQRURbY2guY2hhckNvZGVBdCgwKV0gPSAxO1xufSk7XG5mdW5jdGlvbiBlc2NhcGUoc3RhdGUsIHNpbGVudCkge1xuICBsZXQgcG9zID0gc3RhdGUucG9zO1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXg7XG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDVDIC8qIFxcICovKSByZXR1cm4gZmFsc2U7XG4gIHBvcysrO1xuXG4gIC8vICdcXCcgYXQgdGhlIGVuZCBvZiB0aGUgaW5saW5lIGJsb2NrXG4gIGlmIChwb3MgPj0gbWF4KSByZXR1cm4gZmFsc2U7XG4gIGxldCBjaDEgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICBpZiAoY2gxID09PSAweDBBKSB7XG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHN0YXRlLnB1c2goJ2hhcmRicmVhaycsICdicicsIDApO1xuICAgIH1cbiAgICBwb3MrKztcbiAgICAvLyBza2lwIGxlYWRpbmcgd2hpdGVzcGFjZXMgZnJvbSBuZXh0IGxpbmVcbiAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICBjaDEgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKCFpc1NwYWNlKGNoMSkpIGJyZWFrO1xuICAgICAgcG9zKys7XG4gICAgfVxuICAgIHN0YXRlLnBvcyA9IHBvcztcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBsZXQgZXNjYXBlZFN0ciA9IHN0YXRlLnNyY1twb3NdO1xuICBpZiAoY2gxID49IDB4RDgwMCAmJiBjaDEgPD0gMHhEQkZGICYmIHBvcyArIDEgPCBtYXgpIHtcbiAgICBjb25zdCBjaDIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKTtcbiAgICBpZiAoY2gyID49IDB4REMwMCAmJiBjaDIgPD0gMHhERkZGKSB7XG4gICAgICBlc2NhcGVkU3RyICs9IHN0YXRlLnNyY1twb3MgKyAxXTtcbiAgICAgIHBvcysrO1xuICAgIH1cbiAgfVxuICBjb25zdCBvcmlnU3RyID0gJ1xcXFwnICsgZXNjYXBlZFN0cjtcbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHRfc3BlY2lhbCcsICcnLCAwKTtcbiAgICBpZiAoY2gxIDwgMjU2ICYmIEVTQ0FQRURbY2gxXSAhPT0gMCkge1xuICAgICAgdG9rZW4uY29udGVudCA9IGVzY2FwZWRTdHI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSBvcmlnU3RyO1xuICAgIH1cbiAgICB0b2tlbi5tYXJrdXAgPSBvcmlnU3RyO1xuICAgIHRva2VuLmluZm8gPSAnZXNjYXBlJztcbiAgfVxuICBzdGF0ZS5wb3MgPSBwb3MgKyAxO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gUGFyc2UgYmFja3RpY2tzXG5cbmZ1bmN0aW9uIGJhY2t0aWNrKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvcztcbiAgY29uc3QgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICBpZiAoY2ggIT09IDB4NjAgLyogYCAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBzdGFydCA9IHBvcztcbiAgcG9zKys7XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heDtcblxuICAvLyBzY2FuIG1hcmtlciBsZW5ndGhcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDYwIC8qIGAgKi8pIHtcbiAgICBwb3MrKztcbiAgfVxuICBjb25zdCBtYXJrZXIgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcyk7XG4gIGNvbnN0IG9wZW5lckxlbmd0aCA9IG1hcmtlci5sZW5ndGg7XG4gIGlmIChzdGF0ZS5iYWNrdGlja3NTY2FubmVkICYmIChzdGF0ZS5iYWNrdGlja3Nbb3BlbmVyTGVuZ3RoXSB8fCAwKSA8PSBzdGFydCkge1xuICAgIGlmICghc2lsZW50KSBzdGF0ZS5wZW5kaW5nICs9IG1hcmtlcjtcbiAgICBzdGF0ZS5wb3MgKz0gb3BlbmVyTGVuZ3RoO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGxldCBtYXRjaEVuZCA9IHBvcztcbiAgbGV0IG1hdGNoU3RhcnQ7XG5cbiAgLy8gTm90aGluZyBmb3VuZCBpbiB0aGUgY2FjaGUsIHNjYW4gdW50aWwgdGhlIGVuZCBvZiB0aGUgbGluZSAob3IgdW50aWwgbWFya2VyIGlzIGZvdW5kKVxuICB3aGlsZSAoKG1hdGNoU3RhcnQgPSBzdGF0ZS5zcmMuaW5kZXhPZignYCcsIG1hdGNoRW5kKSkgIT09IC0xKSB7XG4gICAgbWF0Y2hFbmQgPSBtYXRjaFN0YXJ0ICsgMTtcblxuICAgIC8vIHNjYW4gbWFya2VyIGxlbmd0aFxuICAgIHdoaWxlIChtYXRjaEVuZCA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChtYXRjaEVuZCkgPT09IDB4NjAgLyogYCAqLykge1xuICAgICAgbWF0Y2hFbmQrKztcbiAgICB9XG4gICAgY29uc3QgY2xvc2VyTGVuZ3RoID0gbWF0Y2hFbmQgLSBtYXRjaFN0YXJ0O1xuICAgIGlmIChjbG9zZXJMZW5ndGggPT09IG9wZW5lckxlbmd0aCkge1xuICAgICAgLy8gRm91bmQgbWF0Y2hpbmcgY2xvc2VyIGxlbmd0aC5cbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnY29kZV9pbmxpbmUnLCAnY29kZScsIDApO1xuICAgICAgICB0b2tlbi5tYXJrdXAgPSBtYXJrZXI7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXRjaFN0YXJ0KS5yZXBsYWNlKC9cXG4vZywgJyAnKS5yZXBsYWNlKC9eICguKykgJC8sICckMScpO1xuICAgICAgfVxuICAgICAgc3RhdGUucG9zID0gbWF0Y2hFbmQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBTb21lIGRpZmZlcmVudCBsZW5ndGggZm91bmQsIHB1dCBpdCBpbiBjYWNoZSBhcyB1cHBlciBsaW1pdCBvZiB3aGVyZSBjbG9zZXIgY2FuIGJlIGZvdW5kXG4gICAgc3RhdGUuYmFja3RpY2tzW2Nsb3Nlckxlbmd0aF0gPSBtYXRjaFN0YXJ0O1xuICB9XG5cbiAgLy8gU2Nhbm5lZCB0aHJvdWdoIHRoZSBlbmQsIGRpZG4ndCBmaW5kIGFueXRoaW5nXG4gIHN0YXRlLmJhY2t0aWNrc1NjYW5uZWQgPSB0cnVlO1xuICBpZiAoIXNpbGVudCkgc3RhdGUucGVuZGluZyArPSBtYXJrZXI7XG4gIHN0YXRlLnBvcyArPSBvcGVuZXJMZW5ndGg7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyB+fnN0cmlrZSB0aHJvdWdofn5cbi8vXG5cbi8vIEluc2VydCBlYWNoIG1hcmtlciBhcyBhIHNlcGFyYXRlIHRleHQgdG9rZW4sIGFuZCBhZGQgaXQgdG8gZGVsaW1pdGVyIGxpc3Rcbi8vXG5mdW5jdGlvbiBzdHJpa2V0aHJvdWdoX3Rva2VuaXplKHN0YXRlLCBzaWxlbnQpIHtcbiAgY29uc3Qgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGNvbnN0IG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KTtcbiAgaWYgKHNpbGVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobWFya2VyICE9PSAweDdFIC8qIH4gKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc2Nhbm5lZCA9IHN0YXRlLnNjYW5EZWxpbXMoc3RhdGUucG9zLCB0cnVlKTtcbiAgbGV0IGxlbiA9IHNjYW5uZWQubGVuZ3RoO1xuICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKTtcbiAgaWYgKGxlbiA8IDIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IHRva2VuO1xuICBpZiAobGVuICUgMikge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gY2g7XG4gICAgbGVuLS07XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHRva2VuID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gY2ggKyBjaDtcbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgbWFya2VyLFxuICAgICAgbGVuZ3RoOiAwLFxuICAgICAgLy8gZGlzYWJsZSBcInJ1bGUgb2YgM1wiIGxlbmd0aCBjaGVja3MgbWVhbnQgZm9yIGVtcGhhc2lzXG4gICAgICB0b2tlbjogc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG4gICAgICBlbmQ6IC0xLFxuICAgICAgb3Blbjogc2Nhbm5lZC5jYW5fb3BlbixcbiAgICAgIGNsb3NlOiBzY2FubmVkLmNhbl9jbG9zZVxuICAgIH0pO1xuICB9XG4gIHN0YXRlLnBvcyArPSBzY2FubmVkLmxlbmd0aDtcbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBwb3N0UHJvY2VzcyQxKHN0YXRlLCBkZWxpbWl0ZXJzKSB7XG4gIGxldCB0b2tlbjtcbiAgY29uc3QgbG9uZU1hcmtlcnMgPSBbXTtcbiAgY29uc3QgbWF4ID0gZGVsaW1pdGVycy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4OyBpKyspIHtcbiAgICBjb25zdCBzdGFydERlbGltID0gZGVsaW1pdGVyc1tpXTtcbiAgICBpZiAoc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4N0UgLyogfiAqLykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChzdGFydERlbGltLmVuZCA9PT0gLTEpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlbmREZWxpbSA9IGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmRdO1xuICAgIHRva2VuID0gc3RhdGUudG9rZW5zW3N0YXJ0RGVsaW0udG9rZW5dO1xuICAgIHRva2VuLnR5cGUgPSAnc19vcGVuJztcbiAgICB0b2tlbi50YWcgPSAncyc7XG4gICAgdG9rZW4ubmVzdGluZyA9IDE7XG4gICAgdG9rZW4ubWFya3VwID0gJ35+JztcbiAgICB0b2tlbi5jb250ZW50ID0gJyc7XG4gICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW5dO1xuICAgIHRva2VuLnR5cGUgPSAnc19jbG9zZSc7XG4gICAgdG9rZW4udGFnID0gJ3MnO1xuICAgIHRva2VuLm5lc3RpbmcgPSAtMTtcbiAgICB0b2tlbi5tYXJrdXAgPSAnfn4nO1xuICAgIHRva2VuLmNvbnRlbnQgPSAnJztcbiAgICBpZiAoc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuIC0gMV0udHlwZSA9PT0gJ3RleHQnICYmIHN0YXRlLnRva2Vuc1tlbmREZWxpbS50b2tlbiAtIDFdLmNvbnRlbnQgPT09ICd+Jykge1xuICAgICAgbG9uZU1hcmtlcnMucHVzaChlbmREZWxpbS50b2tlbiAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIGEgbWFya2VyIHNlcXVlbmNlIGhhcyBhbiBvZGQgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIGl0J3Mgc3BsaXR0ZWRcbiAgLy8gbGlrZSB0aGlzOiBgfn5+fn5gIC0+IGB+YCArIGB+fmAgKyBgfn5gLCBsZWF2aW5nIG9uZSBtYXJrZXIgYXQgdGhlXG4gIC8vIHN0YXJ0IG9mIHRoZSBzZXF1ZW5jZS5cbiAgLy9cbiAgLy8gU28sIHdlIGhhdmUgdG8gbW92ZSBhbGwgdGhvc2UgbWFya2VycyBhZnRlciBzdWJzZXF1ZW50IHNfY2xvc2UgdGFncy5cbiAgLy9cbiAgd2hpbGUgKGxvbmVNYXJrZXJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGkgPSBsb25lTWFya2Vycy5wb3AoKTtcbiAgICBsZXQgaiA9IGkgKyAxO1xuICAgIHdoaWxlIChqIDwgc3RhdGUudG9rZW5zLmxlbmd0aCAmJiBzdGF0ZS50b2tlbnNbal0udHlwZSA9PT0gJ3NfY2xvc2UnKSB7XG4gICAgICBqKys7XG4gICAgfVxuICAgIGotLTtcbiAgICBpZiAoaSAhPT0gaikge1xuICAgICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbal07XG4gICAgICBzdGF0ZS50b2tlbnNbal0gPSBzdGF0ZS50b2tlbnNbaV07XG4gICAgICBzdGF0ZS50b2tlbnNbaV0gPSB0b2tlbjtcbiAgICB9XG4gIH1cbn1cblxuLy8gV2FsayB0aHJvdWdoIGRlbGltaXRlciBsaXN0IGFuZCByZXBsYWNlIHRleHQgdG9rZW5zIHdpdGggdGFnc1xuLy9cbmZ1bmN0aW9uIHN0cmlrZXRocm91Z2hfcG9zdFByb2Nlc3Moc3RhdGUpIHtcbiAgY29uc3QgdG9rZW5zX21ldGEgPSBzdGF0ZS50b2tlbnNfbWV0YTtcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zX21ldGEubGVuZ3RoO1xuICBwb3N0UHJvY2VzcyQxKHN0YXRlLCBzdGF0ZS5kZWxpbWl0ZXJzKTtcbiAgZm9yIChsZXQgY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIGlmICh0b2tlbnNfbWV0YVtjdXJyXSAmJiB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKSB7XG4gICAgICBwb3N0UHJvY2VzcyQxKHN0YXRlLCB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKTtcbiAgICB9XG4gIH1cbn1cbnZhciByX3N0cmlrZXRocm91Z2ggPSB7XG4gIHRva2VuaXplOiBzdHJpa2V0aHJvdWdoX3Rva2VuaXplLFxuICBwb3N0UHJvY2Vzczogc3RyaWtldGhyb3VnaF9wb3N0UHJvY2Vzc1xufTtcblxuLy8gUHJvY2VzcyAqdGhpcyogYW5kIF90aGF0X1xuLy9cblxuLy8gSW5zZXJ0IGVhY2ggbWFya2VyIGFzIGEgc2VwYXJhdGUgdGV4dCB0b2tlbiwgYW5kIGFkZCBpdCB0byBkZWxpbWl0ZXIgbGlzdFxuLy9cbmZ1bmN0aW9uIGVtcGhhc2lzX3Rva2VuaXplKHN0YXRlLCBzaWxlbnQpIHtcbiAgY29uc3Qgc3RhcnQgPSBzdGF0ZS5wb3M7XG4gIGNvbnN0IG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KTtcbiAgaWYgKHNpbGVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobWFya2VyICE9PSAweDVGIC8qIF8gKi8gJiYgbWFya2VyICE9PSAweDJBIC8qICogKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc2Nhbm5lZCA9IHN0YXRlLnNjYW5EZWxpbXMoc3RhdGUucG9zLCBtYXJrZXIgPT09IDB4MkEpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNjYW5uZWQubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0b2tlbiA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKTtcbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgLy8gQ2hhciBjb2RlIG9mIHRoZSBzdGFydGluZyBtYXJrZXIgKG51bWJlcikuXG4gICAgICAvL1xuICAgICAgbWFya2VyLFxuICAgICAgLy8gVG90YWwgbGVuZ3RoIG9mIHRoZXNlIHNlcmllcyBvZiBkZWxpbWl0ZXJzLlxuICAgICAgLy9cbiAgICAgIGxlbmd0aDogc2Nhbm5lZC5sZW5ndGgsXG4gICAgICAvLyBBIHBvc2l0aW9uIG9mIHRoZSB0b2tlbiB0aGlzIGRlbGltaXRlciBjb3JyZXNwb25kcyB0by5cbiAgICAgIC8vXG4gICAgICB0b2tlbjogc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG4gICAgICAvLyBJZiB0aGlzIGRlbGltaXRlciBpcyBtYXRjaGVkIGFzIGEgdmFsaWQgb3BlbmVyLCBgZW5kYCB3aWxsIGJlXG4gICAgICAvLyBlcXVhbCB0byBpdHMgcG9zaXRpb24sIG90aGVyd2lzZSBpdCdzIGAtMWAuXG4gICAgICAvL1xuICAgICAgZW5kOiAtMSxcbiAgICAgIC8vIEJvb2xlYW4gZmxhZ3MgdGhhdCBkZXRlcm1pbmUgaWYgdGhpcyBkZWxpbWl0ZXIgY291bGQgb3BlbiBvciBjbG9zZVxuICAgICAgLy8gYW4gZW1waGFzaXMuXG4gICAgICAvL1xuICAgICAgb3Blbjogc2Nhbm5lZC5jYW5fb3BlbixcbiAgICAgIGNsb3NlOiBzY2FubmVkLmNhbl9jbG9zZVxuICAgIH0pO1xuICB9XG4gIHN0YXRlLnBvcyArPSBzY2FubmVkLmxlbmd0aDtcbiAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBwb3N0UHJvY2VzcyhzdGF0ZSwgZGVsaW1pdGVycykge1xuICBjb25zdCBtYXggPSBkZWxpbWl0ZXJzLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IG1heCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3Qgc3RhcnREZWxpbSA9IGRlbGltaXRlcnNbaV07XG4gICAgaWYgKHN0YXJ0RGVsaW0ubWFya2VyICE9PSAweDVGIC8qIF8gKi8gJiYgc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4MkEgLyogKiAqLykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBvbmx5IG9wZW5pbmcgbWFya2Vyc1xuICAgIGlmIChzdGFydERlbGltLmVuZCA9PT0gLTEpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlbmREZWxpbSA9IGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmRdO1xuXG4gICAgLy8gSWYgdGhlIHByZXZpb3VzIGRlbGltaXRlciBoYXMgdGhlIHNhbWUgbWFya2VyIGFuZCBpcyBhZGphY2VudCB0byB0aGlzIG9uZSxcbiAgICAvLyBtZXJnZSB0aG9zZSBpbnRvIG9uZSBzdHJvbmcgZGVsaW1pdGVyLlxuICAgIC8vXG4gICAgLy8gYDxlbT48ZW0+d2hhdGV2ZXI8L2VtPjwvZW0+YCAtPiBgPHN0cm9uZz53aGF0ZXZlcjwvc3Ryb25nPmBcbiAgICAvL1xuICAgIGNvbnN0IGlzU3Ryb25nID0gaSA+IDAgJiYgZGVsaW1pdGVyc1tpIC0gMV0uZW5kID09PSBzdGFydERlbGltLmVuZCArIDEgJiZcbiAgICAvLyBjaGVjayB0aGF0IGZpcnN0IHR3byBtYXJrZXJzIG1hdGNoIGFuZCBhZGphY2VudFxuICAgIGRlbGltaXRlcnNbaSAtIDFdLm1hcmtlciA9PT0gc3RhcnREZWxpbS5tYXJrZXIgJiYgZGVsaW1pdGVyc1tpIC0gMV0udG9rZW4gPT09IHN0YXJ0RGVsaW0udG9rZW4gLSAxICYmXG4gICAgLy8gY2hlY2sgdGhhdCBsYXN0IHR3byBtYXJrZXJzIGFyZSBhZGphY2VudCAod2UgY2FuIHNhZmVseSBhc3N1bWUgdGhleSBtYXRjaClcbiAgICBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kICsgMV0udG9rZW4gPT09IGVuZERlbGltLnRva2VuICsgMTtcbiAgICBjb25zdCBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoc3RhcnREZWxpbS5tYXJrZXIpO1xuICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS50b2tlbnNbc3RhcnREZWxpbS50b2tlbl07XG4gICAgdG9rZW5fby50eXBlID0gaXNTdHJvbmcgPyAnc3Ryb25nX29wZW4nIDogJ2VtX29wZW4nO1xuICAgIHRva2VuX28udGFnID0gaXNTdHJvbmcgPyAnc3Ryb25nJyA6ICdlbSc7XG4gICAgdG9rZW5fby5uZXN0aW5nID0gMTtcbiAgICB0b2tlbl9vLm1hcmt1cCA9IGlzU3Ryb25nID8gY2ggKyBjaCA6IGNoO1xuICAgIHRva2VuX28uY29udGVudCA9ICcnO1xuICAgIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW5dO1xuICAgIHRva2VuX2MudHlwZSA9IGlzU3Ryb25nID8gJ3N0cm9uZ19jbG9zZScgOiAnZW1fY2xvc2UnO1xuICAgIHRva2VuX2MudGFnID0gaXNTdHJvbmcgPyAnc3Ryb25nJyA6ICdlbSc7XG4gICAgdG9rZW5fYy5uZXN0aW5nID0gLTE7XG4gICAgdG9rZW5fYy5tYXJrdXAgPSBpc1N0cm9uZyA/IGNoICsgY2ggOiBjaDtcbiAgICB0b2tlbl9jLmNvbnRlbnQgPSAnJztcbiAgICBpZiAoaXNTdHJvbmcpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tkZWxpbWl0ZXJzW2kgLSAxXS50b2tlbl0uY29udGVudCA9ICcnO1xuICAgICAgc3RhdGUudG9rZW5zW2RlbGltaXRlcnNbc3RhcnREZWxpbS5lbmQgKyAxXS50b2tlbl0uY29udGVudCA9ICcnO1xuICAgICAgaS0tO1xuICAgIH1cbiAgfVxufVxuXG4vLyBXYWxrIHRocm91Z2ggZGVsaW1pdGVyIGxpc3QgYW5kIHJlcGxhY2UgdGV4dCB0b2tlbnMgd2l0aCB0YWdzXG4vL1xuZnVuY3Rpb24gZW1waGFzaXNfcG9zdF9wcm9jZXNzKHN0YXRlKSB7XG4gIGNvbnN0IHRva2Vuc19tZXRhID0gc3RhdGUudG9rZW5zX21ldGE7XG4gIGNvbnN0IG1heCA9IHN0YXRlLnRva2Vuc19tZXRhLmxlbmd0aDtcbiAgcG9zdFByb2Nlc3Moc3RhdGUsIHN0YXRlLmRlbGltaXRlcnMpO1xuICBmb3IgKGxldCBjdXJyID0gMDsgY3VyciA8IG1heDsgY3VycisrKSB7XG4gICAgaWYgKHRva2Vuc19tZXRhW2N1cnJdICYmIHRva2Vuc19tZXRhW2N1cnJdLmRlbGltaXRlcnMpIHtcbiAgICAgIHBvc3RQcm9jZXNzKHN0YXRlLCB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKTtcbiAgICB9XG4gIH1cbn1cbnZhciByX2VtcGhhc2lzID0ge1xuICB0b2tlbml6ZTogZW1waGFzaXNfdG9rZW5pemUsXG4gIHBvc3RQcm9jZXNzOiBlbXBoYXNpc19wb3N0X3Byb2Nlc3Ncbn07XG5cbi8vIFByb2Nlc3MgW2xpbmtdKDx0bz4gXCJzdHVmZlwiKVxuXG5mdW5jdGlvbiBsaW5rKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IGNvZGUsIGxhYmVsLCByZXMsIHJlZjtcbiAgbGV0IGhyZWYgPSAnJztcbiAgbGV0IHRpdGxlID0gJyc7XG4gIGxldCBzdGFydCA9IHN0YXRlLnBvcztcbiAgbGV0IHBhcnNlUmVmZXJlbmNlID0gdHJ1ZTtcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgIT09IDB4NUIgLyogWyAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBvbGRQb3MgPSBzdGF0ZS5wb3M7XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heDtcbiAgY29uc3QgbGFiZWxTdGFydCA9IHN0YXRlLnBvcyArIDE7XG4gIGNvbnN0IGxhYmVsRW5kID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhdGUucG9zLCB0cnVlKTtcblxuICAvLyBwYXJzZXIgZmFpbGVkIHRvIGZpbmQgJ10nLCBzbyBpdCdzIG5vdCBhIHZhbGlkIGxpbmtcbiAgaWYgKGxhYmVsRW5kIDwgMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBsZXQgcG9zID0gbGFiZWxFbmQgKyAxO1xuICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjggLyogKCAqLykge1xuICAgIC8vXG4gICAgLy8gSW5saW5lIGxpbmtcbiAgICAvL1xuXG4gICAgLy8gbWlnaHQgaGF2ZSBmb3VuZCBhIHZhbGlkIHNob3J0Y3V0IGxpbmssIGRpc2FibGUgcmVmZXJlbmNlIHBhcnNpbmdcbiAgICBwYXJzZVJlZmVyZW5jZSA9IGZhbHNlO1xuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgcG9zKys7XG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICBeXl5eXl4gcGFyc2luZyBsaW5rIGRlc3RpbmF0aW9uXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKTtcbiAgICAgIGlmIChzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHtcbiAgICAgICAgcG9zID0gcmVzLnBvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAnJztcbiAgICAgIH1cblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgc3RhcnQgPSBwb3M7XG4gICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgICAgLy8gICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNpbmcgbGluayB0aXRsZVxuICAgICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICAgIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiByZXMub2spIHtcbiAgICAgICAgdGl0bGUgPSByZXMuc3RyO1xuICAgICAgICBwb3MgPSByZXMucG9zO1xuXG4gICAgICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHBvcyA+PSBtYXggfHwgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgyOSAvKiApICovKSB7XG4gICAgICAvLyBwYXJzaW5nIGEgdmFsaWQgc2hvcnRjdXQgbGluayBmYWlsZWQsIGZhbGxiYWNrIHRvIHJlZmVyZW5jZVxuICAgICAgcGFyc2VSZWZlcmVuY2UgPSB0cnVlO1xuICAgIH1cbiAgICBwb3MrKztcbiAgfVxuICBpZiAocGFyc2VSZWZlcmVuY2UpIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUIgLyogWyAqLykge1xuICAgICAgc3RhcnQgPSBwb3MgKyAxO1xuICAgICAgcG9zID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgcG9zKTtcbiAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKyspO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gICAgfVxuXG4gICAgLy8gY292ZXJzIGxhYmVsID09PSAnJyBhbmQgbGFiZWwgPT09IHVuZGVmaW5lZFxuICAgIC8vIChjb2xsYXBzZWQgcmVmZXJlbmNlIGxpbmsgYW5kIHNob3J0Y3V0IHJlZmVyZW5jZSBsaW5rIHJlc3BlY3RpdmVseSlcbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCk7XG4gICAgfVxuICAgIHJlZiA9IHN0YXRlLmVudi5yZWZlcmVuY2VzW25vcm1hbGl6ZVJlZmVyZW5jZShsYWJlbCldO1xuICAgIGlmICghcmVmKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGhyZWYgPSByZWYuaHJlZjtcbiAgICB0aXRsZSA9IHJlZi50aXRsZTtcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wb3MgPSBsYWJlbFN0YXJ0O1xuICAgIHN0YXRlLnBvc01heCA9IGxhYmVsRW5kO1xuICAgIGNvbnN0IHRva2VuX28gPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpO1xuICAgIGNvbnN0IGF0dHJzID0gW1snaHJlZicsIGhyZWZdXTtcbiAgICB0b2tlbl9vLmF0dHJzID0gYXR0cnM7XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsndGl0bGUnLCB0aXRsZV0pO1xuICAgIH1cbiAgICBzdGF0ZS5saW5rTGV2ZWwrKztcbiAgICBzdGF0ZS5tZC5pbmxpbmUudG9rZW5pemUoc3RhdGUpO1xuICAgIHN0YXRlLmxpbmtMZXZlbC0tO1xuICAgIHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKTtcbiAgfVxuICBzdGF0ZS5wb3MgPSBwb3M7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFByb2Nlc3MgIVtpbWFnZV0oPHNyYz4gXCJ0aXRsZVwiKVxuXG5mdW5jdGlvbiBpbWFnZShzdGF0ZSwgc2lsZW50KSB7XG4gIGxldCBjb2RlLCBjb250ZW50LCBsYWJlbCwgcG9zLCByZWYsIHJlcywgdGl0bGUsIHN0YXJ0O1xuICBsZXQgaHJlZiA9ICcnO1xuICBjb25zdCBvbGRQb3MgPSBzdGF0ZS5wb3M7XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heDtcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgIT09IDB4MjEgLyogISAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zICsgMSkgIT09IDB4NUIgLyogWyAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBsYWJlbFN0YXJ0ID0gc3RhdGUucG9zICsgMjtcbiAgY29uc3QgbGFiZWxFbmQgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBzdGF0ZS5wb3MgKyAxLCBmYWxzZSk7XG5cbiAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kICddJywgc28gaXQncyBub3QgYSB2YWxpZCBsaW5rXG4gIGlmIChsYWJlbEVuZCA8IDApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjggLyogKCAqLykge1xuICAgIC8vXG4gICAgLy8gSW5saW5lIGxpbmtcbiAgICAvL1xuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgcG9zKys7XG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICBeXl5eXl4gcGFyc2luZyBsaW5rIGRlc3RpbmF0aW9uXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKTtcbiAgICAgIGlmIChzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHtcbiAgICAgICAgcG9zID0gcmVzLnBvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHN0YXJ0ID0gcG9zO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNpbmcgbGluayB0aXRsZVxuICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rVGl0bGUoc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heCk7XG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHJlcy5vaykge1xuICAgICAgdGl0bGUgPSByZXMuc3RyO1xuICAgICAgcG9zID0gcmVzLnBvcztcblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGl0bGUgPSAnJztcbiAgICB9XG4gICAgaWYgKHBvcyA+PSBtYXggfHwgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgyOSAvKiApICovKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHBvcysrO1xuICB9IGVsc2Uge1xuICAgIC8vXG4gICAgLy8gTGluayByZWZlcmVuY2VcbiAgICAvL1xuICAgIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1QiAvKiBbICovKSB7XG4gICAgICBzdGFydCA9IHBvcyArIDE7XG4gICAgICBwb3MgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBwb3MpO1xuICAgICAgaWYgKHBvcyA+PSAwKSB7XG4gICAgICAgIGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MrKyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvcyA9IGxhYmVsRW5kICsgMTtcbiAgICB9XG5cbiAgICAvLyBjb3ZlcnMgbGFiZWwgPT09ICcnIGFuZCBsYWJlbCA9PT0gdW5kZWZpbmVkXG4gICAgLy8gKGNvbGxhcHNlZCByZWZlcmVuY2UgbGluayBhbmQgc2hvcnRjdXQgcmVmZXJlbmNlIGxpbmsgcmVzcGVjdGl2ZWx5KVxuICAgIGlmICghbGFiZWwpIHtcbiAgICAgIGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKGxhYmVsU3RhcnQsIGxhYmVsRW5kKTtcbiAgICB9XG4gICAgcmVmID0gc3RhdGUuZW52LnJlZmVyZW5jZXNbbm9ybWFsaXplUmVmZXJlbmNlKGxhYmVsKV07XG4gICAgaWYgKCFyZWYpIHtcbiAgICAgIHN0YXRlLnBvcyA9IG9sZFBvcztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaHJlZiA9IHJlZi5ocmVmO1xuICAgIHRpdGxlID0gcmVmLnRpdGxlO1xuICB9XG5cbiAgLy9cbiAgLy8gV2UgZm91bmQgdGhlIGVuZCBvZiB0aGUgbGluaywgYW5kIGtub3cgZm9yIGEgZmFjdCBpdCdzIGEgdmFsaWQgbGluaztcbiAgLy8gc28gYWxsIHRoYXQncyBsZWZ0IHRvIGRvIGlzIHRvIGNhbGwgdG9rZW5pemVyLlxuICAvL1xuICBpZiAoIXNpbGVudCkge1xuICAgIGNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UobGFiZWxTdGFydCwgbGFiZWxFbmQpO1xuICAgIGNvbnN0IHRva2VucyA9IFtdO1xuICAgIHN0YXRlLm1kLmlubGluZS5wYXJzZShjb250ZW50LCBzdGF0ZS5tZCwgc3RhdGUuZW52LCB0b2tlbnMpO1xuICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaW1hZ2UnLCAnaW1nJywgMCk7XG4gICAgY29uc3QgYXR0cnMgPSBbWydzcmMnLCBocmVmXSwgWydhbHQnLCAnJ11dO1xuICAgIHRva2VuLmF0dHJzID0gYXR0cnM7XG4gICAgdG9rZW4uY2hpbGRyZW4gPSB0b2tlbnM7XG4gICAgdG9rZW4uY29udGVudCA9IGNvbnRlbnQ7XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsndGl0bGUnLCB0aXRsZV0pO1xuICAgIH1cbiAgfVxuICBzdGF0ZS5wb3MgPSBwb3M7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIFByb2Nlc3MgYXV0b2xpbmtzICc8cHJvdG9jb2w6Li4uPidcblxuLyogZXNsaW50IG1heC1sZW46MCAqL1xuY29uc3QgRU1BSUxfUkUgPSAvXihbYS16QS1aMC05LiEjJCUmJyorLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKikkLztcbi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4ICovXG5jb25zdCBBVVRPTElOS19SRSA9IC9eKFthLXpBLVpdW2EtekEtWjAtOSsuLV17MSwzMX0pOihbXjw+XFx4MDAtXFx4MjBdKikkLztcbmZ1bmN0aW9uIGF1dG9saW5rKHN0YXRlLCBzaWxlbnQpIHtcbiAgbGV0IHBvcyA9IHN0YXRlLnBvcztcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MgLyogPCAqLykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBzdGFydCA9IHN0YXRlLnBvcztcbiAgY29uc3QgbWF4ID0gc3RhdGUucG9zTWF4O1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKCsrcG9zID49IG1heCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY2ggPT09IDB4M0MgLyogPCAqLykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChjaCA9PT0gMHgzRSAvKiA+ICovKSBicmVhaztcbiAgfVxuICBjb25zdCB1cmwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQgKyAxLCBwb3MpO1xuICBpZiAoQVVUT0xJTktfUkUudGVzdCh1cmwpKSB7XG4gICAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsodXJsKTtcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXNpbGVudCkge1xuICAgICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2xpbmtfb3BlbicsICdhJywgMSk7XG4gICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXTtcbiAgICAgIHRva2VuX28ubWFya3VwID0gJ2F1dG9saW5rJztcbiAgICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJztcbiAgICAgIGNvbnN0IHRva2VuX3QgPSBzdGF0ZS5wdXNoKCd0ZXh0JywgJycsIDApO1xuICAgICAgdG9rZW5fdC5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKTtcbiAgICAgIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS5wdXNoKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSk7XG4gICAgICB0b2tlbl9jLm1hcmt1cCA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbl9jLmluZm8gPSAnYXV0byc7XG4gICAgfVxuICAgIHN0YXRlLnBvcyArPSB1cmwubGVuZ3RoICsgMjtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoRU1BSUxfUkUudGVzdCh1cmwpKSB7XG4gICAgY29uc3QgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsoJ21haWx0bzonICsgdXJsKTtcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIXNpbGVudCkge1xuICAgICAgY29uc3QgdG9rZW5fbyA9IHN0YXRlLnB1c2goJ2xpbmtfb3BlbicsICdhJywgMSk7XG4gICAgICB0b2tlbl9vLmF0dHJzID0gW1snaHJlZicsIGZ1bGxVcmxdXTtcbiAgICAgIHRva2VuX28ubWFya3VwID0gJ2F1dG9saW5rJztcbiAgICAgIHRva2VuX28uaW5mbyA9ICdhdXRvJztcbiAgICAgIGNvbnN0IHRva2VuX3QgPSBzdGF0ZS5wdXNoKCd0ZXh0JywgJycsIDApO1xuICAgICAgdG9rZW5fdC5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKTtcbiAgICAgIGNvbnN0IHRva2VuX2MgPSBzdGF0ZS5wdXNoKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSk7XG4gICAgICB0b2tlbl9jLm1hcmt1cCA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbl9jLmluZm8gPSAnYXV0byc7XG4gICAgfVxuICAgIHN0YXRlLnBvcyArPSB1cmwubGVuZ3RoICsgMjtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFByb2Nlc3MgaHRtbCB0YWdzXG5cbmZ1bmN0aW9uIGlzTGlua09wZW4oc3RyKSB7XG4gIHJldHVybiAvXjxhWz5cXHNdL2kudGVzdChzdHIpO1xufVxuZnVuY3Rpb24gaXNMaW5rQ2xvc2Uoc3RyKSB7XG4gIHJldHVybiAvXjxcXC9hXFxzKj4vaS50ZXN0KHN0cik7XG59XG5mdW5jdGlvbiBpc0xldHRlcihjaCkge1xuICAvKiBlc2xpbnQgbm8tYml0d2lzZTowICovXG4gIGNvbnN0IGxjID0gY2ggfCAweDIwOyAvLyB0byBsb3dlciBjYXNlXG4gIHJldHVybiBsYyA+PSAweDYxIC8qIGEgKi8gJiYgbGMgPD0gMHg3YSAvKiB6ICovO1xufVxuZnVuY3Rpb24gaHRtbF9pbmxpbmUoc3RhdGUsIHNpbGVudCkge1xuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMuaHRtbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIENoZWNrIHN0YXJ0XG4gIGNvbnN0IG1heCA9IHN0YXRlLnBvc01heDtcbiAgY29uc3QgcG9zID0gc3RhdGUucG9zO1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQyAvKiA8ICovIHx8IHBvcyArIDIgPj0gbWF4KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gUXVpY2sgZmFpbCBvbiBzZWNvbmQgY2hhclxuICBjb25zdCBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpO1xuICBpZiAoY2ggIT09IDB4MjEgLyogISAqLyAmJiBjaCAhPT0gMHgzRiAvKiA/ICovICYmIGNoICE9PSAweDJGIC8qIC8gKi8gJiYgIWlzTGV0dGVyKGNoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKEhUTUxfVEFHX1JFKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoIXNpbGVudCkge1xuICAgIGNvbnN0IHRva2VuID0gc3RhdGUucHVzaCgnaHRtbF9pbmxpbmUnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCA9IG1hdGNoWzBdO1xuICAgIGlmIChpc0xpbmtPcGVuKHRva2VuLmNvbnRlbnQpKSBzdGF0ZS5saW5rTGV2ZWwrKztcbiAgICBpZiAoaXNMaW5rQ2xvc2UodG9rZW4uY29udGVudCkpIHN0YXRlLmxpbmtMZXZlbC0tO1xuICB9XG4gIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBQcm9jZXNzIGh0bWwgZW50aXR5IC0gJiMxMjM7LCAmI3hBRjssICZxdW90OywgLi4uXG5cbmNvbnN0IERJR0lUQUxfUkUgPSAvXiYjKCg/OnhbYS1mMC05XXsxLDZ9fFswLTldezEsN30pKTsvaTtcbmNvbnN0IE5BTUVEX1JFID0gL14mKFthLXpdW2EtejAtOV17MSwzMX0pOy9pO1xuZnVuY3Rpb24gZW50aXR5KHN0YXRlLCBzaWxlbnQpIHtcbiAgY29uc3QgcG9zID0gc3RhdGUucG9zO1xuICBjb25zdCBtYXggPSBzdGF0ZS5wb3NNYXg7XG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI2IC8qICYgKi8pIHJldHVybiBmYWxzZTtcbiAgaWYgKHBvcyArIDEgPj0gbWF4KSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSk7XG4gIGlmIChjaCA9PT0gMHgyMyAvKiAjICovKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChESUdJVEFMX1JFKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBtYXRjaFsxXVswXS50b0xvd2VyQ2FzZSgpID09PSAneCcgPyBwYXJzZUludChtYXRjaFsxXS5zbGljZSgxKSwgMTYpIDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0ZXh0X3NwZWNpYWwnLCAnJywgMCk7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSBpc1ZhbGlkRW50aXR5Q29kZShjb2RlKSA/IGZyb21Db2RlUG9pbnQoY29kZSkgOiBmcm9tQ29kZVBvaW50KDB4RkZGRCk7XG4gICAgICAgIHRva2VuLm1hcmt1cCA9IG1hdGNoWzBdO1xuICAgICAgICB0b2tlbi5pbmZvID0gJ2VudGl0eSc7XG4gICAgICB9XG4gICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcykubWF0Y2goTkFNRURfUkUpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgZGVjb2RlZCA9IGVudGl0aWVzLmRlY29kZUhUTUwobWF0Y2hbMF0pO1xuICAgICAgaWYgKGRlY29kZWQgIT09IG1hdGNoWzBdKSB7XG4gICAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0ZXh0X3NwZWNpYWwnLCAnJywgMCk7XG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IGRlY29kZWQ7XG4gICAgICAgICAgdG9rZW4ubWFya3VwID0gbWF0Y2hbMF07XG4gICAgICAgICAgdG9rZW4uaW5mbyA9ICdlbnRpdHknO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIEZvciBlYWNoIG9wZW5pbmcgZW1waGFzaXMtbGlrZSBtYXJrZXIgZmluZCBhIG1hdGNoaW5nIGNsb3Npbmcgb25lXG4vL1xuXG5mdW5jdGlvbiBwcm9jZXNzRGVsaW1pdGVycyhkZWxpbWl0ZXJzKSB7XG4gIGNvbnN0IG9wZW5lcnNCb3R0b20gPSB7fTtcbiAgY29uc3QgbWF4ID0gZGVsaW1pdGVycy5sZW5ndGg7XG4gIGlmICghbWF4KSByZXR1cm47XG5cbiAgLy8gaGVhZGVySWR4IGlzIHRoZSBmaXJzdCBkZWxpbWl0ZXIgb2YgdGhlIGN1cnJlbnQgKHdoZXJlIGNsb3NlciBpcykgZGVsaW1pdGVyIHJ1blxuICBsZXQgaGVhZGVySWR4ID0gMDtcbiAgbGV0IGxhc3RUb2tlbklkeCA9IC0yOyAvLyBuZWVkcyBhbnkgdmFsdWUgbG93ZXIgdGhhbiAtMVxuICBjb25zdCBqdW1wcyA9IFtdO1xuICBmb3IgKGxldCBjbG9zZXJJZHggPSAwOyBjbG9zZXJJZHggPCBtYXg7IGNsb3NlcklkeCsrKSB7XG4gICAgY29uc3QgY2xvc2VyID0gZGVsaW1pdGVyc1tjbG9zZXJJZHhdO1xuICAgIGp1bXBzLnB1c2goMCk7XG5cbiAgICAvLyBtYXJrZXJzIGJlbG9uZyB0byBzYW1lIGRlbGltaXRlciBydW4gaWY6XG4gICAgLy8gIC0gdGhleSBoYXZlIGFkamFjZW50IHRva2Vuc1xuICAgIC8vICAtIEFORCBtYXJrZXJzIGFyZSB0aGUgc2FtZVxuICAgIC8vXG4gICAgaWYgKGRlbGltaXRlcnNbaGVhZGVySWR4XS5tYXJrZXIgIT09IGNsb3Nlci5tYXJrZXIgfHwgbGFzdFRva2VuSWR4ICE9PSBjbG9zZXIudG9rZW4gLSAxKSB7XG4gICAgICBoZWFkZXJJZHggPSBjbG9zZXJJZHg7XG4gICAgfVxuICAgIGxhc3RUb2tlbklkeCA9IGNsb3Nlci50b2tlbjtcblxuICAgIC8vIExlbmd0aCBpcyBvbmx5IHVzZWQgZm9yIGVtcGhhc2lzLXNwZWNpZmljIFwicnVsZSBvZiAzXCIsXG4gICAgLy8gaWYgaXQncyBub3QgZGVmaW5lZCAoaW4gc3RyaWtldGhyb3VnaCBvciAzcmQgcGFydHkgcGx1Z2lucyksXG4gICAgLy8gd2UgY2FuIGRlZmF1bHQgaXQgdG8gMCB0byBkaXNhYmxlIHRob3NlIGNoZWNrcy5cbiAgICAvL1xuICAgIGNsb3Nlci5sZW5ndGggPSBjbG9zZXIubGVuZ3RoIHx8IDA7XG4gICAgaWYgKCFjbG9zZXIuY2xvc2UpIGNvbnRpbnVlO1xuXG4gICAgLy8gUHJldmlvdXNseSBjYWxjdWxhdGVkIGxvd2VyIGJvdW5kcyAocHJldmlvdXMgZmFpbHMpXG4gICAgLy8gZm9yIGVhY2ggbWFya2VyLCBlYWNoIGRlbGltaXRlciBsZW5ndGggbW9kdWxvIDMsXG4gICAgLy8gYW5kIGZvciB3aGV0aGVyIHRoaXMgY2xvc2VyIGNhbiBiZSBhbiBvcGVuZXI7XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvbW1vbm1hcmsvY21hcmsvY29tbWl0LzM0MjUwZTEyY2NlYmRjNjM3MmI4YjQ5YzQ0ZmFiNTdjNzI0NDM0NjBcbiAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zICovXG4gICAgaWYgKCFvcGVuZXJzQm90dG9tLmhhc093blByb3BlcnR5KGNsb3Nlci5tYXJrZXIpKSB7XG4gICAgICBvcGVuZXJzQm90dG9tW2Nsb3Nlci5tYXJrZXJdID0gWy0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdO1xuICAgIH1cbiAgICBjb25zdCBtaW5PcGVuZXJJZHggPSBvcGVuZXJzQm90dG9tW2Nsb3Nlci5tYXJrZXJdWyhjbG9zZXIub3BlbiA/IDMgOiAwKSArIGNsb3Nlci5sZW5ndGggJSAzXTtcbiAgICBsZXQgb3BlbmVySWR4ID0gaGVhZGVySWR4IC0ganVtcHNbaGVhZGVySWR4XSAtIDE7XG4gICAgbGV0IG5ld01pbk9wZW5lcklkeCA9IG9wZW5lcklkeDtcbiAgICBmb3IgKDsgb3BlbmVySWR4ID4gbWluT3BlbmVySWR4OyBvcGVuZXJJZHggLT0ganVtcHNbb3BlbmVySWR4XSArIDEpIHtcbiAgICAgIGNvbnN0IG9wZW5lciA9IGRlbGltaXRlcnNbb3BlbmVySWR4XTtcbiAgICAgIGlmIChvcGVuZXIubWFya2VyICE9PSBjbG9zZXIubWFya2VyKSBjb250aW51ZTtcbiAgICAgIGlmIChvcGVuZXIub3BlbiAmJiBvcGVuZXIuZW5kIDwgMCkge1xuICAgICAgICBsZXQgaXNPZGRNYXRjaCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGZyb20gc3BlYzpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgb25lIG9mIHRoZSBkZWxpbWl0ZXJzIGNhbiBib3RoIG9wZW4gYW5kIGNsb3NlIGVtcGhhc2lzLCB0aGVuIHRoZVxuICAgICAgICAvLyBzdW0gb2YgdGhlIGxlbmd0aHMgb2YgdGhlIGRlbGltaXRlciBydW5zIGNvbnRhaW5pbmcgdGhlIG9wZW5pbmcgYW5kXG4gICAgICAgIC8vIGNsb3NpbmcgZGVsaW1pdGVycyBtdXN0IG5vdCBiZSBhIG11bHRpcGxlIG9mIDMgdW5sZXNzIGJvdGggbGVuZ3Roc1xuICAgICAgICAvLyBhcmUgbXVsdGlwbGVzIG9mIDMuXG4gICAgICAgIC8vXG4gICAgICAgIGlmIChvcGVuZXIuY2xvc2UgfHwgY2xvc2VyLm9wZW4pIHtcbiAgICAgICAgICBpZiAoKG9wZW5lci5sZW5ndGggKyBjbG9zZXIubGVuZ3RoKSAlIDMgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChvcGVuZXIubGVuZ3RoICUgMyAhPT0gMCB8fCBjbG9zZXIubGVuZ3RoICUgMyAhPT0gMCkge1xuICAgICAgICAgICAgICBpc09kZE1hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc09kZE1hdGNoKSB7XG4gICAgICAgICAgLy8gSWYgcHJldmlvdXMgZGVsaW1pdGVyIGNhbm5vdCBiZSBhbiBvcGVuZXIsIHdlIGNhbiBzYWZlbHkgc2tpcFxuICAgICAgICAgIC8vIHRoZSBlbnRpcmUgc2VxdWVuY2UgaW4gZnV0dXJlIGNoZWNrcy4gVGhpcyBpcyByZXF1aXJlZCB0byBtYWtlXG4gICAgICAgICAgLy8gc3VyZSBhbGdvcml0aG0gaGFzIGxpbmVhciBjb21wbGV4aXR5IChzZWUgKl8qXypfKl8qXy4uLiBjYXNlKS5cbiAgICAgICAgICAvL1xuICAgICAgICAgIGNvbnN0IGxhc3RKdW1wID0gb3BlbmVySWR4ID4gMCAmJiAhZGVsaW1pdGVyc1tvcGVuZXJJZHggLSAxXS5vcGVuID8ganVtcHNbb3BlbmVySWR4IC0gMV0gKyAxIDogMDtcbiAgICAgICAgICBqdW1wc1tjbG9zZXJJZHhdID0gY2xvc2VySWR4IC0gb3BlbmVySWR4ICsgbGFzdEp1bXA7XG4gICAgICAgICAganVtcHNbb3BlbmVySWR4XSA9IGxhc3RKdW1wO1xuICAgICAgICAgIGNsb3Nlci5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgb3BlbmVyLmVuZCA9IGNsb3NlcklkeDtcbiAgICAgICAgICBvcGVuZXIuY2xvc2UgPSBmYWxzZTtcbiAgICAgICAgICBuZXdNaW5PcGVuZXJJZHggPSAtMTtcbiAgICAgICAgICAvLyB0cmVhdCBuZXh0IHRva2VuIGFzIHN0YXJ0IG9mIHJ1bixcbiAgICAgICAgICAvLyBpdCBvcHRpbWl6ZXMgc2tpcHMgaW4gKio8Li4uPioqYSoqPC4uLj4qKiBwYXRob2xvZ2ljYWwgY2FzZVxuICAgICAgICAgIGxhc3RUb2tlbklkeCA9IC0yO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuZXdNaW5PcGVuZXJJZHggIT09IC0xKSB7XG4gICAgICAvLyBJZiBtYXRjaCBmb3IgdGhpcyBkZWxpbWl0ZXIgcnVuIGZhaWxlZCwgd2Ugd2FudCB0byBzZXQgbG93ZXIgYm91bmQgZm9yXG4gICAgICAvLyBmdXR1cmUgbG9va3Vwcy4gVGhpcyBpcyByZXF1aXJlZCB0byBtYWtlIHN1cmUgYWxnb3JpdGhtIGhhcyBsaW5lYXJcbiAgICAgIC8vIGNvbXBsZXhpdHkuXG4gICAgICAvL1xuICAgICAgLy8gU2VlIGRldGFpbHMgaGVyZTpcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jb21tb25tYXJrL2NtYXJrL2lzc3Vlcy8xNzgjaXNzdWVjb21tZW50LTI3MDQxNzQ0MlxuICAgICAgLy9cbiAgICAgIG9wZW5lcnNCb3R0b21bY2xvc2VyLm1hcmtlcl1bKGNsb3Nlci5vcGVuID8gMyA6IDApICsgKGNsb3Nlci5sZW5ndGggfHwgMCkgJSAzXSA9IG5ld01pbk9wZW5lcklkeDtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGxpbmtfcGFpcnMoc3RhdGUpIHtcbiAgY29uc3QgdG9rZW5zX21ldGEgPSBzdGF0ZS50b2tlbnNfbWV0YTtcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zX21ldGEubGVuZ3RoO1xuICBwcm9jZXNzRGVsaW1pdGVycyhzdGF0ZS5kZWxpbWl0ZXJzKTtcbiAgZm9yIChsZXQgY3VyciA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIGlmICh0b2tlbnNfbWV0YVtjdXJyXSAmJiB0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKSB7XG4gICAgICBwcm9jZXNzRGVsaW1pdGVycyh0b2tlbnNfbWV0YVtjdXJyXS5kZWxpbWl0ZXJzKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gQ2xlYW4gdXAgdG9rZW5zIGFmdGVyIGVtcGhhc2lzIGFuZCBzdHJpa2V0aHJvdWdoIHBvc3Rwcm9jZXNzaW5nOlxuLy8gbWVyZ2UgYWRqYWNlbnQgdGV4dCBub2RlcyBpbnRvIG9uZSBhbmQgcmUtY2FsY3VsYXRlIGFsbCB0b2tlbiBsZXZlbHNcbi8vXG4vLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGluaXRpYWxseSBlbXBoYXNpcyBkZWxpbWl0ZXIgbWFya2VycyAoKiwgXywgfilcbi8vIGFyZSB0cmVhdGVkIGFzIHRoZWlyIG93biBzZXBhcmF0ZSB0ZXh0IHRva2Vucy4gVGhlbiBlbXBoYXNpcyBydWxlIGVpdGhlclxuLy8gbGVhdmVzIHRoZW0gYXMgdGV4dCAobmVlZGVkIHRvIG1lcmdlIHdpdGggYWRqYWNlbnQgdGV4dCkgb3IgdHVybnMgdGhlbVxuLy8gaW50byBvcGVuaW5nL2Nsb3NpbmcgdGFncyAod2hpY2ggbWVzc2VzIHVwIGxldmVscyBpbnNpZGUpLlxuLy9cblxuZnVuY3Rpb24gZnJhZ21lbnRzX2pvaW4oc3RhdGUpIHtcbiAgbGV0IGN1cnIsIGxhc3Q7XG4gIGxldCBsZXZlbCA9IDA7XG4gIGNvbnN0IHRva2VucyA9IHN0YXRlLnRva2VucztcbiAgY29uc3QgbWF4ID0gc3RhdGUudG9rZW5zLmxlbmd0aDtcbiAgZm9yIChjdXJyID0gbGFzdCA9IDA7IGN1cnIgPCBtYXg7IGN1cnIrKykge1xuICAgIC8vIHJlLWNhbGN1bGF0ZSBsZXZlbHMgYWZ0ZXIgZW1waGFzaXMvc3RyaWtldGhyb3VnaCB0dXJucyBzb21lIHRleHQgbm9kZXNcbiAgICAvLyBpbnRvIG9wZW5pbmcvY2xvc2luZyB0YWdzXG4gICAgaWYgKHRva2Vuc1tjdXJyXS5uZXN0aW5nIDwgMCkgbGV2ZWwtLTsgLy8gY2xvc2luZyB0YWdcbiAgICB0b2tlbnNbY3Vycl0ubGV2ZWwgPSBsZXZlbDtcbiAgICBpZiAodG9rZW5zW2N1cnJdLm5lc3RpbmcgPiAwKSBsZXZlbCsrOyAvLyBvcGVuaW5nIHRhZ1xuXG4gICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dCcgJiYgY3VyciArIDEgPCBtYXggJiYgdG9rZW5zW2N1cnIgKyAxXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgIC8vIGNvbGxhcHNlIHR3byBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnQgPSB0b2tlbnNbY3Vycl0uY29udGVudCArIHRva2Vuc1tjdXJyICsgMV0uY29udGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGN1cnIgIT09IGxhc3QpIHtcbiAgICAgICAgdG9rZW5zW2xhc3RdID0gdG9rZW5zW2N1cnJdO1xuICAgICAgfVxuICAgICAgbGFzdCsrO1xuICAgIH1cbiAgfVxuICBpZiAoY3VyciAhPT0gbGFzdCkge1xuICAgIHRva2Vucy5sZW5ndGggPSBsYXN0O1xuICB9XG59XG5cbi8qKiBpbnRlcm5hbFxuICogY2xhc3MgUGFyc2VySW5saW5lXG4gKlxuICogVG9rZW5pemVzIHBhcmFncmFwaCBjb250ZW50LlxuICoqL1xuXG5cbi8vIFBhcnNlciBydWxlc1xuXG5jb25zdCBfcnVsZXMgPSBbWyd0ZXh0JywgdGV4dF0sIFsnbGlua2lmeScsIGxpbmtpZnldLCBbJ25ld2xpbmUnLCBuZXdsaW5lXSwgWydlc2NhcGUnLCBlc2NhcGVdLCBbJ2JhY2t0aWNrcycsIGJhY2t0aWNrXSwgWydzdHJpa2V0aHJvdWdoJywgcl9zdHJpa2V0aHJvdWdoLnRva2VuaXplXSwgWydlbXBoYXNpcycsIHJfZW1waGFzaXMudG9rZW5pemVdLCBbJ2xpbmsnLCBsaW5rXSwgWydpbWFnZScsIGltYWdlXSwgWydhdXRvbGluaycsIGF1dG9saW5rXSwgWydodG1sX2lubGluZScsIGh0bWxfaW5saW5lXSwgWydlbnRpdHknLCBlbnRpdHldXTtcblxuLy8gYHJ1bGUyYCBydWxlc2V0IHdhcyBjcmVhdGVkIHNwZWNpZmljYWxseSBmb3IgZW1waGFzaXMvc3RyaWtldGhyb3VnaFxuLy8gcG9zdC1wcm9jZXNzaW5nIGFuZCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuLy9cbi8vIERvbid0IHVzZSB0aGlzIGZvciBhbnl0aGluZyBleGNlcHQgcGFpcnMgKHBsdWdpbnMgd29ya2luZyB3aXRoIGBiYWxhbmNlX3BhaXJzYCkuXG4vL1xuY29uc3QgX3J1bGVzMiA9IFtbJ2JhbGFuY2VfcGFpcnMnLCBsaW5rX3BhaXJzXSwgWydzdHJpa2V0aHJvdWdoJywgcl9zdHJpa2V0aHJvdWdoLnBvc3RQcm9jZXNzXSwgWydlbXBoYXNpcycsIHJfZW1waGFzaXMucG9zdFByb2Nlc3NdLFxuLy8gcnVsZXMgZm9yIHBhaXJzIHNlcGFyYXRlICcqKicgaW50byBpdHMgb3duIHRleHQgdG9rZW5zLCB3aGljaCBtYXkgYmUgbGVmdCB1bnVzZWQsXG4vLyBydWxlIGJlbG93IG1lcmdlcyB1bnVzZWQgc2VnbWVudHMgYmFjayB3aXRoIHRoZSByZXN0IG9mIHRoZSB0ZXh0XG5bJ2ZyYWdtZW50c19qb2luJywgZnJhZ21lbnRzX2pvaW5dXTtcblxuLyoqXG4gKiBuZXcgUGFyc2VySW5saW5lKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlcklubGluZSgpIHtcbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBpbmxpbmUgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VySW5saW5lI3J1bGVyMiAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIFNlY29uZCBydWxlciB1c2VkIGZvciBwb3N0LXByb2Nlc3NpbmdcbiAgICogKGUuZy4gaW4gZW1waGFzaXMtbGlrZSBydWxlcykuXG4gICAqKi9cbiAgdGhpcy5ydWxlcjIgPSBuZXcgUnVsZXIoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBfcnVsZXMyLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlcjIucHVzaChfcnVsZXMyW2ldWzBdLCBfcnVsZXMyW2ldWzFdKTtcbiAgfVxufVxuXG4vLyBTa2lwIHNpbmdsZSB0b2tlbiBieSBydW5uaW5nIGFsbCBydWxlcyBpbiB2YWxpZGF0aW9uIG1vZGU7XG4vLyByZXR1cm5zIGB0cnVlYCBpZiBhbnkgcnVsZSByZXBvcnRlZCBzdWNjZXNzXG4vL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS5za2lwVG9rZW4gPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgY29uc3QgcG9zID0gc3RhdGUucG9zO1xuICBjb25zdCBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpO1xuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGg7XG4gIGNvbnN0IG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG4gIGNvbnN0IGNhY2hlID0gc3RhdGUuY2FjaGU7XG4gIGlmICh0eXBlb2YgY2FjaGVbcG9zXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBzdGF0ZS5wb3MgPSBjYWNoZVtwb3NdO1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgb2sgPSBmYWxzZTtcbiAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIC8vIEluY3JlbWVudCBzdGF0ZS5sZXZlbCBhbmQgZGVjcmVtZW50IGl0IGxhdGVyIHRvIGxpbWl0IHJlY3Vyc2lvbi5cbiAgICAgIC8vIEl0J3MgaGFybWxlc3MgdG8gZG8gaGVyZSwgYmVjYXVzZSBubyB0b2tlbnMgYXJlIGNyZWF0ZWQuIEJ1dCBpZGVhbGx5LFxuICAgICAgLy8gd2UnZCBuZWVkIGEgc2VwYXJhdGUgcHJpdmF0ZSBzdGF0ZSB2YXJpYWJsZSBmb3IgdGhpcyBwdXJwb3NlLlxuICAgICAgLy9cbiAgICAgIHN0YXRlLmxldmVsKys7XG4gICAgICBvayA9IHJ1bGVzW2ldKHN0YXRlLCB0cnVlKTtcbiAgICAgIHN0YXRlLmxldmVsLS07XG4gICAgICBpZiAob2spIHtcbiAgICAgICAgaWYgKHBvcyA+PSBzdGF0ZS5wb3MpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbmxpbmUgcnVsZSBkaWRuJ3QgaW5jcmVtZW50IHN0YXRlLnBvc1wiKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVG9vIG11Y2ggbmVzdGluZywganVzdCBza2lwIHVudGlsIHRoZSBlbmQgb2YgdGhlIHBhcmFncmFwaC5cbiAgICAvL1xuICAgIC8vIE5PVEU6IHRoaXMgd2lsbCBjYXVzZSBsaW5rcyB0byBiZWhhdmUgaW5jb3JyZWN0bHkgaW4gdGhlIGZvbGxvd2luZyBjYXNlLFxuICAgIC8vICAgICAgIHdoZW4gYW4gYW1vdW50IG9mIGBbYCBpcyBleGFjdGx5IGVxdWFsIHRvIGBtYXhOZXN0aW5nICsgMWA6XG4gICAgLy9cbiAgICAvLyAgICAgICBbW1tbW1tbW1tbW1tbW1tbW1tbW1tmb29dKClcbiAgICAvL1xuICAgIC8vIFRPRE86IHJlbW92ZSB0aGlzIHdvcmthcm91bmQgd2hlbiBDTSBzdGFuZGFyZCB3aWxsIGFsbG93IG5lc3RlZCBsaW5rc1xuICAgIC8vICAgICAgICh3ZSBjYW4gcmVwbGFjZSBpdCBieSBwcmV2ZW50aW5nIGxpbmtzIGZyb20gYmVpbmcgcGFyc2VkIGluXG4gICAgLy8gICAgICAgdmFsaWRhdGlvbiBtb2RlKVxuICAgIC8vXG4gICAgc3RhdGUucG9zID0gc3RhdGUucG9zTWF4O1xuICB9XG4gIGlmICghb2spIHtcbiAgICBzdGF0ZS5wb3MrKztcbiAgfVxuICBjYWNoZVtwb3NdID0gc3RhdGUucG9zO1xufTtcblxuLy8gR2VuZXJhdGUgdG9rZW5zIGZvciBpbnB1dCByYW5nZVxuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgY29uc3QgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKTtcbiAgY29uc3QgbGVuID0gcnVsZXMubGVuZ3RoO1xuICBjb25zdCBlbmQgPSBzdGF0ZS5wb3NNYXg7XG4gIGNvbnN0IG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG4gIHdoaWxlIChzdGF0ZS5wb3MgPCBlbmQpIHtcbiAgICAvLyBUcnkgYWxsIHBvc3NpYmxlIHJ1bGVzLlxuICAgIC8vIE9uIHN1Y2Nlc3MsIHJ1bGUgc2hvdWxkOlxuICAgIC8vXG4gICAgLy8gLSB1cGRhdGUgYHN0YXRlLnBvc2BcbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUudG9rZW5zYFxuICAgIC8vIC0gcmV0dXJuIHRydWVcbiAgICBjb25zdCBwcmV2UG9zID0gc3RhdGUucG9zO1xuICAgIGxldCBvayA9IGZhbHNlO1xuICAgIGlmIChzdGF0ZS5sZXZlbCA8IG1heE5lc3RpbmcpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgZmFsc2UpO1xuICAgICAgICBpZiAob2spIHtcbiAgICAgICAgICBpZiAocHJldlBvcyA+PSBzdGF0ZS5wb3MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImlubGluZSBydWxlIGRpZG4ndCBpbmNyZW1lbnQgc3RhdGUucG9zXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2spIHtcbiAgICAgIGlmIChzdGF0ZS5wb3MgPj0gZW5kKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjW3N0YXRlLnBvcysrXTtcbiAgfVxuICBpZiAoc3RhdGUucGVuZGluZykge1xuICAgIHN0YXRlLnB1c2hQZW5kaW5nKCk7XG4gIH1cbn07XG5cbi8qKlxuICogUGFyc2VySW5saW5lLnBhcnNlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKVxuICpcbiAqIFByb2Nlc3MgaW5wdXQgc3RyaW5nIGFuZCBwdXNoIGlubGluZSB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICBjb25zdCBzdGF0ZSA9IG5ldyB0aGlzLlN0YXRlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKTtcbiAgdGhpcy50b2tlbml6ZShzdGF0ZSk7XG4gIGNvbnN0IHJ1bGVzID0gdGhpcy5ydWxlcjIuZ2V0UnVsZXMoJycpO1xuICBjb25zdCBsZW4gPSBydWxlcy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBydWxlc1tpXShzdGF0ZSk7XG4gIH1cbn07XG5QYXJzZXJJbmxpbmUucHJvdG90eXBlLlN0YXRlID0gU3RhdGVJbmxpbmU7XG5cbi8vIG1hcmtkb3duLWl0IGRlZmF1bHQgb3B0aW9uc1xuXG52YXIgY2ZnX2RlZmF1bHQgPSB7XG4gIG9wdGlvbnM6IHtcbiAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIGh0bWw6IGZhbHNlLFxuICAgIC8vIFVzZSAnLycgdG8gY2xvc2Ugc2luZ2xlIHRhZ3MgKDxiciAvPilcbiAgICB4aHRtbE91dDogZmFsc2UsXG4gICAgLy8gQ29udmVydCAnXFxuJyBpbiBwYXJhZ3JhcGhzIGludG8gPGJyPlxuICAgIGJyZWFrczogZmFsc2UsXG4gICAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxhbmdQcmVmaXg6ICdsYW5ndWFnZS0nLFxuICAgIC8vIGF1dG9jb252ZXJ0IFVSTC1saWtlIHRleHRzIHRvIGxpbmtzXG4gICAgbGlua2lmeTogZmFsc2UsXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogZmFsc2UsXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gQ291bGQgYmUgZWl0aGVyIGEgU3RyaW5nIG9yIGFuIEFycmF5LlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIHlvdSBjYW4gdXNlICdcdTAwQUJcdTAwQkJcdTIwMUVcdTIwMUMnIGZvciBSdXNzaWFuLCAnXHUyMDFFXHUyMDFDXHUyMDFBXHUyMDE4JyBmb3IgR2VybWFuLFxuICAgIC8vIGFuZCBbJ1x1MDBBQlxceEEwJywgJ1xceEEwXHUwMEJCJywgJ1x1MjAzOVxceEEwJywgJ1xceEEwXHUyMDNBJ10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLFxuICAgIC8qIFx1MjAxQ1x1MjAxRFx1MjAxOFx1MjAxOSAqL1xuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIHRoZSBzb3VyY2Ugc3RyaW5nIGlzIG5vdCBjaGFuZ2VkIGFuZCBzaG91bGQgYmUgZXNjYXBlZCBleHRlcm5hbHkuXG4gICAgLy8gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG4gICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gICAgbWF4TmVzdGluZzogMTAwXG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICBjb3JlOiB7fSxcbiAgICBibG9jazoge30sXG4gICAgaW5saW5lOiB7fVxuICB9XG59O1xuXG4vLyBcIlplcm9cIiBwcmVzZXQsIHdpdGggbm90aGluZyBlbmFibGVkLiBVc2VmdWwgZm9yIG1hbnVhbCBjb25maWd1cmluZyBvZiBzaW1wbGVcbi8vIG1vZGVzLiBGb3IgZXhhbXBsZSwgdG8gcGFyc2UgYm9sZC9pdGFsaWMgb25seS5cblxudmFyIGNmZ196ZXJvID0ge1xuICBvcHRpb25zOiB7XG4gICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICBodG1sOiBmYWxzZSxcbiAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgeGh0bWxPdXQ6IGZhbHNlLFxuICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBicmVha3M6IGZhbHNlLFxuICAgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsYW5nUHJlZml4OiAnbGFuZ3VhZ2UtJyxcbiAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuICAgIGxpbmtpZnk6IGZhbHNlLFxuICAgIC8vIEVuYWJsZSBzb21lIGxhbmd1YWdlLW5ldXRyYWwgcmVwbGFjZW1lbnRzICsgcXVvdGVzIGJlYXV0aWZpY2F0aW9uXG4gICAgdHlwb2dyYXBoZXI6IGZhbHNlLFxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnXHUwMEFCXHUwMEJCXHUyMDFFXHUyMDFDJyBmb3IgUnVzc2lhbiwgJ1x1MjAxRVx1MjAxQ1x1MjAxQVx1MjAxOCcgZm9yIEdlcm1hbixcbiAgICAvLyBhbmQgWydcdTAwQUJcXHhBMCcsICdcXHhBMFx1MDBCQicsICdcdTIwMzlcXHhBMCcsICdcXHhBMFx1MjAzQSddIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAgICBxdW90ZXM6ICdcXHUyMDFjXFx1MjAxZFxcdTIwMThcXHUyMDE5JyxcbiAgICAvKiBcdTIwMUNcdTIwMURcdTIwMThcdTIwMTkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuICAgIC8vIEludGVybmFsIHByb3RlY3Rpb24sIHJlY3Vyc2lvbiBsaW1pdFxuICAgIG1heE5lc3Rpbmc6IDIwXG4gIH0sXG4gIGNvbXBvbmVudHM6IHtcbiAgICBjb3JlOiB7XG4gICAgICBydWxlczogWydub3JtYWxpemUnLCAnYmxvY2snLCAnaW5saW5lJywgJ3RleHRfam9pbiddXG4gICAgfSxcbiAgICBibG9jazoge1xuICAgICAgcnVsZXM6IFsncGFyYWdyYXBoJ11cbiAgICB9LFxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFsndGV4dCddLFxuICAgICAgcnVsZXMyOiBbJ2JhbGFuY2VfcGFpcnMnLCAnZnJhZ21lbnRzX2pvaW4nXVxuICAgIH1cbiAgfVxufTtcblxuLy8gQ29tbW9ubWFyayBkZWZhdWx0IG9wdGlvbnNcblxudmFyIGNmZ19jb21tb25tYXJrID0ge1xuICBvcHRpb25zOiB7XG4gICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICBodG1sOiB0cnVlLFxuICAgIC8vIFVzZSAnLycgdG8gY2xvc2Ugc2luZ2xlIHRhZ3MgKDxiciAvPilcbiAgICB4aHRtbE91dDogdHJ1ZSxcbiAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgYnJlYWtzOiBmYWxzZSxcbiAgICAvLyBDU1MgbGFuZ3VhZ2UgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzXG4gICAgbGFuZ1ByZWZpeDogJ2xhbmd1YWdlLScsXG4gICAgLy8gYXV0b2NvbnZlcnQgVVJMLWxpa2UgdGV4dHMgdG8gbGlua3NcbiAgICBsaW5raWZ5OiBmYWxzZSxcbiAgICAvLyBFbmFibGUgc29tZSBsYW5ndWFnZS1uZXV0cmFsIHJlcGxhY2VtZW50cyArIHF1b3RlcyBiZWF1dGlmaWNhdGlvblxuICAgIHR5cG9ncmFwaGVyOiBmYWxzZSxcbiAgICAvLyBEb3VibGUgKyBzaW5nbGUgcXVvdGVzIHJlcGxhY2VtZW50IHBhaXJzLCB3aGVuIHR5cG9ncmFwaGVyIGVuYWJsZWQsXG4gICAgLy8gYW5kIHNtYXJ0cXVvdGVzIG9uLiBDb3VsZCBiZSBlaXRoZXIgYSBTdHJpbmcgb3IgYW4gQXJyYXkuXG4gICAgLy9cbiAgICAvLyBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgJ1x1MDBBQlx1MDBCQlx1MjAxRVx1MjAxQycgZm9yIFJ1c3NpYW4sICdcdTIwMUVcdTIwMUNcdTIwMUFcdTIwMTgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnXHUwMEFCXFx4QTAnLCAnXFx4QTBcdTAwQkInLCAnXHUyMDM5XFx4QTAnLCAnXFx4QTBcdTIwM0EnXSBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gICAgcXVvdGVzOiAnXFx1MjAxY1xcdTIwMWRcXHUyMDE4XFx1MjAxOScsXG4gICAgLyogXHUyMDFDXHUyMDFEXHUyMDE4XHUyMDE5ICovXG5cbiAgICAvLyBIaWdobGlnaHRlciBmdW5jdGlvbi4gU2hvdWxkIHJldHVybiBlc2NhcGVkIEhUTUwsXG4gICAgLy8gb3IgJycgaWYgdGhlIHNvdXJjZSBzdHJpbmcgaXMgbm90IGNoYW5nZWQgYW5kIHNob3VsZCBiZSBlc2NhcGVkIGV4dGVybmFseS5cbiAgICAvLyBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiAoLypzdHIsIGxhbmcqLykgeyByZXR1cm4gJyc7IH1cbiAgICAvL1xuICAgIGhpZ2hsaWdodDogbnVsbCxcbiAgICAvLyBJbnRlcm5hbCBwcm90ZWN0aW9uLCByZWN1cnNpb24gbGltaXRcbiAgICBtYXhOZXN0aW5nOiAyMFxuICB9LFxuICBjb21wb25lbnRzOiB7XG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFsnbm9ybWFsaXplJywgJ2Jsb2NrJywgJ2lubGluZScsICd0ZXh0X2pvaW4nXVxuICAgIH0sXG4gICAgYmxvY2s6IHtcbiAgICAgIHJ1bGVzOiBbJ2Jsb2NrcXVvdGUnLCAnY29kZScsICdmZW5jZScsICdoZWFkaW5nJywgJ2hyJywgJ2h0bWxfYmxvY2snLCAnbGhlYWRpbmcnLCAnbGlzdCcsICdyZWZlcmVuY2UnLCAncGFyYWdyYXBoJ11cbiAgICB9LFxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFsnYXV0b2xpbmsnLCAnYmFja3RpY2tzJywgJ2VtcGhhc2lzJywgJ2VudGl0eScsICdlc2NhcGUnLCAnaHRtbF9pbmxpbmUnLCAnaW1hZ2UnLCAnbGluaycsICduZXdsaW5lJywgJ3RleHQnXSxcbiAgICAgIHJ1bGVzMjogWydiYWxhbmNlX3BhaXJzJywgJ2VtcGhhc2lzJywgJ2ZyYWdtZW50c19qb2luJ11cbiAgICB9XG4gIH1cbn07XG5cbi8vIE1haW4gcGFyc2VyIGNsYXNzXG5cbmNvbnN0IGNvbmZpZyA9IHtcbiAgZGVmYXVsdDogY2ZnX2RlZmF1bHQsXG4gIHplcm86IGNmZ196ZXJvLFxuICBjb21tb25tYXJrOiBjZmdfY29tbW9ubWFya1xufTtcblxuLy9cbi8vIFRoaXMgdmFsaWRhdG9yIGNhbiBwcm9oaWJpdCBtb3JlIHRoYW4gcmVhbGx5IG5lZWRlZCB0byBwcmV2ZW50IFhTUy4gSXQncyBhXG4vLyB0cmFkZW9mZiB0byBrZWVwIGNvZGUgc2ltcGxlIGFuZCB0byBiZSBzZWN1cmUgYnkgZGVmYXVsdC5cbi8vXG4vLyBJZiB5b3UgbmVlZCBkaWZmZXJlbnQgc2V0dXAgLSBvdmVycmlkZSB2YWxpZGF0b3IgbWV0aG9kIGFzIHlvdSB3aXNoLiBPclxuLy8gcmVwbGFjZSBpdCB3aXRoIGR1bW15IGZ1bmN0aW9uIGFuZCB1c2UgZXh0ZXJuYWwgc2FuaXRpemVyLlxuLy9cblxuY29uc3QgQkFEX1BST1RPX1JFID0gL14odmJzY3JpcHR8amF2YXNjcmlwdHxmaWxlfGRhdGEpOi87XG5jb25zdCBHT09EX0RBVEFfUkUgPSAvXmRhdGE6aW1hZ2VcXC8oZ2lmfHBuZ3xqcGVnfHdlYnApOy87XG5mdW5jdGlvbiB2YWxpZGF0ZUxpbmsodXJsKSB7XG4gIC8vIHVybCBzaG91bGQgYmUgbm9ybWFsaXplZCBhdCB0aGlzIHBvaW50LCBhbmQgZXhpc3RpbmcgZW50aXRpZXMgYXJlIGRlY29kZWRcbiAgY29uc3Qgc3RyID0gdXJsLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gQkFEX1BST1RPX1JFLnRlc3Qoc3RyKSA/IEdPT0RfREFUQV9SRS50ZXN0KHN0cikgOiB0cnVlO1xufVxuY29uc3QgUkVDT0RFX0hPU1ROQU1FX0ZPUiA9IFsnaHR0cDonLCAnaHR0cHM6JywgJ21haWx0bzonXTtcbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpbmsodXJsKSB7XG4gIGNvbnN0IHBhcnNlZCA9IG1kdXJsX19uYW1lc3BhY2UucGFyc2UodXJsLCB0cnVlKTtcbiAgaWYgKHBhcnNlZC5ob3N0bmFtZSkge1xuICAgIC8vIEVuY29kZSBob3N0bmFtZXMgaW4gdXJscyBsaWtlOlxuICAgIC8vIGBodHRwOi8vaG9zdC9gLCBgaHR0cHM6Ly9ob3N0L2AsIGBtYWlsdG86dXNlckBob3N0YCwgYC8vaG9zdC9gXG4gICAgLy9cbiAgICAvLyBXZSBkb24ndCBlbmNvZGUgdW5rbm93biBzY2hlbWFzLCBiZWNhdXNlIGl0J3MgbGlrZWx5IHRoYXQgd2UgZW5jb2RlXG4gICAgLy8gc29tZXRoaW5nIHdlIHNob3VsZG4ndCAoZS5nLiBgc2t5cGU6bmFtZWAgdHJlYXRlZCBhcyBgc2t5cGU6aG9zdGApXG4gICAgLy9cbiAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCB8fCBSRUNPREVfSE9TVE5BTUVfRk9SLmluZGV4T2YocGFyc2VkLnByb3RvY29sKSA+PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBwYXJzZWQuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgey8qKi99XG4gICAgfVxuICB9XG4gIHJldHVybiBtZHVybF9fbmFtZXNwYWNlLmVuY29kZShtZHVybF9fbmFtZXNwYWNlLmZvcm1hdChwYXJzZWQpKTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpbmtUZXh0KHVybCkge1xuICBjb25zdCBwYXJzZWQgPSBtZHVybF9fbmFtZXNwYWNlLnBhcnNlKHVybCwgdHJ1ZSk7XG4gIGlmIChwYXJzZWQuaG9zdG5hbWUpIHtcbiAgICAvLyBFbmNvZGUgaG9zdG5hbWVzIGluIHVybHMgbGlrZTpcbiAgICAvLyBgaHR0cDovL2hvc3QvYCwgYGh0dHBzOi8vaG9zdC9gLCBgbWFpbHRvOnVzZXJAaG9zdGAsIGAvL2hvc3QvYFxuICAgIC8vXG4gICAgLy8gV2UgZG9uJ3QgZW5jb2RlIHVua25vd24gc2NoZW1hcywgYmVjYXVzZSBpdCdzIGxpa2VseSB0aGF0IHdlIGVuY29kZVxuICAgIC8vIHNvbWV0aGluZyB3ZSBzaG91bGRuJ3QgKGUuZy4gYHNreXBlOm5hbWVgIHRyZWF0ZWQgYXMgYHNreXBlOmhvc3RgKVxuICAgIC8vXG4gICAgaWYgKCFwYXJzZWQucHJvdG9jb2wgfHwgUkVDT0RFX0hPU1ROQU1FX0ZPUi5pbmRleE9mKHBhcnNlZC5wcm90b2NvbCkgPj0gMCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFyc2VkLmhvc3RuYW1lID0gcHVueWNvZGUudG9Vbmljb2RlKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgey8qKi99XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkICclJyB0byBleGNsdWRlIGxpc3QgYmVjYXVzZSBvZiBodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvaXNzdWVzLzcyMFxuICByZXR1cm4gbWR1cmxfX25hbWVzcGFjZS5kZWNvZGUobWR1cmxfX25hbWVzcGFjZS5mb3JtYXQocGFyc2VkKSwgbWR1cmxfX25hbWVzcGFjZS5kZWNvZGUuZGVmYXVsdENoYXJzICsgJyUnKTtcbn1cblxuLyoqXG4gKiBjbGFzcyBNYXJrZG93bkl0XG4gKlxuICogTWFpbiBwYXJzZXIvcmVuZGVyZXIgY2xhc3MuXG4gKlxuICogIyMjIyMgVXNhZ2VcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiAvLyBub2RlLmpzLCBcImNsYXNzaWNcIiB3YXk6XG4gKiB2YXIgTWFya2Rvd25JdCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JyksXG4gKiAgICAgbWQgPSBuZXcgTWFya2Rvd25JdCgpO1xuICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcignIyBtYXJrZG93bi1pdCBydWxlenohJyk7XG4gKlxuICogLy8gbm9kZS5qcywgdGhlIHNhbWUsIGJ1dCB3aXRoIHN1Z2FyOlxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcignIyBtYXJrZG93bi1pdCBydWxlenohJyk7XG4gKlxuICogLy8gYnJvd3NlciB3aXRob3V0IEFNRCwgYWRkZWQgdG8gXCJ3aW5kb3dcIiBvbiBzY3JpcHQgbG9hZFxuICogLy8gTm90ZSwgdGhlcmUgYXJlIG5vIGRhc2guXG4gKiB2YXIgbWQgPSB3aW5kb3cubWFya2Rvd25pdCgpO1xuICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcignIyBtYXJrZG93bi1pdCBydWxlenohJyk7XG4gKiBgYGBcbiAqXG4gKiBTaW5nbGUgbGluZSByZW5kZXJpbmcsIHdpdGhvdXQgcGFyYWdyYXBoIHdyYXA6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcklubGluZSgnX19tYXJrZG93bi1pdF9fIHJ1bGV6eiEnKTtcbiAqIGBgYFxuICoqL1xuXG4vKipcbiAqIG5ldyBNYXJrZG93bkl0KFtwcmVzZXROYW1lLCBvcHRpb25zXSlcbiAqIC0gcHJlc2V0TmFtZSAoU3RyaW5nKTogb3B0aW9uYWwsIGBjb21tb25tYXJrYCAvIGB6ZXJvYFxuICogLSBvcHRpb25zIChPYmplY3QpXG4gKlxuICogQ3JlYXRlcyBwYXJzZXIgaW5zdGFuc2Ugd2l0aCBnaXZlbiBjb25maWcuIENhbiBiZSBjYWxsZWQgd2l0aG91dCBgbmV3YC5cbiAqXG4gKiAjIyMjIyBwcmVzZXROYW1lXG4gKlxuICogTWFya2Rvd25JdCBwcm92aWRlcyBuYW1lZCBwcmVzZXRzIGFzIGEgY29udmVuaWVuY2UgdG8gcXVpY2tseVxuICogZW5hYmxlL2Rpc2FibGUgYWN0aXZlIHN5bnRheCBydWxlcyBhbmQgb3B0aW9ucyBmb3IgY29tbW9uIHVzZSBjYXNlcy5cbiAqXG4gKiAtIFtcImNvbW1vbm1hcmtcIl0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9wcmVzZXRzL2NvbW1vbm1hcmsubWpzKSAtXG4gKiAgIGNvbmZpZ3VyZXMgcGFyc2VyIHRvIHN0cmljdCBbQ29tbW9uTWFya10oaHR0cDovL2NvbW1vbm1hcmsub3JnLykgbW9kZS5cbiAqIC0gW2RlZmF1bHRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcHJlc2V0cy9kZWZhdWx0Lm1qcykgLVxuICogICBzaW1pbGFyIHRvIEdGTSwgdXNlZCB3aGVuIG5vIHByZXNldCBuYW1lIGdpdmVuLiBFbmFibGVzIGFsbCBhdmFpbGFibGUgcnVsZXMsXG4gKiAgIGJ1dCBzdGlsbCB3aXRob3V0IGh0bWwsIHR5cG9ncmFwaGVyICYgYXV0b2xpbmtlci5cbiAqIC0gW1wiemVyb1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvemVyby5tanMpIC1cbiAqICAgYWxsIHJ1bGVzIGRpc2FibGVkLiBVc2VmdWwgdG8gcXVpY2tseSBzZXR1cCB5b3VyIGNvbmZpZyB2aWEgYC5lbmFibGUoKWAuXG4gKiAgIEZvciBleGFtcGxlLCB3aGVuIHlvdSBuZWVkIG9ubHkgYGJvbGRgIGFuZCBgaXRhbGljYCBtYXJrdXAgYW5kIG5vdGhpbmcgZWxzZS5cbiAqXG4gKiAjIyMjIyBvcHRpb25zOlxuICpcbiAqIC0gX19odG1sX18gLSBgZmFsc2VgLiBTZXQgYHRydWVgIHRvIGVuYWJsZSBIVE1MIHRhZ3MgaW4gc291cmNlLiBCZSBjYXJlZnVsIVxuICogICBUaGF0J3Mgbm90IHNhZmUhIFlvdSBtYXkgbmVlZCBleHRlcm5hbCBzYW5pdGl6ZXIgdG8gcHJvdGVjdCBvdXRwdXQgZnJvbSBYU1MuXG4gKiAgIEl0J3MgYmV0dGVyIHRvIGV4dGVuZCBmZWF0dXJlcyB2aWEgcGx1Z2lucywgaW5zdGVhZCBvZiBlbmFibGluZyBIVE1MLlxuICogLSBfX3hodG1sT3V0X18gLSBgZmFsc2VgLiBTZXQgYHRydWVgIHRvIGFkZCAnLycgd2hlbiBjbG9zaW5nIHNpbmdsZSB0YWdzXG4gKiAgIChgPGJyIC8+YCkuIFRoaXMgaXMgbmVlZGVkIG9ubHkgZm9yIGZ1bGwgQ29tbW9uTWFyayBjb21wYXRpYmlsaXR5LiBJbiByZWFsXG4gKiAgIHdvcmxkIHlvdSB3aWxsIG5lZWQgSFRNTCBvdXRwdXQuXG4gKiAtIF9fYnJlYWtzX18gLSBgZmFsc2VgLiBTZXQgYHRydWVgIHRvIGNvbnZlcnQgYFxcbmAgaW4gcGFyYWdyYXBocyBpbnRvIGA8YnI+YC5cbiAqIC0gX19sYW5nUHJlZml4X18gLSBgbGFuZ3VhZ2UtYC4gQ1NTIGxhbmd1YWdlIGNsYXNzIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrcy5cbiAqICAgQ2FuIGJlIHVzZWZ1bCBmb3IgZXh0ZXJuYWwgaGlnaGxpZ2h0ZXJzLlxuICogLSBfX2xpbmtpZnlfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gYXV0b2NvbnZlcnQgVVJMLWxpa2UgdGV4dCB0byBsaW5rcy5cbiAqIC0gX190eXBvZ3JhcGhlcl9fICAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gZW5hYmxlIFtzb21lIGxhbmd1YWdlLW5ldXRyYWxcbiAqICAgcmVwbGFjZW1lbnRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcnVsZXNfY29yZS9yZXBsYWNlbWVudHMubWpzKSArXG4gKiAgIHF1b3RlcyBiZWF1dGlmaWNhdGlvbiAoc21hcnRxdW90ZXMpLlxuICogLSBfX3F1b3Rlc19fIC0gYFx1MjAxQ1x1MjAxRFx1MjAxOFx1MjAxOWAsIFN0cmluZyBvciBBcnJheS4gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudFxuICogICBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkIGFuZCBzbWFydHF1b3RlcyBvbi4gRm9yIGV4YW1wbGUsIHlvdSBjYW5cbiAqICAgdXNlIGAnXHUwMEFCXHUwMEJCXHUyMDFFXHUyMDFDJ2AgZm9yIFJ1c3NpYW4sIGAnXHUyMDFFXHUyMDFDXHUyMDFBXHUyMDE4J2AgZm9yIEdlcm1hbiwgYW5kXG4gKiAgIGBbJ1x1MDBBQlxceEEwJywgJ1xceEEwXHUwMEJCJywgJ1x1MjAzOVxceEEwJywgJ1xceEEwXHUyMDNBJ11gIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAqIC0gX19oaWdobGlnaHRfXyAtIGBudWxsYC4gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24gZm9yIGZlbmNlZCBjb2RlIGJsb2Nrcy5cbiAqICAgSGlnaGxpZ2h0ZXIgYGZ1bmN0aW9uIChzdHIsIGxhbmcpYCBzaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTC4gSXQgY2FuIGFsc29cbiAqICAgcmV0dXJuIGVtcHR5IHN0cmluZyBpZiB0aGUgc291cmNlIHdhcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWRcbiAqICAgZXh0ZXJuYWx5LiBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIGNvbW1vbm1hcmsgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgnY29tbW9ubWFyaycpO1xuICpcbiAqIC8vIGRlZmF1bHQgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIC8vIGVuYWJsZSBldmVyeXRoaW5nXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaHRtbDogdHJ1ZSxcbiAqICAgbGlua2lmeTogdHJ1ZSxcbiAqICAgdHlwb2dyYXBoZXI6IHRydWVcbiAqIH0pO1xuICogYGBgXG4gKlxuICogIyMjIyMgU3ludGF4IGhpZ2hsaWdodGluZ1xuICpcbiAqIGBgYGpzXG4gKiB2YXIgaGxqcyA9IHJlcXVpcmUoJ2hpZ2hsaWdodC5qcycpIC8vIGh0dHBzOi8vaGlnaGxpZ2h0anMub3JnL1xuICpcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoc3RyLCB7IGxhbmd1YWdlOiBsYW5nLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KS52YWx1ZTtcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICcnOyAvLyB1c2UgZXh0ZXJuYWwgZGVmYXVsdCBlc2NhcGluZ1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIE9yIHdpdGggZnVsbCB3cmFwcGVyIG92ZXJyaWRlIChpZiB5b3UgbmVlZCBhc3NpZ24gY2xhc3MgdG8gYDxwcmU+YCBvciBgPGNvZGU+YCk6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGhsanMgPSByZXF1aXJlKCdoaWdobGlnaHQuanMnKSAvLyBodHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiAqXG4gKiAvLyBBY3R1YWwgZGVmYXVsdCB2YWx1ZXNcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gJzxwcmU+PGNvZGUgY2xhc3M9XCJobGpzXCI+JyArXG4gKiAgICAgICAgICAgICAgICBobGpzLmhpZ2hsaWdodChzdHIsIHsgbGFuZ3VhZ2U6IGxhbmcsIGlnbm9yZUlsbGVnYWxzOiB0cnVlIH0pLnZhbHVlICtcbiAqICAgICAgICAgICAgICAgICc8L2NvZGU+PC9wcmU+JztcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICc8cHJlPjxjb2RlIGNsYXNzPVwiaGxqc1wiPicgKyBtZC51dGlscy5lc2NhcGVIdG1sKHN0cikgKyAnPC9jb2RlPjwvcHJlPic7XG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKlxuICoqL1xuZnVuY3Rpb24gTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXJrZG93bkl0KSkge1xuICAgIHJldHVybiBuZXcgTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBpZiAoIWlzU3RyaW5nKHByZXNldE5hbWUpKSB7XG4gICAgICBvcHRpb25zID0gcHJlc2V0TmFtZSB8fCB7fTtcbiAgICAgIHByZXNldE5hbWUgPSAnZGVmYXVsdCc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjaW5saW5lIC0+IFBhcnNlcklubGluZVxuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1BhcnNlcklubGluZV1dLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5pbmxpbmUgPSBuZXcgUGFyc2VySW5saW5lKCk7XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjYmxvY2sgLT4gUGFyc2VyQmxvY2tcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tQYXJzZXJCbG9ja11dLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5ibG9jayA9IG5ldyBQYXJzZXJCbG9jaygpO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2NvcmUgLT4gQ29yZVxuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW0NvcmVdXSBjaGFpbiBleGVjdXRvci4gWW91IG1heSBuZWVkIGl0IHRvIGFkZCBuZXcgcnVsZXMgd2hlblxuICAgKiB3cml0aW5nIHBsdWdpbnMuIEZvciBzaW1wbGUgcnVsZXMgY29udHJvbCB1c2UgW1tNYXJrZG93bkl0LmRpc2FibGVdXSBhbmRcbiAgICogW1tNYXJrZG93bkl0LmVuYWJsZV1dLlxuICAgKiovXG4gIHRoaXMuY29yZSA9IG5ldyBDb3JlKCk7XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjcmVuZGVyZXIgLT4gUmVuZGVyZXJcbiAgICpcbiAgICogSW5zdGFuY2Ugb2YgW1tSZW5kZXJlcl1dLiBVc2UgaXQgdG8gbW9kaWZ5IG91dHB1dCBsb29rLiBPciB0byBhZGQgcmVuZGVyaW5nXG4gICAqIHJ1bGVzIGZvciBuZXcgdG9rZW4gdHlwZXMsIGdlbmVyYXRlZCBieSBwbHVnaW5zLlxuICAgKlxuICAgKiAjIyMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICAgKlxuICAgKiBmdW5jdGlvbiBteVRva2VuKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNlbGYpIHtcbiAgICogICAvLy4uLlxuICAgKiAgIHJldHVybiByZXN1bHQ7XG4gICAqIH07XG4gICAqXG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzWydteV90b2tlbiddID0gbXlUb2tlblxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIFtbUmVuZGVyZXJdXSBkb2NzIGFuZCBbc291cmNlIGNvZGVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcmVuZGVyZXIubWpzKS5cbiAgICoqL1xuICB0aGlzLnJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKCk7XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjbGlua2lmeSAtPiBMaW5raWZ5SXRcbiAgICpcbiAgICogW2xpbmtpZnktaXRdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9saW5raWZ5LWl0KSBpbnN0YW5jZS5cbiAgICogVXNlZCBieSBbbGlua2lmeV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9ydWxlc19jb3JlL2xpbmtpZnkubWpzKVxuICAgKiBydWxlLlxuICAgKiovXG4gIHRoaXMubGlua2lmeSA9IG5ldyBMaW5raWZ5SXQoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCN2YWxpZGF0ZUxpbmsodXJsKSAtPiBCb29sZWFuXG4gICAqXG4gICAqIExpbmsgdmFsaWRhdGlvbiBmdW5jdGlvbi4gQ29tbW9uTWFyayBhbGxvd3MgdG9vIG11Y2ggaW4gbGlua3MuIEJ5IGRlZmF1bHRcbiAgICogd2UgZGlzYWJsZSBgamF2YXNjcmlwdDpgLCBgdmJzY3JpcHQ6YCwgYGZpbGU6YCBzY2hlbWFzLCBhbmQgYWxtb3N0IGFsbCBgZGF0YTouLi5gIHNjaGVtYXNcbiAgICogZXhjZXB0IHNvbWUgZW1iZWRkZWQgaW1hZ2UgdHlwZXMuXG4gICAqXG4gICAqIFlvdSBjYW4gY2hhbmdlIHRoaXMgYmVoYXZpb3VyOlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICogLy8gZW5hYmxlIGV2ZXJ5dGhpbmdcbiAgICogbWQudmFsaWRhdGVMaW5rID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgKiBgYGBcbiAgICoqL1xuICB0aGlzLnZhbGlkYXRlTGluayA9IHZhbGlkYXRlTGluaztcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNub3JtYWxpemVMaW5rKHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZW5jb2RlIGxpbmsgdXJsIHRvIGEgbWFjaGluZS1yZWFkYWJsZSBmb3JtYXQsXG4gICAqIHdoaWNoIGluY2x1ZGVzIHVybC1lbmNvZGluZywgcHVueWNvZGUsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm5vcm1hbGl6ZUxpbmsgPSBub3JtYWxpemVMaW5rO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I25vcm1hbGl6ZUxpbmtUZXh0KHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZGVjb2RlIGxpbmsgdXJsIHRvIGEgaHVtYW4tcmVhZGFibGUgZm9ybWF0YFxuICAgKiovXG4gIHRoaXMubm9ybWFsaXplTGlua1RleHQgPSBub3JtYWxpemVMaW5rVGV4dDtcblxuICAvLyBFeHBvc2UgdXRpbHMgJiBoZWxwZXJzIGZvciBlYXN5IGFjY2VzIGZyb20gcGx1Z2luc1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I3V0aWxzIC0+IHV0aWxzXG4gICAqXG4gICAqIEFzc29ydGVkIHV0aWxpdHkgZnVuY3Rpb25zLCB1c2VmdWwgdG8gd3JpdGUgcGx1Z2lucy4gU2VlIGRldGFpbHNcbiAgICogW2hlcmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvY29tbW9uL3V0aWxzLm1qcykuXG4gICAqKi9cbiAgdGhpcy51dGlscyA9IHV0aWxzO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2hlbHBlcnMgLT4gaGVscGVyc1xuICAgKlxuICAgKiBMaW5rIGNvbXBvbmVudHMgcGFyc2VyIGZ1bmN0aW9ucywgdXNlZnVsIHRvIHdyaXRlIHBsdWdpbnMuIFNlZSBkZXRhaWxzXG4gICAqIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL2hlbHBlcnMpLlxuICAgKiovXG4gIHRoaXMuaGVscGVycyA9IGFzc2lnbih7fSwgaGVscGVycyk7XG4gIHRoaXMub3B0aW9ucyA9IHt9O1xuICB0aGlzLmNvbmZpZ3VyZShwcmVzZXROYW1lKTtcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICB0aGlzLnNldChvcHRpb25zKTtcbiAgfVxufVxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LnNldChvcHRpb25zKVxuICpcbiAqIFNldCBwYXJzZXIgb3B0aW9ucyAoaW4gdGhlIHNhbWUgZm9ybWF0IGFzIGluIGNvbnN0cnVjdG9yKS4gUHJvYmFibHksIHlvdVxuICogd2lsbCBuZXZlciBuZWVkIGl0LCBidXQgeW91IGNhbiBjaGFuZ2Ugb3B0aW9ucyBhZnRlciBjb25zdHJ1Y3RvciBjYWxsLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKClcbiAqICAgICAgICAgICAgIC5zZXQoeyBodG1sOiB0cnVlLCBicmVha3M6IHRydWUgfSlcbiAqICAgICAgICAgICAgIC5zZXQoeyB0eXBvZ3JhcGhlciwgdHJ1ZSB9KTtcbiAqIGBgYFxuICpcbiAqIF9fTm90ZTpfXyBUbyBhY2hpZXZlIHRoZSBiZXN0IHBvc3NpYmxlIHBlcmZvcm1hbmNlLCBkb24ndCBtb2RpZnkgYVxuICogYG1hcmtkb3duLWl0YCBpbnN0YW5jZSBvcHRpb25zIG9uIHRoZSBmbHkuIElmIHlvdSBuZWVkIG11bHRpcGxlIGNvbmZpZ3VyYXRpb25zXG4gKiBpdCdzIGJlc3QgdG8gY3JlYXRlIG11bHRpcGxlIGluc3RhbmNlcyBhbmQgaW5pdGlhbGl6ZSBlYWNoIHdpdGggc2VwYXJhdGVcbiAqIGNvbmZpZy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGFzc2lnbih0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKiBjaGFpbmFibGUsIGludGVybmFsXG4gKiBNYXJrZG93bkl0LmNvbmZpZ3VyZShwcmVzZXRzKVxuICpcbiAqIEJhdGNoIGxvYWQgb2YgYWxsIG9wdGlvbnMgYW5kIGNvbXBlbmVudCBzZXR0aW5ncy4gVGhpcyBpcyBpbnRlcm5hbCBtZXRob2QsXG4gKiBhbmQgeW91IHByb2JhYmx5IHdpbGwgbm90IG5lZWQgaXQuIEJ1dCBpZiB5b3Ugd2lsbCAtIHNlZSBhdmFpbGFibGUgcHJlc2V0c1xuICogYW5kIGRhdGEgc3RydWN0dXJlIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvdHJlZS9tYXN0ZXIvbGliL3ByZXNldHMpXG4gKlxuICogV2Ugc3Ryb25nbHkgcmVjb21tZW5kIHRvIHVzZSBwcmVzZXRzIGluc3RlYWQgb2YgZGlyZWN0IGNvbmZpZyBsb2Fkcy4gVGhhdFxuICogd2lsbCBnaXZlIGJldHRlciBjb21wYXRpYmlsaXR5IHdpdGggbmV4dCB2ZXJzaW9ucy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChwcmVzZXRzKSB7XG4gIGNvbnN0IHNlbGYgPSB0aGlzO1xuICBpZiAoaXNTdHJpbmcocHJlc2V0cykpIHtcbiAgICBjb25zdCBwcmVzZXROYW1lID0gcHJlc2V0cztcbiAgICBwcmVzZXRzID0gY29uZmlnW3ByZXNldE5hbWVdO1xuICAgIGlmICghcHJlc2V0cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBgbWFya2Rvd24taXRgIHByZXNldCBcIicgKyBwcmVzZXROYW1lICsgJ1wiLCBjaGVjayBuYW1lJyk7XG4gICAgfVxuICB9XG4gIGlmICghcHJlc2V0cykge1xuICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgYG1hcmtkb3duLWl0YCBwcmVzZXQsIGNhblxcJ3QgYmUgZW1wdHknKTtcbiAgfVxuICBpZiAocHJlc2V0cy5vcHRpb25zKSB7XG4gICAgc2VsZi5zZXQocHJlc2V0cy5vcHRpb25zKTtcbiAgfVxuICBpZiAocHJlc2V0cy5jb21wb25lbnRzKSB7XG4gICAgT2JqZWN0LmtleXMocHJlc2V0cy5jb21wb25lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICBpZiAocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzKSB7XG4gICAgICAgIHNlbGZbbmFtZV0ucnVsZXIuZW5hYmxlT25seShwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpO1xuICAgICAgfVxuICAgICAgaWYgKHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlczIpIHtcbiAgICAgICAgc2VsZltuYW1lXS5ydWxlcjIuZW5hYmxlT25seShwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKiBjaGFpbmFibGVcbiAqIE1hcmtkb3duSXQuZW5hYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IHJ1bGUgbmFtZSBvciBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZW5hYmxlXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBFbmFibGUgbGlzdCBvciBydWxlcy4gSXQgd2lsbCBhdXRvbWF0aWNhbGx5IGZpbmQgYXBwcm9wcmlhdGUgY29tcG9uZW50cyxcbiAqIGNvbnRhaW5pbmcgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgcnVsZSBub3QgZm91bmQsIGFuZCBgaWdub3JlSW52YWxpZGBcbiAqIG5vdCBzZXQgLSB0aHJvd3MgZXhjZXB0aW9uLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKClcbiAqICAgICAgICAgICAgIC5lbmFibGUoWydzdWInLCAnc3VwJ10pXG4gKiAgICAgICAgICAgICAuZGlzYWJsZSgnc21hcnRxdW90ZXMnKTtcbiAqIGBgYFxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgbGV0IHJlc3VsdCA9IFtdO1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICBsaXN0ID0gW2xpc3RdO1xuICB9XG4gIFsnY29yZScsICdibG9jaycsICdpbmxpbmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFpbikge1xuICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpc1tjaGFpbl0ucnVsZXIuZW5hYmxlKGxpc3QsIHRydWUpKTtcbiAgfSwgdGhpcyk7XG4gIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5pbmxpbmUucnVsZXIyLmVuYWJsZShsaXN0LCB0cnVlKSk7XG4gIGNvbnN0IG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHJlc3VsdC5pbmRleE9mKG5hbWUpIDwgMDtcbiAgfSk7XG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZW5hYmxlIHVua25vd24gcnVsZShzKTogJyArIG1pc3NlZCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LmRpc2FibGUobGlzdCwgaWdub3JlSW52YWxpZClcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogcnVsZSBuYW1lIG9yIGxpc3Qgb2YgcnVsZSBuYW1lcyB0byBkaXNhYmxlLlxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogVGhlIHNhbWUgYXMgW1tNYXJrZG93bkl0LmVuYWJsZV1dLCBidXQgdHVybiBzcGVjaWZpZWQgcnVsZXMgb2ZmLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIGxldCByZXN1bHQgPSBbXTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgbGlzdCA9IFtsaXN0XTtcbiAgfVxuICBbJ2NvcmUnLCAnYmxvY2snLCAnaW5saW5lJ10uZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXNbY2hhaW5dLnJ1bGVyLmRpc2FibGUobGlzdCwgdHJ1ZSkpO1xuICB9LCB0aGlzKTtcbiAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzLmlubGluZS5ydWxlcjIuZGlzYWJsZShsaXN0LCB0cnVlKSk7XG4gIGNvbnN0IG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHJlc3VsdC5pbmRleE9mKG5hbWUpIDwgMDtcbiAgfSk7XG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZGlzYWJsZSB1bmtub3duIHJ1bGUocyk6ICcgKyBtaXNzZWQpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC51c2UocGx1Z2luLCBwYXJhbXMpXG4gKlxuICogTG9hZCBzcGVjaWZpZWQgcGx1Z2luIHdpdGggZ2l2ZW4gcGFyYW1zIGludG8gY3VycmVudCBwYXJzZXIgaW5zdGFuY2UuXG4gKiBJdCdzIGp1c3QgYSBzdWdhciB0byBjYWxsIGBwbHVnaW4obWQsIHBhcmFtcylgIHdpdGggY3VycmluZy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGl0ZXJhdG9yID0gcmVxdWlyZSgnbWFya2Rvd24taXQtZm9yLWlubGluZScpO1xuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAudXNlKGl0ZXJhdG9yLCAnZm9vX3JlcGxhY2UnLCAndGV4dCcsIGZ1bmN0aW9uICh0b2tlbnMsIGlkeCkge1xuICogICAgICAgICAgICAgICB0b2tlbnNbaWR4XS5jb250ZW50ID0gdG9rZW5zW2lkeF0uY29udGVudC5yZXBsYWNlKC9mb28vZywgJ2JhcicpO1xuICogICAgICAgICAgICAgfSk7XG4gKiBgYGBcbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uIChwbHVnaW4gLyosIHBhcmFtcywgLi4uICovKSB7XG4gIGNvbnN0IGFyZ3MgPSBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICBwbHVnaW4uYXBwbHkocGx1Z2luLCBhcmdzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2Uoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBQYXJzZSBpbnB1dCBzdHJpbmcgYW5kIHJldHVybiBsaXN0IG9mIGJsb2NrIHRva2VucyAoc3BlY2lhbCB0b2tlbiB0eXBlXG4gKiBcImlubGluZVwiIHdpbGwgY29udGFpbiBsaXN0IG9mIGlubGluZSB0b2tlbnMpLiBZb3Ugc2hvdWxkIG5vdCBjYWxsIHRoaXNcbiAqIG1ldGhvZCBkaXJlY3RseSwgdW50aWwgeW91IHdyaXRlIGN1c3RvbSByZW5kZXJlciAoZm9yIGV4YW1wbGUsIHRvIHByb2R1Y2VcbiAqIEFTVCkuXG4gKlxuICogYGVudmAgaXMgdXNlZCB0byBwYXNzIGRhdGEgYmV0d2VlbiBcImRpc3RyaWJ1dGVkXCIgcnVsZXMgYW5kIHJldHVybiBhZGRpdGlvbmFsXG4gKiBtZXRhZGF0YSBsaWtlIHJlZmVyZW5jZSBpbmZvLCBuZWVkZWQgZm9yIHRoZSByZW5kZXJlci4gSXQgYWxzbyBjYW4gYmUgdXNlZCB0b1xuICogaW5qZWN0IGRhdGEgaW4gc3BlY2lmaWMgY2FzZXMuIFVzdWFsbHksIHlvdSB3aWxsIGJlIG9rIHRvIHBhc3MgYHt9YCxcbiAqIGFuZCB0aGVuIHBhc3MgdXBkYXRlZCBvYmplY3QgdG8gcmVuZGVyZXIuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBpZiAodHlwZW9mIHNyYyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0lucHV0IGRhdGEgc2hvdWxkIGJlIGEgU3RyaW5nJyk7XG4gIH1cbiAgY29uc3Qgc3RhdGUgPSBuZXcgdGhpcy5jb3JlLlN0YXRlKHNyYywgdGhpcywgZW52KTtcbiAgdGhpcy5jb3JlLnByb2Nlc3Moc3RhdGUpO1xuICByZXR1cm4gc3RhdGUudG9rZW5zO1xufTtcblxuLyoqXG4gKiBNYXJrZG93bkl0LnJlbmRlcihzcmMgWywgZW52XSkgLT4gU3RyaW5nXG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBSZW5kZXIgbWFya2Rvd24gc3RyaW5nIGludG8gaHRtbC4gSXQgZG9lcyBhbGwgbWFnaWMgZm9yIHlvdSA6KS5cbiAqXG4gKiBgZW52YCBjYW4gYmUgdXNlZCB0byBpbmplY3QgYWRkaXRpb25hbCBtZXRhZGF0YSAoYHt9YCBieSBkZWZhdWx0KS5cbiAqIEJ1dCB5b3Ugd2lsbCBub3QgbmVlZCBpdCB3aXRoIGhpZ2ggcHJvYmFiaWxpdHkuIFNlZSBhbHNvIGNvbW1lbnRcbiAqIGluIFtbTWFya2Rvd25JdC5wYXJzZV1dLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGVudiA9IGVudiB8fCB7fTtcbiAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2Uoc3JjLCBlbnYpLCB0aGlzLm9wdGlvbnMsIGVudik7XG59O1xuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2VJbmxpbmUoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW01hcmtkb3duSXQucGFyc2VdXSBidXQgc2tpcCBhbGwgYmxvY2sgcnVsZXMuIEl0IHJldHVybnMgdGhlXG4gKiBibG9jayB0b2tlbnMgbGlzdCB3aXRoIHRoZSBzaW5nbGUgYGlubGluZWAgZWxlbWVudCwgY29udGFpbmluZyBwYXJzZWQgaW5saW5lXG4gKiB0b2tlbnMgaW4gYGNoaWxkcmVuYCBwcm9wZXJ0eS4gQWxzbyB1cGRhdGVzIGBlbnZgIG9iamVjdC5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGNvbnN0IHN0YXRlID0gbmV3IHRoaXMuY29yZS5TdGF0ZShzcmMsIHRoaXMsIGVudik7XG4gIHN0YXRlLmlubGluZU1vZGUgPSB0cnVlO1xuICB0aGlzLmNvcmUucHJvY2VzcyhzdGF0ZSk7XG4gIHJldHVybiBzdGF0ZS50b2tlbnM7XG59O1xuXG4vKipcbiAqIE1hcmtkb3duSXQucmVuZGVySW5saW5lKHNyYyBbLCBlbnZdKSAtPiBTdHJpbmdcbiAqIC0gc3JjIChTdHJpbmcpOiBzb3VyY2Ugc3RyaW5nXG4gKiAtIGVudiAoT2JqZWN0KTogZW52aXJvbm1lbnQgc2FuZGJveFxuICpcbiAqIFNpbWlsYXIgdG8gW1tNYXJrZG93bkl0LnJlbmRlcl1dIGJ1dCBmb3Igc2luZ2xlIHBhcmFncmFwaCBjb250ZW50LiBSZXN1bHRcbiAqIHdpbGwgTk9UIGJlIHdyYXBwZWQgaW50byBgPHA+YCB0YWdzLlxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUucmVuZGVySW5saW5lID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGVudiA9IGVudiB8fCB7fTtcbiAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VJbmxpbmUoc3JjLCBlbnYpLCB0aGlzLm9wdGlvbnMsIGVudik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtkb3duSXQ7XG4iLCAiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVklCRVggc2lkZWJhciB3ZWJ2aWV3LlxuICpcbiAqIERFU0lHTiBSVUxFIFx1MjAxNCB0aGlzIHJlbmRlcmVyIGRyYXdzIE5PVEhJTkcgb2YgaXRzIG93bi4gSXQgcmVwcm9kdWNlcyB0aGUgRE9NXG4gKiBjbGFzcyBzdHJ1Y3R1cmUgb2YgVlMgQ29kZSdzIG5hdGl2ZSBjaGF0IHdpZGdldCAoYC5pbnRlcmFjdGl2ZS1zZXNzaW9uYCxcbiAqIGAuaW50ZXJhY3RpdmUtaXRlbS1jb250YWluZXJgLCBgLmNoYXQtaW5wdXQtY29udGFpbmVyYCwgXHUyMDI2KSBleGFjdGx5IGFzIHRoZVxuICogd29ya2JlbmNoIHJlbmRlcmVyIGJ1aWxkcyBpdCwgc28gdGhhdCB0aGUgdmVyYmF0aW0tZXh0cmFjdGVkIHN0eWxlc2hlZXQgaW5cbiAqIG1lZGlhL25hdGl2ZS1jaGF0LmNzcyBzdHlsZXMgaXQgaWRlbnRpY2FsbHkgdG8gdGhlIHJlYWwgdGhpbmcuIElmIGEgcGllY2Ugb2ZcbiAqIFVJIGxvb2tzIGRpZmZlcmVudCBmcm9tIG5hdGl2ZSBWUyBDb2RlIGNoYXQsIHRoZSBmaXggaXMgdG8gY29ycmVjdCB0aGUgRE9NXG4gKiBzdHJ1Y3R1cmUgb3IgcmUtZXh0cmFjdCB0aGUgQ1NTIFx1MjAxNCBuZXZlciB0byBoYW5kLXR1bmUgc3R5bGVzLlxuICovXG5cbmNvbnN0IE1hcmtkb3duSXQgPSByZXF1aXJlKFwibWFya2Rvd24taXRcIik7XG5cbmNvbnN0IHZzY29kZSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcbmNvbnN0IG1kID0gbmV3IE1hcmtkb3duSXQoeyBodG1sOiBmYWxzZSwgbGlua2lmeTogdHJ1ZSwgYnJlYWtzOiBmYWxzZSB9KTtcblxuY29uc3Qgc3RhdGUgPSB7XG4gIGFnZW50czogW10sXG4gIHByb2plY3RzOiBbXSxcbiAgY29udmVyc2F0aW9uczogW10sXG4gIHNlbGVjdGVkQ29udmVyc2F0aW9uSWQ6IG51bGwsXG4gIHNlbGVjdGVkUHJvamVjdElkOiBudWxsLFxuICB0YXNrczogW10sXG4gIGhlYWx0aDogbnVsbCxcbiAgb3B0aW9uczogeyBtb2RlbElkOiBudWxsLCBlZmZvcnQ6IFwiXCIsIGFwcHJvdmFsTW9kZTogXCJkZWZhdWx0XCIgfSxcbiAgYnVzeTogZmFsc2UsXG4gIGNvbm5lY3Rpb25FcnJvcjogbnVsbCxcbn07XG5cbmNvbnN0IEFDVElWRV9TVEFUVVNFUyA9IG5ldyBTZXQoW1xuICBcInF1ZXVlZFwiLCBcImludGVycHJldGluZ1wiLCBcImF3YWl0aW5nX2NvbmZpcm1hdGlvblwiLFxuICBcInJlc29sdmluZ19zZXNzaW9uXCIsIFwicnVubmluZ19hZ2VudFwiLCBcInRlc3RpbmdcIixcbl0pO1xuXG5jb25zdCBTVEFUVVNfTUVTU0FHRVMgPSB7XG4gIHF1ZXVlZDogXCJcdUIzMDBcdUFFMzAgXHVDOTExXHVDNzg1XHVCMkM4XHVCMkU0LlwiLFxuICBpbnRlcnByZXRpbmc6IFwiXHVDNjk0XHVDQ0FEXHVDNzQ0IFx1RDU3NFx1QzExRFx1RDU1OFx1QUNFMCBcdUM3ODhcdUMyQjVcdUIyQzhcdUIyRTQuXCIsXG4gIGF3YWl0aW5nX2NvbmZpcm1hdGlvbjogXCJcdUQ2NTVcdUM3NzhcdUM3NDQgXHVBRTMwXHVCMkU0XHVCOUFDXHVBQ0UwIFx1Qzc4OFx1QzJCNVx1QjJDOFx1QjJFNC5cIixcbiAgcmVzb2x2aW5nX3Nlc3Npb246IFwiXHVENTA0XHVCODVDXHVDODFEXHVEMkI4IFx1QzEzOFx1QzE1OFx1Qzc0NCBcdUNDM0VcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxuICBydW5uaW5nX2FnZW50OiBcIlx1QzY5NFx1Q0NBRFx1Qzc0NCBcdUNDOThcdUI5QUNcdUQ1NThcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxuICB0ZXN0aW5nOiBcIlx1RDE0Q1x1QzJBNFx1RDJCOFx1Qjk3QyBcdUMyRTRcdUQ1ODlcdUQ1NThcdUFDRTAgXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiLFxufTtcblxuY29uc3QgQUdFTlRfTkFNRVMgPSB7IFwiY2xhdWRlLWNvZGVcIjogXCJDbGF1ZGUgQ29kZVwiLCBcImNvZGV4LWNsaVwiOiBcIkNvZGV4XCIsIFwiZ2VtaW5pLWNsaVwiOiBcIkdlbWluaVwiIH07XG5cbi8vICNyZWdpb24gRE9NIGhlbHBlcnNcblxuZnVuY3Rpb24gZWwodGFnLCBjbGFzc05hbWUsIHRleHQpIHtcbiAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgaWYgKGNsYXNzTmFtZSkgbm9kZS5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIG5vZGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gbm9kZTtcbn1cblxuZnVuY3Rpb24gY29kaWNvbihuYW1lKSB7XG4gIHJldHVybiBlbChcInNwYW5cIiwgYGNvZGljb24gY29kaWNvbi0ke25hbWV9YCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlck1hcmtkb3duKHRleHQpIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwiZGl2XCIsIFwicmVuZGVyZWQtbWFya2Rvd25cIik7XG4gIGhvc3QuaW5uZXJIVE1MID0gbWQucmVuZGVyKFN0cmluZyh0ZXh0IHx8IFwiXCIpKTtcbiAgZm9yIChjb25zdCBhbmNob3Igb2YgaG9zdC5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXVwiKSkge1xuICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcG9zdCh7IHR5cGU6IFwib3BlbkxpbmtcIiwgaHJlZjogYW5jaG9yLmdldEF0dHJpYnV0ZShcImhyZWZcIikgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGhvc3Q7XG59XG5cbmZ1bmN0aW9uIHBvc3QobWVzc2FnZSkge1xuICB2c2NvZGUucG9zdE1lc3NhZ2UobWVzc2FnZSk7XG59XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBMYXlvdXQgc2tlbGV0b24gKGJ1aWx0IG9uY2UpXG5cbi8vIFRoZSBleHRyYWN0ZWQgc3R5bGVzaGVldCBzY29wZXMgbW9zdCBydWxlcyB1bmRlciB0aGUgd29ya2JlbmNoIHJvb3Rcbi8vIChgLm1vbmFjby13b3JrYmVuY2ggLmludGVyYWN0aXZlLXNlc3Npb24gXHUyMDI2YCkgYW5kIHRoZW1lIGNsYXNzZXMgKGAudnMtZGFya2ApLlxuLy8gVGhlIHdlYnZpZXcgYm9keSBzdGFuZHMgaW4gZm9yIHRoZSB3b3JrYmVuY2ggcm9vdCwgc28gaXQgbXVzdCBjYXJyeSB0aGVcbi8vIHNhbWUgY2xhc3NlczsgdGhlIHRoZW1lIGNsYXNzIGZvbGxvd3MgVlMgQ29kZSdzIG93biBib2R5IGNsYXNzLlxuZnVuY3Rpb24gc3luY1dvcmtiZW5jaENsYXNzZXMoKSB7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICBjb25zdCB0aGVtZU1hcCA9IFtcbiAgICBbXCJ2c2NvZGUtaGlnaC1jb250cmFzdC1saWdodFwiLCBcImhjLWxpZ2h0XCJdLFxuICAgIFtcInZzY29kZS1oaWdoLWNvbnRyYXN0XCIsIFwiaGMtYmxhY2tcIl0sXG4gICAgW1widnNjb2RlLWxpZ2h0XCIsIFwidnNcIl0sXG4gICAgW1widnNjb2RlLWRhcmtcIiwgXCJ2cy1kYXJrXCJdLFxuICBdO1xuICBsZXQgZGVzaXJlZCA9IFwidnMtZGFya1wiO1xuICBmb3IgKGNvbnN0IFt3ZWJ2aWV3Q2xhc3MsIHdvcmtiZW5jaENsYXNzXSBvZiB0aGVtZU1hcCkge1xuICAgIGlmIChib2R5LmNsYXNzTGlzdC5jb250YWlucyh3ZWJ2aWV3Q2xhc3MpKSB7XG4gICAgICBkZXNpcmVkID0gd29ya2JlbmNoQ2xhc3M7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgLy8gT25seSB0b3VjaCB0aGUgYXR0cmlidXRlIHdoZW4gc29tZXRoaW5nIGFjdHVhbGx5IGNoYW5nZXMgXHUyMDE0IHRoZSBvYnNlcnZlclxuICAvLyBiZWxvdyB3YXRjaGVzIGNsYXNzIG11dGF0aW9ucyBhbmQgbXVzdCBub3QgYmUgcmUtdHJpZ2dlcmVkIGJ5IHRoaXMgc3luYy5cbiAgaWYgKGJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKFwibW9uYWNvLXdvcmtiZW5jaFwiKSAmJiBib2R5LmNsYXNzTGlzdC5jb250YWlucyhkZXNpcmVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBib2R5LmNsYXNzTGlzdC5hZGQoXCJtb25hY28td29ya2JlbmNoXCIpO1xuICBmb3IgKGNvbnN0IFssIHdvcmtiZW5jaENsYXNzXSBvZiB0aGVtZU1hcCkge1xuICAgIGlmICh3b3JrYmVuY2hDbGFzcyAhPT0gZGVzaXJlZCkgYm9keS5jbGFzc0xpc3QucmVtb3ZlKHdvcmtiZW5jaENsYXNzKTtcbiAgfVxuICBib2R5LmNsYXNzTGlzdC5hZGQoZGVzaXJlZCk7XG59XG5zeW5jV29ya2JlbmNoQ2xhc3NlcygpO1xubmV3IE11dGF0aW9uT2JzZXJ2ZXIoc3luY1dvcmtiZW5jaENsYXNzZXMpLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICBhdHRyaWJ1dGVzOiB0cnVlLFxuICBhdHRyaWJ1dGVGaWx0ZXI6IFtcImNsYXNzXCJdLFxufSk7XG5cbi8vIE5vIGN1c3RvbSBjaHJvbWU6IHRoZSBwYW5lbCdzIHRpdGxlIGJhciwgaXRzIGFjdGlvbnMgKG5ldyBjb252ZXJzYXRpb24sXG4vLyBoaXN0b3J5KSBhbmQgdGhlIHRhYiBpdHNlbGYgYXJlIHJlbmRlcmVkIG5hdGl2ZWx5IGJ5IFZTIENvZGUgdmlhIHRoZVxuLy8gdmlldy90aXRsZSBtZW51IGNvbnRyaWJ1dGlvbnMgaW4gcGFja2FnZS5qc29uLlxuY29uc3Qgcm9vdCA9IGVsKFwiZGl2XCIsIFwiaW50ZXJhY3RpdmUtc2Vzc2lvblwiKTtcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdCk7XG5cbmNvbnN0IGxpc3QgPSBlbChcImRpdlwiLCBcInZpYmV4LWxpc3RcIik7XG5yb290LmFwcGVuZChsaXN0KTtcblxuLy8gQ29tcG9zZXIgXHUyMDE0IG1pcnJvcnMgdGhlIERPTSB0aGUgd29ya2JlbmNoIGJ1aWxkcyBhdCBydW50aW1lLCBjYXB0dXJlZCBmcm9tIGFcbi8vIGxpdmUgbmF0aXZlIGNoYXQgc2Vzc2lvbiBvdmVyIHRoZSBDaHJvbWUgRGV2VG9vbHMgUHJvdG9jb2xcbi8vIChzY3JhdGNocGFkL2RvbWR1bXAuanMpLiBEbyBub3QgcmVzdHJ1Y3R1cmUgYnkgaW50dWl0aW9uOiByZS1kdW1wIGFuZCBtYXRjaC5cbmZ1bmN0aW9uIHRvb2xiYXIoZXh0cmFDbGFzc2VzKSB7XG4gIGNvbnN0IGhvc3QgPSBlbChcImRpdlwiLCBgbW9uYWNvLXRvb2xiYXIgJHtleHRyYUNsYXNzZXN9YCk7XG4gIGNvbnN0IGJhciA9IGVsKFwiZGl2XCIsIFwibW9uYWNvLWFjdGlvbi1iYXJcIik7XG4gIGNvbnN0IGl0ZW1zID0gZWwoXCJ1bFwiLCBcImFjdGlvbnMtY29udGFpbmVyXCIpO1xuICBiYXIuYXBwZW5kKGl0ZW1zKTtcbiAgaG9zdC5hcHBlbmQoYmFyKTtcbiAgcmV0dXJuIHsgaG9zdCwgaXRlbXMgfTtcbn1cblxuY29uc3QgaW5wdXRQYXJ0ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1wYXJ0XCIpO1xuY29uc3QgaW5wdXRBbmRUb29sYmFyID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pbnB1dC1hbmQtc2lkZS10b29sYmFyXCIpO1xuY29uc3QgaW5wdXRDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtaW5wdXQtY29udGFpbmVyXCIpO1xuY29uc3QgYXR0YWNobWVudHNDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtYXR0YWNobWVudHMtY29udGFpbmVyXCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiOyAvLyBuYXRpdmUgaGlkZXMgaXQgd2hpbGUgZW1wdHlcbmNvbnN0IGF0dGFjaGVkQ29udGV4dCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1hdHRhY2hlZC1jb250ZXh0XCIpO1xuYXR0YWNobWVudHNDb250YWluZXIuYXBwZW5kKGF0dGFjaGVkQ29udGV4dCk7XG5jb25zdCBlZGl0b3JDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtZWRpdG9yLWNvbnRhaW5lclwiKTtcbmNvbnN0IGVkaXRvckhvc3QgPSBlbChcImRpdlwiLCBcImludGVyYWN0aXZlLWlucHV0LWVkaXRvclwiKTtcbmNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xudGV4dGFyZWEuY2xhc3NOYW1lID0gXCJ2aWJleC1pbnB1dFwiO1xudGV4dGFyZWEucm93cyA9IDE7XG5lZGl0b3JIb3N0LmFwcGVuZCh0ZXh0YXJlYSk7XG5lZGl0b3JDb250YWluZXIuYXBwZW5kKGVkaXRvckhvc3QpO1xuXG5jb25zdCB0b29sYmFycyA9IGVsKFwiZGl2XCIsIFwiY2hhdC1pbnB1dC10b29sYmFyc1wiKTtcbmNvbnN0IGlucHV0VG9vbGJhciA9IHRvb2xiYXIoXCJyZXNwb25zaXZlIHJlc3BvbnNpdmUtbGFzdCBjaGF0LWlucHV0LXRvb2xiYXJcIik7XG5jb25zdCBleGVjdXRlVG9vbGJhciA9IHRvb2xiYXIoXCJjaGF0LWV4ZWN1dGUtdG9vbGJhclwiKTtcbmNvbnN0IGV4ZWN1dGVJdGVtcyA9IGV4ZWN1dGVUb29sYmFyLml0ZW1zO1xudG9vbGJhcnMuYXBwZW5kKGlucHV0VG9vbGJhci5ob3N0LCBleGVjdXRlVG9vbGJhci5ob3N0KTtcbmlucHV0Q29udGFpbmVyLmFwcGVuZChhdHRhY2htZW50c0NvbnRhaW5lciwgZWRpdG9yQ29udGFpbmVyLCB0b29sYmFycyk7XG5pbnB1dEFuZFRvb2xiYXIuYXBwZW5kKGlucHV0Q29udGFpbmVyKTtcbmlucHV0UGFydC5hcHBlbmQoaW5wdXRBbmRUb29sYmFyKTtcblxuLy8gQmVsb3cgdGhlIGJveCwgaW4gbmF0aXZlIG9yZGVyOiBjb250ZXh0LXVzYWdlIChlbXB0eSksIHN0YXR1cyAoaGlkZGVuIHdoaWxlXG4vLyBlbXB0eSksIHRoZW4gdGhlIHNlY29uZGFyeSBpbnB1dCB0b29sYmFyIGNhcnJ5aW5nIHRoZSBzZXNzaW9uL29wdGlvbiBwaWxscy5cbmNvbnN0IHNlY29uZGFyeVRvb2xiYXIgPSBlbChcImRpdlwiLCBcImNoYXQtc2Vjb25kYXJ5LXRvb2xiYXJcIik7XG5jb25zdCBjb250ZXh0VXNhZ2UgPSBlbChcImRpdlwiLCBcImNoYXQtY29udGV4dC11c2FnZS1jb250YWluZXJcIik7XG5jb25zdCBzdGF0dXNDb250YWluZXIgPSBlbChcImRpdlwiLCBcImNoYXQtaW5wdXQtc3RhdHVzLWNvbnRhaW5lciBoYXMtbm8tYWN0aW9uc1wiKTtcbnN0YXR1c0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5jb25zdCBzZWNvbmRhcnlJbnB1dFRvb2xiYXIgPSB0b29sYmFyKFwicmVzcG9uc2l2ZSByZXNwb25zaXZlLWFsbCBjaGF0LXNlY29uZGFyeS1pbnB1dC10b29sYmFyXCIpO1xuc2Vjb25kYXJ5VG9vbGJhci5hcHBlbmQoY29udGV4dFVzYWdlLCBzdGF0dXNDb250YWluZXIsIHNlY29uZGFyeUlucHV0VG9vbGJhci5ob3N0KTtcbmlucHV0UGFydC5hcHBlbmQoc2Vjb25kYXJ5VG9vbGJhcik7XG5yb290LmFwcGVuZChpbnB1dFBhcnQpO1xuXG50ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgKCkgPT4gaW5wdXRDb250YWluZXIuY2xhc3NMaXN0LmFkZChcImZvY3VzZWRcIikpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4gaW5wdXRDb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZShcImZvY3VzZWRcIikpO1xudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIGF1dG9Hcm93KTtcbnRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5ICYmICFldmVudC5pc0NvbXBvc2luZykge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgc3VibWl0KCk7XG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBhdXRvR3JvdygpIHtcbiAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCI7XG4gIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke01hdGgubWluKHRleHRhcmVhLnNjcm9sbEhlaWdodCwgMjQwKX1weGA7XG59XG5cbi8vICNlbmRyZWdpb25cblxuLy8gI3JlZ2lvbiBQaWNrZXJzIChtb2RlbCAvIGVmZm9ydCAvIGFwcHJvdmFsIC8gaGlzdG9yeSlcblxubGV0IG9wZW5NZW51ID0gbnVsbDtcblxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuICBpZiAob3Blbk1lbnUpIHtcbiAgICBvcGVuTWVudS5yZW1vdmUoKTtcbiAgICBvcGVuTWVudSA9IG51bGw7XG4gIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICBpZiAob3Blbk1lbnUgJiYgIW9wZW5NZW51LmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIGNsb3NlTWVudSgpO1xufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGF0dGFjaE1lbnUoaG9zdCwgaXRlbXMsIG9uUGljaykge1xuICByZXR1cm4gKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAob3Blbk1lbnUgJiYgb3Blbk1lbnUuZGF0YXNldC5vd25lciA9PT0gaG9zdC5kYXRhc2V0LnBpY2tlcklkKSB7XG4gICAgICBjbG9zZU1lbnUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2xvc2VNZW51KCk7XG4gICAgY29uc3QgbWVudSA9IGVsKFwiZGl2XCIsIFwidmliZXgtbWVudVwiKTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMoKSkge1xuICAgICAgaWYgKGl0ZW0uZ3JvdXApIHtcbiAgICAgICAgbWVudS5hcHBlbmQoZWwoXCJkaXZcIiwgXCJ2aWJleC1tZW51LWdyb3VwXCIsIGl0ZW0uZ3JvdXApKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByb3cgPSBlbChcImRpdlwiLCBgdmliZXgtbWVudS1pdGVtJHtpdGVtLmNoZWNrZWQgPyBcIiBjaGVja2VkXCIgOiBcIlwifWApO1xuICAgICAgcm93LmFwcGVuZChpdGVtLmNoZWNrZWQgPyBjb2RpY29uKFwiY2hlY2tcIikgOiBlbChcInNwYW5cIiwgXCJjb2RpY29uXCIpKTtcbiAgICAgIHJvdy5hcHBlbmQoZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgaXRlbS5sYWJlbCkpO1xuICAgICAgcm93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIGNsb3NlTWVudSgpO1xuICAgICAgICBvblBpY2soaXRlbS5pZCk7XG4gICAgICB9KTtcbiAgICAgIG1lbnUuYXBwZW5kKHJvdyk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGNvbXBvc2VyJ3MgYW5jZXN0b3JzIGFsbCBjbGlwIG92ZXJmbG93ICh0aGUgd29ya2JlbmNoIHJlbmRlcnMgaXRzXG4gICAgLy8gZHJvcGRvd25zIGluIGFuIG92ZXJsYXkgY29udGFpbmVyIGZvciB0aGUgc2FtZSByZWFzb24pLCBzbyB0aGUgbWVudSBpc1xuICAgIC8vIGFwcGVuZGVkIHRvIDxib2R5PiBhbmQgcG9zaXRpb25lZCBhZ2FpbnN0IHRoZSBhbmNob3IgaW4gdmlld3BvcnQgc3BhY2UuXG4gICAgaG9zdC5kYXRhc2V0LnBpY2tlcklkIHx8PSBgcGlja2VyLSR7KytwaWNrZXJJZFNlcX1gO1xuICAgIG1lbnUuZGF0YXNldC5vd25lciA9IGhvc3QuZGF0YXNldC5waWNrZXJJZDtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZChtZW51KTtcbiAgICBjb25zdCBhbmNob3IgPSBob3N0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGhlaWdodCA9IG1lbnUub2Zmc2V0SGVpZ2h0O1xuICAgIGNvbnN0IHRvcCA9IGFuY2hvci50b3AgLSBoZWlnaHQgLSA0O1xuICAgIG1lbnUuc3R5bGUubGVmdCA9IGAke01hdGgubWF4KDQsIE1hdGgubWluKGFuY2hvci5sZWZ0LCB3aW5kb3cuaW5uZXJXaWR0aCAtIG1lbnUub2Zmc2V0V2lkdGggLSA0KSl9cHhgO1xuICAgIC8vIEZsaXAgYmVsb3cgdGhlIGFuY2hvciB3aGVuIHRoZXJlIGlzIG5vdCBlbm91Z2ggcm9vbSBhYm92ZS5cbiAgICBtZW51LnN0eWxlLnRvcCA9IGAke3RvcCA+PSA0ID8gdG9wIDogYW5jaG9yLmJvdHRvbSArIDR9cHhgO1xuICAgIG9wZW5NZW51ID0gbWVudTtcbiAgfTtcbn1cbmxldCBwaWNrZXJJZFNlcSA9IDA7XG5cbi8qKlxuICogVGhlIG1vZGVsIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtaW5wdXQtcGlja2VyLWl0ZW0gPiBkaXYuYWN0aW9uLWxhYmVsLm1vZGVsLXBpY2tlci1zcGxpdCA+XG4gKiAgIGEubW9kZWwtcGlja2VyLXNlY3Rpb24ubW9kZWwtcGlja2VyLW5hbWUgPiBbY29kaWNvbiwgLmNoYXQtaW5wdXQtcGlja2VyLWxhYmVsXVxuICovXG5mdW5jdGlvbiBtb2RlbFBpY2tlclBpbGwoeyBpdGVtcywgb25QaWNrIH0pIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwibGlcIiwgXCJhY3Rpb24taXRlbSBjaGF0LWlucHV0LXBpY2tlci1pdGVtIHZpYmV4LXBpY2tlci1ob3N0XCIpO1xuICBjb25zdCBzcGxpdCA9IGVsKFwiZGl2XCIsIFwiYWN0aW9uLWxhYmVsIG1vZGVsLXBpY2tlci1zcGxpdFwiKTtcbiAgY29uc3Qgc2VjdGlvbiA9IGVsKFwiYVwiLCBcIm1vZGVsLXBpY2tlci1zZWN0aW9uIG1vZGVsLXBpY2tlci1uYW1lXCIpO1xuICBzZWN0aW9uLmFwcGVuZChjb2RpY29uKFwiY2hhdC1tb2RlbC1wcm92aWRlci1nZW5lcmljXCIpKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1pbnB1dC1waWNrZXItbGFiZWxcIiwgXCJcdUFFMzBcdUJDRjggXHVCQUE4XHVCMzc4XCIpO1xuICBzZWN0aW9uLmFwcGVuZChsYWJlbFNwYW4pO1xuICBzcGxpdC5hcHBlbmQoc2VjdGlvbik7XG4gIGhvc3QuYXBwZW5kKHNwbGl0KTtcbiAgc2VjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShob3N0LCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3QsIGxhYmVsU3BhbiB9O1xufVxuXG4vKipcbiAqIEEgc2Vjb25kYXJ5LXRvb2xiYXIgb3B0aW9uIHBpY2tlciwgZXhhY3RseSBhcyB0aGUgd29ya2JlbmNoIGJ1aWxkcyBpdDpcbiAqIGxpLmFjdGlvbi1pdGVtLmNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXIgPiBkaXYuYWN0aW9uLWl0ZW0uY2hhdC1zZXNzaW9uUGlja2VyLWl0ZW0gPlxuICogICBkaXYubW9uYWNvLWRyb3Bkb3duID4gZGl2LmRyb3Bkb3duLWxhYmVsID4gYS5hY3Rpb24tbGFiZWwuY2hhdC1zZXNzaW9uLW9wdGlvbi1waWNrZXIgPlxuICogICAgIHNwYW4uY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFxuICovXG5mdW5jdGlvbiBvcHRpb25QaWNrZXJQaWxsKHsgbGFiZWwsIGl0ZW1zLCBvblBpY2sgfSkge1xuICBjb25zdCBpdGVtID0gZWwoXCJkaXZcIiwgXCJhY3Rpb24taXRlbSBjaGF0LXNlc3Npb25QaWNrZXItaXRlbSB2aWJleC1waWNrZXItaG9zdFwiKTtcbiAgY29uc3QgZHJvcGRvd24gPSBlbChcImRpdlwiLCBcIm1vbmFjby1kcm9wZG93blwiKTtcbiAgY29uc3QgZHJvcGRvd25MYWJlbCA9IGVsKFwiZGl2XCIsIFwiZHJvcGRvd24tbGFiZWxcIik7XG4gIGNvbnN0IGFuY2hvciA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjaGF0LXNlc3Npb24tb3B0aW9uLXBpY2tlclwiKTtcbiAgY29uc3QgbGFiZWxTcGFuID0gZWwoXCJzcGFuXCIsIFwiY2hhdC1zZXNzaW9uLW9wdGlvbi1sYWJlbFwiLCBsYWJlbCk7XG4gIGFuY2hvci5hcHBlbmQobGFiZWxTcGFuKTtcbiAgZHJvcGRvd25MYWJlbC5hcHBlbmQoYW5jaG9yKTtcbiAgZHJvcGRvd24uYXBwZW5kKGRyb3Bkb3duTGFiZWwpO1xuICBpdGVtLmFwcGVuZChkcm9wZG93bik7XG4gIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXR0YWNoTWVudShpdGVtLCBpdGVtcywgb25QaWNrKSk7XG4gIHJldHVybiB7IGhvc3Q6IGl0ZW0sIGxhYmVsU3BhbiB9O1xufVxuXG5jb25zdCBtb2RlbFBpY2tlciA9IG1vZGVsUGlja2VyUGlsbCh7XG4gIGl0ZW1zOiBtb2RlbEl0ZW1zLFxuICBvblBpY2s6IChpZCkgPT4ge1xuICAgIHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9IGlkO1xuICAgIHBvc3QoeyB0eXBlOiBcInNldE9wdGlvblwiLCBpZDogXCJtb2RlbFwiLCB2YWx1ZTogaWQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGVmZm9ydFBpY2tlciA9IG9wdGlvblBpY2tlclBpbGwoe1xuICBsYWJlbDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCIsXG4gIGl0ZW1zOiBlZmZvcnRJdGVtcyxcbiAgb25QaWNrOiAoaWQpID0+IHtcbiAgICBzdGF0ZS5vcHRpb25zLmVmZm9ydCA9IGlkID09PSBcIl9fZGVmYXVsdF9fXCIgPyBcIlwiIDogaWQ7XG4gICAgcG9zdCh7IHR5cGU6IFwic2V0T3B0aW9uXCIsIGlkOiBcImVmZm9ydFwiLCB2YWx1ZTogc3RhdGUub3B0aW9ucy5lZmZvcnQgfSk7XG4gICAgcmVuZGVyUGlja2VycygpO1xuICB9LFxufSk7XG5cbmNvbnN0IGFwcHJvdmFsUGlja2VyID0gb3B0aW9uUGlja2VyUGlsbCh7XG4gIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIixcbiAgaXRlbXM6IGFwcHJvdmFsSXRlbXMsXG4gIG9uUGljazogKGlkKSA9PiB7XG4gICAgc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUgPSBpZDtcbiAgICBwb3N0KHsgdHlwZTogXCJzZXRPcHRpb25cIiwgaWQ6IFwiYXBwcm92YWxNb2RlXCIsIHZhbHVlOiBpZCB9KTtcbiAgICByZW5kZXJQaWNrZXJzKCk7XG4gIH0sXG59KTtcblxuLy8gXCIrIFwiIGF0dGFjaCBhY3Rpb24gXHUyMDE0IGxpLmFjdGlvbi1pdGVtLm1lbnUtZW50cnkgPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYWRkLWNvbXBhY3RcbmNvbnN0IGF0dGFjaEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeVwiKTtcbmNvbnN0IGF0dGFjaEJ1dHRvbiA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjb2RpY29uIGNvZGljb24tYWRkLWNvbXBhY3RcIik7XG5hdHRhY2hCdXR0b24udGl0bGUgPSBcIlx1RDUwNFx1Qjg1Q1x1QzgxRFx1RDJCOCBcdUQzMENcdUM3N0MgXHVDQ0E4XHVCRDgwXCI7XG5hdHRhY2hJdGVtLmFwcGVuZChhdHRhY2hCdXR0b24pO1xuYXR0YWNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiBwb3N0KHsgdHlwZTogXCJwaWNrQXR0YWNobWVudFwiIH0pKTtcbmlucHV0VG9vbGJhci5pdGVtcy5hcHBlbmQoYXR0YWNoSXRlbSwgbW9kZWxQaWNrZXIuaG9zdCk7XG5cbi8vIFNlY29uZGFyeSByb3c6IHNlc3Npb24gdGFyZ2V0IHBpbGwgKGV4dGVuc2lvbnMgaWNvbiArIFZJQkVYKSwgdGhlbiB0aGUgdHdvXG4vLyBvcHRpb24gcGlja2VycyBpbnNpZGUgb25lIGNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXIsIGFzIGluIHRoZSBvcmlnaW5hbC5cbmNvbnN0IHNlc3Npb25QaWxsID0gZWwoXCJsaVwiLCBcImFjdGlvbi1pdGVtIGNoYXQtaW5wdXQtcGlja2VyLWl0ZW0gY2hhdC1zZXNzaW9uLXRhcmdldC1waWNrZXItaXRlbVwiKTtcbmNvbnN0IHNlc3Npb25Ecm9wZG93biA9IGVsKFwiZGl2XCIsIFwibW9uYWNvLWRyb3Bkb3duXCIpO1xuY29uc3Qgc2Vzc2lvbkRyb3Bkb3duTGFiZWwgPSBlbChcImRpdlwiLCBcImRyb3Bkb3duLWxhYmVsXCIpO1xuY29uc3Qgc2Vzc2lvbkFuY2hvciA9IGVsKFwiYVwiLCBcImFjdGlvbi1sYWJlbCBjb21wYWN0XCIpO1xuc2Vzc2lvbkFuY2hvci5hcHBlbmQoY29kaWNvbihcImV4dGVuc2lvbnNcIiksIGVsKFwic3BhblwiLCBcImNoYXQtaW5wdXQtcGlja2VyLWxhYmVsXCIsIFwiVklCRVhcIikpO1xuc2Vzc2lvbkRyb3Bkb3duTGFiZWwuYXBwZW5kKHNlc3Npb25BbmNob3IpO1xuc2Vzc2lvbkRyb3Bkb3duLmFwcGVuZChzZXNzaW9uRHJvcGRvd25MYWJlbCk7XG5zZXNzaW9uUGlsbC5hcHBlbmQoc2Vzc2lvbkRyb3Bkb3duKTtcblxuY29uc3Qgb3B0aW9uQ29udGFpbmVyID0gZWwoXCJsaVwiLCBcImFjdGlvbi1pdGVtIGNoYXQtc2Vzc2lvblBpY2tlci1jb250YWluZXJcIik7XG5vcHRpb25Db250YWluZXIuYXBwZW5kKGVmZm9ydFBpY2tlci5ob3N0LCBhcHByb3ZhbFBpY2tlci5ob3N0KTtcbnNlY29uZGFyeUlucHV0VG9vbGJhci5pdGVtcy5hcHBlbmQoc2Vzc2lvblBpbGwsIG9wdGlvbkNvbnRhaW5lcik7XG5cbi8vIFN1Ym1pdCBcdTIwMTQgbGkuYWN0aW9uLWl0ZW0ubWVudS1lbnRyeS5jaGF0LXN1Ym1pdC1idXR0b24gPiBhLmFjdGlvbi1sYWJlbC5jb2RpY29uLmNvZGljb24tYXJyb3ctdXAtY29tcGFjdFxuY29uc3Qgc2VuZEl0ZW0gPSBlbChcImxpXCIsIFwiYWN0aW9uLWl0ZW0gbWVudS1lbnRyeSBjaGF0LXN1Ym1pdC1idXR0b25cIik7XG5jb25zdCBzZW5kQnV0dG9uID0gZWwoXCJhXCIsIFwiYWN0aW9uLWxhYmVsIGNvZGljb24gY29kaWNvbi1hcnJvdy11cC1jb21wYWN0XCIpO1xuc2VuZEJ1dHRvbi50aXRsZSA9IFwiXHVCQ0Y0XHVCMEI0XHVBRTMwIChFbnRlcilcIjtcbnNlbmRJdGVtLmFwcGVuZChzZW5kQnV0dG9uKTtcbmV4ZWN1dGVJdGVtcy5hcHBlbmQoc2VuZEl0ZW0pO1xuc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3VibWl0KTtcblxuLy8gTmF0aXZlIHN1Ym1pdCBidXR0b24gZ3JleXMgb3V0IHdoaWxlIHRoZXJlIGlzIG5vdGhpbmcgdG8gc2VuZCBcdTIwMTQgdGhlXG4vLyB3b3JrYmVuY2ggcHV0cyAuZGlzYWJsZWQgb24gYm90aCB0aGUgaXRlbSBhbmQgdGhlIGxhYmVsLlxuZnVuY3Rpb24gc3luY1NlbmRFbmFibGVkKCkge1xuICBjb25zdCBkaXNhYmxlZCA9ICF0ZXh0YXJlYS52YWx1ZS50cmltKCkgfHwgc3RhdGUuYnVzeTtcbiAgc2VuZEl0ZW0uY2xhc3NMaXN0LnRvZ2dsZShcImRpc2FibGVkXCIsIGRpc2FibGVkKTtcbiAgc2VuZEJ1dHRvbi5jbGFzc0xpc3QudG9nZ2xlKFwiZGlzYWJsZWRcIiwgZGlzYWJsZWQpO1xufVxudGV4dGFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHN5bmNTZW5kRW5hYmxlZCk7XG5zeW5jU2VuZEVuYWJsZWQoKTtcblxuZnVuY3Rpb24gc2VsZWN0ZWRBZ2VudCgpIHtcbiAgY29uc3QgW2FnZW50SWRdID0gU3RyaW5nKHN0YXRlLm9wdGlvbnMubW9kZWxJZCB8fCBcIlwiKS5zcGxpdChcIjo6XCIpO1xuICByZXR1cm4gc3RhdGUuYWdlbnRzLmZpbmQoKGFnZW50KSA9PiBhZ2VudC5hZ2VudElkID09PSBhZ2VudElkKTtcbn1cblxuZnVuY3Rpb24gbW9kZWxJdGVtcygpIHtcbiAgY29uc3QgaXRlbXMgPSBbXTtcbiAgZm9yIChjb25zdCBhZ2VudCBvZiBzdGF0ZS5hZ2VudHMpIHtcbiAgICBpZiAoIWFnZW50LnVzYWJsZSkgY29udGludWU7XG4gICAgaXRlbXMucHVzaCh7IGdyb3VwOiBhZ2VudC5kaXNwbGF5TmFtZSB9KTtcbiAgICBjb25zdCBtb2RlbHMgPSBhZ2VudC5tb2RlbHM/Lmxlbmd0aCA/IGFnZW50Lm1vZGVscyA6IFt7IHZhbHVlOiBcIlwiLCBsYWJlbDogYWdlbnQuZGlzcGxheU5hbWUgfV07XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiBtb2RlbHMpIHtcbiAgICAgIGNvbnN0IGlkID0gYCR7YWdlbnQuYWdlbnRJZH06OiR7bW9kZWwudmFsdWUgfHwgXCJcIn1gO1xuICAgICAgaXRlbXMucHVzaCh7IGlkLCBsYWJlbDogbW9kZWwubGFiZWwsIGNoZWNrZWQ6IHN0YXRlLm9wdGlvbnMubW9kZWxJZCA9PT0gaWQgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpdGVtcztcbn1cblxuZnVuY3Rpb24gZWZmb3J0SXRlbXMoKSB7XG4gIGNvbnN0IGFnZW50ID0gc2VsZWN0ZWRBZ2VudCgpO1xuICBjb25zdCBpdGVtcyA9IFt7IGlkOiBcIl9fZGVmYXVsdF9fXCIsIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUNEOTRcdUI4NjBcIiwgY2hlY2tlZDogIXN0YXRlLm9wdGlvbnMuZWZmb3J0IH1dO1xuICBmb3IgKGNvbnN0IGVmZm9ydCBvZiBhZ2VudD8uZWZmb3J0cyB8fCBbXSkge1xuICAgIGlmICghZWZmb3J0LnZhbHVlKSBjb250aW51ZTtcbiAgICBpdGVtcy5wdXNoKHsgaWQ6IGVmZm9ydC52YWx1ZSwgbGFiZWw6IGVmZm9ydC5sYWJlbCwgY2hlY2tlZDogc3RhdGUub3B0aW9ucy5lZmZvcnQgPT09IGVmZm9ydC52YWx1ZSB9KTtcbiAgfVxuICByZXR1cm4gaXRlbXM7XG59XG5cbmZ1bmN0aW9uIGFwcHJvdmFsSXRlbXMoKSB7XG4gIHJldHVybiBbXG4gICAgeyBpZDogXCJkZWZhdWx0XCIsIGxhYmVsOiBcIlx1QUUzMFx1QkNGOCBcdUMyQjlcdUM3NzhcIiB9LFxuICAgIHsgaWQ6IFwiYnlwYXNzXCIsIGxhYmVsOiBcIlx1QzJCOVx1Qzc3OCBcdUM1QzZcdUM3NzQgXHVDOUM0XHVENTg5XCIgfSxcbiAgICB7IGlkOiBcImF1dG9waWxvdFwiLCBsYWJlbDogXCJcdUM2MjRcdUQxQTBcdUQzMENcdUM3N0NcdUI3RkZcIiB9LFxuICBdLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgY2hlY2tlZDogc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUgPT09IGl0ZW0uaWQgfSkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJQaWNrZXJzKCkge1xuICBjb25zdCBbYWdlbnRJZCwgbW9kZWxdID0gU3RyaW5nKHN0YXRlLm9wdGlvbnMubW9kZWxJZCB8fCBcIlwiKS5zcGxpdChcIjo6XCIpO1xuICBjb25zdCBhZ2VudCA9IHN0YXRlLmFnZW50cy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS5hZ2VudElkID09PSBhZ2VudElkKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGFnZW50XG4gICAgPyAoYWdlbnQubW9kZWxzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLnZhbHVlID09PSAobW9kZWwgfHwgXCJcIikpPy5sYWJlbCB8fCBhZ2VudC5kaXNwbGF5TmFtZSlcbiAgICA6IFwiXHVBRTMwXHVCQ0Y4IFx1QkFBOFx1QjM3OFwiO1xuICBtb2RlbFBpY2tlci5sYWJlbFNwYW4udGV4dENvbnRlbnQgPSBtb2RlbExhYmVsO1xuICBjb25zdCBlZmZvcnRMYWJlbCA9IHN0YXRlLm9wdGlvbnMuZWZmb3J0XG4gICAgPyAoc2VsZWN0ZWRBZ2VudCgpPy5lZmZvcnRzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLnZhbHVlID09PSBzdGF0ZS5vcHRpb25zLmVmZm9ydCk/LmxhYmVsIHx8IHN0YXRlLm9wdGlvbnMuZWZmb3J0KVxuICAgIDogXCJcdUFFMzBcdUJDRjggXHVDRDk0XHVCODYwXCI7XG4gIGVmZm9ydFBpY2tlci5sYWJlbFNwYW4udGV4dENvbnRlbnQgPSBlZmZvcnRMYWJlbDtcbiAgYXBwcm92YWxQaWNrZXIubGFiZWxTcGFuLnRleHRDb250ZW50ID1cbiAgICB7IGRlZmF1bHQ6IFwiXHVBRTMwXHVCQ0Y4IFx1QzJCOVx1Qzc3OFwiLCBieXBhc3M6IFwiXHVDMkI5XHVDNzc4IFx1QzVDNlx1Qzc3NCBcdUM5QzRcdUQ1ODlcIiwgYXV0b3BpbG90OiBcIlx1QzYyNFx1RDFBMFx1RDMwQ1x1Qzc3Q1x1QjdGRlwiIH1bc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGVdIHx8IFwiXHVBRTMwXHVCQ0Y4IFx1QzJCOVx1Qzc3OFwiO1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gVHJhbnNjcmlwdCByZW5kZXJpbmdcblxuZnVuY3Rpb24gZm9ybWF0VG9rZW5zKGNvdW50KSB7XG4gIGNvbnN0IHZhbHVlID0gTnVtYmVyKGNvdW50KSB8fCAwO1xuICBpZiAodmFsdWUgPj0gMTAwMCkgcmV0dXJuIGAkeyh2YWx1ZSAvIDEwMDApLnRvRml4ZWQodmFsdWUgPj0gMTBfMDAwID8gMCA6IDEpfWtgO1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWV0YUxpbmUodGFzaykge1xuICBjb25zdCBwYXJ0cyA9IFtdO1xuICBjb25zdCBhZ2VudCA9IEFHRU5UX05BTUVTW3Rhc2suYWdlbnRJZF0gfHwgdGFzay5hZ2VudElkO1xuICBpZiAoYWdlbnQpIHBhcnRzLnB1c2godGFzay5hZ2VudE1vZGVsID8gYCR7YWdlbnR9IFx1MDBCNyAke3Rhc2suYWdlbnRNb2RlbH1gIDogYWdlbnQpO1xuICBjb25zdCB1c2FnZSA9IHRhc2sudXNhZ2U7XG4gIGlmICh1c2FnZSAmJiAodXNhZ2UuaW5wdXRUb2tlbnMgfHwgdXNhZ2Uub3V0cHV0VG9rZW5zIHx8IHVzYWdlLnRvdGFsVG9rZW5zKSkge1xuICAgIGNvbnN0IHRvdGFsID0gdXNhZ2UudG90YWxUb2tlbnMgfHwgKHVzYWdlLmlucHV0VG9rZW5zIHx8IDApICsgKHVzYWdlLm91dHB1dFRva2VucyB8fCAwKTtcbiAgICBwYXJ0cy5wdXNoKGAke2Zvcm1hdFRva2Vucyh1c2FnZS5pbnB1dFRva2Vucyl9XHUyMTkxICR7Zm9ybWF0VG9rZW5zKHVzYWdlLm91dHB1dFRva2Vucyl9XHUyMTkzIChcdUNEMUQgJHtmb3JtYXRUb2tlbnModG90YWwpfSBcdUQxQTBcdUQwNzApYCk7XG4gIH1cbiAgaWYgKHVzYWdlPy5jb3N0VXNkICE9IG51bGwpIHBhcnRzLnB1c2goYCQke051bWJlcih1c2FnZS5jb3N0VXNkKS50b0ZpeGVkKDQpfWApO1xuICBjb25zdCB0aW1lID0gdGFzay5jb21wbGV0ZWRBdCB8fCB0YXNrLnVwZGF0ZWRBdDtcbiAgaWYgKHRpbWUpIHtcbiAgICBjb25zdCBhdCA9IG5ldyBEYXRlKHRpbWUpO1xuICAgIGlmICghTnVtYmVyLmlzTmFOKGF0LmdldFRpbWUoKSkpIHtcbiAgICAgIHBhcnRzLnB1c2goYXQudG9Mb2NhbGVUaW1lU3RyaW5nKFwia28tS1JcIiwgeyBob3VyOiBcIm51bWVyaWNcIiwgbWludXRlOiBcIjItZGlnaXRcIiB9KSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXJ0cy5qb2luKFwiIFx1MDBCNyBcIik7XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RSb3codGV4dCkge1xuICBjb25zdCByb3cgPSBlbChcImRpdlwiLCBcImludGVyYWN0aXZlLWl0ZW0tY29udGFpbmVyIGludGVyYWN0aXZlLXJlcXVlc3RcIik7XG4gIGNvbnN0IHZhbHVlID0gZWwoXCJkaXZcIiwgXCJ2YWx1ZVwiKTtcbiAgdmFsdWUuYXBwZW5kKHJlbmRlck1hcmtkb3duKHRleHQpKTtcbiAgcm93LmFwcGVuZCh2YWx1ZSk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHJlc3BvbnNlUm93KHRhc2ssIHsgaXNMYXN0IH0pIHtcbiAgY29uc3Qgcm93ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pdGVtLWNvbnRhaW5lciBpbnRlcmFjdGl2ZS1yZXNwb25zZVwiKTtcbiAgaWYgKGlzTGFzdCkgcm93LmNsYXNzTGlzdC5hZGQoXCJjaGF0LW1vc3QtcmVjZW50LXJlc3BvbnNlXCIpO1xuICBjb25zdCB2YWx1ZSA9IGVsKFwiZGl2XCIsIFwidmFsdWVcIik7XG4gIHJvdy5hcHBlbmQodmFsdWUpO1xuXG4gIGNvbnN0IGFjdGl2ZSA9IEFDVElWRV9TVEFUVVNFUy5oYXModGFzay5zdGF0dXMpO1xuICBpZiAoYWN0aXZlKSByb3cuY2xhc3NMaXN0LmFkZChcImNoYXQtcmVzcG9uc2UtbG9hZGluZ1wiKTtcblxuICAvLyBSZWFzb25pbmcgXHUyMDE0IG5hdGl2ZSB0aGlua2luZyBib3ggc3RydWN0dXJlLlxuICBjb25zdCByZWFzb25pbmcgPSAodGFzay5hY3Rpdml0eUl0ZW1zIHx8IFtdKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0udHlwZSA9PT0gXCJyZWFzb25pbmdcIiAmJiAoaXRlbS50ZXh0IHx8IFwiXCIpLnRyaW0oKSk7XG4gIGlmIChyZWFzb25pbmcubGVuZ3RoKSB7XG4gICAgY29uc3QgYm94ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXRoaW5raW5nLWJveFwiKTtcbiAgICBjb25zdCBsaXN0SG9zdCA9IGVsKFwiZGl2XCIsIFwiY2hhdC11c2VkLWNvbnRleHQtbGlzdCBjaGF0LXRoaW5raW5nLWl0ZW1zXCIpO1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiByZWFzb25pbmcpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXRoaW5raW5nLWl0ZW0gbWFya2Rvd24tY29udGVudFwiKTtcbiAgICAgIGVudHJ5LmFwcGVuZChyZW5kZXJNYXJrZG93bihpdGVtLnRleHQpKTtcbiAgICAgIGxpc3RIb3N0LmFwcGVuZChlbnRyeSk7XG4gICAgfVxuICAgIGJveC5hcHBlbmQobGlzdEhvc3QpO1xuICAgIHZhbHVlLmFwcGVuZChib3gpO1xuICB9XG5cbiAgLy8gTm9uLXJlYXNvbmluZyBhY3Rpdml0eSBcdTIwMTQgb25lIGxhYmVsIHJvdyBwZXIgaXRlbSwgbmF0aXZlIHVzZWQtY29udGV4dCBsYWJlbCBzdHlsaW5nLlxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgdGFzay5hY3Rpdml0eUl0ZW1zIHx8IFtdKSB7XG4gICAgaWYgKGl0ZW0udHlwZSA9PT0gXCJyZWFzb25pbmdcIikgY29udGludWU7XG4gICAgY29uc3QgbGFiZWwgPSBlbChcImRpdlwiLCBcImNoYXQtdXNlZC1jb250ZXh0LWxhYmVsXCIpO1xuICAgIGNvbnN0IGtpbmQgPSBpdGVtLnR5cGU7XG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGlmIChraW5kID09PSBcImNvbW1hbmRFeGVjdXRpb25cIiB8fCBraW5kID09PSBcImNvbW1hbmRcIikge1xuICAgICAgY29uc3QgY29tbWFuZCA9IEFycmF5LmlzQXJyYXkoaXRlbS5kYXRhPy5jb21tYW5kKSA/IGl0ZW0uZGF0YS5jb21tYW5kLmpvaW4oXCIgXCIpIDogaXRlbS5kYXRhPy5jb21tYW5kO1xuICAgICAgdGV4dCA9IGNvbW1hbmQgPyBTdHJpbmcoY29tbWFuZCkgOiBcIlx1QkE4NVx1QjgzOVx1Qzc0NCBcdUMyRTRcdUQ1ODlcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTRcIjtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwidGVybWluYWxcIikpO1xuICAgIH0gZWxzZSBpZiAoa2luZCA9PT0gXCJmaWxlQ2hhbmdlXCIpIHtcbiAgICAgIGNvbnN0IHBhdGhzID0gKGl0ZW0uZGF0YT8uY2hhbmdlcyB8fCBbXSkubWFwKChjaGFuZ2UpID0+IGNoYW5nZT8ucGF0aCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgdGV4dCA9IHBhdGhzLmxlbmd0aCA9PT0gMSA/IHBhdGhzWzBdIDogYCR7cGF0aHMubGVuZ3RofVx1QUMxQyBcdUQzMENcdUM3N0NcdUM3NDQgXHVDMjE4XHVDODE1XHVENTg4XHVDMkI1XHVCMkM4XHVCMkU0YDtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwiZWRpdFwiKSk7XG4gICAgfSBlbHNlIGlmIChraW5kID09PSBcIndlYlNlYXJjaFwiKSB7XG4gICAgICB0ZXh0ID0gaXRlbS50ZXh0IHx8IFwiXHVDNkY5XHVDNzQ0IFx1QUM4MFx1QzBDOVx1RDU4OFx1QzJCNVx1QjJDOFx1QjJFNFwiO1xuICAgICAgbGFiZWwuYXBwZW5kKGNvZGljb24oXCJzZWFyY2hcIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZXh0ID0gaXRlbS50ZXh0IHx8IGl0ZW0uZGF0YT8udG9vbCB8fCBcIlx1Qzc5MVx1QzVDNVx1Qzc0NCBcdUM5QzRcdUQ1ODlcdUQ1ODhcdUMyQjVcdUIyQzhcdUIyRTRcIjtcbiAgICAgIGxhYmVsLmFwcGVuZChjb2RpY29uKFwidG9vbHNcIikpO1xuICAgIH1cbiAgICBjb25zdCBjb2RlID0gZWwoXCJjb2RlXCIsIHVuZGVmaW5lZCwgdGV4dCk7XG4gICAgbGFiZWwuYXBwZW5kKGNvZGUpO1xuICAgIHZhbHVlLmFwcGVuZChsYWJlbCk7XG4gIH1cblxuICAvLyBDbGFyaWZpY2F0aW9uIHR1cm5zIChxdWVzdGlvbiBcdTIxOTIgYW5zd2VyKSBpbiBvcmlnaW5hbCBvcmRlci5cbiAgZm9yIChjb25zdCBjbGFyaWZpY2F0aW9uIG9mIHRhc2suY2xhcmlmaWNhdGlvblR1cm5zIHx8IFtdKSB7XG4gICAgY29uc3QgcmVwbHkgPSAoY2xhcmlmaWNhdGlvbi5hc3Npc3RhbnRSZXBseSB8fCBjbGFyaWZpY2F0aW9uLnF1ZXN0aW9uPy50ZXh0IHx8IFwiXCIpLnRyaW0oKTtcbiAgICBpZiAocmVwbHkpIHZhbHVlLmFwcGVuZChyZW5kZXJNYXJrZG93bihyZXBseSkpO1xuICAgIGNvbnN0IGFuc3dlciA9IChjbGFyaWZpY2F0aW9uLmFuc3dlciB8fCBcIlwiKS50cmltKCk7XG4gICAgaWYgKGFuc3dlcikge1xuICAgICAgY29uc3QgYW5zd2VyUm93ID0gZWwoXCJkaXZcIiwgXCJpbnRlcmFjdGl2ZS1pdGVtLWNvbnRhaW5lciBpbnRlcmFjdGl2ZS1yZXF1ZXN0XCIpO1xuICAgICAgY29uc3QgYW5zd2VyVmFsdWUgPSBlbChcImRpdlwiLCBcInZhbHVlXCIpO1xuICAgICAgYW5zd2VyVmFsdWUuYXBwZW5kKHJlbmRlck1hcmtkb3duKGFuc3dlcikpO1xuICAgICAgYW5zd2VyUm93LmFwcGVuZChhbnN3ZXJWYWx1ZSk7XG4gICAgICB2YWx1ZS5hcHBlbmQoYW5zd2VyUm93KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByZXBseSA9ICh0YXNrLmFnZW50UmVwbHkgfHwgXCJcIikudHJpbSgpO1xuICBpZiAocmVwbHkpIHZhbHVlLmFwcGVuZChyZW5kZXJNYXJrZG93bihyZXBseSkpO1xuXG4gIGlmIChhY3RpdmUpIHtcbiAgICBjb25zdCBwcm9ncmVzcyA9IGVsKFwiZGl2XCIsIFwiY2hhdC11c2VkLWNvbnRleHQtbGFiZWxcIik7XG4gICAgcHJvZ3Jlc3MuYXBwZW5kKGNvZGljb24oXCJsb2FkaW5nIGNvZGljb24tbW9kaWZpZXItc3BpblwiKSk7XG4gICAgcHJvZ3Jlc3MuYXBwZW5kKGVsKFwic3BhblwiLCB1bmRlZmluZWQsIGAgJHtTVEFUVVNfTUVTU0FHRVNbdGFzay5zdGF0dXNdIHx8IFwiXHVDOUM0XHVENTg5IFx1QzkxMVx1Qzc4NVx1QjJDOFx1QjJFNC5cIn1gKSk7XG4gICAgdmFsdWUuYXBwZW5kKHByb2dyZXNzKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qgd2FybmluZyBvZiB0YXNrLndhcm5pbmdzIHx8IFtdKSB7XG4gICAgY29uc3Qgd2lkZ2V0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LW5vdGlmaWNhdGlvbi13aWRnZXRcIik7XG4gICAgd2lkZ2V0LmFwcGVuZChjb2RpY29uKFwid2FybmluZ1wiKSwgZWwoXCJzcGFuXCIsIHVuZGVmaW5lZCwgU3RyaW5nKHdhcm5pbmcpKSk7XG4gICAgdmFsdWUuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHRlc3Qgb2YgdGFzay50ZXN0UmVzdWx0cyB8fCBbXSkge1xuICAgIGNvbnN0IGxhYmVsID0gZWwoXCJkaXZcIiwgXCJjaGF0LXVzZWQtY29udGV4dC1sYWJlbFwiKTtcbiAgICBsYWJlbC5hcHBlbmQoY29kaWNvbih0ZXN0LnN0YXR1cyA9PT0gXCJwYXNzZWRcIiA/IFwiY2hlY2tcIiA6IHRlc3Quc3RhdHVzID09PSBcImZhaWxlZFwiID8gXCJlcnJvclwiIDogXCJjaXJjbGUtc2xhc2hcIikpO1xuICAgIGxhYmVsLmFwcGVuZChlbChcImNvZGVcIiwgdW5kZWZpbmVkLCBgICR7dGVzdC5jb21tYW5kfSR7dGVzdC5zdW1tYXJ5ID8gYCBcdTIwMTQgJHt0ZXN0LnN1bW1hcnl9YCA6IFwiXCJ9YCkpO1xuICAgIHZhbHVlLmFwcGVuZChsYWJlbCk7XG4gIH1cblxuICBpZiAodGFzay5lcnJvcikge1xuICAgIGNvbnN0IHdpZGdldCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1ub3RpZmljYXRpb24td2lkZ2V0XCIpO1xuICAgIHdpZGdldC5hcHBlbmQoY29kaWNvbihcImVycm9yXCIpLCBlbChcInNwYW5cIiwgdW5kZWZpbmVkLCBTdHJpbmcodGFzay5lcnJvcikpKTtcbiAgICB2YWx1ZS5hcHBlbmQod2lkZ2V0KTtcbiAgfVxuXG4gIGlmICghYWN0aXZlKSB7XG4gICAgY29uc3QgZm9vdGVyID0gZWwoXCJkaXZcIiwgXCJjaGF0LXVzZWQtY29udGV4dC1sYWJlbCB2aWJleC1tZXRhXCIpO1xuICAgIGNvbnN0IGFjdGlvbnMgPSBbXTtcbiAgICBpZiAodGFzay5yZXZpZXdBdmFpbGFibGUpIHtcbiAgICAgIGNvbnN0IHJldmlldyA9IGVsKFwiYVwiLCB1bmRlZmluZWQsIFwiXHVCQ0MwXHVBQ0JEIFx1QzBBQ1x1RDU2RCBcdUFDODBcdUQxQTBcIik7XG4gICAgICByZXZpZXcuaHJlZiA9IFwiI1wiO1xuICAgICAgcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcG9zdCh7IHR5cGU6IFwib3BlblJldmlld1wiLCB0YXNrSWQ6IHRhc2sudGFza0lkIH0pO1xuICAgICAgfSk7XG4gICAgICBhY3Rpb25zLnB1c2gocmV2aWV3KTtcbiAgICB9XG4gICAgY29uc3QgbWV0YSA9IG1ldGFMaW5lKHRhc2spO1xuICAgIGlmIChtZXRhKSBmb290ZXIuYXBwZW5kKGVsKFwic3BhblwiLCB1bmRlZmluZWQsIG1ldGEpKTtcbiAgICBpZiAoYWN0aW9ucy5sZW5ndGggJiYgbWV0YSkgZm9vdGVyLmFwcGVuZChlbChcInNwYW5cIiwgdW5kZWZpbmVkLCBcIiBcdTAwQjcgXCIpKTtcbiAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiBhY3Rpb25zKSBmb290ZXIuYXBwZW5kKGFjdGlvbik7XG4gICAgaWYgKGZvb3Rlci5jaGlsZE5vZGVzLmxlbmd0aCkgdmFsdWUuYXBwZW5kKGZvb3Rlcik7XG4gIH1cblxuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiB3ZWxjb21lVmlldygpIHtcbiAgY29uc3QgaG9zdCA9IGVsKFwiZGl2XCIsIFwiY2hhdC13ZWxjb21lLXZpZXdcIik7XG4gIGNvbnN0IGljb25Ib3N0ID0gZWwoXCJkaXZcIiwgXCJjaGF0LXdlbGNvbWUtdmlldy1pY29uXCIpO1xuICBpY29uSG9zdC5hcHBlbmQoY29kaWNvbihcInNwYXJrbGVcIikpO1xuICBjb25zdCB0aXRsZUhvc3QgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3LXRpdGxlXCIsIFwiVklCRVhcIik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBlbChcImRpdlwiLCBcImNoYXQtd2VsY29tZS12aWV3LW1lc3NhZ2VcIik7XG4gIG1lc3NhZ2UuYXBwZW5kKHJlbmRlck1hcmtkb3duKFwiaVBhZFx1QzY0MCBWUyBDb2RlXHVBQzAwIFx1QUMxOVx1Qzc0MCBcdUIzMDBcdUQ2NTRcdUI5N0MgXHVBQ0Y1XHVDNzIwXHVENTY5XHVCMkM4XHVCMkU0LiBcdUJBQThcdUIzNzggXHVDMTIwXHVEMEREXHVBRTMwXHVCODVDIENvZGV4XHVDNjQwIENsYXVkZSBDb2RlXHVCOTdDIHR1cm5cdUI5QzhcdUIyRTQgXHVCQzE0XHVBRkQ0IFx1QzRGOCBcdUMyMTggXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiKSk7XG4gIGhvc3QuYXBwZW5kKGljb25Ib3N0LCB0aXRsZUhvc3QsIG1lc3NhZ2UpO1xuICByZXR1cm4gaG9zdDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHJhbnNjcmlwdCgpIHtcbiAgY29uc3Qgc3RpY2tUb0JvdHRvbSA9XG4gICAgbGlzdC5zY3JvbGxIZWlnaHQgLSBsaXN0LnNjcm9sbFRvcCAtIGxpc3QuY2xpZW50SGVpZ2h0IDwgNjA7XG4gIGxpc3QucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgaWYgKHN0YXRlLmNvbm5lY3Rpb25FcnJvcikge1xuICAgIGNvbnN0IHdpZGdldCA9IGVsKFwiZGl2XCIsIFwiY2hhdC1ub3RpZmljYXRpb24td2lkZ2V0XCIpO1xuICAgIHdpZGdldC5hcHBlbmQoY29kaWNvbihcImRlYnVnLWRpc2Nvbm5lY3RcIiksIGVsKFwic3BhblwiLCB1bmRlZmluZWQsIHN0YXRlLmNvbm5lY3Rpb25FcnJvcikpO1xuICAgIGxpc3QuYXBwZW5kKHdpZGdldCk7XG4gIH1cblxuICBpZiAoIXN0YXRlLnRhc2tzLmxlbmd0aCkge1xuICAgIGxpc3QuYXBwZW5kKHdlbGNvbWVWaWV3KCkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN0YXRlLnRhc2tzLmZvckVhY2goKHRhc2ssIGluZGV4KSA9PiB7XG4gICAgaWYgKHRhc2sudXNlck1lc3NhZ2UpIGxpc3QuYXBwZW5kKHJlcXVlc3RSb3codGFzay51c2VyTWVzc2FnZSkpO1xuICAgIGxpc3QuYXBwZW5kKHJlc3BvbnNlUm93KHRhc2ssIHsgaXNMYXN0OiBpbmRleCA9PT0gc3RhdGUudGFza3MubGVuZ3RoIC0gMSB9KSk7XG4gIH0pO1xuXG4gIGlmIChzdGlja1RvQm90dG9tKSBsaXN0LnNjcm9sbFRvcCA9IGxpc3Quc2Nyb2xsSGVpZ2h0O1xufVxuXG4vLyAjZW5kcmVnaW9uXG5cbi8vICNyZWdpb24gTWVzc2FnaW5nXG5cbmZ1bmN0aW9uIHN1Ym1pdCgpIHtcbiAgY29uc3QgdGV4dCA9IHRleHRhcmVhLnZhbHVlLnRyaW0oKTtcbiAgaWYgKCF0ZXh0IHx8IHN0YXRlLmJ1c3kpIHJldHVybjtcbiAgdGV4dGFyZWEudmFsdWUgPSBcIlwiO1xuICBhdXRvR3JvdygpO1xuICBwb3N0KHtcbiAgICB0eXBlOiBcInNlbmRcIixcbiAgICB0ZXh0LFxuICAgIG1vZGVsSWQ6IHN0YXRlLm9wdGlvbnMubW9kZWxJZCxcbiAgICBlZmZvcnQ6IHN0YXRlLm9wdGlvbnMuZWZmb3J0LFxuICAgIGFwcHJvdmFsTW9kZTogc3RhdGUub3B0aW9ucy5hcHByb3ZhbE1vZGUsXG4gIH0pO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG4gIGNvbnN0IG1lc3NhZ2UgPSBldmVudC5kYXRhO1xuICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgIGNhc2UgXCJzdGF0ZVwiOiB7XG4gICAgICBPYmplY3QuYXNzaWduKHN0YXRlLCB7XG4gICAgICAgIGFnZW50czogbWVzc2FnZS5hZ2VudHMgPz8gc3RhdGUuYWdlbnRzLFxuICAgICAgICBwcm9qZWN0czogbWVzc2FnZS5wcm9qZWN0cyA/PyBzdGF0ZS5wcm9qZWN0cyxcbiAgICAgICAgY29udmVyc2F0aW9uczogbWVzc2FnZS5jb252ZXJzYXRpb25zID8/IHN0YXRlLmNvbnZlcnNhdGlvbnMsXG4gICAgICAgIHNlbGVjdGVkQ29udmVyc2F0aW9uSWQ6IG1lc3NhZ2Uuc2VsZWN0ZWRDb252ZXJzYXRpb25JZCA/PyBzdGF0ZS5zZWxlY3RlZENvbnZlcnNhdGlvbklkLFxuICAgICAgICBzZWxlY3RlZFByb2plY3RJZDogbWVzc2FnZS5zZWxlY3RlZFByb2plY3RJZCA/PyBzdGF0ZS5zZWxlY3RlZFByb2plY3RJZCxcbiAgICAgICAgdGFza3M6IG1lc3NhZ2UudGFza3MgPz8gc3RhdGUudGFza3MsXG4gICAgICAgIGhlYWx0aDogbWVzc2FnZS5oZWFsdGggPz8gc3RhdGUuaGVhbHRoLFxuICAgICAgICBidXN5OiBCb29sZWFuKG1lc3NhZ2UuYnVzeSksXG4gICAgICAgIGNvbm5lY3Rpb25FcnJvcjogbWVzc2FnZS5jb25uZWN0aW9uRXJyb3IgPz8gbnVsbCxcbiAgICAgIH0pO1xuICAgICAgaWYgKG1lc3NhZ2Uub3B0aW9ucykgT2JqZWN0LmFzc2lnbihzdGF0ZS5vcHRpb25zLCBtZXNzYWdlLm9wdGlvbnMpO1xuICAgICAgaWYgKCFzdGF0ZS5vcHRpb25zLm1vZGVsSWQpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBzdGF0ZS5hZ2VudHMuZmluZCgoYWdlbnQpID0+IGFnZW50LnVzYWJsZSk7XG4gICAgICAgIGlmIChmaXJzdCkgc3RhdGUub3B0aW9ucy5tb2RlbElkID0gYCR7Zmlyc3QuYWdlbnRJZH06OiR7Zmlyc3QubW9kZWxzPy5bMF0/LnZhbHVlIHx8IFwiXCJ9YDtcbiAgICAgIH1cbiAgICAgIHRleHRhcmVhLnBsYWNlaG9sZGVyID0gXCJWSUJFWFx1QzVEMCBcdUM2OTRcdUNDQURcdUQ1NThcdUMxMzhcdUM2OTQuIGBAXHVBQ0JEXHVCODVDYFx1Qjg1QyBcdUQ1MDRcdUI4NUNcdUM4MURcdUQyQjggXHVEMzBDXHVDNzdDXHVDNzQ0IFx1Q0MzOFx1Qzg3MFx1RDU2MCBcdUMyMTggXHVDNzg4XHVDMkI1XHVCMkM4XHVCMkU0LlwiO1xuICAgICAgcmVuZGVyUGlja2VycygpO1xuICAgICAgcmVuZGVyVHJhbnNjcmlwdCgpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJpbnNlcnRNZW50aW9uXCI6IHtcbiAgICAgIGNvbnN0IG1lbnRpb24gPSBgQCR7bWVzc2FnZS5yZWxhdGl2ZVBhdGh9IGA7XG4gICAgICBjb25zdCBhdCA9IHRleHRhcmVhLnNlbGVjdGlvblN0YXJ0ID8/IHRleHRhcmVhLnZhbHVlLmxlbmd0aDtcbiAgICAgIHRleHRhcmVhLnZhbHVlID0gdGV4dGFyZWEudmFsdWUuc2xpY2UoMCwgYXQpICsgbWVudGlvbiArIHRleHRhcmVhLnZhbHVlLnNsaWNlKGF0KTtcbiAgICAgIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgICBhdXRvR3JvdygpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJ0YXNrVXBkYXRlXCI6IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gc3RhdGUudGFza3MuZmluZEluZGV4KCh0YXNrKSA9PiB0YXNrLnRhc2tJZCA9PT0gbWVzc2FnZS50YXNrLnRhc2tJZCk7XG4gICAgICBpZiAoaW5kZXggPj0gMCkgc3RhdGUudGFza3NbaW5kZXhdID0gbWVzc2FnZS50YXNrO1xuICAgICAgZWxzZSBzdGF0ZS50YXNrcy5wdXNoKG1lc3NhZ2UudGFzayk7XG4gICAgICBzdGF0ZS5idXN5ID0gQUNUSVZFX1NUQVRVU0VTLmhhcyhtZXNzYWdlLnRhc2suc3RhdHVzKTtcbiAgICAgIHJlbmRlclRyYW5zY3JpcHQoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufSk7XG5cbnBvc3QoeyB0eXBlOiBcInJlYWR5XCIgfSk7XG5cbi8vICNlbmRyZWdpb25cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBSUEsVUFBTSxjQUFjLENBQUM7QUFFckIsZUFBUyxlQUFnQixTQUFTO0FBQ2hDLFlBQUksUUFBUSxZQUFZLE9BQU87QUFDL0IsWUFBSSxPQUFPO0FBQUUsaUJBQU87QUFBQSxRQUFNO0FBRTFCLGdCQUFRLFlBQVksT0FBTyxJQUFJLENBQUM7QUFFaEMsaUJBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxLQUFLO0FBQzVCLGdCQUFNLEtBQUssT0FBTyxhQUFhLENBQUM7QUFDaEMsZ0JBQU0sS0FBSyxFQUFFO0FBQUEsUUFDZjtBQUVBLGlCQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ3ZDLGdCQUFNLEtBQUssUUFBUSxXQUFXLENBQUM7QUFDL0IsZ0JBQU0sRUFBRSxJQUFJLE9BQU8sTUFBTSxHQUFHLFNBQVMsRUFBRSxFQUFFLFlBQVksR0FBRyxNQUFNLEVBQUU7QUFBQSxRQUNsRTtBQUVBLGVBQU87QUFBQSxNQUNUO0FBSUEsZUFBUyxPQUFRLFFBQVEsU0FBUztBQUNoQyxZQUFJLE9BQU8sWUFBWSxVQUFVO0FBQy9CLG9CQUFVLE9BQU87QUFBQSxRQUNuQjtBQUVBLGNBQU0sUUFBUSxlQUFlLE9BQU87QUFFcEMsZUFBTyxPQUFPLFFBQVEscUJBQXFCLFNBQVUsS0FBSztBQUN4RCxjQUFJLFNBQVM7QUFFYixtQkFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLFFBQVEsSUFBSSxHQUFHLEtBQUssR0FBRztBQUM3QyxrQkFBTSxLQUFLLFNBQVMs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QUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLFFBQVEsR0FBRSxDQUFDLElBQUcsU0FBUyxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxhQUFhLEdBQUUsQ0FBQyxLQUFJLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLE1BQUssUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsaUJBQWdCLEdBQUUsTUFBSyxHQUFFLGVBQWMsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxJQUFHLHdCQUF3QixHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsSUFBRyxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxjQUFjLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsb0JBQW9CLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsSUFBRyxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsd0JBQXdCLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsNEJBQTRCLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGFBQVksR0FBRSxLQUFJLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsVUFBUyxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLE1BQUssR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLEtBQUksR0FBRSxVQUFTLENBQUMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGVBQWMsR0FBRSxNQUFLLEdBQUUsWUFBVyxDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxNQUFLLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsTUFBSyxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsUUFBTyxHQUFFLEtBQUksR0FBRSxRQUFPLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsT0FBTSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxLQUFJLFFBQVEsR0FBRSxDQUFDLE1BQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHFCQUFvQixDQUFDLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE1BQUssR0FBRSxjQUFhLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxNQUFLLEdBQUUsZ0JBQWUsQ0FBQyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsaUJBQWdCLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLG9CQUFtQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLHNCQUFxQixDQUFDLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsV0FBVSxHQUFFLE9BQU0sR0FBRSxXQUFVLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxlQUFlLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxrQkFBa0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGdCQUFnQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHVCQUFzQixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLHdCQUF1QixHQUFFLE1BQUssR0FBRSxZQUFXLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFFBQU8sR0FBRSxLQUFJLEdBQUUsUUFBTyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxRQUFPLEdBQUUsS0FBSSxHQUFFLFFBQU8sQ0FBQyxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsU0FBUSxHQUFFLE9BQU0sR0FBRSxTQUFRLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxPQUFNLEdBQUUsU0FBUSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSx5QkFBeUIsR0FBRSxDQUFDLEdBQUUseUJBQXlCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSwwQkFBMEIsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLHlCQUF5QixHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxhQUFZLEdBQUUsS0FBSSxHQUFFLGFBQVksQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxLQUFJLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLGFBQWEsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLElBQUcsV0FBVyxHQUFFLENBQUMsSUFBRyxjQUFjLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLElBQUcsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxhQUFhLEdBQUUsQ0FBQyxHQUFFLGNBQWMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEtBQUksWUFBWSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSx3QkFBd0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGlCQUFpQixHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLG1CQUFtQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxxQkFBcUIsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxJQUFHLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsS0FBSSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxRQUFRLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsSUFBRyxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLElBQUcsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxJQUFHLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsdUJBQXVCLEdBQUUsQ0FBQyxHQUFFLHdCQUF3QixHQUFFLENBQUMsR0FBRSw0QkFBNEIsR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxLQUFJLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsY0FBYyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxXQUFVLEdBQUUsS0FBSSxHQUFFLFdBQVUsQ0FBQyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHVCQUF1QixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsaUJBQWlCLEdBQUUsQ0FBQyxHQUFFLGtCQUFrQixHQUFFLENBQUMsR0FBRSxvQkFBb0IsR0FBRSxDQUFDLEdBQUUsc0JBQXNCLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUsbUJBQW1CLEdBQUUsQ0FBQyxHQUFFLHFCQUFxQixHQUFFLENBQUMsR0FBRSxpQkFBaUIsR0FBRSxDQUFDLEdBQUUsa0JBQWtCLEdBQUUsQ0FBQyxHQUFFLG9CQUFvQixHQUFFLENBQUMsR0FBRSxzQkFBc0IsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLHNCQUFzQixHQUFFLENBQUMsR0FBRSxtQkFBbUIsR0FBRSxDQUFDLEdBQUUscUJBQXFCLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxnQkFBZ0IsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUscUJBQW9CLEdBQUUsS0FBSSxHQUFFLHVCQUFzQixDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxzQkFBcUIsR0FBRSxLQUFJLEdBQUUsd0JBQXVCLENBQUMsR0FBRSxDQUFDLElBQUcsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsZ0JBQWdCLEdBQUUsQ0FBQyxHQUFFLGVBQWUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsYUFBYSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsSUFBRyxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxZQUFZLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxFQUFDLEdBQUUsYUFBWSxHQUFFLEtBQUksR0FBRSxhQUFZLENBQUMsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxTQUFRLEdBQUUsS0FBSSxHQUFFLFNBQVEsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsY0FBYSxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxjQUFhLEdBQUUsS0FBSSxHQUFFLGNBQWEsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsWUFBWSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxNQUFNLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLGNBQWEsR0FBRSxLQUFJLEdBQUUsc0JBQXFCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLG9CQUFtQixHQUFFLEtBQUksR0FBRSw0QkFBMkIsQ0FBQyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxPQUFNLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsT0FBTSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxtQkFBa0IsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFNBQVEsR0FBRSxLQUFJLEdBQUUscUJBQW9CLENBQUMsR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFlBQVksR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsZUFBZSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLE1BQU0sR0FBRSxDQUFDLEdBQUUsTUFBTSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxXQUFXLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFVBQVMsR0FBRSxLQUFJLEdBQUUsVUFBUyxDQUFDLEdBQUUsQ0FBQyxHQUFFLEVBQUMsR0FBRSxVQUFTLEdBQUUsS0FBSSxHQUFFLFVBQVMsQ0FBQyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxPQUFNLEdBQUUsa0JBQWlCLENBQUMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsV0FBVyxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFdBQVcsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFNBQVMsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsU0FBUyxHQUFFLENBQUMsR0FBRSxVQUFVLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsVUFBVSxHQUFFLENBQUMsR0FBRSxTQUFTLEdBQUUsQ0FBQyxHQUFFLFVBQVUsR0FBRSxDQUFDLEdBQUUsRUFBQyxHQUFFLFdBQVUsR0FBRSxNQUFLLEdBQUUsV0FBVSxDQUFDLEdBQUUsQ0FBQyxPQUFNLEVBQUMsR0FBRSxJQUFJLElBQWtDLDRCQUFZLENBQUMsQ0FBQyxPQUFNLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsSUFBRyxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsT0FBTyxHQUFFLENBQUMsR0FBRSxPQUFPLEdBQUUsQ0FBQyxHQUFFLE9BQU8sR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFBQVEsR0FBRSxDQUFDLEdBQUUsUUFBUSxHQUFFLENBQUMsR0FBRSxRQUFRLEdBQUUsQ0FBQyxHQUFFLFFB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SyxRQUFRLElBQUk7QUFDbEMsY0FBTSxPQUFPLGdCQUFnQixJQUFJLFFBQVEsS0FBSyxNQUFNO0FBQ3BELHlCQUFpQjtBQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBRUQsT0FBSyxFQUFFLE1BQU0sUUFBUSxDQUFDOyIsCiAgIm5hbWVzIjogWyJyZXF1aXJlX2luZGV4X2NqcyIsICJfYSIsICJDaGFyQ29kZXMiLCAiQmluVHJpZUZsYWdzIiwgIkVudGl0eURlY29kZXJTdGF0ZSIsICJEZWNvZGluZ01vZGUiLCAiRW50aXR5RGVjb2RlciIsICJFbnRpdHlMZXZlbCIsICJFbmNvZGluZ01vZGUiLCAicmVxdWlyZV9pbmRleF9janMiLCAibGlzdCIsICJlbCIsICJyZXF1aXJlX2luZGV4X2NqcyIsICJjb2RlIiwgImVudGl0eSIsICJzdGF0ZSIsICJsaXN0IiwgIm1kIiwgInRleHQiLCAibmV4dExpbmUiLCAicG9zIiwgIm1heCIsICJsaW5rIiwgIk1hcmtkb3duSXQiLCAicmVwbHkiXQp9Cg==
