(function() {
    const e = "undefined" !== typeof window;
    const t = "undefined" !== typeof document;
    const noop = () => {}
    ;
    const r = t ? document.querySelector("script[type=esms-options]") : void 0;
    const s = r ? JSON.parse(r.innerHTML) : {};
    Object.assign(s, self.esmsInitOptions || {});
    let n = !t || !!s.shimMode;
    const a = globalHook(n && s.onimport);
    const i = globalHook(n && s.resolve);
    let c = s.fetch ? globalHook(s.fetch) : fetch;
    const f = s.meta ? globalHook(n && s.meta) : noop;
    const te = s.skip ? new RegExp(s.skip) : null;
    const se = s.mapOverrides;
    let ne = s.nonce;
    if (!ne && t) {
        const e = document.querySelector("script[nonce]");
        e && (ne = e.nonce || e.getAttribute("nonce"))
    }
    const oe = globalHook(s.onerror || noop);
    const ce = s.onpolyfill ? globalHook(s.onpolyfill) : () => {
        console.log("%c^^ Module TypeError above is polyfilled and can be ignored ^^", "font-weight:900;color:#391")
    }
    ;
    const {revokeBlobURLs: le, noLoadEventRetriggers: fe, enforceIntegrity: ue} = s;
    function globalHook(e) {
        return "string" === typeof e ? self[e] : e
    }
    const de = Array.isArray(s.polyfillEnable) ? s.polyfillEnable : [];
    const pe = de.includes("css-modules");
    const be = de.includes("json-modules");
    const he = !navigator.userAgentData && !!navigator.userAgent.match(/Edge\/\d+\.\d+/);
    const me = t ? document.baseURI : `${location.protocol}//${location.host}${location.pathname.includes("/") ? location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1) : location.pathname}`;
    const createBlob = (e, t="text/javascript") => URL.createObjectURL(new Blob([e],{
        type: t
    }));
    const eoop = e => setTimeout(( () => {
        throw e
    }
    ));
    const throwError = t => {
        (self.reportError || e && window.safari && console.error || eoop)(t),
        void oe(t)
    }
    ;
    function fromParent(e) {
        return e ? ` imported from ${e}` : ""
    }
    let ke = false;
    function setImportMapSrcOrLazy() {
        ke = true
    }
    if (!n)
        if (document.querySelectorAll("script[type=module-shim],script[type=importmap-shim],link[rel=modulepreload-shim]").length)
            n = true;
        else {
            let e = false;
            for (const t of document.querySelectorAll("script[type=module],script[type=importmap]"))
                if (e) {
                    if ("importmap" === t.type && e) {
                        ke = true;
                        break
                    }
                } else
                    "module" !== t.type || t.ep || (e = true)
        }
    const we = /\\/g;
    function isURL(e) {
        if (-1 === e.indexOf(":"))
            return false;
        try {
            new URL(e);
            return true
        } catch (e) {
            return false
        }
    }
    function resolveUrl(e, t) {
        return resolveIfNotPlainOrUrl(e, t) || (isURL(e) ? e : resolveIfNotPlainOrUrl("./" + e, t))
    }
    function resolveIfNotPlainOrUrl(e, t) {
        const r = t.indexOf("?", -1 === t.indexOf("#") ? t.indexOf("#") : t.length);
        -1 !== r && (t = t.slice(0, r));
        -1 !== e.indexOf("\\") && (e = e.replace(we, "/"));
        if ("/" === e[0] && "/" === e[1])
            return t.slice(0, t.indexOf(":") + 1) + e;
        if ("." === e[0] && ("/" === e[1] || "." === e[1] && ("/" === e[2] || 2 === e.length && (e += "/")) || 1 === e.length && (e += "/")) || "/" === e[0]) {
            const r = t.slice(0, t.indexOf(":") + 1);
            let s;
            if ("/" === t[r.length + 1])
                if ("file:" !== r) {
                    s = t.slice(r.length + 2);
                    s = s.slice(s.indexOf("/") + 1)
                } else
                    s = t.slice(8);
            else
                s = t.slice(r.length + ("/" === t[r.length]));
            if ("/" === e[0])
                return t.slice(0, t.length - s.length - 1) + e;
            const n = s.slice(0, s.lastIndexOf("/") + 1) + e;
            const a = [];
            let i = -1;
            for (let e = 0; e < n.length; e++)
                if (-1 === i) {
                    if ("." === n[e]) {
                        if ("." === n[e + 1] && ("/" === n[e + 2] || e + 2 === n.length)) {
                            a.pop();
                            e += 2;
                            continue
                        }
                        if ("/" === n[e + 1] || e + 1 === n.length) {
                            e += 1;
                            continue
                        }
                    }
                    while ("/" === n[e])
                        e++;
                    i = e
                } else if ("/" === n[e]) {
                    a.push(n.slice(i, e + 1));
                    i = -1
                }
            -1 !== i && a.push(n.slice(i));
            return t.slice(0, t.length - s.length) + a.join("")
        }
    }
    function resolveAndComposeImportMap(e, t, r) {
        const s = {
            imports: Object.assign({}, r.imports),
            scopes: Object.assign({}, r.scopes)
        };
        e.imports && resolveAndComposePackages(e.imports, s.imports, t, r);
        if (e.scopes)
            for (let n in e.scopes) {
                const a = resolveUrl(n, t);
                resolveAndComposePackages(e.scopes[n], s.scopes[a] || (s.scopes[a] = {}), t, r)
            }
        return s
    }
    function getMatch(e, t) {
        if (t[e])
            return e;
        let r = e.length;
        do {
            const s = e.slice(0, r + 1);
            if (s in t)
                return s
        } while (-1 !== (r = e.lastIndexOf("/", r - 1)))
    }
    function applyPackages(e, t) {
        const r = getMatch(e, t);
        if (r) {
            const s = t[r];
            if (null === s)
                return;
            return s + e.slice(r.length)
        }
    }
    function resolveImportMap(e, t, r) {
        let s = r && getMatch(r, e.scopes);
        while (s) {
            const r = applyPackages(t, e.scopes[s]);
            if (r)
                return r;
            s = getMatch(s.slice(0, s.lastIndexOf("/")), e.scopes)
        }
        return applyPackages(t, e.imports) || -1 !== t.indexOf(":") && t
    }
    function resolveAndComposePackages(e, t, r, s) {
        for (let a in e) {
            const i = resolveIfNotPlainOrUrl(a, r) || a;
            if ((!n || !se) && t[i] && t[i] !== e[i])
                throw Error(`Rejected map override "${i}" from ${t[i]} to ${e[i]}.`);
            let c = e[a];
            if ("string" !== typeof c)
                continue;
            const f = resolveImportMap(s, resolveIfNotPlainOrUrl(c, r) || c, r);
            f ? t[i] = f : console.warn(`Mapping "${a}" -> "${e[a]}" does not resolve`)
        }
    }
    let ge = !t && (0,
    eval)("u=>import(u)");
    let ve;
    const ye = t && new Promise((e => {
        const t = Object.assign(document.createElement("script"), {
            src: createBlob("self._d=u=>import(u)"),
            ep: true
        });
        t.setAttribute("nonce", ne);
        t.addEventListener("load", ( () => {
            if (!(ve = !!(ge = self._d))) {
                let e;
                window.addEventListener("error", (t => e = t));
                ge = (t, r) => new Promise(( (s, n) => {
                    const a = Object.assign(document.createElement("script"), {
                        type: "module",
                        src: createBlob(`import*as m from'${t}';self._esmsi=m`)
                    });
                    e = void 0;
                    a.ep = true;
                    ne && a.setAttribute("nonce", ne);
                    a.addEventListener("error", cb);
                    a.addEventListener("load", cb);
                    function cb(i) {
                        document.head.removeChild(a);
                        if (self._esmsi) {
                            s(self._esmsi, me);
                            self._esmsi = void 0
                        } else {
                            n(!(i instanceof Event) && i || e && e.error || new Error(`Error loading ${r && r.errUrl || t} (${a.src}).`));
                            e = void 0
                        }
                    }
                    document.head.appendChild(a)
                }
                ))
            }
            document.head.removeChild(t);
            delete self._d;
            e()
        }
        ));
        document.head.appendChild(t)
    }
    ));
    let $e = false;
    let Se = false;
    let Le = !(!t || !HTMLScriptElement.supports) && HTMLScriptElement.supports("importmap");
    let Oe = Le;
    const Ce = "import.meta";
    const xe = 'import"x"assert{type:"css"}';
    const Ae = 'import"x"assert{type:"json"}';
    const Pe = Promise.resolve(ye).then(( () => {
        if (ve && (!Le || pe || be))
            return t ? new Promise((e => {
                const t = document.createElement("iframe");
                t.style.display = "none";
                t.setAttribute("nonce", ne);
                function cb({data: [r,s,n,a]}) {
                    Le = r;
                    Oe = s;
                    Se = n;
                    $e = a;
                    e();
                    document.head.removeChild(t);
                    window.removeEventListener("message", cb, false)
                }
                window.addEventListener("message", cb, false);
                const r = `<script nonce=${ne || ""}>b=(s,type='text/javascript')=>URL.createObjectURL(new Blob([s],{type}));document.head.appendChild(Object.assign(document.createElement('script'),{type:'importmap',nonce:"${ne}",innerText:\`{"imports":{"x":"\${b('')}"}}\`}));Promise.all([${Le ? "true,true" : `'x',b('${Ce}')`}, ${pe ? `b('${xe}'.replace('x',b('','text/css')))` : "false"}, ${be ? `b('${Ae}'.replace('x',b('{}','text/json')))` : "false"}].map(x =>typeof x==='string'?import(x).then(x =>!!x,()=>false):x)).then(a=>parent.postMessage(a,'*'))<\/script>`;
                t.onload = () => {
                    const e = t.contentDocument;
                    if (e && 0 === e.head.childNodes.length) {
                        const t = e.createElement("script");
                        ne && t.setAttribute("nonce", ne);
                        t.innerHTML = r.slice(15 + (ne ? ne.length : 0), -9);
                        e.head.appendChild(t)
                    }
                }
                ;
                document.head.appendChild(t);
                "srcdoc"in t ? t.srcdoc = r : t.contentDocument.write(r)
            }
            )) : Promise.all([Le || ge(createBlob(Ce)).then(( () => Oe = true), noop), pe && ge(createBlob(xe.replace("x", createBlob("", "text/css")))).then(( () => Se = true), noop), be && ge(createBlob(jsonModulescheck.replace("x", createBlob("{}", "text/json")))).then(( () => $e = true), noop)])
    }
    ));
    let Ue, Ee, Me, Ie = 2 << 19;
    const je = 1 === new Uint8Array(new Uint16Array([1]).buffer)[0] ? function(e, t) {
        const r = e.length;
        let s = 0;
        for (; s < r; )
            t[s] = e.charCodeAt(s++)
    }
    : function(e, t) {
        const r = e.length;
        let s = 0;
        for (; s < r; ) {
            const r = e.charCodeAt(s);
            t[s++] = (255 & r) << 8 | r >>> 8
        }
    }
      , Re = "xportmportlassetafromssertvoyiedelecontininstantybreareturdebuggeawaithrwhileforifcatcfinallels";
    let Te, _e, Ne;
    function parse(e, t="@") {
        Te = e,
        _e = t;
        const r = 2 * Te.length + (2 << 18);
        if (r > Ie || !Ue) {
            for (; r > Ie; )
                Ie *= 2;
            Ee = new ArrayBuffer(Ie),
            je(Re, new Uint16Array(Ee,16,95)),
            Ue = function(e, t, r) {
                "use asm";
                var s = new e.Int8Array(r)
                  , n = new e.Int16Array(r)
                  , a = new e.Int32Array(r)
                  , i = new e.Uint8Array(r)
                  , c = new e.Uint16Array(r)
                  , f = 1008;
                function b(e) {
                    e = e | 0;
                    var t = 0
                      , r = 0
                      , i = 0
                      , te = 0
                      , se = 0
                      , ne = 0;
                    ne = f;
                    f = f + 10240 | 0;
                    s[775] = 1;
                    n[385] = 0;
                    n[386] = 0;
                    a[62] = a[2];
                    s[776] = 0;
                    a[61] = 0;
                    s[774] = 0;
                    a[63] = ne + 2048;
                    a[64] = ne;
                    s[777] = 0;
                    e = (a[3] | 0) + -2 | 0;
                    a[65] = e;
                    t = e + (a[59] << 1) | 0;
                    a[66] = t;
                    e: while (1) {
                        r = e + 2 | 0;
                        a[65] = r;
                        if (e >>> 0 >= t >>> 0) {
                            te = 18;
                            break
                        }
                        t: do {
                            switch (n[r >> 1] | 0) {
                            case 9:
                            case 10:
                            case 11:
                            case 12:
                            case 13:
                            case 32:
                                break;
                            case 101:
                                {
                                    if ((((n[386] | 0) == 0 ? F(r) | 0 : 0) ? (m(e + 4 | 0, 16, 10) | 0) == 0 : 0) ? (l(),
                                    (s[775] | 0) == 0) : 0) {
                                        te = 9;
                                        break e
                                    } else
                                        te = 17;
                                    break
                                }
                            case 105:
                                {
                                    if (F(r) | 0 ? (m(e + 4 | 0, 26, 10) | 0) == 0 : 0) {
                                        k();
                                        te = 17
                                    } else
                                        te = 17;
                                    break
                                }
                            case 59:
                                {
                                    te = 17;
                                    break
                                }
                            case 47:
                                switch (n[e + 4 >> 1] | 0) {
                                case 47:
                                    {
                                        E();
                                        break t
                                    }
                                case 42:
                                    {
                                        y(1);
                                        break t
                                    }
                                default:
                                    {
                                        te = 16;
                                        break e
                                    }
                                }
                            default:
                                {
                                    te = 16;
                                    break e
                                }
                            }
                        } while (0);
                        if ((te | 0) == 17) {
                            te = 0;
                            a[62] = a[65]
                        }
                        e = a[65] | 0;
                        t = a[66] | 0
                    }
                    if ((te | 0) == 9) {
                        e = a[65] | 0;
                        a[62] = e;
                        te = 19
                    } else if ((te | 0) == 16) {
                        s[775] = 0;
                        a[65] = e;
                        te = 19
                    } else if ((te | 0) == 18)
                        if (!(s[774] | 0)) {
                            e = r;
                            te = 19
                        } else
                            e = 0;
                    do {
                        if ((te | 0) == 19) {
                            e: while (1) {
                                t = e + 2 | 0;
                                a[65] = t;
                                i = t;
                                if (e >>> 0 >= (a[66] | 0) >>> 0) {
                                    te = 82;
                                    break
                                }
                                t: do {
                                    switch (n[t >> 1] | 0) {
                                    case 9:
                                    case 10:
                                    case 11:
                                    case 12:
                                    case 13:
                                    case 32:
                                        break;
                                    case 101:
                                        {
                                            if (((n[386] | 0) == 0 ? F(t) | 0 : 0) ? (m(e + 4 | 0, 16, 10) | 0) == 0 : 0) {
                                                l();
                                                te = 81
                                            } else
                                                te = 81;
                                            break
                                        }
                                    case 105:
                                        {
                                            if (F(t) | 0 ? (m(e + 4 | 0, 26, 10) | 0) == 0 : 0) {
                                                k();
                                                te = 81
                                            } else
                                                te = 81;
                                            break
                                        }
                                    case 99:
                                        {
                                            if ((F(t) | 0 ? (m(e + 4 | 0, 36, 8) | 0) == 0 : 0) ? R(n[e + 12 >> 1] | 0) | 0 : 0) {
                                                s[777] = 1;
                                                te = 81
                                            } else
                                                te = 81;
                                            break
                                        }
                                    case 40:
                                        {
                                            i = a[63] | 0;
                                            t = n[386] | 0;
                                            te = t & 65535;
                                            a[i + (te << 3) >> 2] = 1;
                                            r = a[62] | 0;
                                            n[386] = t + 1 << 16 >> 16;
                                            a[i + (te << 3) + 4 >> 2] = r;
                                            te = 81;
                                            break
                                        }
                                    case 41:
                                        {
                                            t = n[386] | 0;
                                            if (!(t << 16 >> 16)) {
                                                te = 36;
                                                break e
                                            }
                                            t = t + -1 << 16 >> 16;
                                            n[386] = t;
                                            r = n[385] | 0;
                                            if (r << 16 >> 16 != 0 ? (se = a[(a[64] | 0) + ((r & 65535) + -1 << 2) >> 2] | 0,
                                            (a[se + 20 >> 2] | 0) == (a[(a[63] | 0) + ((t & 65535) << 3) + 4 >> 2] | 0)) : 0) {
                                                t = se + 4 | 0;
                                                if (!(a[t >> 2] | 0))
                                                    a[t >> 2] = i;
                                                a[se + 12 >> 2] = e + 4;
                                                n[385] = r + -1 << 16 >> 16;
                                                te = 81
                                            } else
                                                te = 81;
                                            break
                                        }
                                    case 123:
                                        {
                                            te = a[62] | 0;
                                            i = a[56] | 0;
                                            e = te;
                                            do {
                                                if ((n[te >> 1] | 0) == 41 & (i | 0) != 0 ? (a[i + 4 >> 2] | 0) == (te | 0) : 0) {
                                                    t = a[57] | 0;
                                                    a[56] = t;
                                                    if (!t) {
                                                        a[52] = 0;
                                                        break
                                                    } else {
                                                        a[t + 28 >> 2] = 0;
                                                        break
                                                    }
                                                }
                                            } while (0);
                                            i = a[63] | 0;
                                            r = n[386] | 0;
                                            te = r & 65535;
                                            a[i + (te << 3) >> 2] = (s[777] | 0) == 0 ? 2 : 6;
                                            n[386] = r + 1 << 16 >> 16;
                                            a[i + (te << 3) + 4 >> 2] = e;
                                            s[777] = 0;
                                            te = 81;
                                            break
                                        }
                                    case 125:
                                        {
                                            e = n[386] | 0;
                                            if (!(e << 16 >> 16)) {
                                                te = 49;
                                                break e
                                            }
                                            i = a[63] | 0;
                                            te = e + -1 << 16 >> 16;
                                            n[386] = te;
                                            if ((a[i + ((te & 65535) << 3) >> 2] | 0) == 4) {
                                                h();
                                                te = 81
                                            } else
                                                te = 81;
                                            break
                                        }
                                    case 39:
                                        {
                                            d(39);
                                            te = 81;
                                            break
                                        }
                                    case 34:
                                        {
                                            d(34);
                                            te = 81;
                                            break
                                        }
                                    case 47:
                                        switch (n[e + 4 >> 1] | 0) {
                                        case 47:
                                            {
                                                E();
                                                break t
                                            }
                                        case 42:
                                            {
                                                y(1);
                                                break t
                                            }
                                        default:
                                            {
                                                e = a[62] | 0;
                                                i = n[e >> 1] | 0;
                                                r: do {
                                                    if (!(U(i) | 0)) {
                                                        switch (i << 16 >> 16) {
                                                        case 41:
                                                            if (z(a[(a[63] | 0) + (c[386] << 3) + 4 >> 2] | 0) | 0) {
                                                                te = 69;
                                                                break r
                                                            } else {
                                                                te = 66;
                                                                break r
                                                            }
                                                        case 125:
                                                            break;
                                                        default:
                                                            {
                                                                te = 66;
                                                                break r
                                                            }
                                                        }
                                                        t = a[63] | 0;
                                                        r = c[386] | 0;
                                                        if (!(p(a[t + (r << 3) + 4 >> 2] | 0) | 0) ? (a[t + (r << 3) >> 2] | 0) != 6 : 0)
                                                            te = 66;
                                                        else
                                                            te = 69
                                                    } else
                                                        switch (i << 16 >> 16) {
                                                        case 46:
                                                            if (((n[e + -2 >> 1] | 0) + -48 & 65535) < 10) {
                                                                te = 66;
                                                                break r
                                                            } else {
                                                                te = 69;
                                                                break r
                                                            }
                                                        case 43:
                                                            if ((n[e + -2 >> 1] | 0) == 43) {
                                                                te = 66;
                                                                break r
                                                            } else {
                                                                te = 69;
                                                                break r
                                                            }
                                                        case 45:
                                                            if ((n[e + -2 >> 1] | 0) == 45) {
                                                                te = 66;
                                                                break r
                                                            } else {
                                                                te = 69;
                                                                break r
                                                            }
                                                        default:
                                                            {
                                                                te = 69;
                                                                break r
                                                            }
                                                        }
                                                } while (0);
                                                r: do {
                                                    if ((te | 0) == 66) {
                                                        te = 0;
                                                        if (!(u(e) | 0)) {
                                                            switch (i << 16 >> 16) {
                                                            case 0:
                                                                {
                                                                    te = 69;
                                                                    break r
                                                                }
                                                            case 47:
                                                                {
                                                                    if (s[776] | 0) {
                                                                        te = 69;
                                                                        break r
                                                                    }
                                                                    break
                                                                }
                                                            default:
                                                                {}
                                                            }
                                                            r = a[3] | 0;
                                                            t = i;
                                                            do {
                                                                if (e >>> 0 <= r >>> 0)
                                                                    break;
                                                                e = e + -2 | 0;
                                                                a[62] = e;
                                                                t = n[e >> 1] | 0
                                                            } while (!(B(t) | 0));
                                                            if (D(t) | 0) {
                                                                do {
                                                                    if (e >>> 0 <= r >>> 0)
                                                                        break;
                                                                    e = e + -2 | 0;
                                                                    a[62] = e
                                                                } while (D(n[e >> 1] | 0) | 0);
                                                                if ($(e) | 0) {
                                                                    g();
                                                                    s[776] = 0;
                                                                    te = 81;
                                                                    break t
                                                                } else
                                                                    e = 1
                                                            } else
                                                                e = 1
                                                        } else
                                                            te = 69
                                                    }
                                                } while (0);
                                                if ((te | 0) == 69) {
                                                    g();
                                                    e = 0
                                                }
                                                s[776] = e;
                                                te = 81;
                                                break t
                                            }
                                        }
                                    case 96:
                                        {
                                            i = a[63] | 0;
                                            r = n[386] | 0;
                                            te = r & 65535;
                                            a[i + (te << 3) + 4 >> 2] = a[62];
                                            n[386] = r + 1 << 16 >> 16;
                                            a[i + (te << 3) >> 2] = 3;
                                            h();
                                            te = 81;
                                            break
                                        }
                                    default:
                                        te = 81
                                    }
                                } while (0);
                                if ((te | 0) == 81) {
                                    te = 0;
                                    a[62] = a[65]
                                }
                                e = a[65] | 0
                            }
                            if ((te | 0) == 36) {
                                Q();
                                e = 0;
                                break
                            } else if ((te | 0) == 49) {
                                Q();
                                e = 0;
                                break
                            } else if ((te | 0) == 82) {
                                e = (s[774] | 0) == 0 ? (n[385] | n[386]) << 16 >> 16 == 0 : 0;
                                break
                            }
                        }
                    } while (0);
                    f = ne;
                    return e | 0
                }
                function l() {
                    var e = 0
                      , t = 0
                      , r = 0
                      , i = 0
                      , c = 0
                      , f = 0
                      , te = 0;
                    c = a[65] | 0;
                    f = a[58] | 0;
                    te = c + 12 | 0;
                    a[65] = te;
                    r = w(1) | 0;
                    e = a[65] | 0;
                    if (!((e | 0) == (te | 0) ? !(I(r) | 0) : 0))
                        i = 3;
                    e: do {
                        if ((i | 0) == 3) {
                            t: do {
                                switch (r << 16 >> 16) {
                                case 123:
                                    {
                                        a[65] = e + 2;
                                        e = w(1) | 0;
                                        r = a[65] | 0;
                                        while (1) {
                                            if (T(e) | 0) {
                                                d(e);
                                                e = (a[65] | 0) + 2 | 0;
                                                a[65] = e
                                            } else {
                                                P(e) | 0;
                                                e = a[65] | 0
                                            }
                                            w(1) | 0;
                                            e = v(r, e) | 0;
                                            if (e << 16 >> 16 == 44) {
                                                a[65] = (a[65] | 0) + 2;
                                                e = w(1) | 0
                                            }
                                            t = r;
                                            r = a[65] | 0;
                                            if (e << 16 >> 16 == 125) {
                                                i = 15;
                                                break
                                            }
                                            if ((r | 0) == (t | 0)) {
                                                i = 12;
                                                break
                                            }
                                            if (r >>> 0 > (a[66] | 0) >>> 0) {
                                                i = 14;
                                                break
                                            }
                                        }
                                        if ((i | 0) == 12) {
                                            Q();
                                            break e
                                        } else if ((i | 0) == 14) {
                                            Q();
                                            break e
                                        } else if ((i | 0) == 15) {
                                            a[65] = r + 2;
                                            break t
                                        }
                                        break
                                    }
                                case 42:
                                    {
                                        a[65] = e + 2;
                                        w(1) | 0;
                                        te = a[65] | 0;
                                        v(te, te) | 0;
                                        break
                                    }
                                default:
                                    {
                                        s[775] = 0;
                                        switch (r << 16 >> 16) {
                                        case 100:
                                            {
                                                O(e, e + 14 | 0, 0, 0);
                                                break e
                                            }
                                        case 97:
                                            {
                                                a[65] = e + 10;
                                                w(1) | 0;
                                                e = a[65] | 0;
                                                i = 20;
                                                break
                                            }
                                        case 102:
                                            {
                                                i = 20;
                                                break
                                            }
                                        case 99:
                                            {
                                                if ((m(e + 2 | 0, 36, 8) | 0) == 0 ? (t = e + 10 | 0,
                                                B(n[t >> 1] | 0) | 0) : 0) {
                                                    a[65] = t;
                                                    te = w(1) | 0;
                                                    f = a[65] | 0;
                                                    P(te) | 0;
                                                    te = a[65] | 0;
                                                    O(f, te, f, te);
                                                    a[65] = (a[65] | 0) + -2;
                                                    break e
                                                }
                                                e = e + 4 | 0;
                                                a[65] = e;
                                                break
                                            }
                                        case 108:
                                        case 118:
                                            break;
                                        default:
                                            break e
                                        }
                                        if ((i | 0) == 20) {
                                            a[65] = e + 16;
                                            e = w(1) | 0;
                                            if (e << 16 >> 16 == 42) {
                                                a[65] = (a[65] | 0) + 2;
                                                e = w(1) | 0
                                            }
                                            f = a[65] | 0;
                                            P(e) | 0;
                                            te = a[65] | 0;
                                            O(f, te, f, te);
                                            a[65] = (a[65] | 0) + -2;
                                            break e
                                        }
                                        e = e + 4 | 0;
                                        a[65] = e;
                                        s[775] = 0;
                                        r: while (1) {
                                            a[65] = e + 2;
                                            te = w(1) | 0;
                                            e = a[65] | 0;
                                            switch ((P(te) | 0) << 16 >> 16) {
                                            case 91:
                                            case 123:
                                                break r;
                                            default:
                                                {}
                                            }
                                            t = a[65] | 0;
                                            if ((t | 0) == (e | 0))
                                                break e;
                                            O(e, t, e, t);
                                            if ((w(1) | 0) << 16 >> 16 != 44)
                                                break;
                                            e = a[65] | 0
                                        }
                                        a[65] = (a[65] | 0) + -2;
                                        break e
                                    }
                                }
                            } while (0);
                            te = (w(1) | 0) << 16 >> 16 == 102;
                            e = a[65] | 0;
                            if (te ? (m(e + 2 | 0, 52, 6) | 0) == 0 : 0) {
                                a[65] = e + 8;
                                o(c, w(1) | 0);
                                e = (f | 0) == 0 ? 212 : f + 16 | 0;
                                while (1) {
                                    e = a[e >> 2] | 0;
                                    if (!e)
                                        break e;
                                    a[e + 12 >> 2] = 0;
                                    a[e + 8 >> 2] = 0;
                                    e = e + 16 | 0
                                }
                            }
                            a[65] = e + -2
                        }
                    } while (0);
                    return
                }
                function k() {
                    var e = 0
                      , t = 0
                      , r = 0
                      , i = 0
                      , c = 0
                      , f = 0;
                    c = a[65] | 0;
                    t = c + 12 | 0;
                    a[65] = t;
                    e: do {
                        switch ((w(1) | 0) << 16 >> 16) {
                        case 40:
                            {
                                t = a[63] | 0;
                                f = n[386] | 0;
                                r = f & 65535;
                                a[t + (r << 3) >> 2] = 5;
                                e = a[65] | 0;
                                n[386] = f + 1 << 16 >> 16;
                                a[t + (r << 3) + 4 >> 2] = e;
                                if ((n[a[62] >> 1] | 0) != 46) {
                                    a[65] = e + 2;
                                    f = w(1) | 0;
                                    A(c, a[65] | 0, 0, e);
                                    t = a[56] | 0;
                                    r = a[64] | 0;
                                    c = n[385] | 0;
                                    n[385] = c + 1 << 16 >> 16;
                                    a[r + ((c & 65535) << 2) >> 2] = t;
                                    switch (f << 16 >> 16) {
                                    case 39:
                                        {
                                            d(39);
                                            break
                                        }
                                    case 34:
                                        {
                                            d(34);
                                            break
                                        }
                                    default:
                                        {
                                            a[65] = (a[65] | 0) + -2;
                                            break e
                                        }
                                    }
                                    e = (a[65] | 0) + 2 | 0;
                                    a[65] = e;
                                    switch ((w(1) | 0) << 16 >> 16) {
                                    case 44:
                                        {
                                            a[65] = (a[65] | 0) + 2;
                                            w(1) | 0;
                                            c = a[56] | 0;
                                            a[c + 4 >> 2] = e;
                                            f = a[65] | 0;
                                            a[c + 16 >> 2] = f;
                                            s[c + 24 >> 0] = 1;
                                            a[65] = f + -2;
                                            break e
                                        }
                                    case 41:
                                        {
                                            n[386] = (n[386] | 0) + -1 << 16 >> 16;
                                            f = a[56] | 0;
                                            a[f + 4 >> 2] = e;
                                            a[f + 12 >> 2] = (a[65] | 0) + 2;
                                            s[f + 24 >> 0] = 1;
                                            n[385] = (n[385] | 0) + -1 << 16 >> 16;
                                            break e
                                        }
                                    default:
                                        {
                                            a[65] = (a[65] | 0) + -2;
                                            break e
                                        }
                                    }
                                }
                                break
                            }
                        case 46:
                            {
                                a[65] = (a[65] | 0) + 2;
                                if (((w(1) | 0) << 16 >> 16 == 109 ? (e = a[65] | 0,
                                (m(e + 2 | 0, 44, 6) | 0) == 0) : 0) ? (n[a[62] >> 1] | 0) != 46 : 0)
                                    A(c, c, e + 8 | 0, 2);
                                break
                            }
                        case 42:
                        case 39:
                        case 34:
                            {
                                i = 17;
                                break
                            }
                        case 123:
                            {
                                e = a[65] | 0;
                                if (n[386] | 0) {
                                    a[65] = e + -2;
                                    break e
                                }
                                while (1) {
                                    if (e >>> 0 >= (a[66] | 0) >>> 0)
                                        break;
                                    e = w(1) | 0;
                                    if (!(T(e) | 0)) {
                                        if (e << 16 >> 16 == 125) {
                                            i = 32;
                                            break
                                        }
                                    } else
                                        d(e);
                                    e = (a[65] | 0) + 2 | 0;
                                    a[65] = e
                                }
                                if ((i | 0) == 32)
                                    a[65] = (a[65] | 0) + 2;
                                w(1) | 0;
                                e = a[65] | 0;
                                if (m(e, 50, 8) | 0) {
                                    Q();
                                    break e
                                }
                                a[65] = e + 8;
                                e = w(1) | 0;
                                if (T(e) | 0) {
                                    o(c, e);
                                    break e
                                } else {
                                    Q();
                                    break e
                                }
                            }
                        default:
                            if ((a[65] | 0) == (t | 0))
                                a[65] = c + 10;
                            else
                                i = 17
                        }
                    } while (0);
                    do {
                        if ((i | 0) == 17) {
                            if (n[386] | 0) {
                                a[65] = (a[65] | 0) + -2;
                                break
                            }
                            e = a[66] | 0;
                            t = a[65] | 0;
                            while (1) {
                                if (t >>> 0 >= e >>> 0) {
                                    i = 24;
                                    break
                                }
                                r = n[t >> 1] | 0;
                                if (T(r) | 0) {
                                    i = 22;
                                    break
                                }
                                f = t + 2 | 0;
                                a[65] = f;
                                t = f
                            }
                            if ((i | 0) == 22) {
                                o(c, r);
                                break
                            } else if ((i | 0) == 24) {
                                Q();
                                break
                            }
                        }
                    } while (0);
                    return
                }
                function u(e) {
                    e = e | 0;
                    e: do {
                        switch (n[e >> 1] | 0) {
                        case 100:
                            switch (n[e + -2 >> 1] | 0) {
                            case 105:
                                {
                                    e = S(e + -4 | 0, 68, 2) | 0;
                                    break e
                                }
                            case 108:
                                {
                                    e = S(e + -4 | 0, 72, 3) | 0;
                                    break e
                                }
                            default:
                                {
                                    e = 0;
                                    break e
                                }
                            }
                        case 101:
                            switch (n[e + -2 >> 1] | 0) {
                            case 115:
                                switch (n[e + -4 >> 1] | 0) {
                                case 108:
                                    {
                                        e = j(e + -6 | 0, 101) | 0;
                                        break e
                                    }
                                case 97:
                                    {
                                        e = j(e + -6 | 0, 99) | 0;
                                        break e
                                    }
                                default:
                                    {
                                        e = 0;
                                        break e
                                    }
                                }
                            case 116:
                                {
                                    e = S(e + -4 | 0, 78, 4) | 0;
                                    break e
                                }
                            case 117:
                                {
                                    e = S(e + -4 | 0, 86, 6) | 0;
                                    break e
                                }
                            default:
                                {
                                    e = 0;
                                    break e
                                }
                            }
                        case 102:
                            {
                                if ((n[e + -2 >> 1] | 0) == 111 ? (n[e + -4 >> 1] | 0) == 101 : 0)
                                    switch (n[e + -6 >> 1] | 0) {
                                    case 99:
                                        {
                                            e = S(e + -8 | 0, 98, 6) | 0;
                                            break e
                                        }
                                    case 112:
                                        {
                                            e = S(e + -8 | 0, 110, 2) | 0;
                                            break e
                                        }
                                    default:
                                        {
                                            e = 0;
                                            break e
                                        }
                                    }
                                else
                                    e = 0;
                                break
                            }
                        case 107:
                            {
                                e = S(e + -2 | 0, 114, 4) | 0;
                                break
                            }
                        case 110:
                            {
                                e = e + -2 | 0;
                                if (j(e, 105) | 0)
                                    e = 1;
                                else
                                    e = S(e, 122, 5) | 0;
                                break
                            }
                        case 111:
                            {
                                e = j(e + -2 | 0, 100) | 0;
                                break
                            }
                        case 114:
                            {
                                e = S(e + -2 | 0, 132, 7) | 0;
                                break
                            }
                        case 116:
                            {
                                e = S(e + -2 | 0, 146, 4) | 0;
                                break
                            }
                        case 119:
                            switch (n[e + -2 >> 1] | 0) {
                            case 101:
                                {
                                    e = j(e + -4 | 0, 110) | 0;
                                    break e
                                }
                            case 111:
                                {
                                    e = S(e + -4 | 0, 154, 3) | 0;
                                    break e
                                }
                            default:
                                {
                                    e = 0;
                                    break e
                                }
                            }
                        default:
                            e = 0
                        }
                    } while (0);
                    return e | 0
                }
                function o(e, t) {
                    e = e | 0;
                    t = t | 0;
                    var r = 0
                      , s = 0;
                    r = (a[65] | 0) + 2 | 0;
                    switch (t << 16 >> 16) {
                    case 39:
                        {
                            d(39);
                            s = 5;
                            break
                        }
                    case 34:
                        {
                            d(34);
                            s = 5;
                            break
                        }
                    default:
                        Q()
                    }
                    do {
                        if ((s | 0) == 5) {
                            A(e, r, a[65] | 0, 1);
                            a[65] = (a[65] | 0) + 2;
                            s = (w(0) | 0) << 16 >> 16 == 97;
                            t = a[65] | 0;
                            if (s ? (m(t + 2 | 0, 58, 10) | 0) == 0 : 0) {
                                a[65] = t + 12;
                                if ((w(1) | 0) << 16 >> 16 != 123) {
                                    a[65] = t;
                                    break
                                }
                                e = a[65] | 0;
                                r = e;
                                e: while (1) {
                                    a[65] = r + 2;
                                    r = w(1) | 0;
                                    switch (r << 16 >> 16) {
                                    case 39:
                                        {
                                            d(39);
                                            a[65] = (a[65] | 0) + 2;
                                            r = w(1) | 0;
                                            break
                                        }
                                    case 34:
                                        {
                                            d(34);
                                            a[65] = (a[65] | 0) + 2;
                                            r = w(1) | 0;
                                            break
                                        }
                                    default:
                                        r = P(r) | 0
                                    }
                                    if (r << 16 >> 16 != 58) {
                                        s = 16;
                                        break
                                    }
                                    a[65] = (a[65] | 0) + 2;
                                    switch ((w(1) | 0) << 16 >> 16) {
                                    case 39:
                                        {
                                            d(39);
                                            break
                                        }
                                    case 34:
                                        {
                                            d(34);
                                            break
                                        }
                                    default:
                                        {
                                            s = 20;
                                            break e
                                        }
                                    }
                                    a[65] = (a[65] | 0) + 2;
                                    switch ((w(1) | 0) << 16 >> 16) {
                                    case 125:
                                        {
                                            s = 25;
                                            break e
                                        }
                                    case 44:
                                        break;
                                    default:
                                        {
                                            s = 24;
                                            break e
                                        }
                                    }
                                    a[65] = (a[65] | 0) + 2;
                                    if ((w(1) | 0) << 16 >> 16 == 125) {
                                        s = 25;
                                        break
                                    }
                                    r = a[65] | 0
                                }
                                if ((s | 0) == 16) {
                                    a[65] = t;
                                    break
                                } else if ((s | 0) == 20) {
                                    a[65] = t;
                                    break
                                } else if ((s | 0) == 24) {
                                    a[65] = t;
                                    break
                                } else if ((s | 0) == 25) {
                                    s = a[56] | 0;
                                    a[s + 16 >> 2] = e;
                                    a[s + 12 >> 2] = (a[65] | 0) + 2;
                                    break
                                }
                            }
                            a[65] = t + -2
                        }
                    } while (0);
                    return
                }
                function h() {
                    var e = 0
                      , t = 0
                      , r = 0
                      , s = 0;
                    t = a[66] | 0;
                    r = a[65] | 0;
                    e: while (1) {
                        e = r + 2 | 0;
                        if (r >>> 0 >= t >>> 0) {
                            t = 10;
                            break
                        }
                        switch (n[e >> 1] | 0) {
                        case 96:
                            {
                                t = 7;
                                break e
                            }
                        case 36:
                            {
                                if ((n[r + 4 >> 1] | 0) == 123) {
                                    t = 6;
                                    break e
                                }
                                break
                            }
                        case 92:
                            {
                                e = r + 4 | 0;
                                break
                            }
                        default:
                            {}
                        }
                        r = e
                    }
                    if ((t | 0) == 6) {
                        e = r + 4 | 0;
                        a[65] = e;
                        t = a[63] | 0;
                        s = n[386] | 0;
                        r = s & 65535;
                        a[t + (r << 3) >> 2] = 4;
                        n[386] = s + 1 << 16 >> 16;
                        a[t + (r << 3) + 4 >> 2] = e
                    } else if ((t | 0) == 7) {
                        a[65] = e;
                        r = a[63] | 0;
                        s = (n[386] | 0) + -1 << 16 >> 16;
                        n[386] = s;
                        if ((a[r + ((s & 65535) << 3) >> 2] | 0) != 3)
                            Q()
                    } else if ((t | 0) == 10) {
                        a[65] = e;
                        Q()
                    }
                    return
                }
                function w(e) {
                    e = e | 0;
                    var t = 0
                      , r = 0
                      , s = 0;
                    r = a[65] | 0;
                    e: do {
                        t = n[r >> 1] | 0;
                        t: do {
                            if (t << 16 >> 16 != 47)
                                if (e)
                                    if (R(t) | 0)
                                        break;
                                    else
                                        break e;
                                else if (D(t) | 0)
                                    break;
                                else
                                    break e;
                            else
                                switch (n[r + 2 >> 1] | 0) {
                                case 47:
                                    {
                                        E();
                                        break t
                                    }
                                case 42:
                                    {
                                        y(e);
                                        break t
                                    }
                                default:
                                    {
                                        t = 47;
                                        break e
                                    }
                                }
                        } while (0);
                        s = a[65] | 0;
                        r = s + 2 | 0;
                        a[65] = r
                    } while (s >>> 0 < (a[66] | 0) >>> 0);
                    return t | 0
                }
                function d(e) {
                    e = e | 0;
                    var t = 0
                      , r = 0
                      , s = 0
                      , i = 0;
                    i = a[66] | 0;
                    t = a[65] | 0;
                    while (1) {
                        s = t + 2 | 0;
                        if (t >>> 0 >= i >>> 0) {
                            t = 9;
                            break
                        }
                        r = n[s >> 1] | 0;
                        if (r << 16 >> 16 == e << 16 >> 16) {
                            t = 10;
                            break
                        }
                        if (r << 16 >> 16 == 92) {
                            r = t + 4 | 0;
                            if ((n[r >> 1] | 0) == 13) {
                                t = t + 6 | 0;
                                t = (n[t >> 1] | 0) == 10 ? t : r
                            } else
                                t = r
                        } else if (X(r) | 0) {
                            t = 9;
                            break
                        } else
                            t = s
                    }
                    if ((t | 0) == 9) {
                        a[65] = s;
                        Q()
                    } else if ((t | 0) == 10)
                        a[65] = s;
                    return
                }
                function v(e, t) {
                    e = e | 0;
                    t = t | 0;
                    var r = 0
                      , s = 0
                      , i = 0
                      , c = 0;
                    r = a[65] | 0;
                    s = n[r >> 1] | 0;
                    c = (e | 0) == (t | 0);
                    i = c ? 0 : e;
                    c = c ? 0 : t;
                    if (s << 16 >> 16 == 97) {
                        a[65] = r + 4;
                        r = w(1) | 0;
                        e = a[65] | 0;
                        if (T(r) | 0) {
                            d(r);
                            t = (a[65] | 0) + 2 | 0;
                            a[65] = t
                        } else {
                            P(r) | 0;
                            t = a[65] | 0
                        }
                        s = w(1) | 0;
                        r = a[65] | 0
                    }
                    if ((r | 0) != (e | 0))
                        O(e, t, i, c);
                    return s | 0
                }
                function A(e, t, r, n) {
                    e = e | 0;
                    t = t | 0;
                    r = r | 0;
                    n = n | 0;
                    var i = 0
                      , c = 0;
                    i = a[60] | 0;
                    a[60] = i + 32;
                    c = a[56] | 0;
                    a[((c | 0) == 0 ? 208 : c + 28 | 0) >> 2] = i;
                    a[57] = c;
                    a[56] = i;
                    a[i + 8 >> 2] = e;
                    if (2 == (n | 0))
                        e = r;
                    else
                        e = 1 == (n | 0) ? r + 2 | 0 : 0;
                    a[i + 12 >> 2] = e;
                    a[i >> 2] = t;
                    a[i + 4 >> 2] = r;
                    a[i + 16 >> 2] = 0;
                    a[i + 20 >> 2] = n;
                    s[i + 24 >> 0] = 1 == (n | 0) & 1;
                    a[i + 28 >> 2] = 0;
                    return
                }
                function C() {
                    var e = 0
                      , t = 0
                      , r = 0;
                    r = a[66] | 0;
                    t = a[65] | 0;
                    e: while (1) {
                        e = t + 2 | 0;
                        if (t >>> 0 >= r >>> 0) {
                            t = 6;
                            break
                        }
                        switch (n[e >> 1] | 0) {
                        case 13:
                        case 10:
                            {
                                t = 6;
                                break e
                            }
                        case 93:
                            {
                                t = 7;
                                break e
                            }
                        case 92:
                            {
                                e = t + 4 | 0;
                                break
                            }
                        default:
                            {}
                        }
                        t = e
                    }
                    if ((t | 0) == 6) {
                        a[65] = e;
                        Q();
                        e = 0
                    } else if ((t | 0) == 7) {
                        a[65] = e;
                        e = 93
                    }
                    return e | 0
                }
                function g() {
                    var e = 0
                      , t = 0
                      , r = 0;
                    e: while (1) {
                        e = a[65] | 0;
                        t = e + 2 | 0;
                        a[65] = t;
                        if (e >>> 0 >= (a[66] | 0) >>> 0) {
                            r = 7;
                            break
                        }
                        switch (n[t >> 1] | 0) {
                        case 13:
                        case 10:
                            {
                                r = 7;
                                break e
                            }
                        case 47:
                            break e;
                        case 91:
                            {
                                C() | 0;
                                break
                            }
                        case 92:
                            {
                                a[65] = e + 4;
                                break
                            }
                        default:
                            {}
                        }
                    }
                    if ((r | 0) == 7)
                        Q();
                    return
                }
                function p(e) {
                    e = e | 0;
                    switch (n[e >> 1] | 0) {
                    case 62:
                        {
                            e = (n[e + -2 >> 1] | 0) == 61;
                            break
                        }
                    case 41:
                    case 59:
                        {
                            e = 1;
                            break
                        }
                    case 104:
                        {
                            e = S(e + -2 | 0, 180, 4) | 0;
                            break
                        }
                    case 121:
                        {
                            e = S(e + -2 | 0, 188, 6) | 0;
                            break
                        }
                    case 101:
                        {
                            e = S(e + -2 | 0, 200, 3) | 0;
                            break
                        }
                    default:
                        e = 0
                    }
                    return e | 0
                }
                function y(e) {
                    e = e | 0;
                    var t = 0
                      , r = 0
                      , s = 0
                      , i = 0
                      , c = 0;
                    i = (a[65] | 0) + 2 | 0;
                    a[65] = i;
                    r = a[66] | 0;
                    while (1) {
                        t = i + 2 | 0;
                        if (i >>> 0 >= r >>> 0)
                            break;
                        s = n[t >> 1] | 0;
                        if (!e ? X(s) | 0 : 0)
                            break;
                        if (s << 16 >> 16 == 42 ? (n[i + 4 >> 1] | 0) == 47 : 0) {
                            c = 8;
                            break
                        }
                        i = t
                    }
                    if ((c | 0) == 8) {
                        a[65] = t;
                        t = i + 4 | 0
                    }
                    a[65] = t;
                    return
                }
                function m(e, t, r) {
                    e = e | 0;
                    t = t | 0;
                    r = r | 0;
                    var n = 0
                      , a = 0;
                    e: do {
                        if (!r)
                            e = 0;
                        else {
                            while (1) {
                                n = s[e >> 0] | 0;
                                a = s[t >> 0] | 0;
                                if (n << 24 >> 24 != a << 24 >> 24)
                                    break;
                                r = r + -1 | 0;
                                if (!r) {
                                    e = 0;
                                    break e
                                } else {
                                    e = e + 1 | 0;
                                    t = t + 1 | 0
                                }
                            }
                            e = (n & 255) - (a & 255) | 0
                        }
                    } while (0);
                    return e | 0
                }
                function I(e) {
                    e = e | 0;
                    e: do {
                        switch (e << 16 >> 16) {
                        case 38:
                        case 37:
                        case 33:
                            {
                                e = 1;
                                break
                            }
                        default:
                            if ((e & -8) << 16 >> 16 == 40 | (e + -58 & 65535) < 6)
                                e = 1;
                            else {
                                switch (e << 16 >> 16) {
                                case 91:
                                case 93:
                                case 94:
                                    {
                                        e = 1;
                                        break e
                                    }
                                default:
                                    {}
                                }
                                e = (e + -123 & 65535) < 4
                            }
                        }
                    } while (0);
                    return e | 0
                }
                function U(e) {
                    e = e | 0;
                    e: do {
                        switch (e << 16 >> 16) {
                        case 38:
                        case 37:
                        case 33:
                            break;
                        default:
                            if (!((e + -58 & 65535) < 6 | (e + -40 & 65535) < 7 & e << 16 >> 16 != 41)) {
                                switch (e << 16 >> 16) {
                                case 91:
                                case 94:
                                    break e;
                                default:
                                    {}
                                }
                                return e << 16 >> 16 != 125 & (e + -123 & 65535) < 4 | 0
                            }
                        }
                    } while (0);
                    return 1
                }
                function x(e) {
                    e = e | 0;
                    var t = 0
                      , r = 0
                      , s = 0
                      , i = 0;
                    r = f;
                    f = f + 16 | 0;
                    s = r;
                    a[s >> 2] = 0;
                    a[59] = e;
                    t = a[3] | 0;
                    i = t + (e << 1) | 0;
                    e = i + 2 | 0;
                    n[i >> 1] = 0;
                    a[s >> 2] = e;
                    a[60] = e;
                    a[52] = 0;
                    a[56] = 0;
                    a[54] = 0;
                    a[53] = 0;
                    a[58] = 0;
                    a[55] = 0;
                    f = r;
                    return t | 0
                }
                function S(e, t, r) {
                    e = e | 0;
                    t = t | 0;
                    r = r | 0;
                    var s = 0
                      , i = 0;
                    s = e + (0 - r << 1) | 0;
                    i = s + 2 | 0;
                    e = a[3] | 0;
                    if (i >>> 0 >= e >>> 0 ? (m(i, t, r << 1) | 0) == 0 : 0)
                        if ((i | 0) == (e | 0))
                            e = 1;
                        else
                            e = B(n[s >> 1] | 0) | 0;
                    else
                        e = 0;
                    return e | 0
                }
                function O(e, t, r, s) {
                    e = e | 0;
                    t = t | 0;
                    r = r | 0;
                    s = s | 0;
                    var n = 0
                      , i = 0;
                    n = a[60] | 0;
                    a[60] = n + 20;
                    i = a[58] | 0;
                    a[((i | 0) == 0 ? 212 : i + 16 | 0) >> 2] = n;
                    a[58] = n;
                    a[n >> 2] = e;
                    a[n + 4 >> 2] = t;
                    a[n + 8 >> 2] = r;
                    a[n + 12 >> 2] = s;
                    a[n + 16 >> 2] = 0;
                    return
                }
                function $(e) {
                    e = e | 0;
                    switch (n[e >> 1] | 0) {
                    case 107:
                        {
                            e = S(e + -2 | 0, 114, 4) | 0;
                            break
                        }
                    case 101:
                        {
                            if ((n[e + -2 >> 1] | 0) == 117)
                                e = S(e + -4 | 0, 86, 6) | 0;
                            else
                                e = 0;
                            break
                        }
                    default:
                        e = 0
                    }
                    return e | 0
                }
                function j(e, t) {
                    e = e | 0;
                    t = t | 0;
                    var r = 0;
                    r = a[3] | 0;
                    if (r >>> 0 <= e >>> 0 ? (n[e >> 1] | 0) == t << 16 >> 16 : 0)
                        if ((r | 0) == (e | 0))
                            r = 1;
                        else
                            r = B(n[e + -2 >> 1] | 0) | 0;
                    else
                        r = 0;
                    return r | 0
                }
                function B(e) {
                    e = e | 0;
                    e: do {
                        if ((e + -9 & 65535) < 5)
                            e = 1;
                        else {
                            switch (e << 16 >> 16) {
                            case 32:
                            case 160:
                                {
                                    e = 1;
                                    break e
                                }
                            default:
                                {}
                            }
                            e = e << 16 >> 16 != 46 & (I(e) | 0)
                        }
                    } while (0);
                    return e | 0
                }
                function E() {
                    var e = 0
                      , t = 0
                      , r = 0;
                    e = a[66] | 0;
                    r = a[65] | 0;
                    e: while (1) {
                        t = r + 2 | 0;
                        if (r >>> 0 >= e >>> 0)
                            break;
                        switch (n[t >> 1] | 0) {
                        case 13:
                        case 10:
                            break e;
                        default:
                            r = t
                        }
                    }
                    a[65] = t;
                    return
                }
                function P(e) {
                    e = e | 0;
                    while (1) {
                        if (R(e) | 0)
                            break;
                        if (I(e) | 0)
                            break;
                        e = (a[65] | 0) + 2 | 0;
                        a[65] = e;
                        e = n[e >> 1] | 0;
                        if (!(e << 16 >> 16)) {
                            e = 0;
                            break
                        }
                    }
                    return e | 0
                }
                function q() {
                    var e = 0;
                    e = a[(a[54] | 0) + 20 >> 2] | 0;
                    switch (e | 0) {
                    case 1:
                        {
                            e = -1;
                            break
                        }
                    case 2:
                        {
                            e = -2;
                            break
                        }
                    default:
                        e = e - (a[3] | 0) >> 1
                    }
                    return e | 0
                }
                function z(e) {
                    e = e | 0;
                    if (!(S(e, 160, 5) | 0) ? !(S(e, 170, 3) | 0) : 0)
                        e = S(e, 176, 2) | 0;
                    else
                        e = 1;
                    return e | 0
                }
                function D(e) {
                    e = e | 0;
                    switch (e << 16 >> 16) {
                    case 160:
                    case 32:
                    case 12:
                    case 11:
                    case 9:
                        {
                            e = 1;
                            break
                        }
                    default:
                        e = 0
                    }
                    return e | 0
                }
                function F(e) {
                    e = e | 0;
                    if ((a[3] | 0) == (e | 0))
                        e = 1;
                    else
                        e = B(n[e + -2 >> 1] | 0) | 0;
                    return e | 0
                }
                function G() {
                    var e = 0;
                    e = a[(a[55] | 0) + 12 >> 2] | 0;
                    if (!e)
                        e = -1;
                    else
                        e = e - (a[3] | 0) >> 1;
                    return e | 0
                }
                function H() {
                    var e = 0;
                    e = a[(a[54] | 0) + 12 >> 2] | 0;
                    if (!e)
                        e = -1;
                    else
                        e = e - (a[3] | 0) >> 1;
                    return e | 0
                }
                function J() {
                    var e = 0;
                    e = a[(a[55] | 0) + 8 >> 2] | 0;
                    if (!e)
                        e = -1;
                    else
                        e = e - (a[3] | 0) >> 1;
                    return e | 0
                }
                function K() {
                    var e = 0;
                    e = a[(a[54] | 0) + 16 >> 2] | 0;
                    if (!e)
                        e = -1;
                    else
                        e = e - (a[3] | 0) >> 1;
                    return e | 0
                }
                function L() {
                    var e = 0;
                    e = a[(a[54] | 0) + 4 >> 2] | 0;
                    if (!e)
                        e = -1;
                    else
                        e = e - (a[3] | 0) >> 1;
                    return e | 0
                }
                function M() {
                    var e = 0;
                    e = a[54] | 0;
                    e = a[((e | 0) == 0 ? 208 : e + 28 | 0) >> 2] | 0;
                    a[54] = e;
                    return (e | 0) != 0 | 0
                }
                function N() {
                    var e = 0;
                    e = a[55] | 0;
                    e = a[((e | 0) == 0 ? 212 : e + 16 | 0) >> 2] | 0;
                    a[55] = e;
                    return (e | 0) != 0 | 0
                }
                function Q() {
                    s[774] = 1;
                    a[61] = (a[65] | 0) - (a[3] | 0) >> 1;
                    a[65] = (a[66] | 0) + 2;
                    return
                }
                function R(e) {
                    e = e | 0;
                    return (e | 128) << 16 >> 16 == 160 | (e + -9 & 65535) < 5 | 0
                }
                function T(e) {
                    e = e | 0;
                    return e << 16 >> 16 == 39 | e << 16 >> 16 == 34 | 0
                }
                function V() {
                    return (a[(a[54] | 0) + 8 >> 2] | 0) - (a[3] | 0) >> 1 | 0
                }
                function W() {
                    return (a[(a[55] | 0) + 4 >> 2] | 0) - (a[3] | 0) >> 1 | 0
                }
                function X(e) {
                    e = e | 0;
                    return e << 16 >> 16 == 13 | e << 16 >> 16 == 10 | 0
                }
                function Y() {
                    return (a[a[54] >> 2] | 0) - (a[3] | 0) >> 1 | 0
                }
                function Z() {
                    return (a[a[55] >> 2] | 0) - (a[3] | 0) >> 1 | 0
                }
                function _() {
                    return i[(a[54] | 0) + 24 >> 0] | 0 | 0
                }
                function ee(e) {
                    e = e | 0;
                    a[3] = e;
                    return
                }
                function ae() {
                    return (s[775] | 0) != 0 | 0
                }
                function re() {
                    return a[61] | 0
                }
                function ie(e) {
                    e = e | 0;
                    f = e + 992 + 15 & -16;
                    return 992
                }
                return {
                    su: ie,
                    ai: K,
                    e: re,
                    ee: W,
                    ele: G,
                    els: J,
                    es: Z,
                    f: ae,
                    id: q,
                    ie: L,
                    ip: _,
                    is: Y,
                    p: b,
                    re: N,
                    ri: M,
                    sa: x,
                    se: H,
                    ses: ee,
                    ss: V
                }
            }("undefined" != typeof self ? self : global, {}, Ee),
            Me = Ue.su(Ie - (2 << 17))
        }
        const s = Te.length + 1;
        Ue.ses(Me),
        Ue.sa(s - 1),
        je(Te, new Uint16Array(Ee,Me,s)),
        Ue.p() || (Ne = Ue.e(),
        o());
        const n = []
          , a = [];
        for (; Ue.ri(); ) {
            const e = Ue.is()
              , t = Ue.ie()
              , r = Ue.ai()
              , s = Ue.id()
              , a = Ue.ss()
              , i = Ue.se();
            let c;
            Ue.ip() && (c = b(-1 === s ? e : e + 1, Te.charCodeAt(-1 === s ? e - 1 : e))),
            n.push({
                n: c,
                s: e,
                e: t,
                ss: a,
                se: i,
                d: s,
                a: r
            })
        }
        for (; Ue.re(); ) {
            const e = Ue.es()
              , t = Ue.ee()
              , r = Ue.els()
              , s = Ue.ele()
              , n = Te.charCodeAt(e)
              , i = r >= 0 ? Te.charCodeAt(r) : -1;
            a.push({
                s: e,
                e: t,
                ls: r,
                le: s,
                n: 34 === n || 39 === n ? b(e + 1, n) : Te.slice(e, t),
                ln: r < 0 ? void 0 : 34 === i || 39 === i ? b(r + 1, i) : Te.slice(r, s)
            })
        }
        return [n, a, !!Ue.f()]
    }
    function b(e, t) {
        Ne = e;
        let r = ""
          , s = Ne;
        for (; ; ) {
            Ne >= Te.length && o();
            const e = Te.charCodeAt(Ne);
            if (e === t)
                break;
            92 === e ? (r += Te.slice(s, Ne),
            r += l(),
            s = Ne) : (8232 === e || 8233 === e || u(e) && o(),
            ++Ne)
        }
        return r += Te.slice(s, Ne++),
        r
    }
    function l() {
        let e = Te.charCodeAt(++Ne);
        switch (++Ne,
        e) {
        case 110:
            return "\n";
        case 114:
            return "\r";
        case 120:
            return String.fromCharCode(k(2));
        case 117:
            return function() {
                let e;
                123 === Te.charCodeAt(Ne) ? (++Ne,
                e = k(Te.indexOf("}", Ne) - Ne),
                ++Ne,
                e > 1114111 && o()) : e = k(4);
                return e <= 65535 ? String.fromCharCode(e) : (e -= 65536,
                String.fromCharCode(55296 + (e >> 10), 56320 + (1023 & e)))
            }();
        case 116:
            return "\t";
        case 98:
            return "\b";
        case 118:
            return "\v";
        case 102:
            return "\f";
        case 13:
            10 === Te.charCodeAt(Ne) && ++Ne;
        case 10:
            return "";
        case 56:
        case 57:
            o();
        default:
            if (e >= 48 && e <= 55) {
                let t = Te.substr(Ne - 1, 3).match(/^[0-7]+/)[0]
                  , r = parseInt(t, 8);
                return r > 255 && (t = t.slice(0, -1),
                r = parseInt(t, 8)),
                Ne += t.length - 1,
                e = Te.charCodeAt(Ne),
                "0" === t && 56 !== e && 57 !== e || o(),
                String.fromCharCode(r)
            }
            return u(e) ? "" : String.fromCharCode(e)
        }
    }
    function k(e) {
        const t = Ne;
        let r = 0
          , s = 0;
        for (let t = 0; t < e; ++t,
        ++Ne) {
            let e, n = Te.charCodeAt(Ne);
            if (95 !== n) {
                if (n >= 97)
                    e = n - 97 + 10;
                else if (n >= 65)
                    e = n - 65 + 10;
                else {
                    if (!(n >= 48 && n <= 57))
                        break;
                    e = n - 48
                }
                if (e >= 16)
                    break;
                s = n,
                r = 16 * r + e
            } else
                95 !== s && 0 !== t || o(),
                s = n
        }
        return 95 !== s && Ne - t === e || o(),
        r
    }
    function u(e) {
        return 13 === e || 10 === e
    }
    function o() {
        throw Object.assign(Error(`Parse error ${_e}:${Te.slice(0, Ne).split("\n").length}:${Ne - Te.lastIndexOf("\n", Ne - 1)}`), {
            idx: Ne
        })
    }
    async function _resolve(e, t) {
        const r = resolveIfNotPlainOrUrl(e, t);
        return {
            r: resolveImportMap(Qe, r || e, t) || throwUnresolved(e, t),
            b: !r && !isURL(e)
        }
    }
    const He = i ? async (e, t) => {
        let r = i(e, t, defaultResolve);
        r && r.then && (r = await r);
        return r ? {
            r: r,
            b: !resolveIfNotPlainOrUrl(e, t) && !isURL(e)
        } : _resolve(e, t)
    }
    : _resolve;
    async function importShim(e, ...r) {
        let s = r[r.length - 1];
        "string" !== typeof s && (s = me);
        await De;
        a && await a(e, "string" !== typeof r[1] ? r[1] : {}, s);
        if (ze || n || !qe) {
            t && processScriptsAndPreloads(true);
            n || (ze = false)
        }
        await Je;
        return topLevelLoad((await He(e, s)).r, {
            credentials: "same-origin"
        })
    }
    self.importShim = importShim;
    function defaultResolve(e, t) {
        return resolveImportMap(Qe, resolveIfNotPlainOrUrl(e, t) || e, t) || throwUnresolved(e, t)
    }
    function throwUnresolved(e, t) {
        throw Error(`Unable to resolve specifier '${e}'${fromParent(t)}`)
    }
    const resolveSync = (e, t=me) => {
        t = `${t}`;
        const r = i && i(e, t, defaultResolve);
        return r && !r.then ? r : defaultResolve(e, t)
    }
    ;
    function metaResolve(e, t=this.url) {
        return resolveSync(e, t)
    }
    importShim.resolve = resolveSync;
    importShim.getImportMap = () => JSON.parse(JSON.stringify(Qe));
    importShim.addImportMap = e => {
        if (!n)
            throw new Error("Unsupported in polyfill mode.");
        Qe = resolveAndComposeImportMap(e, me, Qe)
    }
    ;
    const Fe = importShim._r = {};
    async function loadAll(e, t) {
        if (!e.b && !t[e.u]) {
            t[e.u] = 1;
            await e.L;
            await Promise.all(e.d.map((e => loadAll(e, t))));
            e.n || (e.n = e.d.some((e => e.n)))
        }
    }
    let Qe = {
        imports: {},
        scopes: {}
    };
    let qe;
    const De = Pe.then(( () => {
        qe = true !== s.polyfillEnable && ve && Oe && Le && (!be || $e) && (!pe || Se) && !ke && true;
        if (t) {
            if (!Le) {
                const e = HTMLScriptElement.supports || (e => "classic" === e || "module" === e);
                HTMLScriptElement.supports = t => "importmap" === t || e(t)
            }
            if (n || !qe) {
                new MutationObserver((e => {
                    for (const t of e)
                        if ("childList" === t.type)
                            for (const e of t.addedNodes)
                                if ("SCRIPT" === e.tagName) {
                                    e.type === (n ? "module-shim" : "module") && processScript(e, true);
                                    e.type === (n ? "importmap-shim" : "importmap") && processImportMap(e, true)
                                } else
                                    "LINK" === e.tagName && e.rel === (n ? "modulepreload-shim" : "modulepreload") && processPreload(e)
                }
                )).observe(document, {
                    childList: true,
                    subtree: true
                });
                processScriptsAndPreloads();
                if ("complete" === document.readyState)
                    readyStateCompleteCheck();
                else {
                    async function readyListener() {
                        await De;
                        processScriptsAndPreloads();
                        if ("complete" === document.readyState) {
                            readyStateCompleteCheck();
                            document.removeEventListener("readystatechange", readyListener)
                        }
                    }
                    document.addEventListener("readystatechange", readyListener)
                }
            }
        }
    }
    ));
    let Je = De;
    let Be = true;
    let ze = true;
    async function topLevelLoad(e, t, r, s, i) {
        n || (ze = false);
        await De;
        await Je;
        a && await a(e, "string" !== typeof t ? t : {}, "");
        if (!n && qe) {
            if (s)
                return null;
            await i;
            return ge(r ? createBlob(r) : e, {
                errUrl: e || r
            })
        }
        const c = getOrCreateLoad(e, t, null, r);
        const f = {};
        await loadAll(c, f);
        Ke = void 0;
        resolveDeps(c, f);
        await i;
        if (r && !n && !c.n && true) {
            const e = await ge(createBlob(r), {
                errUrl: r
            });
            le && revokeObjectURLs(Object.keys(f));
            return e
        }
        if (Be && !n && c.n && s) {
            ce();
            Be = false
        }
        const te = await ge(n || c.n || !s ? c.b : c.u, {
            errUrl: c.u
        });
        c.s && (await ge(c.s)).u$_(te);
        le && revokeObjectURLs(Object.keys(f));
        return te
    }
    function revokeObjectURLs(e) {
        let t = 0;
        const r = e.length;
        const s = self.requestIdleCallback ? self.requestIdleCallback : self.requestAnimationFrame;
        s(cleanup);
        function cleanup() {
            const n = 100 * t;
            if (!(n > r)) {
                for (const t of e.slice(n, n + 100)) {
                    const e = Fe[t];
                    e && URL.revokeObjectURL(e.b)
                }
                t++;
                s(cleanup)
            }
        }
    }
    function urlJsString(e) {
        return `'${e.replace(/'/g, "\\'")}'`
    }
    let Ke;
    function resolveDeps(e, t) {
        if (e.b || !t[e.u])
            return;
        t[e.u] = 0;
        for (const c of e.d)
            resolveDeps(c, t);
        const [r,s] = e.a;
        const n = e.S;
        let a = he && Ke ? `import '${Ke}';` : "";
        if (r.length) {
            let te = 0
              , se = 0
              , ne = [];
            function pushStringTo(t) {
                while (ne[ne.length - 1] < t) {
                    const t = ne.pop();
                    a += `${n.slice(te, t)}, ${urlJsString(e.r)}`;
                    te = t
                }
                a += n.slice(te, t);
                te = t
            }
            for (const {s: oe, ss: ce, se: le, d: fe} of r)
                if (-1 === fe) {
                    let ue = e.d[se++]
                      , de = ue.b
                      , pe = !de;
                    pe && ((de = ue.s) || (de = ue.s = createBlob(`export function u$_(m){${ue.a[1].map(( ({s: e, e: t}, r) => {
                        const s = '"' === ue.S[e] || "'" === ue.S[e];
                        return `e$_${r}=m${s ? "[" : "."}${ue.S.slice(e, t)}${s ? "]" : ""}`
                    }
                    )).join(",")}}${ue.a[1].length ? `let ${ue.a[1].map(( (e, t) => `e$_${t}`)).join(",")};` : ""}export {${ue.a[1].map(( ({s: e, e: t}, r) => `e$_${r} as ${ue.S.slice(e, t)}`)).join(",")}}\n//# sourceURL=${ue.r}?cycle`)));
                    pushStringTo(oe - 1);
                    a += `/*${n.slice(oe - 1, le)}*/${urlJsString(de)}`;
                    if (!pe && ue.s) {
                        a += `;import*as m$_${se} from'${ue.b}';import{u$_ as u$_${se}}from'${ue.s}';u$_${se}(m$_${se})`;
                        ue.s = void 0
                    }
                    te = le
                } else if (-2 === fe) {
                    e.m = {
                        url: e.r,
                        resolve: metaResolve
                    };
                    f(e.m, e.u);
                    pushStringTo(oe);
                    a += `importShim._r[${urlJsString(e.u)}].m`;
                    te = le
                } else {
                    pushStringTo(ce + 6);
                    a += "Shim(";
                    ne.push(le - 1);
                    te = oe
                }
            e.s && (a += `\n;import{u$_}from'${e.s}';u$_({ ${s.filter((e => e.ln)).map(( ({s: e, e: t, ln: r}) => `${n.slice(e, t)}: ${r}`)).join(",")} });\n`);
            pushStringTo(n.length)
        } else
            a += n;
        let i = false;
        a = a.replace(Xe, ( (t, r, s) => (i = !r,
        t.replace(s, ( () => new URL(s,e.r))))));
        i || (a += "\n//# sourceURL=" + e.r);
        e.b = Ke = createBlob(a);
        e.S = void 0
    }
    const Xe = /\n\/\/# source(Mapping)?URL=([^\n]+)\s*((;|\/\/[^#][^\n]*)\s*)*$/;
    const Ge = /^(text|application)\/(x-)?javascript(;|$)/;
    const Ve = /^(text|application)\/json(;|$)/;
    const We = /^(text|application)\/css(;|$)/;
    const Ye = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
    let Ze = [];
    let et = 0;
    function pushFetchPool() {
        if (++et > 100)
            return new Promise((e => Ze.push(e)))
    }
    function popFetchPool() {
        et--;
        Ze.length && Ze.shift()()
    }
    async function doFetch(e, t, r) {
        if (ue && !t.integrity)
            throw Error(`No integrity for ${e}${fromParent(r)}.`);
        const s = pushFetchPool();
        s && await s;
        try {
            var n = await c(e, t)
        } catch (t) {
            t.message = `Unable to fetch ${e}${fromParent(r)} - see network log for details.\n` + t.message;
            throw t
        } finally {
            popFetchPool()
        }
        if (!n.ok)
            throw Error(`${n.status} ${n.statusText} ${n.url}${fromParent(r)}`);
        return n
    }
    async function fetchModule(e, t, r) {
        const s = await doFetch(e, t, r);
        const n = s.headers.get("content-type");
        if (Ge.test(n))
            return {
                r: s.url,
                s: await s.text(),
                t: "js"
            };
        if (Ve.test(n))
            return {
                r: s.url,
                s: `export default ${await s.text()}`,
                t: "json"
            };
        if (We.test(n))
            return {
                r: s.url,
                s: `var s=new CSSStyleSheet();s.replaceSync(${JSON.stringify((await s.text()).replace(Ye, ( (t, r="", s, n) => `url(${r}${resolveUrl(s || n, e)}${r})`)))});export default s;`,
                t: "css"
            };
        throw Error(`Unsupported Content-Type "${n}" loading ${e}${fromParent(r)}. Modules must be served with a valid MIME type like application/javascript.`)
    }
    function getOrCreateLoad(e, t, r, s) {
        let a = Fe[e];
        if (a && !s)
            return a;
        a = {
            u: e,
            r: s ? e : void 0,
            f: void 0,
            S: void 0,
            L: void 0,
            a: void 0,
            d: void 0,
            b: void 0,
            s: void 0,
            n: false,
            t: null,
            m: null
        };
        if (Fe[e]) {
            let e = 0;
            while (Fe[a.u + ++e])
                ;
            a.u += e
        }
        Fe[a.u] = a;
        a.f = (async () => {
            if (!s) {
                let i;
                ({r: a.r, s: s, t: i} = await (nt[e] || fetchModule(e, t, r)));
                if (i && !n) {
                    if ("css" === i && !pe || "json" === i && !be)
                        throw Error(`${i}-modules require <script type="esms-options">{ "polyfillEnable": ["${i}-modules"] }<\/script>`);
                    ("css" === i && !Se || "json" === i && !$e) && (a.n = true)
                }
            }
            try {
                a.a = parse(s, a.u)
            } catch (e) {
                throwError(e);
                a.a = [[], [], false]
            }
            a.S = s;
            return a
        }
        )();
        a.L = a.f.then((async () => {
            let e = t;
            a.d = (await Promise.all(a.a[0].map((async ({n: t, d: r}) => {
                (r >= 0 && !ve || -2 === r && !Oe) && (a.n = true);
                if (-1 !== r || !t)
                    return;
                const {r: s, b: n} = await He(t, a.r || a.u);
                !n || Le && !ke || (a.n = true);
                if (te && te.test(s))
                    return {
                        b: s
                    };
                e.integrity && (e = Object.assign({}, e, {
                    integrity: void 0
                }));
                return getOrCreateLoad(s, e, a.r).f
            }
            )))).filter((e => e))
        }
        ));
        return a
    }
    function processScriptsAndPreloads(e=false) {
        if (!e)
            for (const e of document.querySelectorAll(n ? "link[rel=modulepreload-shim]" : "link[rel=modulepreload]"))
                processPreload(e);
        for (const e of document.querySelectorAll(n ? "script[type=importmap-shim]" : "script[type=importmap]"))
            processImportMap(e);
        if (!e)
            for (const e of document.querySelectorAll(n ? "script[type=module-shim]" : "script[type=module]"))
                processScript(e)
    }
    function getFetchOpts(e) {
        const t = {};
        e.integrity && (t.integrity = e.integrity);
        e.referrerpolicy && (t.referrerPolicy = e.referrerpolicy);
        "use-credentials" === e.crossorigin ? t.credentials = "include" : "anonymous" === e.crossorigin ? t.credentials = "omit" : t.credentials = "same-origin";
        return t
    }
    let tt = Promise.resolve();
    let rt = 1;
    function domContentLoadedCheck() {
        0 !== --rt || fe || document.dispatchEvent(new Event("DOMContentLoaded"))
    }
    t && document.addEventListener("DOMContentLoaded", (async () => {
        await De;
        !n && qe || domContentLoadedCheck()
    }
    ));
    let st = 1;
    function readyStateCompleteCheck() {
        0 !== --st || fe || document.dispatchEvent(new Event("readystatechange"))
    }
    const hasNext = e => e.nextSibling || e.parentNode && hasNext(e.parentNode);
    const epCheck = (e, t) => e.ep || !t && (!e.src && !e.innerHTML || !hasNext(e)) || null !== e.getAttribute("noshim") || !(e.ep = true);
    function processImportMap(e, t=st > 0) {
        if (!epCheck(e, t)) {
            if (e.src) {
                if (!n)
                    return;
                setImportMapSrcOrLazy()
            }
            if (ze) {
                Je = Je.then((async () => {
                    Qe = resolveAndComposeImportMap(e.src ? await (await doFetch(e.src, getFetchOpts(e))).json() : JSON.parse(e.innerHTML), e.src || me, Qe)
                }
                )).catch((t => {
                    console.log(t);
                    t instanceof SyntaxError && (t = new Error(`Unable to parse import map ${t.message} in: ${e.src || e.innerHTML}`));
                    throwError(t)
                }
                ));
                n || (ze = false)
            }
        }
    }
    function processScript(e, t=st > 0) {
        if (epCheck(e, t))
            return;
        const r = null === e.getAttribute("async") && st > 0;
        const s = rt > 0;
        r && st++;
        s && rt++;
        const a = topLevelLoad(e.src || me, getFetchOpts(e), !e.src && e.innerHTML, !n, r && tt).catch(throwError);
        r && (tt = a.then(readyStateCompleteCheck));
        s && a.then(domContentLoadedCheck)
    }
    const nt = {};
    function processPreload(e) {
        if (!e.ep) {
            e.ep = true;
            nt[e.href] || (nt[e.href] = fetchModule(e.href, getFetchOpts(e)))
        }
    }
}
)();

//# sourceMappingURL=es-module-shims.js.map
