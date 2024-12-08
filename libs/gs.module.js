import*as THREE from "three";
import {Ray as Ray$1, Plane, MathUtils, EventDispatcher as EventDispatcher$1, Vector3, MOUSE, TOUCH, Quaternion, Spherical, Vector2, BufferAttribute, BufferGeometry, InstancedBufferAttribute, InterleavedBuffer, InterleavedBufferAttribute, TrianglesDrawMode, TriangleFanDrawMode, TriangleStripDrawMode, Float32BufferAttribute, Loader, LoaderUtils, FileLoader, Color, LinearSRGBColorSpace, SpotLight, PointLight, DirectionalLight, MeshBasicMaterial, SRGBColorSpace, MeshPhysicalMaterial, Matrix4, InstancedMesh, Object3D as Object3D$1, Interpolant, NearestFilter, LinearFilter, NearestMipmapNearestFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, LinearMipmapLinearFilter, ClampToEdgeWrapping, MirroredRepeatWrapping, RepeatWrapping, InterpolateLinear, InterpolateDiscrete, MeshStandardMaterial, FrontSide, TextureLoader, ImageBitmapLoader, Texture, PointsMaterial, Material, LineBasicMaterial, DoubleSide, PropertyBinding, SkinnedMesh, Mesh, LineSegments, Line, LineLoop, Points, Group, PerspectiveCamera, OrthographicCamera, Skeleton, AnimationClip, Bone, VectorKeyframeTrack, NumberKeyframeTrack, QuaternionKeyframeTrack, Box3, Sphere, ColorManagement, SphereGeometry} from "three";
let fbf;
class SplatBuffer {
    static CenterComponentCount = 3;
    static ScaleComponentCount = 3;
    static RotationComponentCount = 4;
    static ColorComponentCount = 4;
    static CompressionLevels = {
        0: {
            BytesPerCenter: 12,
            BytesPerScale: 12,
            BytesPerColor: 4,
            BytesPerRotation: 16,
            ScaleRange: 1
        },
        1: {
            BytesPerCenter: 6,
            BytesPerScale: 6,
            BytesPerColor: 4,
            BytesPerRotation: 8,
            ScaleRange: 32767
        }
    };
    static CovarianceSizeFloats = 6;
    static CovarianceSizeBytes = 24;
    static HeaderSizeBytes = 1024;
    constructor(e) {
        this.headerBufferData = new ArrayBuffer(SplatBuffer.HeaderSizeBytes),
        this.headerArrayUint8 = new Uint8Array(this.headerBufferData),
        this.headerArrayUint32 = new Uint32Array(this.headerBufferData),
        this.headerArrayFloat32 = new Float32Array(this.headerBufferData),
        this.headerArrayUint8.set(new Uint8Array(e,0,SplatBuffer.HeaderSizeBytes)),
        this.versionMajor = this.headerArrayUint8[0],
        this.versionMinor = this.headerArrayUint8[1],
        this.headerExtraK = this.headerArrayUint8[2],
        this.compressionLevel = this.headerArrayUint8[3],
        this.splatCount = this.headerArrayUint32[1],
        this.bucketSize = this.headerArrayUint32[2],
        this.bucketCount = this.headerArrayUint32[3],
        this.bucketBlockSize = this.headerArrayFloat32[4],
        this.halfBucketBlockSize = this.bucketBlockSize / 2,
        this.bytesPerBucket = this.headerArrayUint32[5],
        this.compressionScaleRange = this.headerArrayUint32[6] || SplatBuffer.CompressionLevels[this.compressionLevel].ScaleRange,
        this.compressionScaleFactor = this.halfBucketBlockSize / this.compressionScaleRange;
        const t = e.byteLength - SplatBuffer.HeaderSizeBytes;
        this.splatBufferData = new ArrayBuffer(t),
        new Uint8Array(this.splatBufferData).set(new Uint8Array(e,SplatBuffer.HeaderSizeBytes,t)),
        this.bytesPerCenter = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerCenter,
        this.bytesPerScale = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerScale,
        this.bytesPerColor = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerColor,
        this.bytesPerRotation = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerRotation,
        this.bytesPerSplat = this.bytesPerCenter + this.bytesPerScale + this.bytesPerColor + this.bytesPerRotation,
        fbf = this.fbf.bind(this),
        this.linkBufferArrays()
    }
    linkBufferArrays() {
        let e = 0 === this.compressionLevel ? Float32Array : Uint16Array;
        this.centerArray = new e(this.splatBufferData,0,this.splatCount * SplatBuffer.CenterComponentCount),
        this.scaleArray = new e(this.splatBufferData,this.bytesPerCenter * this.splatCount,this.splatCount * SplatBuffer.ScaleComponentCount),
        this.colorArray = new Uint8Array(this.splatBufferData,(this.bytesPerCenter + this.bytesPerScale) * this.splatCount,this.splatCount * SplatBuffer.ColorComponentCount),
        this.rotationArray = new e(this.splatBufferData,(this.bytesPerCenter + this.bytesPerScale + this.bytesPerColor) * this.splatCount,this.splatCount * SplatBuffer.RotationComponentCount),
        this.bucketsBase = this.splatCount * this.bytesPerSplat
    }
    fbf(e) {
        return 0 === this.compressionLevel ? e : THREE.DataUtils.fromHalfFloat(e)
    }
    getHeaderBufferData() {
        return this.headerBufferData
    }
    getSplatBufferData() {
        return this.splatBufferData
    }
    getSplatCount() {
        return this.splatCount
    }
    getSplatCenter(e, t, n) {
        let s = [0, 0, 0];
        const r = e * SplatBuffer.CenterComponentCount;
        if (this.compressionLevel > 0) {
            const n = this.compressionScaleFactor
              , o = this.compressionScaleRange
              , i = Math.floor(e / this.bucketSize);
            s = new Float32Array(this.splatBufferData,this.bucketsBase + i * this.bytesPerBucket,3),
            t.x = (this.centerArray[r] - o) * n + s[0],
            t.y = (this.centerArray[r + 1] - o) * n + s[1],
            t.z = (this.centerArray[r + 2] - o) * n + s[2]
        } else
            t.x = this.centerArray[r],
            t.y = this.centerArray[r + 1],
            t.z = this.centerArray[r + 2];
        n && t.applyMatrix4(n)
    }
    getSplatScaleAndRotation = function() {
        const e = new THREE.Matrix4
          , t = new THREE.Matrix4
          , n = new THREE.Matrix4
          , s = new THREE.Vector3;
        return function(r, o, i, a) {
            const l = r * SplatBuffer.ScaleComponentCount;
            o.set(fbf(this.scaleArray[l]), fbf(this.scaleArray[l + 1]), fbf(this.scaleArray[l + 2]));
            const c = r * SplatBuffer.RotationComponentCount;
            i.set(fbf(this.rotationArray[c + 1]), fbf(this.rotationArray[c + 2]), fbf(this.rotationArray[c + 3]), fbf(this.rotationArray[c])),
            a && (e.makeScale(o.x, o.y, o.z),
            t.makeRotationFromQuaternion(i),
            n.copy(e).multiply(t).multiply(a),
            n.decompose(s, i, o))
        }
    }();
    getSplatColor(e, t, n) {
        const s = e * SplatBuffer.ColorComponentCount;
        t.set(this.colorArray[s], this.colorArray[s + 1], this.colorArray[s + 2], this.colorArray[s + 3])
    }
    fillSplatCenterArray(e, t, n) {
        const s = this.splatCount;
        let r = [0, 0, 0];
        const o = new THREE.Vector3;
        for (let i = 0; i < s; i++) {
            const s = i * SplatBuffer.CenterComponentCount
              , a = (i + t) * SplatBuffer.CenterComponentCount;
            if (this.compressionLevel > 0) {
                const e = Math.floor(i / this.bucketSize);
                r = new Float32Array(this.splatBufferData,this.bucketsBase + e * this.bytesPerBucket,3);
                const t = this.compressionScaleFactor
                  , n = this.compressionScaleRange;
                o.x = (this.centerArray[s] - n) * t + r[0],
                o.y = (this.centerArray[s + 1] - n) * t + r[1],
                o.z = (this.centerArray[s + 2] - n) * t + r[2]
            } else
                o.x = this.centerArray[s],
                o.y = this.centerArray[s + 1],
                o.z = this.centerArray[s + 2];
            n && o.applyMatrix4(n),
            e[a] = o.x,
            e[a + 1] = o.y,
            e[a + 2] = o.z
        }
    }
    fillSplatCovarianceArray(e, t, n) {
        const s = this.splatCount
          , r = new THREE.Vector3
          , o = new THREE.Quaternion
          , i = new THREE.Matrix3
          , a = new THREE.Matrix3
          , l = new THREE.Matrix3
          , c = new THREE.Matrix3
          , h = new THREE.Matrix3
          , u = new THREE.Matrix3
          , d = new THREE.Matrix4;
        for (let p = 0; p < s; p++) {
            const s = p * SplatBuffer.ScaleComponentCount;
            r.set(fbf(this.scaleArray[s]), fbf(this.scaleArray[s + 1]), fbf(this.scaleArray[s + 2])),
            d.makeScale(r.x, r.y, r.z),
            a.setFromMatrix4(d);
            const m = p * SplatBuffer.RotationComponentCount;
            o.set(fbf(this.rotationArray[m + 1]), fbf(this.rotationArray[m + 2]), fbf(this.rotationArray[m + 3]), fbf(this.rotationArray[m])),
            d.makeRotationFromQuaternion(o),
            i.setFromMatrix4(d),
            l.copy(i).multiply(a),
            c.copy(l).transpose().premultiply(l);
            const f = SplatBuffer.CovarianceSizeFloats * (p + t);
            n && (h.setFromMatrix4(n),
            u.copy(h).transpose(),
            c.multiply(u),
            c.premultiply(h)),
            e[f] = c.elements[0],
            e[f + 1] = c.elements[3],
            e[f + 2] = c.elements[6],
            e[f + 3] = c.elements[4],
            e[f + 4] = c.elements[7],
            e[f + 5] = c.elements[8]
        }
    }
    fillSplatColorArray(e, t, n) {
        const s = this.splatCount;
        for (let n = 0; n < s; n++) {
            const s = n * SplatBuffer.ColorComponentCount
              , r = (n + t) * SplatBuffer.ColorComponentCount;
            e[r] = this.colorArray[s],
            e[r + 1] = this.colorArray[s + 1],
            e[r + 2] = this.colorArray[s + 2],
            e[r + 3] = this.colorArray[s + 3]
        }
    }
}
class AbortablePromise {
    constructor(e, t) {
        let n, s;
        this.promise = new Promise(( (e, t) => {
            n = e.bind(this),
            s = t.bind(this)
        }
        ));
        e(( (...e) => {
            n(...e)
        }
        ).bind(this), (e => {
            s(e)
        }
        ).bind(this)),
        this.abortHandler = t
    }
    then(e) {
        return new AbortablePromise(( (t, n) => {
            this.promise = this.promise.then(( (...n) => {
                const s = e(...n);
                s instanceof Promise || s instanceof AbortablePromise ? s.then(( (...e) => {
                    t(...e)
                }
                )) : t(s)
            }
            )).catch((e => {
                n(e)
            }
            ))
        }
        ),this.abortHandler)
    }
    catch(e) {
        return new AbortablePromise((t => {
            this.promise = this.promise.then(( (...e) => {
                t(...e)
            }
            )).catch(e)
        }
        ),this.abortHandler)
    }
    abort() {
        this.abortHandler && this.abortHandler()
    }
    static resolve(e) {
        return new AbortablePromise((t => {
            t(e)
        }
        ))
    }
    static reject(e) {
        return new AbortablePromise(( (t, n) => {
            n(e)
        }
        ))
    }
}
const floatToHalf = function() {
    const e = new Float32Array(1)
      , t = new Int32Array(e.buffer);
    return function(n) {
        e[0] = n;
        const s = t[0];
        let r = s >> 16 & 32768
          , o = s >> 12 & 2047;
        const i = s >> 23 & 255;
        return i < 103 ? r : i > 142 ? (r |= 31744,
        r |= (255 == i ? 0 : 1) && 8388607 & s,
        r) : i < 113 ? (o |= 2048,
        r |= (o >> 114 - i) + (o >> 113 - i & 1),
        r) : (r |= i - 112 << 10 | o >> 1,
        r += 1 & o,
        r)
    }
}()
  , uintEncodedFloat = function() {
    const e = new Float32Array(1)
      , t = new Int32Array(e.buffer);
    return function(n) {
        return e[0] = n,
        t[0]
    }
}()
  , rgbaToInteger = function(e, t, n, s) {
    return e + (t << 8) + (n << 16) + (s << 24)
}
  , fetchWithProgress = function(e, t) {
    const n = new AbortController
      , s = n.signal;
    let r = !1
      , o = null;
    return new AbortablePromise(( (n, i) => {
        o = i,
        fetch(e, {
            signal: s
        }).then((async e => {
            const s = e.body.getReader();
            let o = 0
              , a = e.headers.get("Content-Length")
              , l = a ? parseInt(a) : void 0;
            const c = [];
            for (; !r; )
                try {
                    const {value: e, done: r} = await s.read();
                    if (r) {
                        t && t(100, "100%", e);
                        const s = new Blob(c).arrayBuffer();
                        n(s);
                        break
                    }
                    let i, a;
                    o += e.length,
                    void 0 !== l && (i = o / l * 100,
                    a = `${i.toFixed(0)} %`),
                    c.push(e),
                    t && t(i, a, e)
                } catch (e) {
                    i(e);
                    break
                }
        }
        ))
    }
    ),( () => {
        n.abort(),
        o("Fetch aborted"),
        r = !0
    }
    ))
}
  , clamp = function(e, t, n) {
    return Math.max(Math.min(e, n), t)
}
  , getCurrentTime = function() {
    return performance.now() / 1e3
}
  , SplatBufferBucketSize = 256
  , SplatBufferBucketBlockSize = 5;
class UncompressedSplatArray {
    constructor() {
        this.splatCount = 0,
        this.scale_0 = [],
        this.scale_1 = [],
        this.scale_2 = [],
        this.rot_0 = [],
        this.rot_1 = [],
        this.rot_2 = [],
        this.rot_3 = [],
        this.x = [],
        this.y = [],
        this.z = [],
        this.f_dc_0 = [],
        this.f_dc_1 = [],
        this.f_dc_2 = [],
        this.opacity = []
    }
    addSplat(e, t, n, s, r, o, i, a, l, c, h, u, d, p) {
        this.x.push(e),
        this.y.push(t),
        this.z.push(n),
        this.scale_0.push(s),
        this.scale_1.push(r),
        this.scale_2.push(o),
        this.rot_0.push(i),
        this.rot_1.push(a),
        this.rot_2.push(l),
        this.rot_3.push(c),
        this.f_dc_0.push(h),
        this.f_dc_1.push(u),
        this.f_dc_2.push(d),
        this.opacity.push(p),
        this.splatCount++
    }
}
class SplatCompressor {
    constructor(e=0, t=1, n=SplatBufferBucketBlockSize, s=SplatBufferBucketSize) {
        this.compressionLevel = e,
        this.minimumAlpha = t,
        this.bucketSize = s,
        this.blockSize = n
    }
    static createEmptyUncompressedSplatArray() {
        return new UncompressedSplatArray
    }
    uncompressedSplatArrayToSplatBuffer(e) {
        const t = SplatCompressor.createEmptyUncompressedSplatArray();
        t.addSplat(0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0);
        for (let n = 0; n < e.splatCount; n++) {
            let s;
            s = e.opacity[n] ? e.opacity[n] : 255,
            s >= this.minimumAlpha && t.addSplat(e.x[n], e.y[n], e.z[n], e.scale_0[n], e.scale_1[n], e.scale_2[n], e.rot_0[n], e.rot_1[n], e.rot_2[n], e.rot_3[n], e.f_dc_0[n], e.f_dc_1[n], e.f_dc_2[n], e.opacity[n])
        }
        const n = this.computeBucketsForUncompressedSplatArray(t)
          , s = n.length * this.bucketSize
          , r = SplatBuffer.HeaderSizeBytes
          , o = new Uint8Array(new ArrayBuffer(r));
        o[3] = this.compressionLevel,
        new Uint32Array(o.buffer,4,1)[0] = s;
        let i = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerCenter
          , a = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerScale
          , l = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerColor
          , c = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerRotation;
        const h = new ArrayBuffer(i * s)
          , u = new ArrayBuffer(a * s)
          , d = new ArrayBuffer(l * s)
          , p = new ArrayBuffer(c * s)
          , m = this.blockSize / 2
          , f = SplatBuffer.CompressionLevels[this.compressionLevel].ScaleRange
          , g = f / m
          , y = 2 * f + 1
          , E = new THREE.Vector3
          , T = new THREE.Vector3;
        let A = 0;
        for (let e = 0; e < n.length; e++) {
            const s = n[e];
            E.fromArray(s.center);
            for (let e = 0; e < s.splats.length; e++) {
                let n = s.splats[e]
                  , r = !1;
                if (0 === n && (r = !0),
                0 === this.compressionLevel) {
                    const e = new Float32Array(h,A * i,3)
                      , s = new Float32Array(u,A * a,3)
                      , r = new Float32Array(p,A * c,4);
                    if (void 0 !== t.scale_0[n]) {
                        const e = new THREE.Quaternion(t.rot_1[n],t.rot_2[n],t.rot_3[n],t.rot_0[n]);
                        e.normalize(),
                        r.set([e.w, e.x, e.y, e.z]),
                        s.set([t.scale_0[n], t.scale_1[n], t.scale_2[n]])
                    } else
                        s.set([.01, .01, .01]),
                        r.set([1, 0, 0, 0]);
                    e.set([t.x[n], t.y[n], t.z[n]])
                } else {
                    const e = new Uint16Array(h,A * i,3)
                      , s = new Uint16Array(u,A * a,3)
                      , r = new Uint16Array(p,A * c,4)
                      , o = THREE.DataUtils.toHalfFloat.bind(THREE.DataUtils);
                    if (void 0 !== t.scale_0[n]) {
                        const e = new THREE.Quaternion(t.rot_1[n],t.rot_2[n],t.rot_3[n],t.rot_0[n]);
                        e.normalize(),
                        r.set([o(e.w), o(e.x), o(e.y), o(e.z)]),
                        s.set([o(t.scale_0[n]), o(t.scale_1[n]), o(t.scale_2[n])])
                    } else
                        s.set([o(.01), o(.01), o(.01)]),
                        r.set([o(1), 0, 0, 0]);
                    T.set(t.x[n], t.y[n], t.z[n]).sub(E),
                    T.x = Math.round(T.x * g) + f,
                    T.x = clamp(T.x, 0, y),
                    T.y = Math.round(T.y * g) + f,
                    T.y = clamp(T.y, 0, y),
                    T.z = Math.round(T.z * g) + f,
                    T.z = clamp(T.z, 0, y),
                    e.set([T.x, T.y, T.z])
                }
                const o = new Uint8ClampedArray(d,A * l,4);
                r ? (o[0] = 255,
                o[1] = 0,
                o[2] = 0,
                o[3] = 0) : (void 0 !== t.f_dc_0[n] ? o.set([t.f_dc_0[n], t.f_dc_1[n], t.f_dc_2[n]]) : o.set([255, 0, 0]),
                void 0 !== t.opacity[n] ? o[3] = t.opacity[n] : o[3] = 255),
                A++
            }
        }
        const x = 12 * n.length
          , v = h.byteLength + u.byteLength + d.byteLength + p.byteLength
          , S = new Uint32Array(o.buffer)
          , C = new Float32Array(o.buffer);
        let b = r + v;
        this.compressionLevel > 0 && (b += x,
        S[2] = this.bucketSize,
        S[3] = n.length,
        C[4] = this.blockSize,
        S[5] = 12,
        S[6] = SplatBuffer.CompressionLevels[this.compressionLevel].ScaleRange);
        const w = new ArrayBuffer(b);
        if (new Uint8Array(w,0,r).set(o),
        new Uint8Array(w,r,h.byteLength).set(new Uint8Array(h)),
        new Uint8Array(w,r + h.byteLength,u.byteLength).set(new Uint8Array(u)),
        new Uint8Array(w,r + h.byteLength + u.byteLength,d.byteLength).set(new Uint8Array(d)),
        new Uint8Array(w,r + h.byteLength + u.byteLength + d.byteLength,p.byteLength).set(new Uint8Array(p)),
        this.compressionLevel > 0) {
            const e = new Float32Array(w,r + v,3 * n.length);
            for (let t = 0; t < n.length; t++) {
                const s = n[t]
                  , r = 3 * t;
                e[r] = s.center[0],
                e[r + 1] = s.center[1],
                e[r + 2] = s.center[2]
            }
        }
        return new SplatBuffer(w)
    }
    computeBucketsForUncompressedSplatArray(e) {
        let t = e.splatCount;
        const n = this.blockSize
          , s = n / 2
          , r = new THREE.Vector3
          , o = new THREE.Vector3;
        for (let n = 1; n < t; n++) {
            const t = [e.x[n], e.y[n], e.z[n]];
            (0 === n || t[0] < r.x) && (r.x = t[0]),
            (0 === n || t[0] > o.x) && (o.x = t[0]),
            (0 === n || t[1] < r.y) && (r.y = t[1]),
            (0 === n || t[1] > o.y) && (o.y = t[1]),
            (0 === n || t[2] < r.z) && (r.z = t[2]),
            (0 === n || t[2] > o.z) && (o.z = t[2])
        }
        const i = (new THREE.Vector3).copy(o).sub(r)
          , a = Math.ceil(i.y / n)
          , l = Math.ceil(i.z / n)
          , c = new THREE.Vector3
          , h = []
          , u = {};
        for (let o = 1; o < t; o++) {
            const t = [e.x[o], e.y[o], e.z[o]]
              , i = Math.ceil((t[0] - r.x) / n)
              , d = Math.ceil((t[1] - r.y) / n)
              , p = Math.ceil((t[2] - r.z) / n);
            c.x = (i - 1) * n + r.x + s,
            c.y = (d - 1) * n + r.y + s,
            c.z = (p - 1) * n + r.z + s;
            const m = i * (a * l) + d * l + p;
            let f = u[m];
            f || (u[m] = f = {
                splats: [],
                center: c.toArray()
            }),
            f.splats.push(o),
            f.splats.length >= this.bucketSize && (h.push(f),
            u[m] = null)
        }
        for (let e in u)
            if (u.hasOwnProperty(e)) {
                const t = u[e];
                if (t) {
                    for (; t.splats.length < this.bucketSize; )
                        t.splats.push(0);
                    h.push(t)
                }
            }
        return h
    }
}
class PlyParser {
    constructor(e) {
        this.plyBuffer = e
    }
    decodeHeader(e) {
        const t = new TextDecoder;
        let n = 0
          , s = "";
        console.log(".PLY size: " + e.byteLength + " bytes");
        const r = 100;
        for (; ; ) {
            if (n + r >= e.byteLength)
                throw new Error("End of file reached while searching for end of header");
            const o = new Uint8Array(e,n,r);
            s += t.decode(o),
            n += r;
            const i = new Uint8Array(e,Math.max(0, n - 200),200);
            if (t.decode(i).includes("end_header"))
                break
        }
        const o = s.split("\n");
        let i = 0
          , a = {};
        for (let e = 0; e < o.length; e++) {
            const t = o[e].trim();
            if (t.startsWith("element vertex")) {
                const e = t.match(/\d+/);
                e && (i = parseInt(e[0]))
            } else if (t.startsWith("property")) {
                const e = t.match(/(\w+)\s+(\w+)\s+(\w+)/);
                if (e) {
                    const t = e[2];
                    a[e[3]] = t
                }
            } else if ("end_header" === t)
                break
        }
        const l = s.indexOf("end_header") + 10 + 1;
        return {
            splatCount: i,
            propertyTypes: a,
            vertexData: new DataView(e,l),
            headerOffset: n
        }
    }
    readRawVertexFast(e, t, n, s, r, o) {
        let i = o || {};
        for (let o of s) {
            const s = r[o];
            "float" === s ? i[o] = e.getFloat32(t + n[o], !0) : "uchar" === s && (i[o] = e.getUint8(t + n[o]) / 255)
        }
    }
    parseToSplatBuffer(e, t, n, s) {
        const r = performance.now();
        console.log("Parsing PLY to SPLAT...");
        const {splatCount: o, propertyTypes: i, vertexData: a} = this.decodeHeader(this.plyBuffer);
        let l = 0;
        for (const e in i)
            e.startsWith("f_rest_") && (l += 1);
        const c = l / 3;
        console.log("Detected degree", 0, "with ", c, "coefficients per color");
        const h = [];
        for (let e = 0; e < 3; ++e)
            h.push(`f_dc_${e}`);
        for (let e = 0; e < c; ++e)
            for (let t = 0; t < 3; ++t)
                h.push(`f_rest_${t * c + e}`);
        let u = 0
          , d = {};
        const p = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1
        };
        for (let e in i)
            if (i.hasOwnProperty(e)) {
                const t = i[e];
                d[e] = u,
                u += p[t]
            }
        let m = {};
        const f = ["scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3", "x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2", "opacity"]
          , g = SplatCompressor.createEmptyUncompressedSplatArray();
        for (let e = 0; e < o; e++) {
            if (this.readRawVertexFast(a, e * u, d, f, i, m),
            void 0 !== m.scale_0 ? (g.scale_0[e] = Math.exp(m.scale_0),
            g.scale_1[e] = Math.exp(m.scale_1),
            g.scale_2[e] = Math.exp(m.scale_2)) : (g.scale_0[e] = .01,
            g.scale_1[e] = .01,
            g.scale_2[e] = .01),
            void 0 !== m.f_dc_0) {
                const t = .28209479177387814;
                g.f_dc_0[e] = 255 * (.5 + t * m.f_dc_0),
                g.f_dc_1[e] = 255 * (.5 + t * m.f_dc_1),
                g.f_dc_2[e] = 255 * (.5 + t * m.f_dc_2)
            } else
                g.f_dc_0[e] = 0,
                g.f_dc_1[e] = 0,
                g.f_dc_2[e] = 0;
            void 0 !== m.opacity && (g.opacity[e] = 1 / (1 + Math.exp(-m.opacity)) * 255),
            g.rot_0[e] = m.rot_0,
            g.rot_1[e] = m.rot_1,
            g.rot_2[e] = m.rot_2,
            g.rot_3[e] = m.rot_3,
            g.x[e] = m.x,
            g.y[e] = m.y,
            g.z[e] = m.z,
            g.splatCount++
        }
        const y = new SplatCompressor(e,t,n,s).uncompressedSplatArrayToSplatBuffer(g);
        console.log("Total valid splats: ", y.getSplatCount(), "out of", o);
        const E = performance.now();
        return console.log("Parsing PLY to SPLAT complete!"),
        console.log("Total time: ", (E - r).toFixed(2) + " ms"),
        y
    }
}
class PlyLoader {
    constructor() {
        this.splatBuffer = null
    }
    loadFromURL(e, t, n, s, r, o) {
        return fetchWithProgress(e, t).then((e => {
            const t = new PlyParser(e).parseToSplatBuffer(n, s, r, o);
            return this.splatBuffer = t,
            t
        }
        ))
    }
}
class SplatLoader {
    constructor(e=null) {
        this.splatBuffer = e,
        this.downLoadLink = null
    }
    static isFileSplatFormat(e) {
        return SplatLoader.isCustomSplatFormat(e) || SplatLoader.isStandardSplatFormat(e)
    }
    static isCustomSplatFormat(e) {
        return e.endsWith(".ksplat")
    }
    static isStandardSplatFormat(e) {
        return e.endsWith(".splat")
    }
    loadFromURL(e, t, n, s, r, o) {
        return fetchWithProgress(e, t).then((t => {
            let i;
            if (SplatLoader.isCustomSplatFormat(e))
                i = new SplatBuffer(t);
            else {
                const e = new SplatCompressor(n,s,r,o)
                  , a = SplatLoader.parseStandardSplatToUncompressedSplatArray(t);
                i = e.uncompressedSplatArrayToSplatBuffer(a)
            }
            return i
        }
        ))
    }
    static parseStandardSplatToUncompressedSplatArray(e) {
        const t = e.byteLength / 32
          , n = SplatCompressor.createEmptyUncompressedSplatArray();
        for (let s = 0; s < t; s++) {
            const t = 12
              , r = 12
              , o = 4
              , i = 32 * s
              , a = new Float32Array(e,i,3)
              , l = new Float32Array(e,i + t,3)
              , c = new Uint8Array(e,i + t + r,4)
              , h = new Uint8Array(e,i + t + r + o,4)
              , u = new THREE.Quaternion((h[1] - 128) / 128,(h[2] - 128) / 128,(h[3] - 128) / 128,(h[0] - 128) / 128);
            u.normalize(),
            n.addSplat(a[0], a[1], a[2], l[0], l[1], l[2], u.w, u.x, u.y, u.z, c[0], c[1], c[2], c[3])
        }
        return n
    }
    setFromBuffer(e) {
        this.splatBuffer = e
    }
    downloadFile(e) {
        const t = new Uint8Array(this.splatBuffer.getHeaderBufferData())
          , n = new Uint8Array(this.splatBuffer.getSplatBufferData())
          , s = new Blob([t.buffer, n.buffer],{
            type: "application/octet-stream"
        });
        this.downLoadLink || (this.downLoadLink = document.createElement("a"),
        document.body.appendChild(this.downLoadLink)),
        this.downLoadLink.download = e,
        this.downLoadLink.href = URL.createObjectURL(s),
        this.downLoadLink.click()
    }
}
const _changeEvent = {
    type: "change"
}
  , _startEvent = {
    type: "start"
}
  , _endEvent = {
    type: "end"
}
  , _ray = new Ray$1
  , _plane = new Plane
  , TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
class OrbitControls extends EventDispatcher$1 {
    constructor(e, t) {
        super(),
        this.object = e,
        this.domElement = t,
        this.domElement.style.touchAction = "none",
        this.enabled = !0,
        this.target = new Vector3,
        this.minDistance = 0,
        this.maxDistance = 1 / 0,
        this.minZoom = 0,
        this.maxZoom = 1 / 0,
        this.minPolarAngle = 0,
        this.maxPolarAngle = Math.PI,
        this.minAzimuthAngle = -1 / 0,
        this.maxAzimuthAngle = 1 / 0,
        this.enableDamping = !1,
        this.dampingFactor = .05,
        this.enableZoom = !0,
        this.zoomSpeed = 1,
        this.enableRotate = !0,
        this.rotateSpeed = 1,
        this.enablePan = !0,
        this.panSpeed = 1,
        this.screenSpacePanning = !0,
        this.keyPanSpeed = 7,
        this.zoomToCursor = !1,
        this.autoRotate = !1,
        this.autoRotateSpeed = 2,
        this.keys = {
            LEFT: "KeyA",
            UP: "KeyW",
            RIGHT: "KeyD",
            BOTTOM: "KeyS"
        },
        this.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        },
        this.touches = {
            ONE: TOUCH.ROTATE,
            TWO: TOUCH.DOLLY_PAN
        },
        this.target0 = this.target.clone(),
        this.position0 = this.object.position.clone(),
        this.zoom0 = this.object.zoom,
        this._domElementKeyEvents = null,
        this.getPolarAngle = function() {
            return i.phi
        }
        ,
        this.getAzimuthalAngle = function() {
            return i.theta
        }
        ,
        this.getDistance = function() {
            return this.object.position.distanceTo(this.target)
        }
        ,
        this.listenToKeyEvents = function(e) {
            e.addEventListener("keydown", X),
            this._domElementKeyEvents = e
        }
        ,
        this.stopListenToKeyEvents = function() {
            this._domElementKeyEvents.removeEventListener("keydown", X),
            this._domElementKeyEvents = null
        }
        ,
        this.saveState = function() {
            n.target0.copy(n.target),
            n.position0.copy(n.object.position),
            n.zoom0 = n.object.zoom
        }
        ,
        this.reset = function() {
            n.target.copy(n.target0),
            n.object.position.copy(n.position0),
            n.object.zoom = n.zoom0,
            n.object.updateProjectionMatrix(),
            n.dispatchEvent(_changeEvent),
            n.update(),
            r = s.NONE
        }
        ,
        this.update = function() {
            const t = new Vector3
              , h = (new Quaternion).setFromUnitVectors(e.up, new Vector3(0,1,0))
              , u = h.clone().invert()
              , d = new Vector3
              , p = new Quaternion
              , m = new Vector3
              , f = 2 * Math.PI;
            return function() {
                h.setFromUnitVectors(e.up, new Vector3(0,1,0)),
                u.copy(h).invert();
                const g = n.object.position;
                t.copy(g).sub(n.target),
                t.applyQuaternion(h),
                i.setFromVector3(t),
                n.autoRotate && r === s.NONE && b(2 * Math.PI / 60 / 60 * n.autoRotateSpeed),
                n.enableDamping ? (i.theta += a.theta * n.dampingFactor,
                i.phi += a.phi * n.dampingFactor) : (i.theta += a.theta,
                i.phi += a.phi);
                let y = n.minAzimuthAngle
                  , E = n.maxAzimuthAngle;
                isFinite(y) && isFinite(E) && (y < -Math.PI ? y += f : y > Math.PI && (y -= f),
                E < -Math.PI ? E += f : E > Math.PI && (E -= f),
                i.theta = y <= E ? Math.max(y, Math.min(E, i.theta)) : i.theta > (y + E) / 2 ? Math.max(y, i.theta) : Math.min(E, i.theta)),
                i.phi = Math.max(n.minPolarAngle, Math.min(n.maxPolarAngle, i.phi)),
                i.makeSafe(),
                !0 === n.enableDamping ? n.target.addScaledVector(c, n.dampingFactor) : n.target.add(c),
                n.zoomToCursor && x || n.object.isOrthographicCamera ? i.radius = L(i.radius) : i.radius = L(i.radius * l),
                t.setFromSpherical(i),
                t.applyQuaternion(u),
                g.copy(n.target).add(t),
                n.object.lookAt(n.target),
                !0 === n.enableDamping ? (a.theta *= 1 - n.dampingFactor,
                a.phi *= 1 - n.dampingFactor,
                c.multiplyScalar(1 - n.dampingFactor)) : (a.set(0, 0, 0),
                c.set(0, 0, 0));
                let v = !1;
                if (n.zoomToCursor && x) {
                    let s = null;
                    if (n.object.isPerspectiveCamera) {
                        const e = t.length();
                        s = L(e * l);
                        const r = e - s;
                        n.object.position.addScaledVector(T, r),
                        n.object.updateMatrixWorld()
                    } else if (n.object.isOrthographicCamera) {
                        const e = new Vector3(A.x,A.y,0);
                        e.unproject(n.object),
                        n.object.zoom = Math.max(n.minZoom, Math.min(n.maxZoom, n.object.zoom / l)),
                        n.object.updateProjectionMatrix(),
                        v = !0;
                        const r = new Vector3(A.x,A.y,0);
                        r.unproject(n.object),
                        n.object.position.sub(r).add(e),
                        n.object.updateMatrixWorld(),
                        s = t.length()
                    } else
                        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),
                        n.zoomToCursor = !1;
                    null !== s && (this.screenSpacePanning ? n.target.set(0, 0, -1).transformDirection(n.object.matrix).multiplyScalar(s).add(n.object.position) : (_ray.origin.copy(n.object.position),
                    _ray.direction.set(0, 0, -1).transformDirection(n.object.matrix),
                    Math.abs(n.object.up.dot(_ray.direction)) < TILT_LIMIT ? e.lookAt(n.target) : (_plane.setFromNormalAndCoplanarPoint(n.object.up, n.target),
                    _ray.intersectPlane(_plane, n.target))))
                } else
                    n.object.isOrthographicCamera && (n.object.zoom = Math.max(n.minZoom, Math.min(n.maxZoom, n.object.zoom / l)),
                    n.object.updateProjectionMatrix(),
                    v = !0);
                return l = 1,
                x = !1,
                !!(v || d.distanceToSquared(n.object.position) > o || 8 * (1 - p.dot(n.object.quaternion)) > o || m.distanceToSquared(n.target) > 0) && (n.dispatchEvent(_changeEvent),
                d.copy(n.object.position),
                p.copy(n.object.quaternion),
                m.copy(n.target),
                v = !1,
                !0)
            }
        }(),
        this.dispose = function() {
            n.domElement.removeEventListener("contextmenu", Y),
            n.domElement.removeEventListener("pointerdown", z),
            n.domElement.removeEventListener("pointercancel", j),
            n.domElement.removeEventListener("wheel", W),
            n.domElement.removeEventListener("pointermove", G),
            n.domElement.removeEventListener("pointerup", j),
            null !== n._domElementKeyEvents && (n._domElementKeyEvents.removeEventListener("keydown", X),
            n._domElementKeyEvents = null)
        }
        ;
        const n = this
          , s = {
            NONE: -1,
            ROTATE: 0,
            DOLLY: 1,
            PAN: 2,
            TOUCH_ROTATE: 3,
            TOUCH_PAN: 4,
            TOUCH_DOLLY_PAN: 5,
            TOUCH_DOLLY_ROTATE: 6
        };
        let r = s.NONE;
        const o = 1e-6
          , i = new Spherical
          , a = new Spherical;
        let l = 1;
        const c = new Vector3
          , h = new Vector2
          , u = new Vector2
          , d = new Vector2
          , p = new Vector2
          , m = new Vector2
          , f = new Vector2
          , g = new Vector2
          , y = new Vector2
          , E = new Vector2
          , T = new Vector3
          , A = new Vector2;
        let x = !1;
        const v = []
          , S = {};
        function C() {
            return Math.pow(.95, n.zoomSpeed)
        }
        function b(e) {
            a.theta -= e
        }
        function w(e) {
            a.phi -= e
        }
        const R = function() {
            const e = new Vector3;
            return function(t, n) {
                e.setFromMatrixColumn(n, 0),
                e.multiplyScalar(-t),
                c.add(e)
            }
        }()
          , M = function() {
            const e = new Vector3;
            return function(t, s) {
                !0 === n.screenSpacePanning ? e.setFromMatrixColumn(s, 1) : (e.setFromMatrixColumn(s, 0),
                e.crossVectors(n.object.up, e)),
                e.multiplyScalar(t),
                c.add(e)
            }
        }()
          , _ = function() {
            const e = new Vector3;
            return function(t, s) {
                const r = n.domElement;
                if (n.object.isPerspectiveCamera) {
                    const o = n.object.position;
                    e.copy(o).sub(n.target);
                    let i = e.length();
                    i *= Math.tan(n.object.fov / 2 * Math.PI / 180),
                    R(2 * t * i / r.clientHeight, n.object.matrix),
                    M(2 * s * i / r.clientHeight, n.object.matrix)
                } else
                    n.object.isOrthographicCamera ? (R(t * (n.object.right - n.object.left) / n.object.zoom / r.clientWidth, n.object.matrix),
                    M(s * (n.object.top - n.object.bottom) / n.object.zoom / r.clientHeight, n.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),
                    n.enablePan = !1)
            }
        }();
        function I(e) {
            n.object.isPerspectiveCamera || n.object.isOrthographicCamera ? l /= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
            n.enableZoom = !1)
        }
        function P(e) {
            n.object.isPerspectiveCamera || n.object.isOrthographicCamera ? l *= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),
            n.enableZoom = !1)
        }
        function B(t) {
            if (!n.zoomToCursor)
                return;
            x = !0;
            const s = n.domElement.getBoundingClientRect()
              , r = t.clientX - s.left
              , o = t.clientY - s.top
              , i = s.width
              , a = s.height;
            A.x = r / i * 2 - 1,
            A.y = -o / a * 2 + 1,
            T.set(A.x, A.y, 1).unproject(e).sub(e.position).normalize()
        }
        function L(e) {
            return Math.max(n.minDistance, Math.min(n.maxDistance, e))
        }
        function N(e) {
            h.set(e.clientX, e.clientY)
        }
        function O(e) {
            p.set(e.clientX, e.clientY)
        }
        function D() {
            if (1 === v.length)
                h.set(v[0].pageX, v[0].pageY);
            else {
                const e = .5 * (v[0].pageX + v[1].pageX)
                  , t = .5 * (v[0].pageY + v[1].pageY);
                h.set(e, t)
            }
        }
        function F() {
            if (1 === v.length)
                p.set(v[0].pageX, v[0].pageY);
            else {
                const e = .5 * (v[0].pageX + v[1].pageX)
                  , t = .5 * (v[0].pageY + v[1].pageY);
                p.set(e, t)
            }
        }
        function H() {
            const e = v[0].pageX - v[1].pageX
              , t = v[0].pageY - v[1].pageY
              , n = Math.sqrt(e * e + t * t);
            g.set(0, n)
        }
        function k(e) {
            if (1 == v.length)
                u.set(e.pageX, e.pageY);
            else {
                const t = q(e)
                  , n = .5 * (e.pageX + t.x)
                  , s = .5 * (e.pageY + t.y);
                u.set(n, s)
            }
            d.subVectors(u, h).multiplyScalar(n.rotateSpeed);
            const t = n.domElement;
            b(2 * Math.PI * d.x / t.clientHeight),
            w(2 * Math.PI * d.y / t.clientHeight),
            h.copy(u)
        }
        function V(e) {
            if (1 === v.length)
                m.set(e.pageX, e.pageY);
            else {
                const t = q(e)
                  , n = .5 * (e.pageX + t.x)
                  , s = .5 * (e.pageY + t.y);
                m.set(n, s)
            }
            f.subVectors(m, p).multiplyScalar(n.panSpeed),
            _(f.x, f.y),
            p.copy(m)
        }
        function U(e) {
            const t = q(e)
              , s = e.pageX - t.x
              , r = e.pageY - t.y
              , o = Math.sqrt(s * s + r * r);
            y.set(0, o),
            E.set(0, Math.pow(y.y / g.y, n.zoomSpeed)),
            I(E.y),
            g.copy(y)
        }
        function z(e) {
            !1 !== n.enabled && (0 === v.length && (n.domElement.setPointerCapture(e.pointerId),
            n.domElement.addEventListener("pointermove", G),
            n.domElement.addEventListener("pointerup", j)),
            function(e) {
                v.push(e)
            }(e),
            "touch" === e.pointerType ? function(e) {
                switch (Q(e),
                v.length) {
                case 1:
                    switch (n.touches.ONE) {
                    case TOUCH.ROTATE:
                        if (!1 === n.enableRotate)
                            return;
                        D(),
                        r = s.TOUCH_ROTATE;
                        break;
                    case TOUCH.PAN:
                        if (!1 === n.enablePan)
                            return;
                        F(),
                        r = s.TOUCH_PAN;
                        break;
                    default:
                        r = s.NONE
                    }
                    break;
                case 2:
                    switch (n.touches.TWO) {
                    case TOUCH.DOLLY_PAN:
                        if (!1 === n.enableZoom && !1 === n.enablePan)
                            return;
                        n.enableZoom && H(),
                        n.enablePan && F(),
                        r = s.TOUCH_DOLLY_PAN;
                        break;
                    case TOUCH.DOLLY_ROTATE:
                        if (!1 === n.enableZoom && !1 === n.enableRotate)
                            return;
                        n.enableZoom && H(),
                        n.enableRotate && D(),
                        r = s.TOUCH_DOLLY_ROTATE;
                        break;
                    default:
                        r = s.NONE
                    }
                    break;
                default:
                    r = s.NONE
                }
                r !== s.NONE && n.dispatchEvent(_startEvent)
            }(e) : function(e) {
                let t;
                switch (e.button) {
                case 0:
                    t = n.mouseButtons.LEFT;
                    break;
                case 1:
                    t = n.mouseButtons.MIDDLE;
                    break;
                case 2:
                    t = n.mouseButtons.RIGHT;
                    break;
                default:
                    t = -1
                }
                switch (t) {
                case MOUSE.DOLLY:
                    if (!1 === n.enableZoom)
                        return;
                    !function(e) {
                        B(e),
                        g.set(e.clientX, e.clientY)
                    }(e),
                    r = s.DOLLY;
                    break;
                case MOUSE.ROTATE:
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        if (!1 === n.enablePan)
                            return;
                        O(e),
                        r = s.PAN
                    } else {
                        if (!1 === n.enableRotate)
                            return;
                        N(e),
                        r = s.ROTATE
                    }
                    break;
                case MOUSE.PAN:
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        if (!1 === n.enableRotate)
                            return;
                        N(e),
                        r = s.ROTATE
                    } else {
                        if (!1 === n.enablePan)
                            return;
                        O(e),
                        r = s.PAN
                    }
                    break;
                default:
                    r = s.NONE
                }
                r !== s.NONE && n.dispatchEvent(_startEvent)
            }(e))
        }
        function G(e) {
            !1 !== n.enabled && ("touch" === e.pointerType ? function(e) {
                switch (Q(e),
                r) {
                case s.TOUCH_ROTATE:
                    if (!1 === n.enableRotate)
                        return;
                    k(e),
                    n.update();
                    break;
                case s.TOUCH_PAN:
                    if (!1 === n.enablePan)
                        return;
                    V(e),
                    n.update();
                    break;
                case s.TOUCH_DOLLY_PAN:
                    if (!1 === n.enableZoom && !1 === n.enablePan)
                        return;
                    !function(e) {
                        n.enableZoom && U(e),
                        n.enablePan && V(e)
                    }(e),
                    n.update();
                    break;
                case s.TOUCH_DOLLY_ROTATE:
                    if (!1 === n.enableZoom && !1 === n.enableRotate)
                        return;
                    !function(e) {
                        n.enableZoom && U(e),
                        n.enableRotate && k(e)
                    }(e),
                    n.update();
                    break;
                default:
                    r = s.NONE
                }
            }(e) : function(e) {
                switch (r) {
                case s.ROTATE:
                    if (!1 === n.enableRotate)
                        return;
                    !function(e) {
                        u.set(e.clientX, e.clientY),
                        d.subVectors(u, h).multiplyScalar(n.rotateSpeed);
                        const t = n.domElement;
                        b(2 * Math.PI * d.x / t.clientHeight),
                        w(2 * Math.PI * d.y / t.clientHeight),
                        h.copy(u),
                        n.update()
                    }(e);
                    break;
                case s.DOLLY:
                    if (!1 === n.enableZoom)
                        return;
                    !function(e) {
                        y.set(e.clientX, e.clientY),
                        E.subVectors(y, g),
                        E.y > 0 ? I(C()) : E.y < 0 && P(C()),
                        g.copy(y),
                        n.update()
                    }(e);
                    break;
                case s.PAN:
                    if (!1 === n.enablePan)
                        return;
                    !function(e) {
                        m.set(e.clientX, e.clientY),
                        f.subVectors(m, p).multiplyScalar(n.panSpeed),
                        _(f.x, f.y),
                        p.copy(m),
                        n.update()
                    }(e)
                }
            }(e))
        }
        function j(e) {
            !function(e) {
                delete S[e.pointerId];
                for (let t = 0; t < v.length; t++)
                    if (v[t].pointerId == e.pointerId)
                        return void v.splice(t, 1)
            }(e),
            0 === v.length && (n.domElement.releasePointerCapture(e.pointerId),
            n.domElement.removeEventListener("pointermove", G),
            n.domElement.removeEventListener("pointerup", j)),
            n.dispatchEvent(_endEvent),
            r = s.NONE
        }
        function W(e) {
            !1 !== n.enabled && !1 !== n.enableZoom && r === s.NONE && (e.preventDefault(),
            n.dispatchEvent(_startEvent),
            function(e) {
                B(e),
                e.deltaY < 0 ? P(C()) : e.deltaY > 0 && I(C()),
                n.update()
            }(e),
            n.dispatchEvent(_endEvent))
        }
        function X(e) {
            !1 !== n.enabled && !1 !== n.enablePan && function(e) {
                let t = !1;
                switch (e.code) {
                case n.keys.UP:
                    e.ctrlKey || e.metaKey || e.shiftKey ? w(2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : _(0, n.keyPanSpeed),
                    t = !0;
                    break;
                case n.keys.BOTTOM:
                    e.ctrlKey || e.metaKey || e.shiftKey ? w(-2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : _(0, -n.keyPanSpeed),
                    t = !0;
                    break;
                case n.keys.LEFT:
                    e.ctrlKey || e.metaKey || e.shiftKey ? b(2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : _(n.keyPanSpeed, 0),
                    t = !0;
                    break;
                case n.keys.RIGHT:
                    e.ctrlKey || e.metaKey || e.shiftKey ? b(-2 * Math.PI * n.rotateSpeed / n.domElement.clientHeight) : _(-n.keyPanSpeed, 0),
                    t = !0
                }
                t && (e.preventDefault(),
                n.update())
            }(e)
        }
        function Y(e) {
            !1 !== n.enabled && e.preventDefault()
        }
        function Q(e) {
            let t = S[e.pointerId];
            void 0 === t && (t = new Vector2,
            S[e.pointerId] = t),
            t.set(e.pageX, e.pageY)
        }
        function q(e) {
            const t = e.pointerId === v[0].pointerId ? v[1] : v[0];
            return S[t.pointerId]
        }
        n.domElement.addEventListener("contextmenu", Y),
        n.domElement.addEventListener("pointerdown", z),
        n.domElement.addEventListener("pointercancel", j),
        n.domElement.addEventListener("wheel", W, {
            passive: !1
        }),
        this.update()
    }
}
class LoadingSpinner {
    constructor(e, t) {
        this.message = e || "Loading...",
        this.container = t || document.body,
        this.spinnerDivContainerOuter = document.createElement("div"),
        this.spinnerDivContainerOuter.className = "outerContainer",
        this.spinnerDivContainerOuter.style.display = "none",
        this.spinnerDivContainer = document.createElement("div"),
        this.spinnerDivContainer.className = "container",
        this.spinnerDiv = document.createElement("div"),
        this.spinnerDiv.className = "loader",
        this.messageDiv = document.createElement("div"),
        this.messageDiv.className = "message",
        this.messageDiv.innerHTML = this.message,
        this.spinnerDivContainer.appendChild(this.spinnerDiv),
        this.spinnerDivContainer.appendChild(this.messageDiv),
        this.spinnerDivContainerOuter.appendChild(this.spinnerDivContainer),
        this.container.appendChild(this.spinnerDivContainerOuter);
        const n = document.createElement("style");
        n.innerHTML = "\n\n            .message {\n                font-family: arial;\n                font-size: 12pt;\n                color: #ffffff;\n                text-align: center;\n                padding-top:15px;\n                width: 180px;\n            }\n\n            .outerContainer {\n                width: 100%;\n                height: 100%;\n            }\n\n            .container {\n                position: absolute;\n                top: 50%;\n                left: 50%;\n                transform: translate(-80px, -80px);\n                width: 180px;\n            }\n\n            .loader {\n                width: 120px;        /* the size */\n                padding: 15px;       /* the border thickness */\n                background: #07e8d6; /* the color */\n                z-index:99999;\n                display: none;\n                aspect-ratio: 1;\n                border-radius: 50%;\n                --_m: \n                    conic-gradient(#0000,#000),\n                    linear-gradient(#000 0 0) content-box;\n                -webkit-mask: var(--_m);\n                    mask: var(--_m);\n                -webkit-mask-composite: source-out;\n                    mask-composite: subtract;\n                box-sizing: border-box;\n                animation: load 1s linear infinite;\n                margin-left: 30px;\n            }\n            \n            @keyframes load {\n                to{transform: rotate(1turn)}\n            }\n\n        ",
        this.spinnerDivContainerOuter.appendChild(n)
    }
    show() {
        this.spinnerDivContainerOuter.style.display = "block"
    }
    hide() {
        this.spinnerDivContainerOuter.style.display = "none"
    }
    setContainer(e) {
        this.container && this.container.removeChild(this.spinnerDivContainerOuter),
        this.container = e,
        this.container.appendChild(this.spinnerDivContainerOuter),
        this.spinnerDivContainerOuter.style.zIndex = this.container.style.zIndex + 1
    }
    setMessage(e) {
        this.messageDiv.innerHTML = e
    }
}
class ArrowHelper extends THREE.Object3D {
    constructor(e=new THREE.Vector3(0,0,1), t=new THREE.Vector3(0,0,0), n=1, s=.1, r=16776960, o=.2 * n, i=.2 * o) {
        super(),
        this.type = "ArrowHelper";
        const a = new THREE.CylinderGeometry(s,s,n,32);
        a.translate(0, n / 2, 0);
        const l = new THREE.CylinderGeometry(0,i,o,32);
        l.translate(0, n, 0),
        this.position.copy(t),
        this.line = new THREE.Mesh(a,new THREE.MeshBasicMaterial({
            color: r,
            toneMapped: !1
        })),
        this.line.matrixAutoUpdate = !1,
        this.add(this.line),
        this.cone = new THREE.Mesh(l,new THREE.MeshBasicMaterial({
            color: r,
            toneMapped: !1
        })),
        this.cone.matrixAutoUpdate = !1,
        this.add(this.cone),
        this.setDirection(e)
    }
    setDirection(e) {
        if (e.y > .99999)
            this.quaternion.set(0, 0, 0, 1);
        else if (e.y < -.99999)
            this.quaternion.set(1, 0, 0, 0);
        else {
            _axis.set(e.z, 0, -e.x).normalize();
            const t = Math.acos(e.y);
            this.quaternion.setFromAxisAngle(_axis, t)
        }
    }
    setColor(e) {
        this.line.material.color.set(e),
        this.cone.material.color.set(e)
    }
    copy(e) {
        return super.copy(e, !1),
        this.line.copy(e.line),
        this.cone.copy(e.cone),
        this
    }
    dispose() {
        this.line.geometry.dispose(),
        this.line.material.dispose(),
        this.cone.geometry.dispose(),
        this.cone.material.dispose()
    }
}
class SceneHelper {
    constructor(e) {
        this.scene = e,
        this.splatRenderTarget = null,
        this.renderTargetCopyMaterial = null,
        this.renderTargetCopyQuad = null,
        this.renderTargetCopyCamera = null,
        this.meshCursor = null,
        this.focusMarker = null,
        this.controlPlane = null
    }
    updateSplatRenderTargetForRenderDimensions(e, t) {
        this.splatRenderTarget = new THREE.WebGLRenderTarget(e,t,{
            format: THREE.RGBAFormat,
            stencilBuffer: !1,
            depthBuffer: !0
        }),
        this.splatRenderTarget.depthTexture = new THREE.DepthTexture(e,t),
        this.splatRenderTarget.depthTexture.format = THREE.DepthFormat,
        this.splatRenderTarget.depthTexture.type = THREE.UnsignedIntType
    }
    setupRenderTargetCopyObjects() {
        this.renderTargetCopyMaterial = new THREE.ShaderMaterial({
            vertexShader: "\n                varying vec2 vUv;\n                void main() {\n                    vUv = uv;\n                    gl_Position = vec4( position.xy, 0.0, 1.0 );    \n                }\n            ",
            fragmentShader: "\n                #include <common>\n                #include <packing>\n                varying vec2 vUv;\n                uniform sampler2D sourceColorTexture;\n                uniform sampler2D sourceDepthTexture;\n                void main() {\n                    vec4 color = texture2D(sourceColorTexture, vUv);\n                    float fragDepth = texture2D(sourceDepthTexture, vUv).x;\n                    gl_FragDepth = fragDepth;\n                    gl_FragColor = vec4(color.rgb, color.a * 2.0);\n              }\n            ",
            uniforms: {
                sourceColorTexture: {
                    type: "t",
                    value: null
                },
                sourceDepthTexture: {
                    type: "t",
                    value: null
                }
            },
            depthWrite: !1,
            depthTest: !1,
            transparent: !0,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendSrcAlpha: THREE.SrcAlphaFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor
        }),
        this.renderTargetCopyMaterial.extensions.fragDepth = !0,
        this.renderTargetCopyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.renderTargetCopyMaterial),
        this.renderTargetCopyCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1)
    }
    setupMeshCursor() {
        if (!this.meshCursor) {
            const e = new THREE.ConeGeometry(.5,1.5,32)
              , t = new THREE.MeshBasicMaterial({
                color: 16777215
            })
              , n = new THREE.Mesh(e,t);
            n.rotation.set(0, 0, Math.PI),
            n.position.set(0, 1, 0);
            const s = new THREE.Mesh(e,t);
            s.position.set(0, -1, 0);
            const r = new THREE.Mesh(e,t);
            r.rotation.set(0, 0, Math.PI / 2),
            r.position.set(1, 0, 0);
            const o = new THREE.Mesh(e,t);
            o.rotation.set(0, 0, -Math.PI / 2),
            o.position.set(-1, 0, 0),
            this.meshCursor = new THREE.Object3D,
            this.meshCursor.add(n),
            this.meshCursor.add(s),
            this.meshCursor.add(r),
            this.meshCursor.add(o),
            this.meshCursor.scale.set(.1, .1, .1),
            this.scene.add(this.meshCursor),
            this.meshCursor.visible = !1
        }
    }
    destroyMeshCursor() {
        this.meshCursor && (this.meshCursor.children.forEach((e => {
            e.geometry.dispose(),
            e.material.dispose()
        }
        )),
        this.scene.remove(this.meshCursor),
        this.meshCursor = null)
    }
    setMeshCursorVisibility(e) {
        this.meshCursor.visible = e
    }
    setMeshCursorPosition(e) {
        this.meshCursor.position.copy(e)
    }
    positionAndOrientMeshCursor(e, t) {
        this.meshCursor.position.copy(e),
        this.meshCursor.up.copy(t.up),
        this.meshCursor.lookAt(t.position)
    }
    setupFocusMarker() {
        if (!this.focusMarker) {
            const e = new THREE.SphereGeometry(.5,32,32)
              , t = SceneHelper.buildFocusMarkerMaterial();
            t.depthTest = !1,
            t.depthWrite = !1,
            t.transparent = !0;
            const n = new THREE.Mesh(e,t);
            this.focusMarker = n
        }
    }
    updateFocusMarker = function() {
        const e = new THREE.Vector3
          , t = new THREE.Matrix4;
        return function(n, s, r) {
            t.copy(s.matrixWorld).invert(),
            e.copy(n).applyMatrix4(t),
            e.normalize().multiplyScalar(10),
            e.applyMatrix4(s.matrixWorld),
            this.focusMarker.position.copy(e),
            this.focusMarker.material.uniforms.realFocusPosition.value.copy(n),
            this.focusMarker.material.uniforms.viewport.value.copy(r),
            this.focusMarker.material.uniformsNeedUpdate = !0
        }
    }();
    setFocusMarkerVisibility(e) {
        this.focusMarker.visible = e
    }
    setFocusMarkerOpacity(e) {
        this.focusMarker.material.uniforms.opacity.value = e,
        this.focusMarker.material.uniformsNeedUpdate = !0
    }
    getFocusMarkerOpacity() {
        return this.focusMarker.material.uniforms.opacity.value
    }
    setupControlPlane() {
        const e = new THREE.PlaneGeometry(1,1);
        e.rotateX(-Math.PI / 2);
        const t = new THREE.MeshBasicMaterial({
            color: 16777215
        });
        t.transparent = !0,
        t.opacity = .6,
        t.depthTest = !1,
        t.depthWrite = !1,
        t.side = THREE.DoubleSide;
        const n = new THREE.Mesh(e,t)
          , s = new THREE.Vector3(0,1,0);
        s.normalize();
        const r = new THREE.Vector3(0,0,0)
          , o = new ArrowHelper(s,r,.5,.01,56576,.1,.03);
        this.controlPlane = new THREE.Object3D,
        this.controlPlane.add(n),
        this.controlPlane.add(o)
    }
    setControlPlaneVisibility(e) {
        this.controlPlane.visible = e
    }
    positionAndOrientControlPlane = function() {
        const e = new THREE.Quaternion
          , t = new THREE.Vector3(0,1,0);
        return function(n, s) {
            e.setFromUnitVectors(t, s),
            this.controlPlane.position.copy(n),
            this.controlPlane.quaternion.copy(e)
        }
    }();
    addDebugMeshes() {
        this.debugRoot = this.createDebugMeshes(),
        this.secondaryDebugRoot = this.createSecondaryDebugMeshes(),
        this.scene.add(this.debugRoot),
        this.scene.add(this.secondaryDebugRoot)
    }
    createDebugMeshes(e) {
        const t = new THREE.SphereGeometry(1,32,32)
          , n = new THREE.Object3D
          , s = (s, r) => {
            let o = new THREE.Mesh(t,SceneHelper.buildDebugMaterial(s));
            o.renderOrder = e,
            n.add(o),
            o.position.fromArray(r)
        }
        ;
        return s(16711680, [-50, 0, 0]),
        s(16711680, [50, 0, 0]),
        s(65280, [0, 0, -50]),
        s(65280, [0, 0, 50]),
        s(16755200, [5, 0, 5]),
        n
    }
    createSecondaryDebugMeshes(e) {
        const t = new THREE.BoxGeometry(3,3,3)
          , n = new THREE.Object3D;
        const s = s => {
            let r = new THREE.Mesh(t,SceneHelper.buildDebugMaterial(12303291));
            r.renderOrder = e,
            n.add(r),
            r.position.fromArray(s)
        }
        ;
        let r = 10;
        return s([-10, 0, -10]),
        s([-10, 0, r]),
        s([r, 0, -10]),
        s([r, 0, r]),
        n
    }
    static buildDebugMaterial(e) {
        const t = {
            color: {
                type: "v3",
                value: new THREE.Color(e)
            }
        }
          , n = new THREE.ShaderMaterial({
            uniforms: t,
            vertexShader: "\n            #include <common>\n            varying float ndcDepth;\n\n            void main() {\n                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position.xyz, 1.0);\n                ndcDepth = gl_Position.z / gl_Position.w;\n                gl_Position.x = gl_Position.x / gl_Position.w;\n                gl_Position.y = gl_Position.y / gl_Position.w;\n                gl_Position.z = 0.0;\n                gl_Position.w = 1.0;\n    \n            }\n        ",
            fragmentShader: "\n            #include <common>\n            uniform vec3 color;\n            varying float ndcDepth;\n            void main() {\n                gl_FragDepth = (ndcDepth + 1.0) / 2.0;\n                gl_FragColor = vec4(color.rgb, 0.0);\n            }\n        ",
            transparent: !1,
            depthTest: !0,
            depthWrite: !0,
            side: THREE.FrontSide
        });
        return n.extensions.fragDepth = !0,
        n
    }
    static buildFocusMarkerMaterial(e) {
        const t = {
            color: {
                type: "v3",
                value: new THREE.Color(e)
            },
            realFocusPosition: {
                type: "v3",
                value: new THREE.Vector3
            },
            viewport: {
                type: "v2",
                value: new THREE.Vector2
            },
            opacity: {
                value: 0
            }
        };
        return new THREE.ShaderMaterial({
            uniforms: t,
            vertexShader: "\n            #include <common>\n\n            uniform vec2 viewport;\n            uniform vec3 realFocusPosition;\n\n            varying vec4 ndcPosition;\n            varying vec4 ndcCenter;\n            varying vec4 ndcFocusPosition;\n\n            void main() {\n                float radius = 0.01;\n\n                vec4 viewPosition = modelViewMatrix * vec4(position.xyz, 1.0);\n                vec4 viewCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);\n\n                vec4 viewFocusPosition = modelViewMatrix * vec4(realFocusPosition, 1.0);\n\n                ndcPosition = projectionMatrix * viewPosition;\n                ndcPosition = ndcPosition * vec4(1.0 / ndcPosition.w);\n                ndcCenter = projectionMatrix * viewCenter;\n                ndcCenter = ndcCenter * vec4(1.0 / ndcCenter.w);\n\n                ndcFocusPosition = projectionMatrix * viewFocusPosition;\n                ndcFocusPosition = ndcFocusPosition * vec4(1.0 / ndcFocusPosition.w);\n\n                gl_Position = projectionMatrix * viewPosition;\n\n            }\n        ",
            fragmentShader: "\n            #include <common>\n            uniform vec3 color;\n            uniform vec2 viewport;\n            uniform float opacity;\n\n            varying vec4 ndcPosition;\n            varying vec4 ndcCenter;\n            varying vec4 ndcFocusPosition;\n\n            void main() {\n                vec2 screenPosition = vec2(ndcPosition) * viewport;\n                vec2 screenCenter = vec2(ndcCenter) * viewport;\n\n                vec2 screenVec = screenPosition - screenCenter;\n\n                float projectedRadius = length(screenVec);\n\n                float lineWidth = 0.0005 * viewport.y;\n                float aaRange = 0.0025 * viewport.y;\n                float radius = 0.06 * viewport.y;\n                float radDiff = abs(projectedRadius - radius) - lineWidth;\n                float alpha = 1.0 - clamp(radDiff / 5.0, 0.0, 1.0); \n\n                gl_FragColor = vec4(color.rgb, alpha * opacity);\n            }\n        ",
            transparent: !0,
            depthTest: !1,
            depthWrite: !1,
            side: THREE.FrontSide
        })
    }
}
const VectorRight = new THREE.Vector3(1,0,0)
  , VectorUp = new THREE.Vector3(0,1,0)
  , VectorBackward = new THREE.Vector3(0,0,1);
class Ray {
    constructor(e=new THREE.Vector3, t=new THREE.Vector3) {
        this.origin = new THREE.Vector3,
        this.direction = new THREE.Vector3,
        this.setParameters(e, t)
    }
    setParameters(e, t) {
        this.origin.copy(e),
        this.direction.copy(t).normalize()
    }
    boxContainsPoint(e, t, n) {
        return !(t.x < e.min.x - n || t.x > e.max.x + n || t.y < e.min.y - n || t.y > e.max.y + n || t.z < e.min.z - n || t.z > e.max.z + n)
    }
    intersectBox = function() {
        const e = new THREE.Vector3
          , t = []
          , n = []
          , s = [];
        return function(r, o) {
            if (n[0] = this.origin.x,
            n[1] = this.origin.y,
            n[2] = this.origin.z,
            s[0] = this.direction.x,
            s[1] = this.direction.y,
            s[2] = this.direction.z,
            this.boxContainsPoint(r, this.origin, 1e-4))
                return o && (o.origin.copy(this.origin),
                o.normal.set(0, 0, 0),
                o.distance = -1),
                !0;
            for (let i = 0; i < 3; i++) {
                if (0 == s[i])
                    continue;
                const a = 0 == i ? VectorRight : 1 == i ? VectorUp : VectorBackward
                  , l = s[i] < 0 ? r.max : r.min;
                let c = -Math.sign(s[i]);
                t[0] = 0 == i ? l.x : 1 == i ? l.y : l.z;
                let h = t[0] - n[i];
                if (h * c < 0) {
                    const l = (i + 1) % 3
                      , u = (i + 2) % 3;
                    if (t[2] = s[l] / s[i] * h + n[l],
                    t[1] = s[u] / s[i] * h + n[u],
                    e.set(t[i], t[u], t[l]),
                    this.boxContainsPoint(r, e, 1e-4))
                        return o && (o.origin.copy(e),
                        o.normal.copy(a).multiplyScalar(c),
                        o.distance = e.sub(this.origin).length()),
                        !0
                }
            }
            return !1
        }
    }();
    intersectSphere = function() {
        const e = new THREE.Vector3;
        return function(t, n, s) {
            e.copy(t).sub(this.origin);
            const r = e.dot(this.direction)
              , o = r * r
              , i = e.dot(e) - o
              , a = n * n;
            if (i > a)
                return !1;
            const l = Math.sqrt(a - i)
              , c = r - l
              , h = r + l;
            if (h < 0)
                return !1;
            let u = c < 0 ? h : c;
            return s && (s.origin.copy(this.origin).addScaledVector(this.direction, u),
            s.normal.copy(s.origin).sub(t).normalize(),
            s.distance = u),
            !0
        }
    }()
}
class Hit {
    constructor() {
        this.origin = new THREE.Vector3,
        this.normal = new THREE.Vector3,
        this.distance = 0
    }
    set(e, t, n) {
        this.origin.copy(e),
        this.normal.copy(t),
        this.distance = n
    }
    clone() {
        const e = new Hit;
        return e.origin.copy(this.origin),
        e.normal.copy(this.normal),
        e.distance = this.distance,
        e
    }
}
class Raycaster {
    constructor(e, t) {
        this.ray = new Ray(e,t)
    }
    setFromCameraAndScreenPosition = function() {
        const e = new THREE.Vector2;
        return function(t, n, s) {
            if (e.x = n.x / s.x * 2 - 1,
            e.y = (s.y - n.y) / s.y * 2 - 1,
            t.isPerspectiveCamera)
                this.ray.origin.setFromMatrixPosition(t.matrixWorld),
                this.ray.direction.set(e.x, e.y, .5).unproject(t).sub(this.ray.origin).normalize(),
                this.camera = t;
            else {
                if (!t.isOrthographicCamera)
                    throw new Error("Raycaster::setFromCameraAndScreenPosition() -> Unsupported camera type");
                this.ray.origin.set(n.x, n.y, (t.near + t.far) / (t.near - t.far)).unproject(t),
                this.ray.direction.set(0, 0, -1).transformDirection(t.matrixWorld),
                this.camera = t
            }
        }
    }();
    intersectSplatMesh = function() {
        const e = new THREE.Matrix4
          , t = new THREE.Matrix4
          , n = new Ray;
        return function(s, r=[]) {
            t.copy(s.matrixWorld),
            e.copy(t).invert(),
            n.origin.copy(this.ray.origin).applyMatrix4(e),
            n.direction.copy(this.ray.direction).transformDirection(e);
            const o = s.getSplatTree();
            return o.rootNode && this.castRayAtSplatTreeNode(n, o, o.rootNode, r),
            r.sort(( (e, t) => e.distance > t.distance ? 1 : -1)),
            r.forEach((e => {
                e.origin.applyMatrix4(t),
                e.normal.transformDirection(t)
            }
            )),
            r
        }
    }();
    castRayAtSplatTreeNode = function() {
        const e = new THREE.Vector3
          , t = new THREE.Vector3
          , n = new THREE.Quaternion
          , s = new Hit
          , r = 1e-7;
        return function(o, i, a, l=[]) {
            if (o.intersectBox(a.boundingBox)) {
                if (a.data.indexes && a.data.indexes.length > 0)
                    for (let c = 0; c < a.data.indexes.length; c++) {
                        const h = a.data.indexes[c];
                        if (i.splatMesh.getSplatCenter(h, e),
                        i.splatMesh.getSplatScaleAndRotation(h, t, n),
                        t.x <= r || t.y <= r || t.z <= r)
                            continue;
                        const u = (t.x + t.y + t.z) / 3;
                        o.intersectSphere(e, u, s) && l.push(s.clone())
                    }
                if (a.children && a.children.length > 0)
                    for (let e of a.children)
                        this.castRayAtSplatTreeNode(o, i, e, l);
                return l
            }
        }
    }()
}
let idGen = 0;
class SplatTreeNode {
    constructor(e, t, n, s) {
        this.min = (new THREE.Vector3).copy(e),
        this.max = (new THREE.Vector3).copy(t),
        this.boundingBox = new THREE.Box3(this.min,this.max),
        this.center = (new THREE.Vector3).copy(this.max).sub(this.min).multiplyScalar(.5).add(this.min),
        this.depth = n,
        this.children = [],
        this.data = null,
        this.id = s || idGen++
    }
}
class SplatTree {
    constructor(e, t) {
        this.maxDepth = e,
        this.maxCentersPerNode = t,
        this.splatMesh = [],
        this.sceneDimensions = new THREE.Vector3,
        this.sceneMin = new THREE.Vector3,
        this.sceneMax = new THREE.Vector3,
        this.rootNode = null,
        this.addedIndexes = {},
        this.nodesWithIndexes = []
    }
    processSplatMesh(e, t=( () => !0)) {
        const n = new THREE.Vector3;
        this.splatMesh = e,
        this.sceneMin = new THREE.Vector3,
        this.sceneMax = new THREE.Vector3,
        this.addedIndexes = {},
        this.nodesWithIndexes = [],
        this.globalSplatIndexToLocalSplatIndexMap = {},
        this.globalSplatIndexToSplatBufferIndexMap = {};
        let s = 0;
        const r = []
          , o = this.splatMesh.getSplatCount();
        for (let e = 0; e < o; e++)
            t(e) && (this.splatMesh.getSplatCenter(e, n),
            (0 === s || n.x < this.sceneMin.x) && (this.sceneMin.x = n.x),
            (0 === s || n.x > this.sceneMax.x) && (this.sceneMax.x = n.x),
            (0 === s || n.y < this.sceneMin.y) && (this.sceneMin.y = n.y),
            (0 === s || n.y > this.sceneMax.y) && (this.sceneMax.y = n.y),
            (0 === s || n.z < this.sceneMin.z) && (this.sceneMin.z = n.z),
            (0 === s || n.z > this.sceneMax.z) && (this.sceneMax.z = n.z),
            s++,
            r.push(e));
        this.sceneDimensions.copy(this.sceneMin).sub(this.sceneMin),
        this.rootNode = new SplatTreeNode(this.sceneMin,this.sceneMax,0),
        this.rootNode.data = {
            indexes: r
        },
        this.processNode(this.rootNode, e)
    }
    processNode(e, t) {
        const n = e.data.indexes.length;
        if (n < this.maxCentersPerNode || e.depth > this.maxDepth) {
            const t = [];
            for (let n = 0; n < e.data.indexes.length; n++)
                this.addedIndexes[e.data.indexes[n]] || (t.push(e.data.indexes[n]),
                this.addedIndexes[e.data.indexes[n]] = !0);
            return e.data.indexes = t,
            void this.nodesWithIndexes.push(e)
        }
        const s = (new THREE.Vector3).copy(e.max).sub(e.min)
          , r = (new THREE.Vector3).copy(s).multiplyScalar(.5)
          , o = (new THREE.Vector3).copy(e.min).add(r)
          , i = [new THREE.Box3(new THREE.Vector3(o.x - r.x,o.y,o.z - r.z),new THREE.Vector3(o.x,o.y + r.y,o.z)), new THREE.Box3(new THREE.Vector3(o.x,o.y,o.z - r.z),new THREE.Vector3(o.x + r.x,o.y + r.y,o.z)), new THREE.Box3(new THREE.Vector3(o.x,o.y,o.z),new THREE.Vector3(o.x + r.x,o.y + r.y,o.z + r.z)), new THREE.Box3(new THREE.Vector3(o.x - r.x,o.y,o.z),new THREE.Vector3(o.x,o.y + r.y,o.z + r.z)), new THREE.Box3(new THREE.Vector3(o.x - r.x,o.y - r.y,o.z - r.z),new THREE.Vector3(o.x,o.y,o.z)), new THREE.Box3(new THREE.Vector3(o.x,o.y - r.y,o.z - r.z),new THREE.Vector3(o.x + r.x,o.y,o.z)), new THREE.Box3(new THREE.Vector3(o.x,o.y - r.y,o.z),new THREE.Vector3(o.x + r.x,o.y,o.z + r.z)), new THREE.Box3(new THREE.Vector3(o.x - r.x,o.y - r.y,o.z),new THREE.Vector3(o.x,o.y,o.z + r.z))]
          , a = []
          , l = [];
        for (let e = 0; e < i.length; e++)
            a[e] = 0,
            l[e] = [];
        const c = new THREE.Vector3;
        for (let t = 0; t < n; t++) {
            const n = e.data.indexes[t];
            this.splatMesh.getSplatCenter(n, c);
            for (let e = 0; e < i.length; e++)
                i[e].containsPoint(c) && (a[e]++,
                l[e].push(n))
        }
        for (let t = 0; t < i.length; t++) {
            const n = new SplatTreeNode(i[t].min,i[t].max,e.depth + 1);
            n.data = {
                indexes: l[t]
            },
            e.children.push(n)
        }
        e.data = {};
        for (let n of e.children)
            this.processNode(n, t)
    }
    countLeaves() {
        let e = 0;
        return this.visitLeaves(( () => {
            e++
        }
        )),
        e
    }
    visitLeaves(e) {
        const t = (e, n) => {
            0 === e.children.length && n(e);
            for (let s of e.children)
                t(s, n)
        }
        ;
        return t(this.rootNode, e)
    }
}
const dummyGeometry = new THREE.BufferGeometry
  , dummyMaterial = new THREE.MeshBasicMaterial;
class SplatMesh extends THREE.Mesh {
    constructor(e=!1, t=1, n=!0, s=!1) {
        super(dummyGeometry, dummyMaterial),
        this.renderer = void 0,
        this.halfPrecisionCovariancesOnGPU = e,
        this.devicePixelRatio = t,
        this.enableDistancesComputationOnGPU = n,
        this.integerBasedDistancesComputation = s,
        this.splatBuffers = [],
        this.splatBufferOptions = [],
        this.splatBufferTransforms = [],
        this.splatTree = null,
        this.splatDataTextures = null,
        this.distancesTransformFeedback = {
            id: null,
            vertexShader: null,
            fragmentShader: null,
            program: null,
            centersBuffer: null,
            outDistancesBuffer: null,
            centersLoc: -1,
            modelViewProjLoc: -1
        },
        this.globalSplatIndexToLocalSplatIndexMap = {},
        this.globalSplatIndexToSplatBufferIndexMap = {}
    }
    static buildMaterial() {
        const e = {
            covariancesTexture: {
                type: "t",
                value: null
            },
            centersColorsTexture: {
                type: "t",
                value: null
            },
            focal: {
                type: "v2",
                value: new THREE.Vector2
            },
            viewport: {
                type: "v2",
                value: new THREE.Vector2
            },
            basisViewport: {
                type: "v2",
                value: new THREE.Vector2
            },
            debugColor: {
                type: "v3",
                value: new THREE.Color
            },
            covariancesTextureSize: {
                type: "v2",
                value: new THREE.Vector2(1024,1024)
            },
            centersColorsTextureSize: {
                type: "v2",
                value: new THREE.Vector2(1024,1024)
            }
        };
        return new THREE.ShaderMaterial({
            uniforms: e,
            vertexShader: "\n            precision highp float;\n            #include <common>\n\n            attribute uint splatIndex;\n\n            uniform highp sampler2D covariancesTexture;\n            uniform highp usampler2D centersColorsTexture;\n            uniform vec2 focal;\n            uniform vec2 viewport;\n            uniform vec2 basisViewport;\n            uniform vec2 covariancesTextureSize;\n            uniform vec2 centersColorsTextureSize;\n\n            varying vec4 vColor;\n            varying vec2 vUv;\n\n            varying vec2 vPosition;\n\n            const vec4 encodeNorm4 = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0);\n            const uvec4 mask4 = uvec4(uint(0x000000FF), uint(0x0000FF00), uint(0x00FF0000), uint(0xFF000000));\n            const uvec4 shift4 = uvec4(0, 8, 16, 24);\n            vec4 uintToRGBAVec (uint u) {\n               uvec4 urgba = mask4 & u;\n               urgba = urgba >> shift4;\n               vec4 rgba = vec4(urgba) * encodeNorm4;\n               return rgba;\n            }\n\n            vec2 getDataUV(in int stride, in int offset, in vec2 dimensions) {\n                vec2 samplerUV = vec2(0.0, 0.0);\n                float d = float(splatIndex * uint(stride) + uint(offset)) / dimensions.x;\n                samplerUV.y = float(floor(d)) / dimensions.y;\n                samplerUV.x = fract(d);\n                return samplerUV;\n            }\n\n            void main () {\n                uvec4 sampledCenterColor = texture(centersColorsTexture, getDataUV(1, 0, centersColorsTextureSize));\n                vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));\n                vColor = uintToRGBAVec(sampledCenterColor.r);\n\n                vPosition = position.xy * 2.0;\n\n                vec4 viewCenter = modelViewMatrix * vec4(splatCenter, 1.0);\n                vec4 clipCenter = projectionMatrix * viewCenter;\n\n                vec2 sampledCovarianceA = texture(covariancesTexture, getDataUV(3, 0, covariancesTextureSize)).rg;\n                vec2 sampledCovarianceB = texture(covariancesTexture, getDataUV(3, 1, covariancesTextureSize)).rg;\n                vec2 sampledCovarianceC = texture(covariancesTexture, getDataUV(3, 2, covariancesTextureSize)).rg;\n\n                vec3 cov3D_M11_M12_M13 = vec3(sampledCovarianceA.rg, sampledCovarianceB.r);\n                vec3 cov3D_M22_M23_M33 = vec3(sampledCovarianceB.g, sampledCovarianceC.rg);\n\n                // Compute the 2D covariance matrix from the upper-right portion of the 3D covariance matrix\n                mat3 Vrk = mat3(\n                    cov3D_M11_M12_M13.x, cov3D_M11_M12_M13.y, cov3D_M11_M12_M13.z,\n                    cov3D_M11_M12_M13.y, cov3D_M22_M23_M33.x, cov3D_M22_M23_M33.y,\n                    cov3D_M11_M12_M13.z, cov3D_M22_M23_M33.y, cov3D_M22_M23_M33.z\n                );\n                float s = 1.0 / (viewCenter.z * viewCenter.z);\n                mat3 J = mat3(\n                    focal.x / viewCenter.z, 0., -(focal.x * viewCenter.x) * s,\n                    0., focal.y / viewCenter.z, -(focal.y * viewCenter.y) * s,\n                    0., 0., 0.\n                );\n                mat3 W = transpose(mat3(modelViewMatrix));\n                mat3 T = W * J;\n                mat3 cov2Dm = transpose(T) * Vrk * T;\n                cov2Dm[0][0] += 0.3;\n                cov2Dm[1][1] += 0.3;\n\n                // We are interested in the upper-left 2x2 portion of the projected 3D covariance matrix because\n                // we only care about the X and Y values. We want the X-diagonal, cov2Dm[0][0],\n                // the Y-diagonal, cov2Dm[1][1], and the correlation between the two cov2Dm[0][1]. We don't\n                // need cov2Dm[1][0] because it is a symetric matrix.\n                vec3 cov2Dv = vec3(cov2Dm[0][0], cov2Dm[0][1], cov2Dm[1][1]);\n\n                vec3 ndcCenter = clipCenter.xyz / clipCenter.w;\n\n                // We now need to solve for the eigen-values and eigen vectors of the 2D covariance matrix\n                // so that we can determine the 2D basis for the splat. This is done using the method described\n                // here: https://people.math.harvard.edu/~knill/teaching/math21b2004/exhibits/2dmatrices/index.html\n                //\n                // This is a different approach than in the original work at INRIA. In that work they compute the\n                // max extents of the 2D covariance matrix in screen space to form an axis aligned bounding rectangle\n                // which forms the geometry that is actually rasterized. They then use the inverse 2D covariance\n                // matrix (called 'conic') to determine fragment opacity.\n                float a = cov2Dv.x;\n                float d = cov2Dv.z;\n                float b = cov2Dv.y;\n                float D = a * d - b * b;\n                float trace = a + d;\n                float traceOver2 = 0.5 * trace;\n                float term2 = sqrt(trace * trace / 4.0 - D);\n                float eigenValue1 = traceOver2 + term2;\n                float eigenValue2 = max(traceOver2 - term2, 0.00); // prevent negative eigen value\n\n                const float maxSplatSize = 1024.0;\n                vec2 eigenVector1 = normalize(vec2(b, eigenValue1 - a));\n                // since the eigen vectors are orthogonal, we derive the second one from the first\n                vec2 eigenVector2 = vec2(eigenVector1.y, -eigenVector1.x);\n                vec2 basisVector1 = eigenVector1 * min(sqrt(2.0 * eigenValue1), maxSplatSize);\n                vec2 basisVector2 = eigenVector2 * min(sqrt(2.0 * eigenValue2), maxSplatSize);\n\n                vec2 ndcOffset = vec2(vPosition.x * basisVector1 + vPosition.y * basisVector2) * basisViewport;\n\n                gl_Position = vec4(ndcCenter.xy + ndcOffset, ndcCenter.z, 1.0);\n            }",
            fragmentShader: "\n            precision highp float;\n            #include <common>\n\n            uniform vec3 debugColor;\n\n            varying vec4 vColor;\n            varying vec2 vUv;\n\n            varying vec2 vPosition;\n\n            void main () {\n                // compute the negative squared distance from the center of the splat to the\n                // current fragment in the splat's local space.\n                float A = -dot(vPosition, vPosition);\n                if (A < -4.0) discard;\n                vec3 color = vColor.rgb;\n                A = exp(A) * vColor.a;\n                gl_FragColor = vec4(color.rgb, A);\n            }",
            transparent: !0,
            alphaTest: 1,
            blending: THREE.NormalBlending,
            depthTest: !0,
            depthWrite: !1,
            side: THREE.DoubleSide
        })
    }
    static buildGeomtery(e) {
        const t = new THREE.BufferGeometry;
        t.setIndex([0, 1, 2, 0, 2, 3]);
        const n = new Float32Array(12)
          , s = new THREE.BufferAttribute(n,3);
        t.setAttribute("position", s),
        s.setXYZ(0, -1, -1, 0),
        s.setXYZ(1, -1, 1, 0),
        s.setXYZ(2, 1, 1, 0),
        s.setXYZ(3, 1, -1, 0),
        s.needsUpdate = !0;
        const r = (new THREE.InstancedBufferGeometry).copy(t)
          , o = new Uint32Array(e)
          , i = new THREE.InstancedBufferAttribute(o,1,!1);
        return i.setUsage(THREE.DynamicDrawUsage),
        r.setAttribute("splatIndex", i),
        r.instanceCount = e,
        r
    }
    static buildSplatBufferTransforms(e, t=null) {
        (t = t || []).length = e.length;
        for (let n = 0; n < e.length; n++)
            if (!t[n]) {
                const s = e[n];
                if (s) {
                    let e = s.position || [0, 0, 0]
                      , r = s.rotation || [0, 0, 0, 1]
                      , o = s.scale || [1, 1, 1];
                    const i = (new THREE.Vector3).fromArray(e)
                      , a = (new THREE.Quaternion).fromArray(r)
                      , l = (new THREE.Vector3).fromArray(o)
                      , c = new THREE.Matrix4;
                    c.compose(i, a, l),
                    t[n] = c
                }
            }
        return t
    }
    static buildSplatIndexMaps(e) {
        const t = new Map
          , n = new Map;
        let s = 0;
        for (let r = 0; r < e.length; r++) {
            const o = e[r].getSplatCount();
            for (let e = 0; e < o; e++)
                t[s] = e,
                n[s] = r,
                s++
        }
        return {
            localSplatIndexMap: t,
            splatBufferIndexMap: n
        }
    }
    static buildSplatTree(e) {
        const t = new SplatTree(8,1e3);
        console.time("SplatTree build");
        const n = new THREE.Vector4;
        t.processSplatMesh(e, (t => {
            e.getSplatColor(t, n);
            const s = e.getSplatBufferIndexForSplat(t)
              , r = e.splatBufferOptions[s];
            return n.w >= (r.splatAlphaRemovalThreshold || 1)
        }
        )),
        console.timeEnd("SplatTree build");
        let s = 0
          , r = 0
          , o = 0
          , i = 0;
        return t.visitLeaves((e => {
            const t = e.data.indexes.length;
            t > 0 && (r += t,
            o = Math.max(o, t),
            i++,
            s++)
        }
        )),
        console.log(`SplatTree leaves: ${t.countLeaves()}`),
        console.log(`SplatTree leaves with splats:${s}`),
        r /= i,
        console.log(`Avg splat count per node: ${r}`),
        console.log(`Total splat count: ${e.getSplatCount()}`),
        t
    }
    build(e, t, n=!0) {
        this.disposeMeshData();
        const s = SplatMesh.getTotalSplatCountForSplatBuffers(e);
        this.splatBufferTransforms = SplatMesh.buildSplatBufferTransforms(t, n ? this.splatBufferTransforms : null),
        this.geometry = SplatMesh.buildGeomtery(s),
        this.material = SplatMesh.buildMaterial();
        const r = SplatMesh.buildSplatIndexMaps(e);
        this.globalSplatIndexToLocalSplatIndexMap = r.localSplatIndexMap,
        this.globalSplatIndexToSplatBufferIndexMap = r.splatBufferIndexMap,
        this.splatTree = SplatMesh.buildSplatTree(this),
        this.splatBuffers = e,
        this.splatBufferOptions = t,
        this.enableDistancesComputationOnGPU && this.setupDistancesComputationTransformFeedback(),
        this.resetDataFromSplatBuffer()
    }
    dispose() {
        this.disposeMeshData(),
        this.enableDistancesComputationOnGPU && this.disposeDistancesComputationGPUResources()
    }
    disposeMeshData() {
        this.geometry && this.geometry !== dummyGeometry && (this.geometry.dispose(),
        this.geometry = null);
        for (let e in this.splatDataTextures)
            if (this.splatDataTextures.hasOwnProperty(e)) {
                const t = this.splatDataTextures[e];
                t.texture && (t.texture.dispose(),
                t.texture = null)
            }
        this.splatDataTextures = null,
        this.material && (this.material.dispose(),
        this.material = null),
        this.splatTree = null
    }
    getSplatTree() {
        return this.splatTree
    }
    resetDataFromSplatBuffer() {
        this.uploadSplatDataToTextures(),
        this.enableDistancesComputationOnGPU && this.updateGPUCentersBufferForDistancesComputation()
    }
    uploadSplatDataToTextures() {
        const e = this.getSplatCount()
          , t = new Float32Array(6 * e)
          , n = new Float32Array(3 * e)
          , s = new Uint8Array(4 * e);
        this.fillSplatDataArrays(t, n, s);
        const r = new THREE.Vector2(4096,1024);
        for (; r.x * r.y * 2 < 6 * e; )
            r.y *= 2;
        const o = new THREE.Vector2(4096,1024);
        for (; o.x * o.y * 4 < 4 * e; )
            o.y *= 2;
        let i, a;
        if (this.halfPrecisionCovariancesOnGPU) {
            a = new Uint16Array(r.x * r.y * 2);
            for (let e = 0; e < t.length; e++)
                a[e] = THREE.DataUtils.toHalfFloat(t[e]);
            i = new THREE.DataTexture(a,r.x,r.y,THREE.RGFormat,THREE.HalfFloatType)
        } else
            a = new Float32Array(r.x * r.y * 2),
            a.set(t),
            i = new THREE.DataTexture(a,r.x,r.y,THREE.RGFormat,THREE.FloatType);
        i.needsUpdate = !0,
        this.material.uniforms.covariancesTexture.value = i,
        this.material.uniforms.covariancesTextureSize.value.copy(r);
        const l = new Uint32Array(o.x * o.y * 4);
        for (let t = 0; t < e; t++) {
            const e = 4 * t
              , r = 3 * t
              , o = 4 * t;
            l[o] = rgbaToInteger(s[e], s[e + 1], s[e + 2], s[e + 3]),
            l[o + 1] = uintEncodedFloat(n[r]),
            l[o + 2] = uintEncodedFloat(n[r + 1]),
            l[o + 3] = uintEncodedFloat(n[r + 2])
        }
        const c = new THREE.DataTexture(l,o.x,o.y,THREE.RGBAIntegerFormat,THREE.UnsignedIntType);
        c.internalFormat = "RGBA32UI",
        c.needsUpdate = !0,
        this.material.uniforms.centersColorsTexture.value = c,
        this.material.uniforms.centersColorsTextureSize.value.copy(o),
        this.material.uniformsNeedUpdate = !0,
        this.splatDataTextures = {
            covariances: {
                data: a,
                texture: i,
                size: r
            },
            centerColors: {
                data: l,
                texture: c,
                size: o
            }
        }
    }
    updateRenderIndexes(e, t) {
        const n = this.geometry;
        n.attributes.splatIndex.set(e),
        n.attributes.splatIndex.needsUpdate = !0,
        n.instanceCount = t
    }
    updateUniforms = function() {
        const e = new THREE.Vector2;
        return function(t, n, s) {
            this.getSplatCount() > 0 && (e.set(t.x * this.devicePixelRatio, t.y * this.devicePixelRatio),
            this.material.uniforms.viewport.value.copy(e),
            this.material.uniforms.basisViewport.value.set(2 / e.x, 2 / e.y),
            this.material.uniforms.focal.value.set(n, s),
            this.material.uniformsNeedUpdate = !0)
        }
    }();
    getSplatDataTextures() {
        return this.splatDataTextures
    }
    getSplatCount() {
        return SplatMesh.getTotalSplatCountForSplatBuffers(this.splatBuffers)
    }
    static getTotalSplatCountForSplatBuffers(e) {
        let t = 0;
        for (let n of e)
            t += n.getSplatCount();
        return t
    }
    disposeDistancesComputationGPUResources() {
        if (!this.renderer)
            return;
        const e = this.renderer.getContext();
        this.distancesTransformFeedback.vao && (e.deleteVertexArray(this.distancesTransformFeedback.vao),
        this.distancesTransformFeedback.vao = null),
        this.distancesTransformFeedback.program && (e.deleteProgram(this.distancesTransformFeedback.program),
        e.deleteShader(this.distancesTransformFeedback.vertexShader),
        e.deleteShader(this.distancesTransformFeedback.fragmentShader),
        this.distancesTransformFeedback.program = null,
        this.distancesTransformFeedback.vertexShader = null,
        this.distancesTransformFeedback.fragmentShader = null),
        this.disposeDistancesComputationGPUBufferResources(),
        this.distancesTransformFeedback.id && (e.deleteTransformFeedback(this.distancesTransformFeedback.id),
        this.distancesTransformFeedback.id = null)
    }
    disposeDistancesComputationGPUBufferResources() {
        if (!this.renderer)
            return;
        const e = this.renderer.getContext();
        this.distancesTransformFeedback.centersBuffer && (this.distancesTransformFeedback.centersBuffer = null,
        e.deleteBuffer(this.distancesTransformFeedback.centersBuffer)),
        this.distancesTransformFeedback.outDistancesBuffer && (e.deleteBuffer(this.distancesTransformFeedback.outDistancesBuffer),
        this.distancesTransformFeedback.outDistancesBuffer = null)
    }
    setRenderer(e) {
        e !== this.renderer && (this.renderer = e,
        this.enableDistancesComputationOnGPU && this.getSplatCount() > 0 && (this.setupDistancesComputationTransformFeedback(),
        this.updateGPUCentersBufferForDistancesComputation()))
    }
    setupDistancesComputationTransformFeedback = function() {
        let e, t;
        return function() {
            const n = this.getSplatCount();
            if (!this.renderer || e === this.renderer && t === n)
                return;
            const s = e !== this.renderer
              , r = t !== n;
            s ? this.disposeDistancesComputationGPUResources() : r && this.disposeDistancesComputationGPUBufferResources();
            const o = this.renderer.getContext()
              , i = (e, t, n) => {
                const s = e.createShader(t);
                if (!s)
                    return console.error("Fatal error: gl could not create a shader object."),
                    null;
                e.shaderSource(s, n),
                e.compileShader(s);
                if (!e.getShaderParameter(s, e.COMPILE_STATUS)) {
                    let n = "unknown";
                    t === e.VERTEX_SHADER ? n = "vertex shader" : t === e.FRAGMENT_SHADER && (n = "fragement shader");
                    const r = e.getShaderInfoLog(s);
                    return console.error("Failed to compile " + n + " with these errors:" + r),
                    e.deleteShader(s),
                    null
                }
                return s
            }
            ;
            let a;
            a = this.integerBasedDistancesComputation ? "#version 300 es\n                    in ivec3 center;\n                    uniform ivec3 modelViewProj;\n                    flat out int distance;\n                    void main(void) {\n                        distance = center.x * modelViewProj.x + center.y * modelViewProj.y + center.z * modelViewProj.z;\n                    }\n                " : "#version 300 es\n                    in vec3 center;\n                    uniform vec3 modelViewProj;\n                    flat out float distance;\n                    void main(void) {\n                        distance = center.x * modelViewProj.x + center.y * modelViewProj.y + center.z * modelViewProj.z;\n                    }\n                ";
            const l = o.getParameter(o.VERTEX_ARRAY_BINDING)
              , c = o.getParameter(o.CURRENT_PROGRAM);
            if (s && (this.distancesTransformFeedback.vao = o.createVertexArray()),
            o.bindVertexArray(this.distancesTransformFeedback.vao),
            s) {
                const e = o.createProgram()
                  , t = i(o, o.VERTEX_SHADER, a)
                  , n = i(o, o.FRAGMENT_SHADER, "#version 300 es\n                precision lowp float;\n                out vec4 fragColor;\n                void main(){}\n            ");
                if (!t || !n)
                    throw new Error("Could not compile shaders for distances computation on GPU.");
                o.attachShader(e, t),
                o.attachShader(e, n),
                o.transformFeedbackVaryings(e, ["distance"], o.SEPARATE_ATTRIBS),
                o.linkProgram(e);
                if (!o.getProgramParameter(e, o.LINK_STATUS)) {
                    const s = o.getProgramInfoLog(e);
                    throw console.error("Fatal error: Failed to link program: " + s),
                    o.deleteProgram(e),
                    o.deleteShader(n),
                    o.deleteShader(t),
                    new Error("Could not link shaders for distances computation on GPU.")
                }
                this.distancesTransformFeedback.program = e,
                this.distancesTransformFeedback.vertexShader = t,
                this.distancesTransformFeedback.vertexShader = n
            }
            o.useProgram(this.distancesTransformFeedback.program),
            this.distancesTransformFeedback.centersLoc = o.getAttribLocation(this.distancesTransformFeedback.program, "center"),
            this.distancesTransformFeedback.modelViewProjLoc = o.getUniformLocation(this.distancesTransformFeedback.program, "modelViewProj"),
            (s || r) && (this.distancesTransformFeedback.centersBuffer = o.createBuffer(),
            o.bindBuffer(o.ARRAY_BUFFER, this.distancesTransformFeedback.centersBuffer),
            o.enableVertexAttribArray(this.distancesTransformFeedback.centersLoc),
            this.integerBasedDistancesComputation ? o.vertexAttribIPointer(this.distancesTransformFeedback.centersLoc, 3, o.INT, 0, 0) : o.vertexAttribPointer(this.distancesTransformFeedback.centersLoc, 3, o.FLOAT, !1, 0, 0)),
            (s || r) && (this.distancesTransformFeedback.outDistancesBuffer = o.createBuffer()),
            o.bindBuffer(o.ARRAY_BUFFER, this.distancesTransformFeedback.outDistancesBuffer),
            o.bufferData(o.ARRAY_BUFFER, 4 * n, o.DYNAMIC_COPY),
            s && (this.distancesTransformFeedback.id = o.createTransformFeedback()),
            o.bindTransformFeedback(o.TRANSFORM_FEEDBACK, this.distancesTransformFeedback.id),
            o.bindBufferBase(o.TRANSFORM_FEEDBACK_BUFFER, 0, this.distancesTransformFeedback.outDistancesBuffer),
            c && o.useProgram(c),
            l && o.bindVertexArray(l),
            e = this.renderer,
            t = n
        }
    }();
    updateGPUCentersBufferForDistancesComputation() {
        if (!this.renderer)
            return;
        const e = this.renderer.getContext()
          , t = e.getParameter(e.VERTEX_ARRAY_BINDING);
        if (e.bindVertexArray(this.distancesTransformFeedback.vao),
        e.bindBuffer(e.ARRAY_BUFFER, this.distancesTransformFeedback.centersBuffer),
        this.integerBasedDistancesComputation) {
            const t = this.getIntegerCenters(!1);
            e.bufferData(e.ARRAY_BUFFER, t, e.STATIC_DRAW)
        } else {
            const t = this.getFloatCenters(!1);
            e.bufferData(e.ARRAY_BUFFER, t, e.STATIC_DRAW)
        }
        t && e.bindVertexArray(t)
    }
    computeDistancesOnGPU(e, t) {
        if (!this.renderer)
            return;
        const n = this.renderer.getContext()
          , s = n.getParameter(n.VERTEX_ARRAY_BINDING)
          , r = n.getParameter(n.CURRENT_PROGRAM);
        if (n.bindVertexArray(this.distancesTransformFeedback.vao),
        n.useProgram(this.distancesTransformFeedback.program),
        n.enable(n.RASTERIZER_DISCARD),
        this.integerBasedDistancesComputation) {
            const t = SplatMesh.getIntegerMatrixArray(e)
              , s = [t[2], t[6], t[10]];
            n.uniform3i(this.distancesTransformFeedback.modelViewProjLoc, s[0], s[1], s[2])
        } else {
            const t = [e.elements[2], e.elements[6], e.elements[10]];
            n.uniform3f(this.distancesTransformFeedback.modelViewProjLoc, t[0], t[1], t[2])
        }
        n.bindBuffer(n.ARRAY_BUFFER, this.distancesTransformFeedback.centersBuffer),
        n.enableVertexAttribArray(this.distancesTransformFeedback.centersLoc),
        this.integerBasedDistancesComputation ? n.vertexAttribIPointer(this.distancesTransformFeedback.centersLoc, 3, n.INT, 0, 0) : n.vertexAttribPointer(this.distancesTransformFeedback.centersLoc, 3, n.FLOAT, !1, 0, 0),
        n.bindTransformFeedback(n.TRANSFORM_FEEDBACK, this.distancesTransformFeedback.id),
        n.bindBufferBase(n.TRANSFORM_FEEDBACK_BUFFER, 0, this.distancesTransformFeedback.outDistancesBuffer),
        n.beginTransformFeedback(n.POINTS),
        n.drawArrays(n.POINTS, 0, this.getSplatCount()),
        n.endTransformFeedback(),
        n.bindBufferBase(n.TRANSFORM_FEEDBACK_BUFFER, 0, null),
        n.bindTransformFeedback(n.TRANSFORM_FEEDBACK, null),
        n.disable(n.RASTERIZER_DISCARD),
        n.bindBuffer(n.ARRAY_BUFFER, this.distancesTransformFeedback.outDistancesBuffer),
        n.getBufferSubData(n.ARRAY_BUFFER, 0, t),
        n.bindBuffer(n.ARRAY_BUFFER, null),
        r && n.useProgram(r),
        s && n.bindVertexArray(s)
    }
    getLocalSplatParameters(e, t) {
        t.splatBuffer = this.getSplatBufferForSplat(e),
        t.localIndex = this.getSplatLocalIndex(e),
        t.splatBufferTransform = this.getSplatBufferTransformForSplat(e)
    }
    fillSplatDataArrays(e, t, n) {
        let s = 0;
        for (let r = 0; r < this.splatBuffers.length; r++) {
            const o = this.splatBuffers[r]
              , i = this.splatBufferTransforms[r];
            e && o.fillSplatCovarianceArray(e, s, i),
            t && o.fillSplatCenterArray(t, s, i),
            n && o.fillSplatColorArray(n, s, i),
            s += o.getSplatCount()
        }
    }
    getIntegerCenters(e) {
        const t = this.getSplatCount()
          , n = new Float32Array(3 * t);
        let s;
        this.fillSplatDataArrays(null, n, null);
        let r = e ? 4 : 3;
        s = new Int32Array(t * r);
        for (let o = 0; o < t; o++) {
            for (let e = 0; e < 3; e++)
                s[o * r + e] = Math.round(1e3 * n[3 * o + e]);
            e && (s[o * r + 3] = 1)
        }
        return s
    }
    getFloatCenters(e) {
        const t = this.getSplatCount()
          , n = new Float32Array(3 * t);
        if (this.fillSplatDataArrays(null, n, null),
        !e)
            return n;
        let s = new Float32Array(4 * t);
        for (let e = 0; e < t; e++) {
            for (let t = 0; t < 3; t++)
                s[4 * e + t] = n[3 * e + t];
            s[4 * e + 3] = 1
        }
        return s
    }
    getSplatCenter = function() {
        const e = {};
        return function(t, n) {
            this.getLocalSplatParameters(t, e),
            e.splatBuffer.getSplatCenter(e.localIndex, n, e.splatBufferTransform)
        }
    }();
    getSplatScaleAndRotation = function() {
        const e = {};
        return function(t, n, s) {
            this.getLocalSplatParameters(t, e),
            e.splatBuffer.getSplatScaleAndRotation(e.localIndex, n, s, e.splatBufferTransform)
        }
    }();
    getSplatColor = function() {
        const e = {};
        return function(t, n) {
            this.getLocalSplatParameters(t, e),
            e.splatBuffer.getSplatColor(e.localIndex, n, e.splatBufferTransform)
        }
    }();
    getSplatBufferForSplat(e) {
        return this.splatBuffers[this.globalSplatIndexToSplatBufferIndexMap[e]]
    }
    getSplatBufferIndexForSplat(e) {
        return this.globalSplatIndexToSplatBufferIndexMap[e]
    }
    getSplatBufferTransformForSplat(e) {
        return this.splatBufferTransforms[this.globalSplatIndexToSplatBufferIndexMap[e]]
    }
    getSplatLocalIndex(e) {
        return this.globalSplatIndexToLocalSplatIndexMap[e]
    }
    static getIntegerMatrixArray(e) {
        const t = e.elements
          , n = [];
        for (let e = 0; e < 16; e++)
            n[e] = Math.round(1e3 * t[e]);
        return n
    }
}
var SorterWasm = "AGFzbQEAAAAADAZkeWxpbmsAAAAAAAEYA2AAAGANf39/f39/f39/f39/fwBgAAF/AhIBA2VudgZtZW1vcnkCAwCAgAQDBAMAAQIHOQMRX193YXNtX2NhbGxfY3RvcnMAAAtzb3J0SW5kZXhlcwABE2Vtc2NyaXB0ZW5fdGxzX2luaXQAAgq/BwMDAAELswcDAXwDfQJ7IAkgCGshCgJAIAwEQCALBEBB+P///wchDEGIgICAeCELIAkgCk0NAiAKIQUDQCADIAVBAnQiAWogAiAAIAFqKAIAQQJ0aigCACIBNgIAIAEgDCABIAxIGyEMIAEgCyABIAtKGyELIAVBAWoiBSAJRw0ACwwCC0H4////ByEMQYiAgIB4IQsgCSAKTQ0BIAVBKGogBUEYaiAF/QkCCP1WAgAB/VYCAAIhEiAKIQUDQCADIAVBAnQiAmogASAAIAJqKAIAQQR0av0AAAAgEv21ASIR/RsAIBH9GwFqIBH9GwJqIgI2AgAgAiAMIAIgDEgbIQwgAiALIAIgC0obIQsgBUEBaiIFIAlHDQALDAELAkAgC0UEQCAJIApLDQFBiICAgHghC0H4////ByEMDAILQfj///8HIQxBiICAgHghCyAJIApNDQEgCiEFA0AgAyAFQQJ0IghqAn8gAiAAIAhqKAIAQQJ0aioCALtEAAAAAAAAsECiIg2ZRAAAAAAAAOBBYwRAIA2qDAELQYCAgIB4CyIINgIAIAggDCAIIAxIGyEMIAggCyAIIAtKGyELIAVBAWoiBSAJRw0ACwwBCyAFKgIoIRAgBSoCGCEOIAUqAgghD0H4////ByEMQYiAgIB4IQsgCiEFA0ACfyAPIAEgACAFQQJ0IgJqKAIAQQR0aiIIKgIAlCAOIAgqAgSUkiAQIAgqAgiUkrtEAAAAAAAAsECiIg2ZRAAAAAAAAOBBYwRAIA2qDAELQYCAgIB4CyEIIAIgA2ogCDYCACAIIAwgCCAMSBshDCAIIAsgCCALShshCyAFQQFqIgUgCUcNAAsLIAkgCksEQCAHQQFrsyALsiAMspOVIQ4gCiELA0ACfyAOIAMgC0ECdGoiASgCACAMa7KUIg+LQwAAAE9dBEAgD6gMAQtBgICAgHgLIQggASAINgIAIAQgCEECdGoiASABKAIAQQFqNgIAIAtBAWoiCyAJRw0ACwsgB0ECTwRAIAQoAgAhC0EBIQwDQCAEIAxBAnRqIgEgASgCACALaiILNgIAIAxBAWoiDCAHRw0ACwsgCkEASgRAIAohDANAIAYgDEEBayIBQQJ0IgJqIAAgAmooAgA2AgAgDEEBSiECIAEhDCACDQALCyAJIApKBEAgCSEMA0AgBiAJIAQgAyAMQQFrIgxBAnQiBWooAgBBAnRqIgIoAgAiAWtBAnRqIAAgBWooAgA2AgAgAiABQQFrNgIAIAogDEgNAAsLCwQAQQAL";
let Constants$1 = class {
    static DepthMapRange = 65536;
    static MemoryPageSize = 65536;
    static BytesPerFloat = 4;
    static BytesPerInt = 4
}
;
function sortWorker(e) {
    let t, n, s, r, o, i, a, l, c, h, u, d, p, m;
    e.onmessage = f => {
        if (f.data.centers)
            centers = f.data.centers,
            r ? new Int32Array(n,u,4 * o).set(new Int32Array(centers)) : new Float32Array(n,u,4 * o).set(new Float32Array(centers)),
            e.postMessage({
                sortSetupComplete: !0
            });
        else if (f.data.sort) {
            const g = f.data.sort.splatRenderCount || 0
              , y = f.data.sort.splatSortCount || 0
              , E = f.data.sort.usePrecomputedDistances;
            let T, A;
            s || (T = f.data.sort.indexesToSort,
            E && (A = f.data.sort.precomputedDistances)),
            function(f, g, y, E, T, A) {
                const x = performance.now();
                if (!s && (new Uint32Array(n,i,T.byteLength / m.BytesPerInt).set(T),
                E)) {
                    let e;
                    e = r ? new Int32Array(n,l,A.byteLength / m.BytesPerInt) : new Float32Array(n,l,A.byteLength / m.BytesPerFloat),
                    e.set(A)
                }
                p || (p = new Uint32Array(m.DepthMapRange)),
                r ? new Int32Array(n,d,16).set(y) : new Float32Array(n,d,16).set(y),
                new Uint32Array(n,h,m.DepthMapRange).set(p),
                t.exports.sortIndexes(i, u, l, c, h, d, a, m.DepthMapRange, f, g, o, E, r);
                const v = {
                    sortDone: !0,
                    splatSortCount: f,
                    splatRenderCount: g,
                    sortTime: 0
                }
                  , S = [];
                if (!s) {
                    const e = new Uint32Array(n,a,g)
                      , t = new Uint32Array(g);
                    t.set(e),
                    v.sortedIndexes = t.buffer,
                    S.push(t.buffer)
                }
                const C = performance.now();
                v.sortTime = C - x,
                e.postMessage(v, S)
            }(y, g, f.data.sort.modelViewProj, E, T, A)
        } else if (f.data.init) {
            m = f.data.init.Constants,
            o = f.data.init.splatCount,
            s = f.data.init.useSharedMemory,
            r = f.data.init.integerBasedSort;
            const p = r ? 4 * m.BytesPerInt : 4 * m.BytesPerFloat
              , g = new Uint8Array(f.data.init.sorterWasmBytes)
              , y = o * m.BytesPerInt
              , E = o * p
              , T = r ? 16 * m.BytesPerInt : 16 * m.BytesPerFloat
              , A = r ? o * m.BytesPerInt : o * m.BytesPerFloat
              , x = o * m.BytesPerInt
              , v = o * m.BytesPerInt
              , S = m.DepthMapRange * m.BytesPerInt * 2
              , C = 32 * m.MemoryPageSize
              , b = y + E + T + A + x + v + S + C
              , w = Math.floor(b / m.MemoryPageSize) + 1
              , R = {
                module: {},
                env: {
                    memory: new WebAssembly.Memory({
                        initial: 2 * w,
                        maximum: 4 * w,
                        shared: !0
                    })
                }
            };
            WebAssembly.compile(g).then((e => WebAssembly.instantiate(e, R))).then((r => {
                t = r,
                i = 0,
                u = i + y,
                d = u + E,
                l = d + T,
                c = l + A,
                h = c + x,
                a = h + S,
                n = R.env.memory.buffer,
                s ? e.postMessage({
                    sortSetupPhase1Complete: !0,
                    indexesToSortBuffer: n,
                    indexesToSortOffset: i,
                    sortedIndexesBuffer: n,
                    sortedIndexesOffset: a,
                    precomputedDistancesBuffer: n,
                    precomputedDistancesOffset: l
                }) : e.postMessage({
                    sortSetupPhase1Complete: !0
                })
            }
            ))
        }
    }
}
function createSortWorker(e, t, n) {
    const s = new Worker(URL.createObjectURL(new Blob(["(", sortWorker.toString(), ")(self)"],{
        type: "application/javascript"
    })))
      , r = atob(SorterWasm)
      , o = new Uint8Array(r.length);
    for (let e = 0; e < r.length; e++)
        o[e] = r.charCodeAt(e);
    return s.postMessage({
        init: {
            sorterWasmBytes: o.buffer,
            splatCount: e,
            useSharedMemory: t,
            integerBasedSort: n,
            Constants: {
                BytesPerFloat: Constants$1.BytesPerFloat,
                BytesPerInt: Constants$1.BytesPerInt,
                DepthMapRange: Constants$1.DepthMapRange,
                MemoryPageSize: Constants$1.MemoryPageSize
            }
        }
    }),
    s
}
class VRButton {
    static createButton(e) {
        const t = document.createElement("button");
        function n() {
            t.style.display = "",
            t.style.cursor = "auto",
            t.style.left = "calc(50% - 75px)",
            t.style.width = "150px",
            t.onmouseenter = null,
            t.onmouseleave = null,
            t.onclick = null
        }
        function s(e) {
            e.style.position = "absolute",
            e.style.bottom = "20px",
            e.style.padding = "12px 6px",
            e.style.border = "1px solid #fff",
            e.style.borderRadius = "4px",
            e.style.background = "rgba(0,0,0,0.1)",
            e.style.color = "#fff",
            e.style.font = "normal 13px sans-serif",
            e.style.textAlign = "center",
            e.style.opacity = "0.5",
            e.style.outline = "none",
            e.style.zIndex = "999"
        }
        if ("xr"in navigator)
            return t.id = "VRButton",
            t.style.display = "none",
            s(t),
            navigator.xr.isSessionSupported("immersive-vr").then((function(s) {
                s ? function() {
                    let n = null;
                    async function s(s) {
                        s.addEventListener("end", r),
                        await e.xr.setSession(s),
                        t.textContent = "EXIT VR",
                        n = s
                    }
                    function r() {
                        n.removeEventListener("end", r),
                        t.textContent = "ENTER VR",
                        n = null
                    }
                    t.style.display = "",
                    t.style.cursor = "pointer",
                    t.style.left = "calc(50% - 50px)",
                    t.style.width = "100px",
                    t.textContent = "ENTER VR",
                    t.onmouseenter = function() {
                        t.style.opacity = "1.0"
                    }
                    ,
                    t.onmouseleave = function() {
                        t.style.opacity = "0.5"
                    }
                    ,
                    t.onclick = function() {
                        if (null === n) {
                            const e = {
                                optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"]
                            };
                            navigator.xr.requestSession("immersive-vr", e).then(s)
                        } else
                            n.end()
                    }
                }() : (n(),
                t.textContent = "VR NOT SUPPORTED"),
                s && VRButton.xrSessionIsGranted && t.click()
            }
            )).catch((function(e) {
                n(),
                console.warn("Exception when trying to call xr.isSessionSupported", e),
                t.textContent = "VR NOT ALLOWED"
            }
            )),
            t;
        {
            const e = document.createElement("a");
            return !1 === window.isSecureContext ? (e.href = document.location.href.replace(/^http:/, "https:"),
            e.innerHTML = "WEBXR NEEDS HTTPS") : (e.href = "https://immersiveweb.dev/",
            e.innerHTML = "WEBXR NOT AVAILABLE"),
            e.style.left = "calc(50% - 90px)",
            e.style.width = "180px",
            e.style.textDecoration = "none",
            s(e),
            e
        }
    }
    static registerSessionGrantedListener() {
        if ("undefined" != typeof navigator && "xr"in navigator) {
            if (/WebXRViewer\//i.test(navigator.userAgent))
                return;
            navigator.xr.addEventListener("sessiongranted", ( () => {
                VRButton.xrSessionIsGranted = !0
            }
            ))
        }
    }
}
VRButton.xrSessionIsGranted = !1,
VRButton.registerSessionGrantedListener();
class ARButton {
    static createButton(e, t={}) {
        const n = document.createElement("button");
        function s() {
            n.style.display = "",
            n.style.cursor = "auto",
            n.style.left = "calc(50% - 75px)",
            n.style.width = "150px",
            n.onmouseenter = null,
            n.onmouseleave = null,
            n.onclick = null
        }
        function r(e) {
            e.style.position = "absolute",
            e.style.bottom = "20px",
            e.style.padding = "12px 6px",
            e.style.border = "1px solid #fff",
            e.style.borderRadius = "4px",
            e.style.background = "rgba(0,0,0,0.1)",
            e.style.color = "#fff",
            e.style.font = "normal 13px sans-serif",
            e.style.textAlign = "center",
            e.style.opacity = "0.5",
            e.style.outline = "none",
            e.style.zIndex = "999"
        }
        if ("xr"in navigator)
            return n.id = "ARButton",
            n.style.display = "none",
            r(n),
            navigator.xr.isSessionSupported("immersive-ar").then((function(r) {
                r ? function() {
                    if (void 0 === t.domOverlay) {
                        const e = document.createElement("div");
                        e.style.display = "none",
                        document.body.appendChild(e);
                        const n = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        n.setAttribute("width", 38),
                        n.setAttribute("height", 38),
                        n.style.position = "absolute",
                        n.style.right = "20px",
                        n.style.top = "20px",
                        n.addEventListener("click", (function() {
                            s.end()
                        }
                        )),
                        e.appendChild(n);
                        const r = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        r.setAttribute("d", "M 12,12 L 28,28 M 28,12 12,28"),
                        r.setAttribute("stroke", "#fff"),
                        r.setAttribute("stroke-width", 2),
                        n.appendChild(r),
                        void 0 === t.optionalFeatures && (t.optionalFeatures = []),
                        t.optionalFeatures.push("dom-overlay"),
                        t.domOverlay = {
                            root: e
                        }
                    }
                    let s = null;
                    async function r(r) {
                        r.addEventListener("end", o),
                        e.xr.setReferenceSpaceType("local"),
                        await e.xr.setSession(r),
                        n.textContent = "STOP AR",
                        t.domOverlay.root.style.display = "",
                        s = r
                    }
                    function o() {
                        s.removeEventListener("end", o),
                        n.textContent = "START AR",
                        t.domOverlay.root.style.display = "none",
                        s = null
                    }
                    n.style.display = "",
                    n.style.cursor = "pointer",
                    n.style.left = "calc(50% - 50px)",
                    n.style.width = "100px",
                    n.textContent = "START AR",
                    n.onmouseenter = function() {
                        n.style.opacity = "1.0"
                    }
                    ,
                    n.onmouseleave = function() {
                        n.style.opacity = "0.5"
                    }
                    ,
                    n.onclick = function() {
                        null === s ? navigator.xr.requestSession("immersive-ar", t).then(r) : s.end()
                    }
                }() : (s(),
                n.textContent = "AR NOT SUPPORTED")
            }
            )).catch((function(e) {
                s(),
                console.warn("Exception when trying to call xr.isSessionSupported", e),
                n.textContent = "AR NOT ALLOWED"
            }
            )),
            n;
        {
            const e = document.createElement("a");
            return !1 === window.isSecureContext ? (e.href = document.location.href.replace(/^http:/, "https:"),
            e.innerHTML = "WEBXR NEEDS HTTPS") : (e.href = "https://immersiveweb.dev/",
            e.innerHTML = "WEBXR NOT AVAILABLE"),
            e.style.left = "calc(50% - 90px)",
            e.style.width = "180px",
            e.style.textDecoration = "none",
            r(e),
            e
        }
    }
}
function computeMikkTSpaceTangents(e, t, n=!0) {
    if (!t || !t.isReady)
        throw new Error("BufferGeometryUtils: Initialized MikkTSpace library required.");
    if (!e.hasAttribute("position") || !e.hasAttribute("normal") || !e.hasAttribute("uv"))
        throw new Error('BufferGeometryUtils: Tangents require "position", "normal", and "uv" attributes.');
    function s(e) {
        if (e.normalized || e.isInterleavedBufferAttribute) {
            const t = new Float32Array(e.count * e.itemSize);
            for (let n = 0, s = 0; n < e.count; n++)
                t[s++] = e.getX(n),
                t[s++] = e.getY(n),
                e.itemSize > 2 && (t[s++] = e.getZ(n));
            return t
        }
        return e.array instanceof Float32Array ? e.array : new Float32Array(e.array)
    }
    const r = e.index ? e.toNonIndexed() : e
      , o = t.generateTangents(s(r.attributes.position), s(r.attributes.normal), s(r.attributes.uv));
    if (n)
        for (let e = 3; e < o.length; e += 4)
            o[e] *= -1;
    return r.setAttribute("tangent", new BufferAttribute(o,4)),
    e !== r && e.copy(r),
    e
}
function mergeGeometries(e, t=!1) {
    const n = null !== e[0].index
      , s = new Set(Object.keys(e[0].attributes))
      , r = new Set(Object.keys(e[0].morphAttributes))
      , o = {}
      , i = {}
      , a = e[0].morphTargetsRelative
      , l = new BufferGeometry;
    let c = 0;
    for (let h = 0; h < e.length; ++h) {
        const u = e[h];
        let d = 0;
        if (n !== (null !== u.index))
            return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),
            null;
        for (const e in u.attributes) {
            if (!s.has(e))
                return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + '. All geometries must have compatible attributes; make sure "' + e + '" attribute exists among all geometries, or in none of them.'),
                null;
            void 0 === o[e] && (o[e] = []),
            o[e].push(u.attributes[e]),
            d++
        }
        if (d !== s.size)
            return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + ". Make sure all geometries have the same number of attributes."),
            null;
        if (a !== u.morphTargetsRelative)
            return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + ". .morphTargetsRelative must be consistent throughout all geometries."),
            null;
        for (const e in u.morphAttributes) {
            if (!r.has(e))
                return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + ".  .morphAttributes must be consistent throughout all geometries."),
                null;
            void 0 === i[e] && (i[e] = []),
            i[e].push(u.morphAttributes[e])
        }
        if (t) {
            let e;
            if (n)
                e = u.index.count;
            else {
                if (void 0 === u.attributes.position)
                    return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + h + ". The geometry must have either an index or a position attribute"),
                    null;
                e = u.attributes.position.count
            }
            l.addGroup(c, e, h),
            c += e
        }
    }
    if (n) {
        let t = 0;
        const n = [];
        for (let s = 0; s < e.length; ++s) {
            const r = e[s].index;
            for (let e = 0; e < r.count; ++e)
                n.push(r.getX(e) + t);
            t += e[s].attributes.position.count
        }
        l.setIndex(n)
    }
    for (const e in o) {
        const t = mergeAttributes(o[e]);
        if (!t)
            return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + e + " attribute."),
            null;
        l.setAttribute(e, t)
    }
    for (const e in i) {
        const t = i[e][0].length;
        if (0 === t)
            break;
        l.morphAttributes = l.morphAttributes || {},
        l.morphAttributes[e] = [];
        for (let n = 0; n < t; ++n) {
            const t = [];
            for (let s = 0; s < i[e].length; ++s)
                t.push(i[e][s][n]);
            const s = mergeAttributes(t);
            if (!s)
                return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + e + " morphAttribute."),
                null;
            l.morphAttributes[e].push(s)
        }
    }
    return l
}
function mergeAttributes(e) {
    let t, n, s, r = -1, o = 0;
    for (let i = 0; i < e.length; ++i) {
        const a = e[i];
        if (a.isInterleavedBufferAttribute)
            return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. InterleavedBufferAttributes are not supported."),
            null;
        if (void 0 === t && (t = a.array.constructor),
        t !== a.array.constructor)
            return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),
            null;
        if (void 0 === n && (n = a.itemSize),
        n !== a.itemSize)
            return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),
            null;
        if (void 0 === s && (s = a.normalized),
        s !== a.normalized)
            return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),
            null;
        if (-1 === r && (r = a.gpuType),
        r !== a.gpuType)
            return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),
            null;
        o += a.array.length
    }
    const i = new t(o);
    let a = 0;
    for (let t = 0; t < e.length; ++t)
        i.set(e[t].array, a),
        a += e[t].array.length;
    const l = new BufferAttribute(i,n,s);
    return void 0 !== r && (l.gpuType = r),
    l
}
function deepCloneAttribute(e) {
    return e.isInstancedInterleavedBufferAttribute || e.isInterleavedBufferAttribute ? deinterleaveAttribute(e) : e.isInstancedBufferAttribute ? (new InstancedBufferAttribute).copy(e) : (new BufferAttribute).copy(e)
}
function interleaveAttributes(e) {
    let t, n = 0, s = 0;
    for (let r = 0, o = e.length; r < o; ++r) {
        const o = e[r];
        if (void 0 === t && (t = o.array.constructor),
        t !== o.array.constructor)
            return console.error("AttributeBuffers of different types cannot be interleaved"),
            null;
        n += o.array.length,
        s += o.itemSize
    }
    const r = new InterleavedBuffer(new t(n),s);
    let o = 0;
    const i = []
      , a = ["getX", "getY", "getZ", "getW"]
      , l = ["setX", "setY", "setZ", "setW"];
    for (let t = 0, n = e.length; t < n; t++) {
        const n = e[t]
          , s = n.itemSize
          , c = n.count
          , h = new InterleavedBufferAttribute(r,s,o,n.normalized);
        i.push(h),
        o += s;
        for (let e = 0; e < c; e++)
            for (let t = 0; t < s; t++)
                h[l[t]](e, n[a[t]](e))
    }
    return i
}
function deinterleaveAttribute(e) {
    const t = e.data.array.constructor
      , n = e.count
      , s = e.itemSize
      , r = e.normalized
      , o = new t(n * s);
    let i;
    i = e.isInstancedInterleavedBufferAttribute ? new InstancedBufferAttribute(o,s,r,e.meshPerAttribute) : new BufferAttribute(o,s,r);
    for (let t = 0; t < n; t++)
        i.setX(t, e.getX(t)),
        s >= 2 && i.setY(t, e.getY(t)),
        s >= 3 && i.setZ(t, e.getZ(t)),
        s >= 4 && i.setW(t, e.getW(t));
    return i
}
function deinterleaveGeometry(e) {
    const t = e.attributes
      , n = e.morphTargets
      , s = new Map;
    for (const e in t) {
        const n = t[e];
        n.isInterleavedBufferAttribute && (s.has(n) || s.set(n, deinterleaveAttribute(n)),
        t[e] = s.get(n))
    }
    for (const e in n) {
        const t = n[e];
        t.isInterleavedBufferAttribute && (s.has(t) || s.set(t, deinterleaveAttribute(t)),
        n[e] = s.get(t))
    }
}
function estimateBytesUsed(e) {
    let t = 0;
    for (const n in e.attributes) {
        const s = e.getAttribute(n);
        t += s.count * s.itemSize * s.array.BYTES_PER_ELEMENT
    }
    const n = e.getIndex();
    return t += n ? n.count * n.itemSize * n.array.BYTES_PER_ELEMENT : 0,
    t
}
function mergeVertices(e, t=1e-4) {
    t = Math.max(t, Number.EPSILON);
    const n = {}
      , s = e.getIndex()
      , r = e.getAttribute("position")
      , o = s ? s.count : r.count;
    let i = 0;
    const a = Object.keys(e.attributes)
      , l = {}
      , c = {}
      , h = []
      , u = ["getX", "getY", "getZ", "getW"]
      , d = ["setX", "setY", "setZ", "setW"];
    for (let t = 0, n = a.length; t < n; t++) {
        const n = a[t]
          , s = e.attributes[n];
        l[n] = new BufferAttribute(new s.array.constructor(s.count * s.itemSize),s.itemSize,s.normalized);
        const r = e.morphAttributes[n];
        r && (c[n] = new BufferAttribute(new r.array.constructor(r.count * r.itemSize),r.itemSize,r.normalized))
    }
    const p = .5 * t
      , m = Math.log10(1 / t)
      , f = Math.pow(10, m)
      , g = p * f;
    for (let t = 0; t < o; t++) {
        const r = s ? s.getX(t) : t;
        let o = "";
        for (let t = 0, n = a.length; t < n; t++) {
            const n = a[t]
              , s = e.getAttribute(n)
              , i = s.itemSize;
            for (let e = 0; e < i; e++)
                o += ~~(s[u[e]](r) * f + g) + ","
        }
        if (o in n)
            h.push(n[o]);
        else {
            for (let t = 0, n = a.length; t < n; t++) {
                const n = a[t]
                  , s = e.getAttribute(n)
                  , o = e.morphAttributes[n]
                  , h = s.itemSize
                  , p = l[n]
                  , m = c[n];
                for (let e = 0; e < h; e++) {
                    const t = u[e]
                      , n = d[e];
                    if (p[n](i, s[t](r)),
                    o)
                        for (let e = 0, s = o.length; e < s; e++)
                            m[e][n](i, o[e][t](r))
                }
            }
            n[o] = i,
            h.push(i),
            i++
        }
    }
    const y = e.clone();
    for (const t in e.attributes) {
        const e = l[t];
        if (y.setAttribute(t, new BufferAttribute(e.array.slice(0, i * e.itemSize),e.itemSize,e.normalized)),
        t in c)
            for (let e = 0; e < c[t].length; e++) {
                const n = c[t][e];
                y.morphAttributes[t][e] = new BufferAttribute(n.array.slice(0, i * n.itemSize),n.itemSize,n.normalized)
            }
    }
    return y.setIndex(h),
    y
}
function toTrianglesDrawMode(e, t) {
    if (t === TrianglesDrawMode)
        return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),
        e;
    if (t === TriangleFanDrawMode || t === TriangleStripDrawMode) {
        let n = e.getIndex();
        if (null === n) {
            const t = []
              , s = e.getAttribute("position");
            if (void 0 === s)
                return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),
                e;
            for (let e = 0; e < s.count; e++)
                t.push(e);
            e.setIndex(t),
            n = e.getIndex()
        }
        const s = n.count - 2
          , r = [];
        if (t === TriangleFanDrawMode)
            for (let e = 1; e <= s; e++)
                r.push(n.getX(0)),
                r.push(n.getX(e)),
                r.push(n.getX(e + 1));
        else
            for (let e = 0; e < s; e++)
                e % 2 == 0 ? (r.push(n.getX(e)),
                r.push(n.getX(e + 1)),
                r.push(n.getX(e + 2))) : (r.push(n.getX(e + 2)),
                r.push(n.getX(e + 1)),
                r.push(n.getX(e)));
        r.length / 3 !== s && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
        const o = e.clone();
        return o.setIndex(r),
        o.clearGroups(),
        o
    }
    return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", t),
    e
}
function computeMorphedAttributes(e) {
    const t = new Vector3
      , n = new Vector3
      , s = new Vector3
      , r = new Vector3
      , o = new Vector3
      , i = new Vector3
      , a = new Vector3
      , l = new Vector3
      , c = new Vector3;
    function h(e, h, u, d, p, m, f, g) {
        t.fromBufferAttribute(h, p),
        n.fromBufferAttribute(h, m),
        s.fromBufferAttribute(h, f);
        const y = e.morphTargetInfluences;
        if (u && y) {
            a.set(0, 0, 0),
            l.set(0, 0, 0),
            c.set(0, 0, 0);
            for (let e = 0, h = u.length; e < h; e++) {
                const h = y[e]
                  , g = u[e];
                0 !== h && (r.fromBufferAttribute(g, p),
                o.fromBufferAttribute(g, m),
                i.fromBufferAttribute(g, f),
                d ? (a.addScaledVector(r, h),
                l.addScaledVector(o, h),
                c.addScaledVector(i, h)) : (a.addScaledVector(r.sub(t), h),
                l.addScaledVector(o.sub(n), h),
                c.addScaledVector(i.sub(s), h)))
            }
            t.add(a),
            n.add(l),
            s.add(c)
        }
        e.isSkinnedMesh && (e.applyBoneTransform(p, t),
        e.applyBoneTransform(m, n),
        e.applyBoneTransform(f, s)),
        g[3 * p + 0] = t.x,
        g[3 * p + 1] = t.y,
        g[3 * p + 2] = t.z,
        g[3 * m + 0] = n.x,
        g[3 * m + 1] = n.y,
        g[3 * m + 2] = n.z,
        g[3 * f + 0] = s.x,
        g[3 * f + 1] = s.y,
        g[3 * f + 2] = s.z
    }
    const u = e.geometry
      , d = e.material;
    let p, m, f;
    const g = u.index
      , y = u.attributes.position
      , E = u.morphAttributes.position
      , T = u.morphTargetsRelative
      , A = u.attributes.normal
      , x = u.morphAttributes.position
      , v = u.groups
      , S = u.drawRange;
    let C, b, w, R, M, _, I;
    const P = new Float32Array(y.count * y.itemSize)
      , B = new Float32Array(A.count * A.itemSize);
    if (null !== g)
        if (Array.isArray(d))
            for (C = 0,
            w = v.length; C < w; C++)
                for (M = v[C],
                _ = Math.max(M.start, S.start),
                I = Math.min(M.start + M.count, S.start + S.count),
                b = _,
                R = I; b < R; b += 3)
                    p = g.getX(b),
                    m = g.getX(b + 1),
                    f = g.getX(b + 2),
                    h(e, y, E, T, p, m, f, P),
                    h(e, A, x, T, p, m, f, B);
        else
            for (_ = Math.max(0, S.start),
            I = Math.min(g.count, S.start + S.count),
            C = _,
            w = I; C < w; C += 3)
                p = g.getX(C),
                m = g.getX(C + 1),
                f = g.getX(C + 2),
                h(e, y, E, T, p, m, f, P),
                h(e, A, x, T, p, m, f, B);
    else if (Array.isArray(d))
        for (C = 0,
        w = v.length; C < w; C++)
            for (M = v[C],
            _ = Math.max(M.start, S.start),
            I = Math.min(M.start + M.count, S.start + S.count),
            b = _,
            R = I; b < R; b += 3)
                p = b,
                m = b + 1,
                f = b + 2,
                h(e, y, E, T, p, m, f, P),
                h(e, A, x, T, p, m, f, B);
    else
        for (_ = Math.max(0, S.start),
        I = Math.min(y.count, S.start + S.count),
        C = _,
        w = I; C < w; C += 3)
            p = C,
            m = C + 1,
            f = C + 2,
            h(e, y, E, T, p, m, f, P),
            h(e, A, x, T, p, m, f, B);
    return {
        positionAttribute: y,
        normalAttribute: A,
        morphedPositionAttribute: new Float32BufferAttribute(P,3),
        morphedNormalAttribute: new Float32BufferAttribute(B,3)
    }
}
function mergeGroups(e) {
    if (0 === e.groups.length)
        return console.warn("THREE.BufferGeometryUtils.mergeGroups(): No groups are defined. Nothing to merge."),
        e;
    let t = e.groups;
    if (t = t.sort(( (e, t) => e.materialIndex !== t.materialIndex ? e.materialIndex - t.materialIndex : e.start - t.start)),
    null === e.getIndex()) {
        const t = e.getAttribute("position")
          , n = [];
        for (let e = 0; e < t.count; e += 3)
            n.push(e, e + 1, e + 2);
        e.setIndex(n)
    }
    const n = e.getIndex()
      , s = [];
    for (let e = 0; e < t.length; e++) {
        const r = t[e]
          , o = r.start
          , i = o + r.count;
        for (let e = o; e < i; e++)
            s.push(n.getX(e))
    }
    e.dispose(),
    e.setIndex(s);
    let r = 0;
    for (let e = 0; e < t.length; e++) {
        const n = t[e];
        n.start = r,
        r += n.count
    }
    let o = t[0];
    e.groups = [o];
    for (let n = 1; n < t.length; n++) {
        const s = t[n];
        o.materialIndex === s.materialIndex ? o.count += s.count : (o = s,
        e.groups.push(o))
    }
    return e
}
function toCreasedNormals(e, t=Math.PI / 3) {
    const n = Math.cos(t)
      , s = 100 * (1 + 1e-10)
      , r = [new Vector3, new Vector3, new Vector3]
      , o = new Vector3
      , i = new Vector3
      , a = new Vector3
      , l = new Vector3;
    function c(e) {
        return `${~~(e.x * s)},${~~(e.y * s)},${~~(e.z * s)}`
    }
    const h = e.index ? e.toNonIndexed() : e
      , u = h.attributes.position
      , d = {};
    for (let e = 0, t = u.count / 3; e < t; e++) {
        const t = 3 * e
          , n = r[0].fromBufferAttribute(u, t + 0)
          , s = r[1].fromBufferAttribute(u, t + 1)
          , a = r[2].fromBufferAttribute(u, t + 2);
        o.subVectors(a, s),
        i.subVectors(n, s);
        const l = (new Vector3).crossVectors(o, i).normalize();
        for (let e = 0; e < 3; e++) {
            const t = c(r[e]);
            t in d || (d[t] = []),
            d[t].push(l)
        }
    }
    const p = new Float32Array(3 * u.count)
      , m = new BufferAttribute(p,3,!1);
    for (let e = 0, t = u.count / 3; e < t; e++) {
        const t = 3 * e
          , s = r[0].fromBufferAttribute(u, t + 0)
          , h = r[1].fromBufferAttribute(u, t + 1)
          , p = r[2].fromBufferAttribute(u, t + 2);
        o.subVectors(p, h),
        i.subVectors(s, h),
        a.crossVectors(o, i).normalize();
        for (let e = 0; e < 3; e++) {
            const s = d[c(r[e])];
            l.set(0, 0, 0);
            for (let e = 0, t = s.length; e < t; e++) {
                const t = s[e];
                a.dot(t) > n && l.add(t)
            }
            l.normalize(),
            m.setXYZ(t + e, l.x, l.y, l.z)
        }
    }
    return h.setAttribute("normal", m),
    h
}
function mergeBufferGeometries(e, t=!1) {
    return console.warn("THREE.BufferGeometryUtils: mergeBufferGeometries() has been renamed to mergeGeometries()."),
    mergeGeometries(e, t)
}
function mergeBufferAttributes(e) {
    return console.warn("THREE.BufferGeometryUtils: mergeBufferAttributes() has been renamed to mergeAttributes()."),
    mergeAttributes(e)
}
class GLTFLoader extends Loader {
    constructor(e) {
        super(e),
        this.dracoLoader = null,
        this.ktx2Loader = null,
        this.meshoptDecoder = null,
        this.pluginCallbacks = [],
        this.register((function(e) {
            return new GLTFMaterialsClearcoatExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFTextureBasisUExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFTextureWebPExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFTextureAVIFExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsSheenExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsTransmissionExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsVolumeExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsIorExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsEmissiveStrengthExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsSpecularExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsIridescenceExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsAnisotropyExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMaterialsBumpExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFLightsExtension(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMeshoptCompression(e)
        }
        )),
        this.register((function(e) {
            return new GLTFMeshGpuInstancing(e)
        }
        ))
    }
    load(e, t, n, s) {
        const r = this;
        let o;
        if ("" !== this.resourcePath)
            o = this.resourcePath;
        else if ("" !== this.path) {
            const t = LoaderUtils.extractUrlBase(e);
            o = LoaderUtils.resolveURL(t, this.path)
        } else
            o = LoaderUtils.extractUrlBase(e);
        this.manager.itemStart(e);
        const i = function(t) {
            s ? s(t) : console.error(t),
            r.manager.itemError(e),
            r.manager.itemEnd(e)
        }
          , a = new FileLoader(this.manager);
        a.setPath(this.path),
        a.setResponseType("arraybuffer"),
        a.setRequestHeader(this.requestHeader),
        a.setWithCredentials(this.withCredentials),
        a.load(e, (function(n) {
            try {
                r.parse(n, o, (function(n) {
                    t(n),
                    r.manager.itemEnd(e)
                }
                ), i)
            } catch (e) {
                i(e)
            }
        }
        ), n, i)
    }
    setDRACOLoader(e) {
        return this.dracoLoader = e,
        this
    }
    setDDSLoader() {
        throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')
    }
    setKTX2Loader(e) {
        return this.ktx2Loader = e,
        this
    }
    setMeshoptDecoder(e) {
        return this.meshoptDecoder = e,
        this
    }
    register(e) {
        return -1 === this.pluginCallbacks.indexOf(e) && this.pluginCallbacks.push(e),
        this
    }
    unregister(e) {
        return -1 !== this.pluginCallbacks.indexOf(e) && this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e), 1),
        this
    }
    parse(e, t, n, s) {
        let r;
        const o = {}
          , i = {}
          , a = new TextDecoder;
        if ("string" == typeof e)
            r = JSON.parse(e);
        else if (e instanceof ArrayBuffer) {
            if (a.decode(new Uint8Array(e,0,4)) === BINARY_EXTENSION_HEADER_MAGIC) {
                try {
                    o[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(e)
                } catch (e) {
                    return void (s && s(e))
                }
                r = JSON.parse(o[EXTENSIONS.KHR_BINARY_GLTF].content)
            } else
                r = JSON.parse(a.decode(e))
        } else
            r = e;
        if (void 0 === r.asset || r.asset.version[0] < 2)
            return void (s && s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.")));
        const l = new GLTFParser(r,{
            path: t || this.resourcePath || "",
            crossOrigin: this.crossOrigin,
            requestHeader: this.requestHeader,
            manager: this.manager,
            ktx2Loader: this.ktx2Loader,
            meshoptDecoder: this.meshoptDecoder
        });
        l.fileLoader.setRequestHeader(this.requestHeader);
        for (let e = 0; e < this.pluginCallbacks.length; e++) {
            const t = this.pluginCallbacks[e](l);
            t.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),
            i[t.name] = t,
            o[t.name] = !0
        }
        if (r.extensionsUsed)
            for (let e = 0; e < r.extensionsUsed.length; ++e) {
                const t = r.extensionsUsed[e]
                  , n = r.extensionsRequired || [];
                switch (t) {
                case EXTENSIONS.KHR_MATERIALS_UNLIT:
                    o[t] = new GLTFMaterialsUnlitExtension;
                    break;
                case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
                    o[t] = new GLTFDracoMeshCompressionExtension(r,this.dracoLoader);
                    break;
                case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
                    o[t] = new GLTFTextureTransformExtension;
                    break;
                case EXTENSIONS.KHR_MESH_QUANTIZATION:
                    o[t] = new GLTFMeshQuantizationExtension;
                    break;
                default:
                    n.indexOf(t) >= 0 && void 0 === i[t] && console.warn('THREE.GLTFLoader: Unknown extension "' + t + '".')
                }
            }
        l.setExtensions(o),
        l.setPlugins(i),
        l.parse(n, s)
    }
    parseAsync(e, t) {
        const n = this;
        return new Promise((function(s, r) {
            n.parse(e, t, s, r)
        }
        ))
    }
}
function GLTFRegistry() {
    let e = {};
    return {
        get: function(t) {
            return e[t]
        },
        add: function(t, n) {
            e[t] = n
        },
        remove: function(t) {
            delete e[t]
        },
        removeAll: function() {
            e = {}
        }
    }
}
const EXTENSIONS = {
    KHR_BINARY_GLTF: "KHR_binary_glTF",
    KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
    KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
    KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
    KHR_MATERIALS_IOR: "KHR_materials_ior",
    KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
    KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
    KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
    KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
    KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
    KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
    KHR_MATERIALS_VOLUME: "KHR_materials_volume",
    KHR_TEXTURE_BASISU: "KHR_texture_basisu",
    KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
    KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
    KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
    EXT_MATERIALS_BUMP: "EXT_materials_bump",
    EXT_TEXTURE_WEBP: "EXT_texture_webp",
    EXT_TEXTURE_AVIF: "EXT_texture_avif",
    EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
    EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing"
};
class GLTFLightsExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL,
        this.cache = {
            refs: {},
            uses: {}
        }
    }
    _markDefs() {
        const e = this.parser
          , t = this.parser.json.nodes || [];
        for (let n = 0, s = t.length; n < s; n++) {
            const s = t[n];
            s.extensions && s.extensions[this.name] && void 0 !== s.extensions[this.name].light && e._addNodeRef(this.cache, s.extensions[this.name].light)
        }
    }
    _loadLight(e) {
        const t = this.parser
          , n = "light:" + e;
        let s = t.cache.get(n);
        if (s)
            return s;
        const r = t.json
          , o = ((r.extensions && r.extensions[this.name] || {}).lights || [])[e];
        let i;
        const a = new Color(16777215);
        void 0 !== o.color && a.setRGB(o.color[0], o.color[1], o.color[2], LinearSRGBColorSpace);
        const l = void 0 !== o.range ? o.range : 0;
        switch (o.type) {
        case "directional":
            i = new DirectionalLight(a),
            i.target.position.set(0, 0, -1),
            i.add(i.target);
            break;
        case "point":
            i = new PointLight(a),
            i.distance = l;
            break;
        case "spot":
            i = new SpotLight(a),
            i.distance = l,
            o.spot = o.spot || {},
            o.spot.innerConeAngle = void 0 !== o.spot.innerConeAngle ? o.spot.innerConeAngle : 0,
            o.spot.outerConeAngle = void 0 !== o.spot.outerConeAngle ? o.spot.outerConeAngle : Math.PI / 4,
            i.angle = o.spot.outerConeAngle,
            i.penumbra = 1 - o.spot.innerConeAngle / o.spot.outerConeAngle,
            i.target.position.set(0, 0, -1),
            i.add(i.target);
            break;
        default:
            throw new Error("THREE.GLTFLoader: Unexpected light type: " + o.type)
        }
        return i.position.set(0, 0, 0),
        i.decay = 2,
        assignExtrasToUserData(i, o),
        void 0 !== o.intensity && (i.intensity = o.intensity),
        i.name = t.createUniqueName(o.name || "light_" + e),
        s = Promise.resolve(i),
        t.cache.add(n, s),
        s
    }
    getDependency(e, t) {
        if ("light" === e)
            return this._loadLight(t)
    }
    createNodeAttachment(e) {
        const t = this
          , n = this.parser
          , s = n.json.nodes[e]
          , r = (s.extensions && s.extensions[this.name] || {}).light;
        return void 0 === r ? null : this._loadLight(r).then((function(e) {
            return n._getNodeRef(t.cache, r, e)
        }
        ))
    }
}
class GLTFMaterialsUnlitExtension {
    constructor() {
        this.name = EXTENSIONS.KHR_MATERIALS_UNLIT
    }
    getMaterialType() {
        return MeshBasicMaterial
    }
    extendParams(e, t, n) {
        const s = [];
        e.color = new Color(1,1,1),
        e.opacity = 1;
        const r = t.pbrMetallicRoughness;
        if (r) {
            if (Array.isArray(r.baseColorFactor)) {
                const t = r.baseColorFactor;
                e.color.setRGB(t[0], t[1], t[2], LinearSRGBColorSpace),
                e.opacity = t[3]
            }
            void 0 !== r.baseColorTexture && s.push(n.assignTexture(e, "map", r.baseColorTexture, SRGBColorSpace))
        }
        return Promise.all(s)
    }
}
class GLTFMaterialsEmissiveStrengthExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH
    }
    extendMaterialParams(e, t) {
        const n = this.parser.json.materials[e];
        if (!n.extensions || !n.extensions[this.name])
            return Promise.resolve();
        const s = n.extensions[this.name].emissiveStrength;
        return void 0 !== s && (t.emissiveIntensity = s),
        Promise.resolve()
    }
}
class GLTFMaterialsClearcoatExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        if (void 0 !== o.clearcoatFactor && (t.clearcoat = o.clearcoatFactor),
        void 0 !== o.clearcoatTexture && r.push(n.assignTexture(t, "clearcoatMap", o.clearcoatTexture)),
        void 0 !== o.clearcoatRoughnessFactor && (t.clearcoatRoughness = o.clearcoatRoughnessFactor),
        void 0 !== o.clearcoatRoughnessTexture && r.push(n.assignTexture(t, "clearcoatRoughnessMap", o.clearcoatRoughnessTexture)),
        void 0 !== o.clearcoatNormalTexture && (r.push(n.assignTexture(t, "clearcoatNormalMap", o.clearcoatNormalTexture)),
        void 0 !== o.clearcoatNormalTexture.scale)) {
            const e = o.clearcoatNormalTexture.scale;
            t.clearcoatNormalScale = new Vector2(e,e)
        }
        return Promise.all(r)
    }
}
class GLTFMaterialsIridescenceExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        return void 0 !== o.iridescenceFactor && (t.iridescence = o.iridescenceFactor),
        void 0 !== o.iridescenceTexture && r.push(n.assignTexture(t, "iridescenceMap", o.iridescenceTexture)),
        void 0 !== o.iridescenceIor && (t.iridescenceIOR = o.iridescenceIor),
        void 0 === t.iridescenceThicknessRange && (t.iridescenceThicknessRange = [100, 400]),
        void 0 !== o.iridescenceThicknessMinimum && (t.iridescenceThicknessRange[0] = o.iridescenceThicknessMinimum),
        void 0 !== o.iridescenceThicknessMaximum && (t.iridescenceThicknessRange[1] = o.iridescenceThicknessMaximum),
        void 0 !== o.iridescenceThicknessTexture && r.push(n.assignTexture(t, "iridescenceThicknessMap", o.iridescenceThicknessTexture)),
        Promise.all(r)
    }
}
class GLTFMaterialsSheenExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_SHEEN
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = [];
        t.sheenColor = new Color(0,0,0),
        t.sheenRoughness = 0,
        t.sheen = 1;
        const o = s.extensions[this.name];
        if (void 0 !== o.sheenColorFactor) {
            const e = o.sheenColorFactor;
            t.sheenColor.setRGB(e[0], e[1], e[2], LinearSRGBColorSpace)
        }
        return void 0 !== o.sheenRoughnessFactor && (t.sheenRoughness = o.sheenRoughnessFactor),
        void 0 !== o.sheenColorTexture && r.push(n.assignTexture(t, "sheenColorMap", o.sheenColorTexture, SRGBColorSpace)),
        void 0 !== o.sheenRoughnessTexture && r.push(n.assignTexture(t, "sheenRoughnessMap", o.sheenRoughnessTexture)),
        Promise.all(r)
    }
}
class GLTFMaterialsTransmissionExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        return void 0 !== o.transmissionFactor && (t.transmission = o.transmissionFactor),
        void 0 !== o.transmissionTexture && r.push(n.assignTexture(t, "transmissionMap", o.transmissionTexture)),
        Promise.all(r)
    }
}
class GLTFMaterialsVolumeExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_VOLUME
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        t.thickness = void 0 !== o.thicknessFactor ? o.thicknessFactor : 0,
        void 0 !== o.thicknessTexture && r.push(n.assignTexture(t, "thicknessMap", o.thicknessTexture)),
        t.attenuationDistance = o.attenuationDistance || 1 / 0;
        const i = o.attenuationColor || [1, 1, 1];
        return t.attenuationColor = (new Color).setRGB(i[0], i[1], i[2], LinearSRGBColorSpace),
        Promise.all(r)
    }
}
class GLTFMaterialsIorExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_IOR
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser.json.materials[e];
        if (!n.extensions || !n.extensions[this.name])
            return Promise.resolve();
        const s = n.extensions[this.name];
        return t.ior = void 0 !== s.ior ? s.ior : 1.5,
        Promise.resolve()
    }
}
class GLTFMaterialsSpecularExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        t.specularIntensity = void 0 !== o.specularFactor ? o.specularFactor : 1,
        void 0 !== o.specularTexture && r.push(n.assignTexture(t, "specularIntensityMap", o.specularTexture));
        const i = o.specularColorFactor || [1, 1, 1];
        return t.specularColor = (new Color).setRGB(i[0], i[1], i[2], LinearSRGBColorSpace),
        void 0 !== o.specularColorTexture && r.push(n.assignTexture(t, "specularColorMap", o.specularColorTexture, SRGBColorSpace)),
        Promise.all(r)
    }
}
class GLTFMaterialsBumpExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.EXT_MATERIALS_BUMP
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        return t.bumpScale = void 0 !== o.bumpFactor ? o.bumpFactor : 1,
        void 0 !== o.bumpTexture && r.push(n.assignTexture(t, "bumpMap", o.bumpTexture)),
        Promise.all(r)
    }
}
class GLTFMaterialsAnisotropyExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_MATERIALS_ANISOTROPY
    }
    getMaterialType(e) {
        const t = this.parser.json.materials[e];
        return t.extensions && t.extensions[this.name] ? MeshPhysicalMaterial : null
    }
    extendMaterialParams(e, t) {
        const n = this.parser
          , s = n.json.materials[e];
        if (!s.extensions || !s.extensions[this.name])
            return Promise.resolve();
        const r = []
          , o = s.extensions[this.name];
        return void 0 !== o.anisotropyStrength && (t.anisotropy = o.anisotropyStrength),
        void 0 !== o.anisotropyRotation && (t.anisotropyRotation = o.anisotropyRotation),
        void 0 !== o.anisotropyTexture && r.push(n.assignTexture(t, "anisotropyMap", o.anisotropyTexture)),
        Promise.all(r)
    }
}
class GLTFTextureBasisUExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.KHR_TEXTURE_BASISU
    }
    loadTexture(e) {
        const t = this.parser
          , n = t.json
          , s = n.textures[e];
        if (!s.extensions || !s.extensions[this.name])
            return null;
        const r = s.extensions[this.name]
          , o = t.options.ktx2Loader;
        if (!o) {
            if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
                throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
            return null
        }
        return t.loadTextureImage(e, r.source, o)
    }
}
class GLTFTextureWebPExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.EXT_TEXTURE_WEBP,
        this.isSupported = null
    }
    loadTexture(e) {
        const t = this.name
          , n = this.parser
          , s = n.json
          , r = s.textures[e];
        if (!r.extensions || !r.extensions[t])
            return null;
        const o = r.extensions[t]
          , i = s.images[o.source];
        let a = n.textureLoader;
        if (i.uri) {
            const e = n.options.manager.getHandler(i.uri);
            null !== e && (a = e)
        }
        return this.detectSupport().then((function(r) {
            if (r)
                return n.loadTextureImage(e, o.source, a);
            if (s.extensionsRequired && s.extensionsRequired.indexOf(t) >= 0)
                throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");
            return n.loadTexture(e)
        }
        ))
    }
    detectSupport() {
        return this.isSupported || (this.isSupported = new Promise((function(e) {
            const t = new Image;
            t.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
            t.onload = t.onerror = function() {
                e(1 === t.height)
            }
        }
        ))),
        this.isSupported
    }
}
class GLTFTextureAVIFExtension {
    constructor(e) {
        this.parser = e,
        this.name = EXTENSIONS.EXT_TEXTURE_AVIF,
        this.isSupported = null
    }
    loadTexture(e) {
        const t = this.name
          , n = this.parser
          , s = n.json
          , r = s.textures[e];
        if (!r.extensions || !r.extensions[t])
            return null;
        const o = r.extensions[t]
          , i = s.images[o.source];
        let a = n.textureLoader;
        if (i.uri) {
            const e = n.options.manager.getHandler(i.uri);
            null !== e && (a = e)
        }
        return this.detectSupport().then((function(r) {
            if (r)
                return n.loadTextureImage(e, o.source, a);
            if (s.extensionsRequired && s.extensionsRequired.indexOf(t) >= 0)
                throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");
            return n.loadTexture(e)
        }
        ))
    }
    detectSupport() {
        return this.isSupported || (this.isSupported = new Promise((function(e) {
            const t = new Image;
            t.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",
            t.onload = t.onerror = function() {
                e(1 === t.height)
            }
        }
        ))),
        this.isSupported
    }
}
class GLTFMeshoptCompression {
    constructor(e) {
        this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION,
        this.parser = e
    }
    loadBufferView(e) {
        const t = this.parser.json
          , n = t.bufferViews[e];
        if (n.extensions && n.extensions[this.name]) {
            const e = n.extensions[this.name]
              , s = this.parser.getDependency("buffer", e.buffer)
              , r = this.parser.options.meshoptDecoder;
            if (!r || !r.supported) {
                if (t.extensionsRequired && t.extensionsRequired.indexOf(this.name) >= 0)
                    throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
                return null
            }
            return s.then((function(t) {
                const n = e.byteOffset || 0
                  , s = e.byteLength || 0
                  , o = e.count
                  , i = e.byteStride
                  , a = new Uint8Array(t,n,s);
                return r.decodeGltfBufferAsync ? r.decodeGltfBufferAsync(o, i, a, e.mode, e.filter).then((function(e) {
                    return e.buffer
                }
                )) : r.ready.then((function() {
                    const t = new ArrayBuffer(o * i);
                    return r.decodeGltfBuffer(new Uint8Array(t), o, i, a, e.mode, e.filter),
                    t
                }
                ))
            }
            ))
        }
        return null
    }
}
class GLTFMeshGpuInstancing {
    constructor(e) {
        this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING,
        this.parser = e
    }
    createNodeMesh(e) {
        const t = this.parser.json
          , n = t.nodes[e];
        if (!n.extensions || !n.extensions[this.name] || void 0 === n.mesh)
            return null;
        const s = t.meshes[n.mesh];
        for (const e of s.primitives)
            if (e.mode !== WEBGL_CONSTANTS.TRIANGLES && e.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP && e.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN && void 0 !== e.mode)
                return null;
        const r = n.extensions[this.name].attributes
          , o = []
          , i = {};
        for (const e in r)
            o.push(this.parser.getDependency("accessor", r[e]).then((t => (i[e] = t,
            i[e]))));
        return o.length < 1 ? null : (o.push(this.parser.createNodeMesh(e)),
        Promise.all(o).then((e => {
            const t = e.pop()
              , n = t.isGroup ? t.children : [t]
              , s = e[0].count
              , r = [];
            for (const e of n) {
                const t = new Matrix4
                  , n = new Vector3
                  , o = new Quaternion
                  , a = new Vector3(1,1,1)
                  , l = new InstancedMesh(e.geometry,e.material,s);
                for (let e = 0; e < s; e++)
                    i.TRANSLATION && n.fromBufferAttribute(i.TRANSLATION, e),
                    i.ROTATION && o.fromBufferAttribute(i.ROTATION, e),
                    i.SCALE && a.fromBufferAttribute(i.SCALE, e),
                    l.setMatrixAt(e, t.compose(n, o, a));
                for (const t in i)
                    if ("_COLOR_0" === t) {
                        const e = i[t];
                        l.instanceColor = new InstancedBufferAttribute(e.array,e.itemSize,e.normalized)
                    } else
                        "TRANSLATION" !== t && "ROTATION" !== t && "SCALE" !== t && e.geometry.setAttribute(t, i[t]);
                Object3D$1.prototype.copy.call(l, e),
                this.parser.assignFinalMaterial(l),
                r.push(l)
            }
            return t.isGroup ? (t.clear(),
            t.add(...r),
            t) : r[0]
        }
        )))
    }
}
const BINARY_EXTENSION_HEADER_MAGIC = "glTF"
  , BINARY_EXTENSION_HEADER_LENGTH = 12
  , BINARY_EXTENSION_CHUNK_TYPES = {
    JSON: 1313821514,
    BIN: 5130562
};
class GLTFBinaryExtension {
    constructor(e) {
        this.name = EXTENSIONS.KHR_BINARY_GLTF,
        this.content = null,
        this.body = null;
        const t = new DataView(e,0,BINARY_EXTENSION_HEADER_LENGTH)
          , n = new TextDecoder;
        if (this.header = {
            magic: n.decode(new Uint8Array(e.slice(0, 4))),
            version: t.getUint32(4, !0),
            length: t.getUint32(8, !0)
        },
        this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC)
            throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
        if (this.header.version < 2)
            throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
        const s = this.header.length - BINARY_EXTENSION_HEADER_LENGTH
          , r = new DataView(e,BINARY_EXTENSION_HEADER_LENGTH);
        let o = 0;
        for (; o < s; ) {
            const t = r.getUint32(o, !0);
            o += 4;
            const s = r.getUint32(o, !0);
            if (o += 4,
            s === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                const s = new Uint8Array(e,BINARY_EXTENSION_HEADER_LENGTH + o,t);
                this.content = n.decode(s)
            } else if (s === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                const n = BINARY_EXTENSION_HEADER_LENGTH + o;
                this.body = e.slice(n, n + t)
            }
            o += t
        }
        if (null === this.content)
            throw new Error("THREE.GLTFLoader: JSON content not found.")
    }
}
class GLTFDracoMeshCompressionExtension {
    constructor(e, t) {
        if (!t)
            throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
        this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION,
        this.json = e,
        this.dracoLoader = t,
        this.dracoLoader.preload()
    }
    decodePrimitive(e, t) {
        const n = this.json
          , s = this.dracoLoader
          , r = e.extensions[this.name].bufferView
          , o = e.extensions[this.name].attributes
          , i = {}
          , a = {}
          , l = {};
        for (const e in o) {
            const t = ATTRIBUTES[e] || e.toLowerCase();
            i[t] = o[e]
        }
        for (const t in e.attributes) {
            const s = ATTRIBUTES[t] || t.toLowerCase();
            if (void 0 !== o[t]) {
                const r = n.accessors[e.attributes[t]]
                  , o = WEBGL_COMPONENT_TYPES[r.componentType];
                l[s] = o.name,
                a[s] = !0 === r.normalized
            }
        }
        return t.getDependency("bufferView", r).then((function(e) {
            return new Promise((function(t, n) {
                s.decodeDracoFile(e, (function(e) {
                    for (const t in e.attributes) {
                        const n = e.attributes[t]
                          , s = a[t];
                        void 0 !== s && (n.normalized = s)
                    }
                    t(e)
                }
                ), i, l, LinearSRGBColorSpace, n)
            }
            ))
        }
        ))
    }
}
class GLTFTextureTransformExtension {
    constructor() {
        this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM
    }
    extendTexture(e, t) {
        return void 0 !== t.texCoord && t.texCoord !== e.channel || void 0 !== t.offset || void 0 !== t.rotation || void 0 !== t.scale ? (e = e.clone(),
        void 0 !== t.texCoord && (e.channel = t.texCoord),
        void 0 !== t.offset && e.offset.fromArray(t.offset),
        void 0 !== t.rotation && (e.rotation = t.rotation),
        void 0 !== t.scale && e.repeat.fromArray(t.scale),
        e.needsUpdate = !0,
        e) : e
    }
}
class GLTFMeshQuantizationExtension {
    constructor() {
        this.name = EXTENSIONS.KHR_MESH_QUANTIZATION
    }
}
class GLTFCubicSplineInterpolant extends Interpolant {
    constructor(e, t, n, s) {
        super(e, t, n, s)
    }
    copySampleValue_(e) {
        const t = this.resultBuffer
          , n = this.sampleValues
          , s = this.valueSize
          , r = e * s * 3 + s;
        for (let e = 0; e !== s; e++)
            t[e] = n[r + e];
        return t
    }
    interpolate_(e, t, n, s) {
        const r = this.resultBuffer
          , o = this.sampleValues
          , i = this.valueSize
          , a = 2 * i
          , l = 3 * i
          , c = s - t
          , h = (n - t) / c
          , u = h * h
          , d = u * h
          , p = e * l
          , m = p - l
          , f = -2 * d + 3 * u
          , g = d - u
          , y = 1 - f
          , E = g - u + h;
        for (let e = 0; e !== i; e++) {
            const t = o[m + e + i]
              , n = o[m + e + a] * c
              , s = o[p + e + i]
              , l = o[p + e] * c;
            r[e] = y * t + E * n + f * s + g * l
        }
        return r
    }
}
const _q = new Quaternion;
class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
    interpolate_(e, t, n, s) {
        const r = super.interpolate_(e, t, n, s);
        return _q.fromArray(r).normalize().toArray(r),
        r
    }
}
const WEBGL_CONSTANTS = {
    FLOAT: 5126,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    LINEAR: 9729,
    REPEAT: 10497,
    SAMPLER_2D: 35678,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123
}
  , WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
}
  , WEBGL_FILTERS = {
    9728: NearestFilter,
    9729: LinearFilter,
    9984: NearestMipmapNearestFilter,
    9985: LinearMipmapNearestFilter,
    9986: NearestMipmapLinearFilter,
    9987: LinearMipmapLinearFilter
}
  , WEBGL_WRAPPINGS = {
    33071: ClampToEdgeWrapping,
    33648: MirroredRepeatWrapping,
    10497: RepeatWrapping
}
  , WEBGL_TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
}
  , ATTRIBUTES = {
    POSITION: "position",
    NORMAL: "normal",
    TANGENT: "tangent",
    TEXCOORD_0: "uv",
    TEXCOORD_1: "uv1",
    TEXCOORD_2: "uv2",
    TEXCOORD_3: "uv3",
    COLOR_0: "color",
    WEIGHTS_0: "skinWeight",
    JOINTS_0: "skinIndex"
}
  , PATH_PROPERTIES = {
    scale: "scale",
    translation: "position",
    rotation: "quaternion",
    weights: "morphTargetInfluences"
}
  , INTERPOLATION = {
    CUBICSPLINE: void 0,
    LINEAR: InterpolateLinear,
    STEP: InterpolateDiscrete
}
  , ALPHA_MODES = {
    OPAQUE: "OPAQUE",
    MASK: "MASK",
    BLEND: "BLEND"
};
function createDefaultMaterial(e) {
    return void 0 === e.DefaultMaterial && (e.DefaultMaterial = new MeshStandardMaterial({
        color: 16777215,
        emissive: 0,
        metalness: 1,
        roughness: 1,
        transparent: !1,
        depthTest: !0,
        side: FrontSide
    })),
    e.DefaultMaterial
}
function addUnknownExtensionsToUserData(e, t, n) {
    for (const s in n.extensions)
        void 0 === e[s] && (t.userData.gltfExtensions = t.userData.gltfExtensions || {},
        t.userData.gltfExtensions[s] = n.extensions[s])
}
function assignExtrasToUserData(e, t) {
    void 0 !== t.extras && ("object" == typeof t.extras ? Object.assign(e.userData, t.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + t.extras))
}
function addMorphTargets(e, t, n) {
    let s = !1
      , r = !1
      , o = !1;
    for (let e = 0, n = t.length; e < n; e++) {
        const n = t[e];
        if (void 0 !== n.POSITION && (s = !0),
        void 0 !== n.NORMAL && (r = !0),
        void 0 !== n.COLOR_0 && (o = !0),
        s && r && o)
            break
    }
    if (!s && !r && !o)
        return Promise.resolve(e);
    const i = []
      , a = []
      , l = [];
    for (let c = 0, h = t.length; c < h; c++) {
        const h = t[c];
        if (s) {
            const t = void 0 !== h.POSITION ? n.getDependency("accessor", h.POSITION) : e.attributes.position;
            i.push(t)
        }
        if (r) {
            const t = void 0 !== h.NORMAL ? n.getDependency("accessor", h.NORMAL) : e.attributes.normal;
            a.push(t)
        }
        if (o) {
            const t = void 0 !== h.COLOR_0 ? n.getDependency("accessor", h.COLOR_0) : e.attributes.color;
            l.push(t)
        }
    }
    return Promise.all([Promise.all(i), Promise.all(a), Promise.all(l)]).then((function(t) {
        const n = t[0]
          , i = t[1]
          , a = t[2];
        return s && (e.morphAttributes.position = n),
        r && (e.morphAttributes.normal = i),
        o && (e.morphAttributes.color = a),
        e.morphTargetsRelative = !0,
        e
    }
    ))
}
function updateMorphTargets(e, t) {
    if (e.updateMorphTargets(),
    void 0 !== t.weights)
        for (let n = 0, s = t.weights.length; n < s; n++)
            e.morphTargetInfluences[n] = t.weights[n];
    if (t.extras && Array.isArray(t.extras.targetNames)) {
        const n = t.extras.targetNames;
        if (e.morphTargetInfluences.length === n.length) {
            e.morphTargetDictionary = {};
            for (let t = 0, s = n.length; t < s; t++)
                e.morphTargetDictionary[n[t]] = t
        } else
            console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")
    }
}
function createPrimitiveKey(e) {
    let t;
    const n = e.extensions && e.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
    if (t = n ? "draco:" + n.bufferView + ":" + n.indices + ":" + createAttributesKey(n.attributes) : e.indices + ":" + createAttributesKey(e.attributes) + ":" + e.mode,
    void 0 !== e.targets)
        for (let n = 0, s = e.targets.length; n < s; n++)
            t += ":" + createAttributesKey(e.targets[n]);
    return t
}
function createAttributesKey(e) {
    let t = "";
    const n = Object.keys(e).sort();
    for (let s = 0, r = n.length; s < r; s++)
        t += n[s] + ":" + e[n[s]] + ";";
    return t
}
function getNormalizedComponentScale(e) {
    switch (e) {
    case Int8Array:
        return 1 / 127;
    case Uint8Array:
        return 1 / 255;
    case Int16Array:
        return 1 / 32767;
    case Uint16Array:
        return 1 / 65535;
    default:
        throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")
    }
}
function getImageURIMimeType(e) {
    return e.search(/\.jpe?g($|\?)/i) > 0 || 0 === e.search(/^data\:image\/jpeg/) ? "image/jpeg" : e.search(/\.webp($|\?)/i) > 0 || 0 === e.search(/^data\:image\/webp/) ? "image/webp" : "image/png"
}
const _identityMatrix = new Matrix4;
class GLTFParser {
    constructor(e={}, t={}) {
        this.json = e,
        this.extensions = {},
        this.plugins = {},
        this.options = t,
        this.cache = new GLTFRegistry,
        this.associations = new Map,
        this.primitiveCache = {},
        this.nodeCache = {},
        this.meshCache = {
            refs: {},
            uses: {}
        },
        this.cameraCache = {
            refs: {},
            uses: {}
        },
        this.lightCache = {
            refs: {},
            uses: {}
        },
        this.sourceCache = {},
        this.textureCache = {},
        this.nodeNamesUsed = {};
        let n = !1
          , s = !1
          , r = -1;
        "undefined" != typeof navigator && (n = !0 === /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        s = navigator.userAgent.indexOf("Firefox") > -1,
        r = s ? navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1] : -1),
        "undefined" == typeof createImageBitmap || n || s && r < 98 ? this.textureLoader = new TextureLoader(this.options.manager) : this.textureLoader = new ImageBitmapLoader(this.options.manager),
        this.textureLoader.setCrossOrigin(this.options.crossOrigin),
        this.textureLoader.setRequestHeader(this.options.requestHeader),
        this.fileLoader = new FileLoader(this.options.manager),
        this.fileLoader.setResponseType("arraybuffer"),
        "use-credentials" === this.options.crossOrigin && this.fileLoader.setWithCredentials(!0)
    }
    setExtensions(e) {
        this.extensions = e
    }
    setPlugins(e) {
        this.plugins = e
    }
    parse(e, t) {
        const n = this
          , s = this.json
          , r = this.extensions;
        this.cache.removeAll(),
        this.nodeCache = {},
        this._invokeAll((function(e) {
            return e._markDefs && e._markDefs()
        }
        )),
        Promise.all(this._invokeAll((function(e) {
            return e.beforeRoot && e.beforeRoot()
        }
        ))).then((function() {
            return Promise.all([n.getDependencies("scene"), n.getDependencies("animation"), n.getDependencies("camera")])
        }
        )).then((function(t) {
            const o = {
                scene: t[0][s.scene || 0],
                scenes: t[0],
                animations: t[1],
                cameras: t[2],
                asset: s.asset,
                parser: n,
                userData: {}
            };
            return addUnknownExtensionsToUserData(r, o, s),
            assignExtrasToUserData(o, s),
            Promise.all(n._invokeAll((function(e) {
                return e.afterRoot && e.afterRoot(o)
            }
            ))).then((function() {
                e(o)
            }
            ))
        }
        )).catch(t)
    }
    _markDefs() {
        const e = this.json.nodes || []
          , t = this.json.skins || []
          , n = this.json.meshes || [];
        for (let n = 0, s = t.length; n < s; n++) {
            const s = t[n].joints;
            for (let t = 0, n = s.length; t < n; t++)
                e[s[t]].isBone = !0
        }
        for (let t = 0, s = e.length; t < s; t++) {
            const s = e[t];
            void 0 !== s.mesh && (this._addNodeRef(this.meshCache, s.mesh),
            void 0 !== s.skin && (n[s.mesh].isSkinnedMesh = !0)),
            void 0 !== s.camera && this._addNodeRef(this.cameraCache, s.camera)
        }
    }
    _addNodeRef(e, t) {
        void 0 !== t && (void 0 === e.refs[t] && (e.refs[t] = e.uses[t] = 0),
        e.refs[t]++)
    }
    _getNodeRef(e, t, n) {
        if (e.refs[t] <= 1)
            return n;
        const s = n.clone()
          , r = (e, t) => {
            const n = this.associations.get(e);
            null != n && this.associations.set(t, n);
            for (const [n,s] of e.children.entries())
                r(s, t.children[n])
        }
        ;
        return r(n, s),
        s.name += "_instance_" + e.uses[t]++,
        s
    }
    _invokeOne(e) {
        const t = Object.values(this.plugins);
        t.push(this);
        for (let n = 0; n < t.length; n++) {
            const s = e(t[n]);
            if (s)
                return s
        }
        return null
    }
    _invokeAll(e) {
        const t = Object.values(this.plugins);
        t.unshift(this);
        const n = [];
        for (let s = 0; s < t.length; s++) {
            const r = e(t[s]);
            r && n.push(r)
        }
        return n
    }
    getDependency(e, t) {
        const n = e + ":" + t;
        let s = this.cache.get(n);
        if (!s) {
            switch (e) {
            case "scene":
                s = this.loadScene(t);
                break;
            case "node":
                s = this._invokeOne((function(e) {
                    return e.loadNode && e.loadNode(t)
                }
                ));
                break;
            case "mesh":
                s = this._invokeOne((function(e) {
                    return e.loadMesh && e.loadMesh(t)
                }
                ));
                break;
            case "accessor":
                s = this.loadAccessor(t);
                break;
            case "bufferView":
                s = this._invokeOne((function(e) {
                    return e.loadBufferView && e.loadBufferView(t)
                }
                ));
                break;
            case "buffer":
                s = this.loadBuffer(t);
                break;
            case "material":
                s = this._invokeOne((function(e) {
                    return e.loadMaterial && e.loadMaterial(t)
                }
                ));
                break;
            case "texture":
                s = this._invokeOne((function(e) {
                    return e.loadTexture && e.loadTexture(t)
                }
                ));
                break;
            case "skin":
                s = this.loadSkin(t);
                break;
            case "animation":
                s = this._invokeOne((function(e) {
                    return e.loadAnimation && e.loadAnimation(t)
                }
                ));
                break;
            case "camera":
                s = this.loadCamera(t);
                break;
            default:
                if (s = this._invokeOne((function(n) {
                    return n != this && n.getDependency && n.getDependency(e, t)
                }
                )),
                !s)
                    throw new Error("Unknown type: " + e)
            }
            this.cache.add(n, s)
        }
        return s
    }
    getDependencies(e) {
        let t = this.cache.get(e);
        if (!t) {
            const n = this
              , s = this.json[e + ("mesh" === e ? "es" : "s")] || [];
            t = Promise.all(s.map((function(t, s) {
                return n.getDependency(e, s)
            }
            ))),
            this.cache.add(e, t)
        }
        return t
    }
    loadBuffer(e) {
        const t = this.json.buffers[e]
          , n = this.fileLoader;
        if (t.type && "arraybuffer" !== t.type)
            throw new Error("THREE.GLTFLoader: " + t.type + " buffer type is not supported.");
        if (void 0 === t.uri && 0 === e)
            return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
        const s = this.options;
        return new Promise((function(e, r) {
            n.load(LoaderUtils.resolveURL(t.uri, s.path), e, void 0, (function() {
                r(new Error('THREE.GLTFLoader: Failed to load buffer "' + t.uri + '".'))
            }
            ))
        }
        ))
    }
    loadBufferView(e) {
        const t = this.json.bufferViews[e];
        return this.getDependency("buffer", t.buffer).then((function(e) {
            const n = t.byteLength || 0
              , s = t.byteOffset || 0;
            return e.slice(s, s + n)
        }
        ))
    }
    loadAccessor(e) {
        const t = this
          , n = this.json
          , s = this.json.accessors[e];
        if (void 0 === s.bufferView && void 0 === s.sparse) {
            const e = WEBGL_TYPE_SIZES[s.type]
              , t = WEBGL_COMPONENT_TYPES[s.componentType]
              , n = !0 === s.normalized
              , r = new t(s.count * e);
            return Promise.resolve(new BufferAttribute(r,e,n))
        }
        const r = [];
        return void 0 !== s.bufferView ? r.push(this.getDependency("bufferView", s.bufferView)) : r.push(null),
        void 0 !== s.sparse && (r.push(this.getDependency("bufferView", s.sparse.indices.bufferView)),
        r.push(this.getDependency("bufferView", s.sparse.values.bufferView))),
        Promise.all(r).then((function(e) {
            const r = e[0]
              , o = WEBGL_TYPE_SIZES[s.type]
              , i = WEBGL_COMPONENT_TYPES[s.componentType]
              , a = i.BYTES_PER_ELEMENT
              , l = a * o
              , c = s.byteOffset || 0
              , h = void 0 !== s.bufferView ? n.bufferViews[s.bufferView].byteStride : void 0
              , u = !0 === s.normalized;
            let d, p;
            if (h && h !== l) {
                const e = Math.floor(c / h)
                  , n = "InterleavedBuffer:" + s.bufferView + ":" + s.componentType + ":" + e + ":" + s.count;
                let l = t.cache.get(n);
                l || (d = new i(r,e * h,s.count * h / a),
                l = new InterleavedBuffer(d,h / a),
                t.cache.add(n, l)),
                p = new InterleavedBufferAttribute(l,o,c % h / a,u)
            } else
                d = null === r ? new i(s.count * o) : new i(r,c,s.count * o),
                p = new BufferAttribute(d,o,u);
            if (void 0 !== s.sparse) {
                const t = WEBGL_TYPE_SIZES.SCALAR
                  , n = WEBGL_COMPONENT_TYPES[s.sparse.indices.componentType]
                  , a = s.sparse.indices.byteOffset || 0
                  , l = s.sparse.values.byteOffset || 0
                  , c = new n(e[1],a,s.sparse.count * t)
                  , h = new i(e[2],l,s.sparse.count * o);
                null !== r && (p = new BufferAttribute(p.array.slice(),p.itemSize,p.normalized));
                for (let e = 0, t = c.length; e < t; e++) {
                    const t = c[e];
                    if (p.setX(t, h[e * o]),
                    o >= 2 && p.setY(t, h[e * o + 1]),
                    o >= 3 && p.setZ(t, h[e * o + 2]),
                    o >= 4 && p.setW(t, h[e * o + 3]),
                    o >= 5)
                        throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")
                }
            }
            return p
        }
        ))
    }
    loadTexture(e) {
        const t = this.json
          , n = this.options
          , s = t.textures[e].source
          , r = t.images[s];
        let o = this.textureLoader;
        if (r.uri) {
            const e = n.manager.getHandler(r.uri);
            null !== e && (o = e)
        }
        return this.loadTextureImage(e, s, o)
    }
    loadTextureImage(e, t, n) {
        const s = this
          , r = this.json
          , o = r.textures[e]
          , i = r.images[t]
          , a = (i.uri || i.bufferView) + ":" + o.sampler;
        if (this.textureCache[a])
            return this.textureCache[a];
        const l = this.loadImageSource(t, n).then((function(t) {
            t.flipY = !1,
            t.name = o.name || i.name || "",
            "" === t.name && "string" == typeof i.uri && !1 === i.uri.startsWith("data:image/") && (t.name = i.uri);
            const n = (r.samplers || {})[o.sampler] || {};
            return t.magFilter = WEBGL_FILTERS[n.magFilter] || LinearFilter,
            t.minFilter = WEBGL_FILTERS[n.minFilter] || LinearMipmapLinearFilter,
            t.wrapS = WEBGL_WRAPPINGS[n.wrapS] || RepeatWrapping,
            t.wrapT = WEBGL_WRAPPINGS[n.wrapT] || RepeatWrapping,
            s.associations.set(t, {
                textures: e
            }),
            t
        }
        )).catch((function() {
            return null
        }
        ));
        return this.textureCache[a] = l,
        l
    }
    loadImageSource(e, t) {
        const n = this
          , s = this.json
          , r = this.options;
        if (void 0 !== this.sourceCache[e])
            return this.sourceCache[e].then((e => e.clone()));
        const o = s.images[e]
          , i = self.URL || self.webkitURL;
        let a = o.uri || ""
          , l = !1;
        if (void 0 !== o.bufferView)
            a = n.getDependency("bufferView", o.bufferView).then((function(e) {
                l = !0;
                const t = new Blob([e],{
                    type: o.mimeType
                });
                return a = i.createObjectURL(t),
                a
            }
            ));
        else if (void 0 === o.uri)
            throw new Error("THREE.GLTFLoader: Image " + e + " is missing URI and bufferView");
        const c = Promise.resolve(a).then((function(e) {
            return new Promise((function(n, s) {
                let o = n;
                !0 === t.isImageBitmapLoader && (o = function(e) {
                    const t = new Texture(e);
                    t.needsUpdate = !0,
                    n(t)
                }
                ),
                t.load(LoaderUtils.resolveURL(e, r.path), o, void 0, s)
            }
            ))
        }
        )).then((function(e) {
            return !0 === l && i.revokeObjectURL(a),
            e.userData.mimeType = o.mimeType || getImageURIMimeType(o.uri),
            e
        }
        )).catch((function(e) {
            throw console.error("THREE.GLTFLoader: Couldn't load texture", a),
            e
        }
        ));
        return this.sourceCache[e] = c,
        c
    }
    assignTexture(e, t, n, s) {
        const r = this;
        return this.getDependency("texture", n.index).then((function(o) {
            if (!o)
                return null;
            if (void 0 !== n.texCoord && n.texCoord > 0 && ((o = o.clone()).channel = n.texCoord),
            r.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
                const e = void 0 !== n.extensions ? n.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] : void 0;
                if (e) {
                    const t = r.associations.get(o);
                    o = r.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(o, e),
                    r.associations.set(o, t)
                }
            }
            return void 0 !== s && (o.colorSpace = s),
            e[t] = o,
            o
        }
        ))
    }
    assignFinalMaterial(e) {
        const t = e.geometry;
        let n = e.material;
        const s = void 0 === t.attributes.tangent
          , r = void 0 !== t.attributes.color
          , o = void 0 === t.attributes.normal;
        if (e.isPoints) {
            const e = "PointsMaterial:" + n.uuid;
            let t = this.cache.get(e);
            t || (t = new PointsMaterial,
            Material.prototype.copy.call(t, n),
            t.color.copy(n.color),
            t.map = n.map,
            t.sizeAttenuation = !1,
            this.cache.add(e, t)),
            n = t
        } else if (e.isLine) {
            const e = "LineBasicMaterial:" + n.uuid;
            let t = this.cache.get(e);
            t || (t = new LineBasicMaterial,
            Material.prototype.copy.call(t, n),
            t.color.copy(n.color),
            t.map = n.map,
            this.cache.add(e, t)),
            n = t
        }
        if (s || r || o) {
            let e = "ClonedMaterial:" + n.uuid + ":";
            s && (e += "derivative-tangents:"),
            r && (e += "vertex-colors:"),
            o && (e += "flat-shading:");
            let t = this.cache.get(e);
            t || (t = n.clone(),
            r && (t.vertexColors = !0),
            o && (t.flatShading = !0),
            s && (t.normalScale && (t.normalScale.y *= -1),
            t.clearcoatNormalScale && (t.clearcoatNormalScale.y *= -1)),
            this.cache.add(e, t),
            this.associations.set(t, this.associations.get(n))),
            n = t
        }
        e.material = n
    }
    getMaterialType() {
        return MeshStandardMaterial
    }
    loadMaterial(e) {
        const t = this
          , n = this.json
          , s = this.extensions
          , r = n.materials[e];
        let o;
        const i = {}
          , a = [];
        if ((r.extensions || {})[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
            const e = s[EXTENSIONS.KHR_MATERIALS_UNLIT];
            o = e.getMaterialType(),
            a.push(e.extendParams(i, r, t))
        } else {
            const n = r.pbrMetallicRoughness || {};
            if (i.color = new Color(1,1,1),
            i.opacity = 1,
            Array.isArray(n.baseColorFactor)) {
                const e = n.baseColorFactor;
                i.color.setRGB(e[0], e[1], e[2], LinearSRGBColorSpace),
                i.opacity = e[3]
            }
            void 0 !== n.baseColorTexture && a.push(t.assignTexture(i, "map", n.baseColorTexture, SRGBColorSpace)),
            i.metalness = void 0 !== n.metallicFactor ? n.metallicFactor : 1,
            i.roughness = void 0 !== n.roughnessFactor ? n.roughnessFactor : 1,
            void 0 !== n.metallicRoughnessTexture && (a.push(t.assignTexture(i, "metalnessMap", n.metallicRoughnessTexture)),
            a.push(t.assignTexture(i, "roughnessMap", n.metallicRoughnessTexture))),
            o = this._invokeOne((function(t) {
                return t.getMaterialType && t.getMaterialType(e)
            }
            )),
            a.push(Promise.all(this._invokeAll((function(t) {
                return t.extendMaterialParams && t.extendMaterialParams(e, i)
            }
            ))))
        }
        !0 === r.doubleSided && (i.side = DoubleSide);
        const l = r.alphaMode || ALPHA_MODES.OPAQUE;
        if (l === ALPHA_MODES.BLEND ? (i.transparent = !0,
        i.depthWrite = !1) : (i.transparent = !1,
        l === ALPHA_MODES.MASK && (i.alphaTest = void 0 !== r.alphaCutoff ? r.alphaCutoff : .5)),
        void 0 !== r.normalTexture && o !== MeshBasicMaterial && (a.push(t.assignTexture(i, "normalMap", r.normalTexture)),
        i.normalScale = new Vector2(1,1),
        void 0 !== r.normalTexture.scale)) {
            const e = r.normalTexture.scale;
            i.normalScale.set(e, e)
        }
        if (void 0 !== r.occlusionTexture && o !== MeshBasicMaterial && (a.push(t.assignTexture(i, "aoMap", r.occlusionTexture)),
        void 0 !== r.occlusionTexture.strength && (i.aoMapIntensity = r.occlusionTexture.strength)),
        void 0 !== r.emissiveFactor && o !== MeshBasicMaterial) {
            const e = r.emissiveFactor;
            i.emissive = (new Color).setRGB(e[0], e[1], e[2], LinearSRGBColorSpace)
        }
        return void 0 !== r.emissiveTexture && o !== MeshBasicMaterial && a.push(t.assignTexture(i, "emissiveMap", r.emissiveTexture, SRGBColorSpace)),
        Promise.all(a).then((function() {
            const n = new o(i);
            return r.name && (n.name = r.name),
            assignExtrasToUserData(n, r),
            t.associations.set(n, {
                materials: e
            }),
            r.extensions && addUnknownExtensionsToUserData(s, n, r),
            n
        }
        ))
    }
    createUniqueName(e) {
        const t = PropertyBinding.sanitizeNodeName(e || "");
        return t in this.nodeNamesUsed ? t + "_" + ++this.nodeNamesUsed[t] : (this.nodeNamesUsed[t] = 0,
        t)
    }
    loadGeometries(e) {
        const t = this
          , n = this.extensions
          , s = this.primitiveCache;
        function r(e) {
            return n[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(e, t).then((function(n) {
                return addPrimitiveAttributes(n, e, t)
            }
            ))
        }
        const o = [];
        for (let n = 0, i = e.length; n < i; n++) {
            const i = e[n]
              , a = createPrimitiveKey(i)
              , l = s[a];
            if (l)
                o.push(l.promise);
            else {
                let e;
                e = i.extensions && i.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION] ? r(i) : addPrimitiveAttributes(new BufferGeometry, i, t),
                s[a] = {
                    primitive: i,
                    promise: e
                },
                o.push(e)
            }
        }
        return Promise.all(o)
    }
    loadMesh(e) {
        const t = this
          , n = this.json
          , s = this.extensions
          , r = n.meshes[e]
          , o = r.primitives
          , i = [];
        for (let e = 0, t = o.length; e < t; e++) {
            const t = void 0 === o[e].material ? createDefaultMaterial(this.cache) : this.getDependency("material", o[e].material);
            i.push(t)
        }
        return i.push(t.loadGeometries(o)),
        Promise.all(i).then((function(n) {
            const i = n.slice(0, n.length - 1)
              , a = n[n.length - 1]
              , l = [];
            for (let n = 0, c = a.length; n < c; n++) {
                const c = a[n]
                  , h = o[n];
                let u;
                const d = i[n];
                if (h.mode === WEBGL_CONSTANTS.TRIANGLES || h.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP || h.mode === WEBGL_CONSTANTS.TRIANGLE_FAN || void 0 === h.mode)
                    u = !0 === r.isSkinnedMesh ? new SkinnedMesh(c,d) : new Mesh(c,d),
                    !0 === u.isSkinnedMesh && u.normalizeSkinWeights(),
                    h.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ? u.geometry = toTrianglesDrawMode(u.geometry, TriangleStripDrawMode) : h.mode === WEBGL_CONSTANTS.TRIANGLE_FAN && (u.geometry = toTrianglesDrawMode(u.geometry, TriangleFanDrawMode));
                else if (h.mode === WEBGL_CONSTANTS.LINES)
                    u = new LineSegments(c,d);
                else if (h.mode === WEBGL_CONSTANTS.LINE_STRIP)
                    u = new Line(c,d);
                else if (h.mode === WEBGL_CONSTANTS.LINE_LOOP)
                    u = new LineLoop(c,d);
                else {
                    if (h.mode !== WEBGL_CONSTANTS.POINTS)
                        throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + h.mode);
                    u = new Points(c,d)
                }
                Object.keys(u.geometry.morphAttributes).length > 0 && updateMorphTargets(u, r),
                u.name = t.createUniqueName(r.name || "mesh_" + e),
                assignExtrasToUserData(u, r),
                h.extensions && addUnknownExtensionsToUserData(s, u, h),
                t.assignFinalMaterial(u),
                l.push(u)
            }
            for (let n = 0, s = l.length; n < s; n++)
                t.associations.set(l[n], {
                    meshes: e,
                    primitives: n
                });
            if (1 === l.length)
                return r.extensions && addUnknownExtensionsToUserData(s, l[0], r),
                l[0];
            const c = new Group;
            r.extensions && addUnknownExtensionsToUserData(s, c, r),
            t.associations.set(c, {
                meshes: e
            });
            for (let e = 0, t = l.length; e < t; e++)
                c.add(l[e]);
            return c
        }
        ))
    }
    loadCamera(e) {
        let t;
        const n = this.json.cameras[e]
          , s = n[n.type];
        if (s)
            return "perspective" === n.type ? t = new PerspectiveCamera(MathUtils.radToDeg(s.yfov),s.aspectRatio || 1,s.znear || 1,s.zfar || 2e6) : "orthographic" === n.type && (t = new OrthographicCamera(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),
            n.name && (t.name = this.createUniqueName(n.name)),
            assignExtrasToUserData(t, n),
            Promise.resolve(t);
        console.warn("THREE.GLTFLoader: Missing camera parameters.")
    }
    loadSkin(e) {
        const t = this.json.skins[e]
          , n = [];
        for (let e = 0, s = t.joints.length; e < s; e++)
            n.push(this._loadNodeShallow(t.joints[e]));
        return void 0 !== t.inverseBindMatrices ? n.push(this.getDependency("accessor", t.inverseBindMatrices)) : n.push(null),
        Promise.all(n).then((function(e) {
            const n = e.pop()
              , s = e
              , r = []
              , o = [];
            for (let e = 0, i = s.length; e < i; e++) {
                const i = s[e];
                if (i) {
                    r.push(i);
                    const t = new Matrix4;
                    null !== n && t.fromArray(n.array, 16 * e),
                    o.push(t)
                } else
                    console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', t.joints[e])
            }
            return new Skeleton(r,o)
        }
        ))
    }
    loadAnimation(e) {
        const t = this.json
          , n = this
          , s = t.animations[e]
          , r = s.name ? s.name : "animation_" + e
          , o = []
          , i = []
          , a = []
          , l = []
          , c = [];
        for (let e = 0, t = s.channels.length; e < t; e++) {
            const t = s.channels[e]
              , n = s.samplers[t.sampler]
              , r = t.target
              , h = r.node
              , u = void 0 !== s.parameters ? s.parameters[n.input] : n.input
              , d = void 0 !== s.parameters ? s.parameters[n.output] : n.output;
            void 0 !== r.node && (o.push(this.getDependency("node", h)),
            i.push(this.getDependency("accessor", u)),
            a.push(this.getDependency("accessor", d)),
            l.push(n),
            c.push(r))
        }
        return Promise.all([Promise.all(o), Promise.all(i), Promise.all(a), Promise.all(l), Promise.all(c)]).then((function(e) {
            const t = e[0]
              , s = e[1]
              , o = e[2]
              , i = e[3]
              , a = e[4]
              , l = [];
            for (let e = 0, r = t.length; e < r; e++) {
                const r = t[e]
                  , c = s[e]
                  , h = o[e]
                  , u = i[e]
                  , d = a[e];
                if (void 0 === r)
                    continue;
                r.updateMatrix && r.updateMatrix();
                const p = n._createAnimationTracks(r, c, h, u, d);
                if (p)
                    for (let e = 0; e < p.length; e++)
                        l.push(p[e])
            }
            return new AnimationClip(r,void 0,l)
        }
        ))
    }
    createNodeMesh(e) {
        const t = this.json
          , n = this
          , s = t.nodes[e];
        return void 0 === s.mesh ? null : n.getDependency("mesh", s.mesh).then((function(e) {
            const t = n._getNodeRef(n.meshCache, s.mesh, e);
            return void 0 !== s.weights && t.traverse((function(e) {
                if (e.isMesh)
                    for (let t = 0, n = s.weights.length; t < n; t++)
                        e.morphTargetInfluences[t] = s.weights[t]
            }
            )),
            t
        }
        ))
    }
    loadNode(e) {
        const t = this
          , n = this.json.nodes[e]
          , s = t._loadNodeShallow(e)
          , r = []
          , o = n.children || [];
        for (let e = 0, n = o.length; e < n; e++)
            r.push(t.getDependency("node", o[e]));
        const i = void 0 === n.skin ? Promise.resolve(null) : t.getDependency("skin", n.skin);
        return Promise.all([s, Promise.all(r), i]).then((function(e) {
            const t = e[0]
              , n = e[1]
              , s = e[2];
            null !== s && t.traverse((function(e) {
                e.isSkinnedMesh && e.bind(s, _identityMatrix)
            }
            ));
            for (let e = 0, s = n.length; e < s; e++)
                t.add(n[e]);
            return t
        }
        ))
    }
    _loadNodeShallow(e) {
        const t = this.json
          , n = this.extensions
          , s = this;
        if (void 0 !== this.nodeCache[e])
            return this.nodeCache[e];
        const r = t.nodes[e]
          , o = r.name ? s.createUniqueName(r.name) : ""
          , i = []
          , a = s._invokeOne((function(t) {
            return t.createNodeMesh && t.createNodeMesh(e)
        }
        ));
        return a && i.push(a),
        void 0 !== r.camera && i.push(s.getDependency("camera", r.camera).then((function(e) {
            return s._getNodeRef(s.cameraCache, r.camera, e)
        }
        ))),
        s._invokeAll((function(t) {
            return t.createNodeAttachment && t.createNodeAttachment(e)
        }
        )).forEach((function(e) {
            i.push(e)
        }
        )),
        this.nodeCache[e] = Promise.all(i).then((function(t) {
            let i;
            if (i = !0 === r.isBone ? new Bone : t.length > 1 ? new Group : 1 === t.length ? t[0] : new Object3D$1,
            i !== t[0])
                for (let e = 0, n = t.length; e < n; e++)
                    i.add(t[e]);
            if (r.name && (i.userData.name = r.name,
            i.name = o),
            assignExtrasToUserData(i, r),
            r.extensions && addUnknownExtensionsToUserData(n, i, r),
            void 0 !== r.matrix) {
                const e = new Matrix4;
                e.fromArray(r.matrix),
                i.applyMatrix4(e)
            } else
                void 0 !== r.translation && i.position.fromArray(r.translation),
                void 0 !== r.rotation && i.quaternion.fromArray(r.rotation),
                void 0 !== r.scale && i.scale.fromArray(r.scale);
            return s.associations.has(i) || s.associations.set(i, {}),
            s.associations.get(i).nodes = e,
            i
        }
        )),
        this.nodeCache[e]
    }
    loadScene(e) {
        const t = this.extensions
          , n = this.json.scenes[e]
          , s = this
          , r = new Group;
        n.name && (r.name = s.createUniqueName(n.name)),
        assignExtrasToUserData(r, n),
        n.extensions && addUnknownExtensionsToUserData(t, r, n);
        const o = n.nodes || []
          , i = [];
        for (let e = 0, t = o.length; e < t; e++)
            i.push(s.getDependency("node", o[e]));
        return Promise.all(i).then((function(e) {
            for (let t = 0, n = e.length; t < n; t++)
                r.add(e[t]);
            return s.associations = (e => {
                const t = new Map;
                for (const [e,n] of s.associations)
                    (e instanceof Material || e instanceof Texture) && t.set(e, n);
                return e.traverse((e => {
                    const n = s.associations.get(e);
                    null != n && t.set(e, n)
                }
                )),
                t
            }
            )(r),
            r
        }
        ))
    }
    _createAnimationTracks(e, t, n, s, r) {
        const o = []
          , i = e.name ? e.name : e.uuid
          , a = [];
        let l;
        switch (PATH_PROPERTIES[r.path] === PATH_PROPERTIES.weights ? e.traverse((function(e) {
            e.morphTargetInfluences && a.push(e.name ? e.name : e.uuid)
        }
        )) : a.push(i),
        PATH_PROPERTIES[r.path]) {
        case PATH_PROPERTIES.weights:
            l = NumberKeyframeTrack;
            break;
        case PATH_PROPERTIES.rotation:
            l = QuaternionKeyframeTrack;
            break;
        case PATH_PROPERTIES.position:
        case PATH_PROPERTIES.scale:
            l = VectorKeyframeTrack;
            break;
        default:
            if (1 === n.itemSize)
                l = NumberKeyframeTrack;
            else
                l = VectorKeyframeTrack
        }
        const c = void 0 !== s.interpolation ? INTERPOLATION[s.interpolation] : InterpolateLinear
          , h = this._getArrayFromAccessor(n);
        for (let e = 0, n = a.length; e < n; e++) {
            const n = new l(a[e] + "." + PATH_PROPERTIES[r.path],t.array,h,c);
            "CUBICSPLINE" === s.interpolation && this._createCubicSplineTrackInterpolant(n),
            o.push(n)
        }
        return o
    }
    _getArrayFromAccessor(e) {
        let t = e.array;
        if (e.normalized) {
            const e = getNormalizedComponentScale(t.constructor)
              , n = new Float32Array(t.length);
            for (let s = 0, r = t.length; s < r; s++)
                n[s] = t[s] * e;
            t = n
        }
        return t
    }
    _createCubicSplineTrackInterpolant(e) {
        e.createInterpolant = function(e) {
            return new (this instanceof QuaternionKeyframeTrack ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant)(this.times,this.values,this.getValueSize() / 3,e)
        }
        ,
        e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0
    }
}
function computeBounds(e, t, n) {
    const s = t.attributes
      , r = new Box3;
    if (void 0 === s.POSITION)
        return;
    {
        const e = n.json.accessors[s.POSITION]
          , t = e.min
          , o = e.max;
        if (void 0 === t || void 0 === o)
            return void console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
        if (r.set(new Vector3(t[0],t[1],t[2]), new Vector3(o[0],o[1],o[2])),
        e.normalized) {
            const t = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[e.componentType]);
            r.min.multiplyScalar(t),
            r.max.multiplyScalar(t)
        }
    }
    const o = t.targets;
    if (void 0 !== o) {
        const e = new Vector3
          , t = new Vector3;
        for (let s = 0, r = o.length; s < r; s++) {
            const r = o[s];
            if (void 0 !== r.POSITION) {
                const s = n.json.accessors[r.POSITION]
                  , o = s.min
                  , i = s.max;
                if (void 0 !== o && void 0 !== i) {
                    if (t.setX(Math.max(Math.abs(o[0]), Math.abs(i[0]))),
                    t.setY(Math.max(Math.abs(o[1]), Math.abs(i[1]))),
                    t.setZ(Math.max(Math.abs(o[2]), Math.abs(i[2]))),
                    s.normalized) {
                        const e = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[s.componentType]);
                        t.multiplyScalar(e)
                    }
                    e.max(t)
                } else
                    console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")
            }
        }
        r.expandByVector(e)
    }
    e.boundingBox = r;
    const i = new Sphere;
    r.getCenter(i.center),
    i.radius = r.min.distanceTo(r.max) / 2,
    e.boundingSphere = i
}
function addPrimitiveAttributes(e, t, n) {
    const s = t.attributes
      , r = [];
    function o(t, s) {
        return n.getDependency("accessor", t).then((function(t) {
            e.setAttribute(s, t)
        }
        ))
    }
    for (const t in s) {
        const n = ATTRIBUTES[t] || t.toLowerCase();
        n in e.attributes || r.push(o(s[t], n))
    }
    if (void 0 !== t.indices && !e.index) {
        const s = n.getDependency("accessor", t.indices).then((function(t) {
            e.setIndex(t)
        }
        ));
        r.push(s)
    }
    return ColorManagement.workingColorSpace !== LinearSRGBColorSpace && "COLOR_0"in s && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ColorManagement.workingColorSpace}" not supported.`),
    assignExtrasToUserData(e, t),
    computeBounds(e, t, n),
    Promise.all(r).then((function() {
        return void 0 !== t.targets ? addMorphTargets(e, t.targets, n) : e
    }
    ))
}
const Constants = {
    Handedness: Object.freeze({
        NONE: "none",
        LEFT: "left",
        RIGHT: "right"
    }),
    ComponentState: Object.freeze({
        DEFAULT: "default",
        TOUCHED: "touched",
        PRESSED: "pressed"
    }),
    ComponentProperty: Object.freeze({
        BUTTON: "button",
        X_AXIS: "xAxis",
        Y_AXIS: "yAxis",
        STATE: "state"
    }),
    ComponentType: Object.freeze({
        TRIGGER: "trigger",
        SQUEEZE: "squeeze",
        TOUCHPAD: "touchpad",
        THUMBSTICK: "thumbstick",
        BUTTON: "button"
    }),
    ButtonTouchThreshold: .05,
    AxisTouchThreshold: .1,
    VisualResponseProperty: Object.freeze({
        TRANSFORM: "transform",
        VISIBILITY: "visibility"
    })
};
async function fetchJsonFile(e) {
    const t = await fetch(e);
    if (t.ok)
        return t.json();
    throw new Error(t.statusText)
}
async function fetchProfilesList(e) {
    if (!e)
        throw new Error("No basePath supplied");
    return await fetchJsonFile(`${e}/profilesList.json`)
}
async function fetchProfile(e, t, n=null, s=!0) {
    if (!e)
        throw new Error("No xrInputSource supplied");
    if (!t)
        throw new Error("No basePath supplied");
    const r = await fetchProfilesList(t);
    let o;
    if (e.profiles.some((e => {
        const n = r[e];
        return n && (o = {
            profileId: e,
            profilePath: `${t}/${n.path}`,
            deprecated: !!n.deprecated
        }),
        !!o
    }
    )),
    !o) {
        if (!n)
            throw new Error("No matching profile name found");
        const e = r[n];
        if (!e)
            throw new Error(`No matching profile name found and default profile "${n}" missing.`);
        o = {
            profileId: n,
            profilePath: `${t}/${e.path}`,
            deprecated: !!e.deprecated
        }
    }
    const i = await fetchJsonFile(o.profilePath);
    let a;
    if (s) {
        let t;
        if (t = "any" === e.handedness ? i.layouts[Object.keys(i.layouts)[0]] : i.layouts[e.handedness],
        !t)
            throw new Error(`No matching handedness, ${e.handedness}, in profile ${o.profileId}`);
        t.assetPath && (a = o.profilePath.replace("profile.json", t.assetPath))
    }
    return {
        profile: i,
        assetPath: a
    }
}
const defaultComponentValues = {
    xAxis: 0,
    yAxis: 0,
    button: 0,
    state: Constants.ComponentState.DEFAULT
};
function normalizeAxes(e=0, t=0) {
    let n = e
      , s = t;
    if (Math.sqrt(e * e + t * t) > 1) {
        const r = Math.atan2(t, e);
        n = Math.cos(r),
        s = Math.sin(r)
    }
    return {
        normalizedXAxis: .5 * n + .5,
        normalizedYAxis: .5 * s + .5
    }
}
class VisualResponse {
    constructor(e) {
        this.componentProperty = e.componentProperty,
        this.states = e.states,
        this.valueNodeName = e.valueNodeName,
        this.valueNodeProperty = e.valueNodeProperty,
        this.valueNodeProperty === Constants.VisualResponseProperty.TRANSFORM && (this.minNodeName = e.minNodeName,
        this.maxNodeName = e.maxNodeName),
        this.value = 0,
        this.updateFromComponent(defaultComponentValues)
    }
    updateFromComponent({xAxis: e, yAxis: t, button: n, state: s}) {
        const {normalizedXAxis: r, normalizedYAxis: o} = normalizeAxes(e, t);
        switch (this.componentProperty) {
        case Constants.ComponentProperty.X_AXIS:
            this.value = this.states.includes(s) ? r : .5;
            break;
        case Constants.ComponentProperty.Y_AXIS:
            this.value = this.states.includes(s) ? o : .5;
            break;
        case Constants.ComponentProperty.BUTTON:
            this.value = this.states.includes(s) ? n : 0;
            break;
        case Constants.ComponentProperty.STATE:
            this.valueNodeProperty === Constants.VisualResponseProperty.VISIBILITY ? this.value = this.states.includes(s) : this.value = this.states.includes(s) ? 1 : 0;
            break;
        default:
            throw new Error(`Unexpected visualResponse componentProperty ${this.componentProperty}`)
        }
    }
}
let Component$1 = class {
    constructor(e, t) {
        if (!(e && t && t.visualResponses && t.gamepadIndices && 0 !== Object.keys(t.gamepadIndices).length))
            throw new Error("Invalid arguments supplied");
        this.id = e,
        this.type = t.type,
        this.rootNodeName = t.rootNodeName,
        this.touchPointNodeName = t.touchPointNodeName,
        this.visualResponses = {},
        Object.keys(t.visualResponses).forEach((e => {
            const n = new VisualResponse(t.visualResponses[e]);
            this.visualResponses[e] = n
        }
        )),
        this.gamepadIndices = Object.assign({}, t.gamepadIndices),
        this.values = {
            state: Constants.ComponentState.DEFAULT,
            button: void 0 !== this.gamepadIndices.button ? 0 : void 0,
            xAxis: void 0 !== this.gamepadIndices.xAxis ? 0 : void 0,
            yAxis: void 0 !== this.gamepadIndices.yAxis ? 0 : void 0
        }
    }
    get data() {
        return {
            id: this.id,
            ...this.values
        }
    }
    updateFromGamepad(e) {
        if (this.values.state = Constants.ComponentState.DEFAULT,
        void 0 !== this.gamepadIndices.button && e.buttons.length > this.gamepadIndices.button) {
            const t = e.buttons[this.gamepadIndices.button];
            this.values.button = t.value,
            this.values.button = this.values.button < 0 ? 0 : this.values.button,
            this.values.button = this.values.button > 1 ? 1 : this.values.button,
            t.pressed || 1 === this.values.button ? this.values.state = Constants.ComponentState.PRESSED : (t.touched || this.values.button > Constants.ButtonTouchThreshold) && (this.values.state = Constants.ComponentState.TOUCHED)
        }
        void 0 !== this.gamepadIndices.xAxis && e.axes.length > this.gamepadIndices.xAxis && (this.values.xAxis = e.axes[this.gamepadIndices.xAxis],
        this.values.xAxis = this.values.xAxis < -1 ? -1 : this.values.xAxis,
        this.values.xAxis = this.values.xAxis > 1 ? 1 : this.values.xAxis,
        this.values.state === Constants.ComponentState.DEFAULT && Math.abs(this.values.xAxis) > Constants.AxisTouchThreshold && (this.values.state = Constants.ComponentState.TOUCHED)),
        void 0 !== this.gamepadIndices.yAxis && e.axes.length > this.gamepadIndices.yAxis && (this.values.yAxis = e.axes[this.gamepadIndices.yAxis],
        this.values.yAxis = this.values.yAxis < -1 ? -1 : this.values.yAxis,
        this.values.yAxis = this.values.yAxis > 1 ? 1 : this.values.yAxis,
        this.values.state === Constants.ComponentState.DEFAULT && Math.abs(this.values.yAxis) > Constants.AxisTouchThreshold && (this.values.state = Constants.ComponentState.TOUCHED)),
        Object.values(this.visualResponses).forEach((e => {
            e.updateFromComponent(this.values)
        }
        ))
    }
}
;
class MotionController {
    constructor(e, t, n) {
        if (!e)
            throw new Error("No xrInputSource supplied");
        if (!t)
            throw new Error("No profile supplied");
        this.xrInputSource = e,
        this.assetUrl = n,
        this.id = t.profileId,
        this.layoutDescription = t.layouts[e.handedness],
        this.components = {},
        Object.keys(this.layoutDescription.components).forEach((e => {
            const t = this.layoutDescription.components[e];
            this.components[e] = new Component$1(e,t)
        }
        )),
        this.updateFromGamepad()
    }
    get gripSpace() {
        return this.xrInputSource.gripSpace
    }
    get targetRaySpace() {
        return this.xrInputSource.targetRaySpace
    }
    get data() {
        const e = [];
        return Object.values(this.components).forEach((t => {
            e.push(t.data)
        }
        )),
        e
    }
    updateFromGamepad() {
        Object.values(this.components).forEach((e => {
            e.updateFromGamepad(this.xrInputSource.gamepad)
        }
        ))
    }
}
const DEFAULT_PROFILES_PATH = "https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles"
  , DEFAULT_PROFILE = "generic-trigger";
class XRControllerModel extends Object3D$1 {
    constructor() {
        super(),
        this.motionController = null,
        this.envMap = null
    }
    setEnvironmentMap(e) {
        return this.envMap == e || (this.envMap = e,
        this.traverse((e => {
            e.isMesh && (e.material.envMap = this.envMap,
            e.material.needsUpdate = !0)
        }
        ))),
        this
    }
    updateMatrixWorld(e) {
        super.updateMatrixWorld(e),
        this.motionController && (this.motionController.updateFromGamepad(),
        Object.values(this.motionController.components).forEach((e => {
            Object.values(e.visualResponses).forEach((e => {
                const {valueNode: t, minNode: n, maxNode: s, value: r, valueNodeProperty: o} = e;
                t && (o === Constants.VisualResponseProperty.VISIBILITY ? t.visible = r : o === Constants.VisualResponseProperty.TRANSFORM && (t.quaternion.slerpQuaternions(n.quaternion, s.quaternion, r),
                t.position.lerpVectors(n.position, s.position, r)))
            }
            ))
        }
        )))
    }
}
function findNodes(e, t) {
    Object.values(e.components).forEach((e => {
        const {type: n, touchPointNodeName: s, visualResponses: r} = e;
        if (n === Constants.ComponentType.TOUCHPAD)
            if (e.touchPointNode = t.getObjectByName(s),
            e.touchPointNode) {
                const t = new SphereGeometry(.001)
                  , n = new MeshBasicMaterial({
                    color: 255
                })
                  , s = new Mesh(t,n);
                e.touchPointNode.add(s)
            } else
                console.warn(`Could not find touch dot, ${e.touchPointNodeName}, in touchpad component ${e.id}`);
        Object.values(r).forEach((e => {
            const {valueNodeName: n, minNodeName: s, maxNodeName: r, valueNodeProperty: o} = e;
            if (o === Constants.VisualResponseProperty.TRANSFORM) {
                if (e.minNode = t.getObjectByName(s),
                e.maxNode = t.getObjectByName(r),
                !e.minNode)
                    return void console.warn(`Could not find ${s} in the model`);
                if (!e.maxNode)
                    return void console.warn(`Could not find ${r} in the model`)
            }
            e.valueNode = t.getObjectByName(n),
            e.valueNode || console.warn(`Could not find ${n} in the model`)
        }
        ))
    }
    ))
}
function addAssetSceneToControllerModel(e, t) {
    findNodes(e.motionController, t),
    e.envMap && t.traverse((t => {
        t.isMesh && (t.material.envMap = e.envMap,
        t.material.needsUpdate = !0)
    }
    )),
    e.add(t)
}
class XRControllerModelFactory {
    constructor(e=null) {
        this.gltfLoader = e,
        this.path = DEFAULT_PROFILES_PATH,
        this._assetCache = {},
        this.gltfLoader || (this.gltfLoader = new GLTFLoader)
    }
    createControllerModel(e) {
        const t = new XRControllerModel;
        let n = null;
        return e.addEventListener("connected", (e => {
            const s = e.data;
            "tracked-pointer" === s.targetRayMode && s.gamepad && fetchProfile(s, this.path, DEFAULT_PROFILE).then(( ({profile: e, assetPath: r}) => {
                t.motionController = new MotionController(s,e,r);
                const o = this._assetCache[t.motionController.assetUrl];
                if (o)
                    n = o.scene.clone(),
                    addAssetSceneToControllerModel(t, n);
                else {
                    if (!this.gltfLoader)
                        throw new Error("GLTFLoader not set.");
                    this.gltfLoader.setPath(""),
                    this.gltfLoader.load(t.motionController.assetUrl, (e => {
                        this._assetCache[t.motionController.assetUrl] = e,
                        n = e.scene.clone(),
                        addAssetSceneToControllerModel(t, n)
                    }
                    ), null, ( () => {
                        throw new Error(`Asset ${t.motionController.assetUrl} missing or malformed.`)
                    }
                    ))
                }
            }
            )).catch((e => {
                console.warn(e)
            }
            ))
        }
        )),
        e.addEventListener("disconnected", ( () => {
            t.motionController = null,
            t.remove(n),
            n = null
        }
        )),
        t
    }
}
const DEFAULT_HAND_PROFILE_PATH = "https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/";
class XRHandMeshModel {
    constructor(e, t, n, s, r=null) {
        this.controller = t,
        this.handModel = e,
        this.bones = [],
        null === r && (r = new GLTFLoader).setPath(n || DEFAULT_HAND_PROFILE_PATH),
        r.load(`${s}.glb`, (e => {
            const t = e.scene.children[0];
            this.handModel.add(t);
            const n = t.getObjectByProperty("type", "SkinnedMesh");
            n.frustumCulled = !1,
            n.castShadow = !0,
            n.receiveShadow = !0;
            ["wrist", "thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip", "index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-phalanx-intermediate", "index-finger-phalanx-distal", "index-finger-tip", "middle-finger-metacarpal", "middle-finger-phalanx-proximal", "middle-finger-phalanx-intermediate", "middle-finger-phalanx-distal", "middle-finger-tip", "ring-finger-metacarpal", "ring-finger-phalanx-proximal", "ring-finger-phalanx-intermediate", "ring-finger-phalanx-distal", "ring-finger-tip", "pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-phalanx-intermediate", "pinky-finger-phalanx-distal", "pinky-finger-tip"].forEach((e => {
                const n = t.getObjectByName(e);
                void 0 !== n ? n.jointName = e : console.warn(`Couldn't find ${e} in ${s} hand mesh`),
                this.bones.push(n)
            }
            ))
        }
        ))
    }
    updateMesh() {
        const e = this.controller.joints;
        for (let t = 0; t < this.bones.length; t++) {
            const n = this.bones[t];
            if (n) {
                const t = e[n.jointName];
                if (t.visible) {
                    const e = t.position;
                    n.position.copy(e),
                    n.quaternion.copy(t.quaternion)
                }
            }
        }
    }
}
const TOUCH_RADIUS = .01
  , POINTING_JOINT = "index-finger-tip";
class OculusHandModel extends Object3D$1 {
    constructor(e, t=null) {
        super(),
        this.controller = e,
        this.motionController = null,
        this.envMap = null,
        this.loader = t,
        this.mesh = null,
        e.addEventListener("connected", (t => {
            const n = t.data;
            n.hand && !this.motionController && (this.xrInputSource = n,
            this.motionController = new XRHandMeshModel(this,e,this.path,n.handedness,this.loader))
        }
        )),
        e.addEventListener("disconnected", ( () => {
            this.clear(),
            this.motionController = null
        }
        ))
    }
    updateMatrixWorld(e) {
        super.updateMatrixWorld(e),
        this.motionController && this.motionController.updateMesh()
    }
    getPointerPosition() {
        const e = this.controller.joints[POINTING_JOINT];
        return e ? e.position : null
    }
    intersectBoxObject(e) {
        const t = this.getPointerPosition();
        if (t) {
            const n = new Sphere(t,TOUCH_RADIUS)
              , s = (new Box3).setFromObject(e);
            return n.intersectsBox(s)
        }
        return !1
    }
    checkButton(e) {
        this.intersectBoxObject(e) ? e.onPress() : e.onClear(),
        e.isPressed() && e.whilePressed()
    }
}
function createText(e, t, n="#ffffff") {
    const s = document.createElement("canvas")
      , r = s.getContext("2d");
    let o = null;
    const i = 100;
    r.font = "normal 100px Arial",
    o = r.measureText(e);
    const a = o.width;
    s.width = a,
    s.height = i,
    r.font = "normal 100px Arial",
    r.textAlign = "center",
    r.textBaseline = "middle",
    r.fillStyle = n,
    r.fillText(e, a / 2, 50);
    const l = new THREE.Texture(s);
    l.needsUpdate = !0;
    const c = new THREE.MeshBasicMaterial({
        color: 16777215,
        side: THREE.DoubleSide,
        map: l,
        transparent: !0
    })
      , h = new THREE.PlaneGeometry(t * a / i,t);
    return new THREE.Mesh(h,c)
}
function queryKey(e) {
    for (var t = [], n = 0; n < e.length; n++) {
        var s = e[n];
        if (!componentRegistered(s))
            throw new Error("Tried to create a query with an unregistered component");
        if ("object" == typeof s) {
            var r = "not" === s.operator ? "!" : s.operator;
            t.push(r + s.Component._typeId)
        } else
            t.push(s._typeId)
    }
    return t.sort().join("-")
}
const hasWindow = "undefined" != typeof window
  , now = hasWindow && void 0 !== window.performance ? performance.now.bind(performance) : Date.now.bind(Date);
function componentRegistered(e) {
    return "object" == typeof e && void 0 !== e.Component._typeId || e.isComponent && void 0 !== e._typeId
}
class SystemManager {
    constructor(e) {
        this._systems = [],
        this._executeSystems = [],
        this.world = e,
        this.lastExecutedSystem = null
    }
    registerSystem(e, t) {
        if (!e.isSystem)
            throw new Error(`System '${e.name}' does not extend 'System' class`);
        if (void 0 !== this.getSystem(e))
            return console.warn(`System '${e.getName()}' already registered.`),
            this;
        var n = new e(this.world,t);
        return n.init && n.init(t),
        n.order = this._systems.length,
        this._systems.push(n),
        n.execute && (this._executeSystems.push(n),
        this.sortSystems()),
        this
    }
    unregisterSystem(e) {
        let t = this.getSystem(e);
        return void 0 === t ? (console.warn(`Can unregister system '${e.getName()}'. It doesn't exist.`),
        this) : (this._systems.splice(this._systems.indexOf(t), 1),
        t.execute && this._executeSystems.splice(this._executeSystems.indexOf(t), 1),
        this)
    }
    sortSystems() {
        this._executeSystems.sort(( (e, t) => e.priority - t.priority || e.order - t.order))
    }
    getSystem(e) {
        return this._systems.find((t => t instanceof e))
    }
    getSystems() {
        return this._systems
    }
    removeSystem(e) {
        var t = this._systems.indexOf(e);
        ~t && this._systems.splice(t, 1)
    }
    executeSystem(e, t, n) {
        if (e.initialized && e.canExecute()) {
            let s = now();
            e.execute(t, n),
            e.executeTime = now() - s,
            this.lastExecutedSystem = e,
            e.clearEvents()
        }
    }
    stop() {
        this._executeSystems.forEach((e => e.stop()))
    }
    execute(e, t, n) {
        this._executeSystems.forEach((s => (n || s.enabled) && this.executeSystem(s, e, t)))
    }
    stats() {
        for (var e = {
            numSystems: this._systems.length,
            systems: {}
        }, t = 0; t < this._systems.length; t++) {
            var n = this._systems[t]
              , s = e.systems[n.getName()] = {
                queries: {},
                executeTime: n.executeTime
            };
            for (var r in n.ctx)
                s.queries[r] = n.ctx[r].stats()
        }
        return e
    }
}
class ObjectPool {
    constructor(e, t) {
        this.freeList = [],
        this.count = 0,
        this.T = e,
        this.isObjectPool = !0,
        void 0 !== t && this.expand(t)
    }
    acquire() {
        return this.freeList.length <= 0 && this.expand(Math.round(.2 * this.count) + 1),
        this.freeList.pop()
    }
    release(e) {
        e.reset(),
        this.freeList.push(e)
    }
    expand(e) {
        for (var t = 0; t < e; t++) {
            var n = new this.T;
            n._pool = this,
            this.freeList.push(n)
        }
        this.count += e
    }
    totalSize() {
        return this.count
    }
    totalFree() {
        return this.freeList.length
    }
    totalUsed() {
        return this.count - this.freeList.length
    }
}
class EventDispatcher {
    constructor() {
        this._listeners = {},
        this.stats = {
            fired: 0,
            handled: 0
        }
    }
    addEventListener(e, t) {
        let n = this._listeners;
        void 0 === n[e] && (n[e] = []),
        -1 === n[e].indexOf(t) && n[e].push(t)
    }
    hasEventListener(e, t) {
        return void 0 !== this._listeners[e] && -1 !== this._listeners[e].indexOf(t)
    }
    removeEventListener(e, t) {
        var n = this._listeners[e];
        if (void 0 !== n) {
            var s = n.indexOf(t);
            -1 !== s && n.splice(s, 1)
        }
    }
    dispatchEvent(e, t, n) {
        this.stats.fired++;
        var s = this._listeners[e];
        if (void 0 !== s)
            for (var r = s.slice(0), o = 0; o < r.length; o++)
                r[o].call(this, t, n)
    }
    resetCounters() {
        this.stats.fired = this.stats.handled = 0
    }
}
class Query {
    constructor(e, t) {
        if (this.Components = [],
        this.NotComponents = [],
        e.forEach((e => {
            "object" == typeof e ? this.NotComponents.push(e.Component) : this.Components.push(e)
        }
        )),
        0 === this.Components.length)
            throw new Error("Can't create a query without components");
        this.entities = [],
        this.eventDispatcher = new EventDispatcher,
        this.reactive = !1,
        this.key = queryKey(e);
        for (var n = 0; n < t._entities.length; n++) {
            var s = t._entities[n];
            this.match(s) && (s.queries.push(this),
            this.entities.push(s))
        }
    }
    addEntity(e) {
        e.queries.push(this),
        this.entities.push(e),
        this.eventDispatcher.dispatchEvent(Query.prototype.ENTITY_ADDED, e)
    }
    removeEntity(e) {
        let t = this.entities.indexOf(e);
        ~t && (this.entities.splice(t, 1),
        t = e.queries.indexOf(this),
        e.queries.splice(t, 1),
        this.eventDispatcher.dispatchEvent(Query.prototype.ENTITY_REMOVED, e))
    }
    match(e) {
        return e.hasAllComponents(this.Components) && !e.hasAnyComponents(this.NotComponents)
    }
    toJSON() {
        return {
            key: this.key,
            reactive: this.reactive,
            components: {
                included: this.Components.map((e => e.name)),
                not: this.NotComponents.map((e => e.name))
            },
            numEntities: this.entities.length
        }
    }
    stats() {
        return {
            numComponents: this.Components.length,
            numEntities: this.entities.length
        }
    }
}
Query.prototype.ENTITY_ADDED = "Query#ENTITY_ADDED",
Query.prototype.ENTITY_REMOVED = "Query#ENTITY_REMOVED",
Query.prototype.COMPONENT_CHANGED = "Query#COMPONENT_CHANGED";
class QueryManager {
    constructor(e) {
        this._world = e,
        this._queries = {}
    }
    onEntityRemoved(e) {
        for (var t in this._queries) {
            var n = this._queries[t];
            -1 !== e.queries.indexOf(n) && n.removeEntity(e)
        }
    }
    onEntityComponentAdded(e, t) {
        for (var n in this._queries) {
            var s = this._queries[n];
            ~s.NotComponents.indexOf(t) && ~s.entities.indexOf(e) ? s.removeEntity(e) : ~s.Components.indexOf(t) && s.match(e) && !~s.entities.indexOf(e) && s.addEntity(e)
        }
    }
    onEntityComponentRemoved(e, t) {
        for (var n in this._queries) {
            var s = this._queries[n];
            ~s.NotComponents.indexOf(t) && !~s.entities.indexOf(e) && s.match(e) ? s.addEntity(e) : ~s.Components.indexOf(t) && ~s.entities.indexOf(e) && !s.match(e) && s.removeEntity(e)
        }
    }
    getQuery(e) {
        var t = queryKey(e)
          , n = this._queries[t];
        return n || (this._queries[t] = n = new Query(e,this._world)),
        n
    }
    stats() {
        var e = {};
        for (var t in this._queries)
            e[t] = this._queries[t].stats();
        return e
    }
}
class Component {
    constructor(e) {
        if (!1 !== e) {
            const t = this.constructor.schema;
            for (const n in t)
                if (e && e.hasOwnProperty(n))
                    this[n] = e[n];
                else {
                    const e = t[n];
                    if (e.hasOwnProperty("default"))
                        this[n] = e.type.clone(e.default);
                    else {
                        const t = e.type;
                        this[n] = t.clone(t.default)
                    }
                }
            void 0 !== e && this.checkUndefinedAttributes(e)
        }
        this._pool = null
    }
    copy(e) {
        const t = this.constructor.schema;
        for (const n in t) {
            const s = t[n];
            e.hasOwnProperty(n) && (this[n] = s.type.copy(e[n], this[n]))
        }
        return this.checkUndefinedAttributes(e),
        this
    }
    clone() {
        return (new this.constructor).copy(this)
    }
    reset() {
        const e = this.constructor.schema;
        for (const t in e) {
            const n = e[t];
            if (n.hasOwnProperty("default"))
                this[t] = n.type.copy(n.default, this[t]);
            else {
                const e = n.type;
                this[t] = e.copy(e.default, this[t])
            }
        }
    }
    dispose() {
        this._pool && this._pool.release(this)
    }
    getName() {
        return this.constructor.getName()
    }
    checkUndefinedAttributes(e) {
        const t = this.constructor.schema;
        Object.keys(e).forEach((e => {
            t.hasOwnProperty(e) || console.warn(`Trying to set attribute '${e}' not defined in the '${this.constructor.name}' schema. Please fix the schema, the attribute value won't be set`)
        }
        ))
    }
}
Component.schema = {},
Component.isComponent = !0,
Component.getName = function() {
    return this.displayName || this.name
}
;
class SystemStateComponent extends Component {
}
SystemStateComponent.isSystemStateComponent = !0;
class EntityPool extends ObjectPool {
    constructor(e, t, n) {
        super(t, void 0),
        this.entityManager = e,
        void 0 !== n && this.expand(n)
    }
    expand(e) {
        for (var t = 0; t < e; t++) {
            var n = new this.T(this.entityManager);
            n._pool = this,
            this.freeList.push(n)
        }
        this.count += e
    }
}
class EntityManager {
    constructor(e) {
        this.world = e,
        this.componentsManager = e.componentsManager,
        this._entities = [],
        this._nextEntityId = 0,
        this._entitiesByNames = {},
        this._queryManager = new QueryManager(this),
        this.eventDispatcher = new EventDispatcher,
        this._entityPool = new EntityPool(this,this.world.options.entityClass,this.world.options.entityPoolSize),
        this.entitiesWithComponentsToRemove = [],
        this.entitiesToRemove = [],
        this.deferredRemovalEnabled = !0
    }
    getEntityByName(e) {
        return this._entitiesByNames[e]
    }
    createEntity(e) {
        var t = this._entityPool.acquire();
        return t.alive = !0,
        t.name = e || "",
        e && (this._entitiesByNames[e] ? console.warn(`Entity name '${e}' already exist`) : this._entitiesByNames[e] = t),
        this._entities.push(t),
        this.eventDispatcher.dispatchEvent(ENTITY_CREATED, t),
        t
    }
    entityAddComponent(e, t, n) {
        if (void 0 === t._typeId && !this.world.componentsManager._ComponentsMap[t._typeId])
            throw new Error(`Attempted to add unregistered component "${t.getName()}"`);
        if (~e._ComponentTypes.indexOf(t))
            console.warn("Component type already exists on entity.", e, t.getName());
        else {
            e._ComponentTypes.push(t),
            t.__proto__ === SystemStateComponent && e.numStateComponents++;
            var s = this.world.componentsManager.getComponentsPool(t)
              , r = s ? s.acquire() : new t(n);
            s && n && r.copy(n),
            e._components[t._typeId] = r,
            this._queryManager.onEntityComponentAdded(e, t),
            this.world.componentsManager.componentAddedToEntity(t),
            this.eventDispatcher.dispatchEvent(COMPONENT_ADDED, e, t)
        }
    }
    entityRemoveComponent(e, t, n) {
        var s = e._ComponentTypes.indexOf(t);
        ~s && (this.eventDispatcher.dispatchEvent(COMPONENT_REMOVE, e, t),
        n ? this._entityRemoveComponentSync(e, t, s) : (0 === e._ComponentTypesToRemove.length && this.entitiesWithComponentsToRemove.push(e),
        e._ComponentTypes.splice(s, 1),
        e._ComponentTypesToRemove.push(t),
        e._componentsToRemove[t._typeId] = e._components[t._typeId],
        delete e._components[t._typeId]),
        this._queryManager.onEntityComponentRemoved(e, t),
        t.__proto__ === SystemStateComponent && (e.numStateComponents--,
        0 !== e.numStateComponents || e.alive || e.remove()))
    }
    _entityRemoveComponentSync(e, t, n) {
        e._ComponentTypes.splice(n, 1);
        var s = e._components[t._typeId];
        delete e._components[t._typeId],
        s.dispose(),
        this.world.componentsManager.componentRemovedFromEntity(t)
    }
    entityRemoveAllComponents(e, t) {
        let n = e._ComponentTypes;
        for (let s = n.length - 1; s >= 0; s--)
            n[s].__proto__ !== SystemStateComponent && this.entityRemoveComponent(e, n[s], t)
    }
    removeEntity(e, t) {
        var n = this._entities.indexOf(e);
        if (!~n)
            throw new Error("Tried to remove entity not in list");
        e.alive = !1,
        this.entityRemoveAllComponents(e, t),
        0 === e.numStateComponents && (this.eventDispatcher.dispatchEvent(ENTITY_REMOVED, e),
        this._queryManager.onEntityRemoved(e),
        !0 === t ? this._releaseEntity(e, n) : this.entitiesToRemove.push(e))
    }
    _releaseEntity(e, t) {
        this._entities.splice(t, 1),
        this._entitiesByNames[e.name] && delete this._entitiesByNames[e.name],
        e._pool.release(e)
    }
    removeAllEntities() {
        for (var e = this._entities.length - 1; e >= 0; e--)
            this.removeEntity(this._entities[e])
    }
    processDeferredRemoval() {
        if (this.deferredRemovalEnabled) {
            for (let e = 0; e < this.entitiesToRemove.length; e++) {
                let t = this.entitiesToRemove[e]
                  , n = this._entities.indexOf(t);
                this._releaseEntity(t, n)
            }
            this.entitiesToRemove.length = 0;
            for (let t = 0; t < this.entitiesWithComponentsToRemove.length; t++) {
                let n = this.entitiesWithComponentsToRemove[t];
                for (; n._ComponentTypesToRemove.length > 0; ) {
                    let t = n._ComponentTypesToRemove.pop();
                    var e = n._componentsToRemove[t._typeId];
                    delete n._componentsToRemove[t._typeId],
                    e.dispose(),
                    this.world.componentsManager.componentRemovedFromEntity(t)
                }
            }
            this.entitiesWithComponentsToRemove.length = 0
        }
    }
    queryComponents(e) {
        return this._queryManager.getQuery(e)
    }
    count() {
        return this._entities.length
    }
    stats() {
        var e = {
            numEntities: this._entities.length,
            numQueries: Object.keys(this._queryManager._queries).length,
            queries: this._queryManager.stats(),
            numComponentPool: Object.keys(this.componentsManager._componentPool).length,
            componentPool: {},
            eventDispatcher: this.eventDispatcher.stats
        };
        for (var t in this.componentsManager._componentPool) {
            var n = this.componentsManager._componentPool[t];
            e.componentPool[n.T.getName()] = {
                used: n.totalUsed(),
                size: n.count
            }
        }
        return e
    }
}
const ENTITY_CREATED = "EntityManager#ENTITY_CREATE"
  , ENTITY_REMOVED = "EntityManager#ENTITY_REMOVED"
  , COMPONENT_ADDED = "EntityManager#COMPONENT_ADDED"
  , COMPONENT_REMOVE = "EntityManager#COMPONENT_REMOVE";
class ComponentManager {
    constructor() {
        this.Components = [],
        this._ComponentsMap = {},
        this._componentPool = {},
        this.numComponents = {},
        this.nextComponentId = 0
    }
    hasComponent(e) {
        return -1 !== this.Components.indexOf(e)
    }
    registerComponent(e, t) {
        if (-1 !== this.Components.indexOf(e))
            return void console.warn(`Component type: '${e.getName()}' already registered.`);
        const n = e.schema;
        if (!n)
            throw new Error(`Component "${e.getName()}" has no schema property.`);
        for (const t in n) {
            if (!n[t].type)
                throw new Error(`Invalid schema for component "${e.getName()}". Missing type for "${t}" property.`)
        }
        e._typeId = this.nextComponentId++,
        this.Components.push(e),
        this._ComponentsMap[e._typeId] = e,
        this.numComponents[e._typeId] = 0,
        void 0 === t ? t = new ObjectPool(e) : !1 === t && (t = void 0),
        this._componentPool[e._typeId] = t
    }
    componentAddedToEntity(e) {
        this.numComponents[e._typeId]++
    }
    componentRemovedFromEntity(e) {
        this.numComponents[e._typeId]--
    }
    getComponentsPool(e) {
        return this._componentPool[e._typeId]
    }
}
const Version = "0.3.1"
  , proxyMap = new WeakMap
  , proxyHandler = {
    set(e, t) {
        throw new Error(`Tried to write to "${e.constructor.getName()}#${String(t)}" on immutable component. Use .getMutableComponent() to modify a component.`)
    }
};
function wrapImmutableComponent(e, t) {
    if (void 0 === t)
        return;
    let n = proxyMap.get(t);
    return n || (n = new Proxy(t,proxyHandler),
    proxyMap.set(t, n)),
    n
}
class Entity {
    constructor(e) {
        this._entityManager = e || null,
        this.id = e._nextEntityId++,
        this._ComponentTypes = [],
        this._components = {},
        this._componentsToRemove = {},
        this.queries = [],
        this._ComponentTypesToRemove = [],
        this.alive = !1,
        this.numStateComponents = 0
    }
    getComponent(e, t) {
        var n = this._components[e._typeId];
        return n || !0 !== t || (n = this._componentsToRemove[e._typeId]),
        wrapImmutableComponent(e, n)
    }
    getRemovedComponent(e) {
        return wrapImmutableComponent(e, this._componentsToRemove[e._typeId])
    }
    getComponents() {
        return this._components
    }
    getComponentsToRemove() {
        return this._componentsToRemove
    }
    getComponentTypes() {
        return this._ComponentTypes
    }
    getMutableComponent(e) {
        var t = this._components[e._typeId];
        if (t) {
            for (var n = 0; n < this.queries.length; n++) {
                var s = this.queries[n];
                s.reactive && -1 !== s.Components.indexOf(e) && s.eventDispatcher.dispatchEvent(Query.prototype.COMPONENT_CHANGED, this, t)
            }
            return t
        }
    }
    addComponent(e, t) {
        return this._entityManager.entityAddComponent(this, e, t),
        this
    }
    removeComponent(e, t) {
        return this._entityManager.entityRemoveComponent(this, e, t),
        this
    }
    hasComponent(e, t) {
        return !!~this._ComponentTypes.indexOf(e) || !0 === t && this.hasRemovedComponent(e)
    }
    hasRemovedComponent(e) {
        return !!~this._ComponentTypesToRemove.indexOf(e)
    }
    hasAllComponents(e) {
        for (var t = 0; t < e.length; t++)
            if (!this.hasComponent(e[t]))
                return !1;
        return !0
    }
    hasAnyComponents(e) {
        for (var t = 0; t < e.length; t++)
            if (this.hasComponent(e[t]))
                return !0;
        return !1
    }
    removeAllComponents(e) {
        return this._entityManager.entityRemoveAllComponents(this, e)
    }
    copy(e) {
        for (var t in e._components) {
            var n = e._components[t];
            this.addComponent(n.constructor),
            this.getComponent(n.constructor).copy(n)
        }
        return this
    }
    clone() {
        return new Entity(this._entityManager).copy(this)
    }
    reset() {
        for (var e in this.id = this._entityManager._nextEntityId++,
        this._ComponentTypes.length = 0,
        this.queries.length = 0,
        this._components)
            delete this._components[e]
    }
    remove(e) {
        return this._entityManager.removeEntity(this, e)
    }
}
const DEFAULT_OPTIONS = {
    entityPoolSize: 0,
    entityClass: Entity
};
class World {
    constructor(e={}) {
        if (this.options = Object.assign({}, DEFAULT_OPTIONS, e),
        this.componentsManager = new ComponentManager(this),
        this.entityManager = new EntityManager(this),
        this.systemManager = new SystemManager(this),
        this.enabled = !0,
        this.eventQueues = {},
        hasWindow && "undefined" != typeof CustomEvent) {
            var t = new CustomEvent("ecsy-world-created",{
                detail: {
                    world: this,
                    version: Version
                }
            });
            window.dispatchEvent(t)
        }
        this.lastTime = now() / 1e3
    }
    registerComponent(e, t) {
        return this.componentsManager.registerComponent(e, t),
        this
    }
    registerSystem(e, t) {
        return this.systemManager.registerSystem(e, t),
        this
    }
    hasRegisteredComponent(e) {
        return this.componentsManager.hasComponent(e)
    }
    unregisterSystem(e) {
        return this.systemManager.unregisterSystem(e),
        this
    }
    getSystem(e) {
        return this.systemManager.getSystem(e)
    }
    getSystems() {
        return this.systemManager.getSystems()
    }
    execute(e, t) {
        e || (e = (t = now() / 1e3) - this.lastTime,
        this.lastTime = t),
        this.enabled && (this.systemManager.execute(e, t),
        this.entityManager.processDeferredRemoval())
    }
    stop() {
        this.enabled = !1
    }
    play() {
        this.enabled = !0
    }
    createEntity(e) {
        return this.entityManager.createEntity(e)
    }
    stats() {
        return {
            entities: this.entityManager.stats(),
            system: this.systemManager.stats()
        }
    }
}
class System {
    canExecute() {
        if (0 === this._mandatoryQueries.length)
            return !0;
        for (let e = 0; e < this._mandatoryQueries.length; e++) {
            if (0 === this._mandatoryQueries[e].entities.length)
                return !1
        }
        return !0
    }
    getName() {
        return this.constructor.getName()
    }
    constructor(e, t) {
        if (this.world = e,
        this.enabled = !0,
        this._queries = {},
        this.queries = {},
        this.priority = 0,
        this.executeTime = 0,
        t && t.priority && (this.priority = t.priority),
        this._mandatoryQueries = [],
        this.initialized = !0,
        this.constructor.queries)
            for (var n in this.constructor.queries) {
                var s = this.constructor.queries[n]
                  , r = s.components;
                if (!r || 0 === r.length)
                    throw new Error("'components' attribute can't be empty in a query");
                let e = r.filter((e => !componentRegistered(e)));
                if (e.length > 0)
                    throw new Error(`Tried to create a query '${this.constructor.name}.${n}' with unregistered components: [${e.map((e => e.getName())).join(", ")}]`);
                var o = this.world.entityManager.queryComponents(r);
                this._queries[n] = o,
                !0 === s.mandatory && this._mandatoryQueries.push(o),
                this.queries[n] = {
                    results: o.entities
                };
                var i = ["added", "removed", "changed"];
                const t = {
                    added: Query.prototype.ENTITY_ADDED,
                    removed: Query.prototype.ENTITY_REMOVED,
                    changed: Query.prototype.COMPONENT_CHANGED
                };
                s.listen && i.forEach((e => {
                    if (this.execute || console.warn(`System '${this.getName()}' has defined listen events (${i.join(", ")}) for query '${n}' but it does not implement the 'execute' method.`),
                    s.listen[e]) {
                        let r = s.listen[e];
                        if ("changed" === e) {
                            if (o.reactive = !0,
                            !0 === r) {
                                let t = this.queries[n][e] = [];
                                o.eventDispatcher.addEventListener(Query.prototype.COMPONENT_CHANGED, (e => {
                                    -1 === t.indexOf(e) && t.push(e)
                                }
                                ))
                            } else if (Array.isArray(r)) {
                                let t = this.queries[n][e] = [];
                                o.eventDispatcher.addEventListener(Query.prototype.COMPONENT_CHANGED, ( (e, n) => {
                                    -1 !== r.indexOf(n.constructor) && -1 === t.indexOf(e) && t.push(e)
                                }
                                ))
                            }
                        } else {
                            let s = this.queries[n][e] = [];
                            o.eventDispatcher.addEventListener(t[e], (e => {
                                -1 === s.indexOf(e) && s.push(e)
                            }
                            ))
                        }
                    }
                }
                ))
            }
    }
    stop() {
        this.executeTime = 0,
        this.enabled = !1
    }
    play() {
        this.enabled = !0
    }
    clearEvents() {
        for (let t in this.queries) {
            var e = this.queries[t];
            if (e.added && (e.added.length = 0),
            e.removed && (e.removed.length = 0),
            e.changed)
                if (Array.isArray(e.changed))
                    e.changed.length = 0;
                else
                    for (let t in e.changed)
                        e.changed[t].length = 0
        }
    }
    toJSON() {
        var e = {
            name: this.getName(),
            enabled: this.enabled,
            executeTime: this.executeTime,
            priority: this.priority,
            queries: {}
        };
        if (this.constructor.queries) {
            var t = this.constructor.queries;
            for (let n in t) {
                let s = this.queries[n]
                  , r = t[n]
                  , o = e.queries[n] = {
                    key: this._queries[n].key
                };
                if (o.mandatory = !0 === r.mandatory,
                o.reactive = r.listen && (!0 === r.listen.added || !0 === r.listen.removed || !0 === r.listen.changed || Array.isArray(r.listen.changed)),
                o.reactive) {
                    o.listen = {};
                    ["added", "removed", "changed"].forEach((e => {
                        s[e] && (o.listen[e] = {
                            entities: s[e].length
                        })
                    }
                    ))
                }
            }
        }
        return e
    }
}
function Not(e) {
    return {
        operator: "not",
        Component: e
    }
}
System.isSystem = !0,
System.getName = function() {
    return this.displayName || this.name
}
;
class TagComponent extends Component {
    constructor() {
        super(!1)
    }
}
TagComponent.isTagComponent = !0;
const copyValue = e => e
  , cloneValue = e => e
  , copyArray = (e, t) => {
    if (!e)
        return e;
    if (!t)
        return e.slice();
    t.length = 0;
    for (let n = 0; n < e.length; n++)
        t.push(e[n]);
    return t
}
  , cloneArray = e => e && e.slice()
  , copyJSON = e => JSON.parse(JSON.stringify(e))
  , cloneJSON = e => JSON.parse(JSON.stringify(e))
  , copyCopyable = (e, t) => e ? t ? t.copy(e) : e.clone() : e
  , cloneClonable = e => e && e.clone();
function createType(e) {
    var t = ["name", "default", "copy", "clone"].filter((t => !e.hasOwnProperty(t)));
    if (t.length > 0)
        throw new Error(`createType expects a type definition with the following properties: ${t.join(", ")}`);
    return e.isType = !0,
    e
}
const Types = {
    Number: createType({
        name: "Number",
        default: 0,
        copy: copyValue,
        clone: cloneValue
    }),
    Boolean: createType({
        name: "Boolean",
        default: !1,
        copy: copyValue,
        clone: cloneValue
    }),
    String: createType({
        name: "String",
        default: "",
        copy: copyValue,
        clone: cloneValue
    }),
    Array: createType({
        name: "Array",
        default: [],
        copy: copyArray,
        clone: cloneArray
    }),
    Ref: createType({
        name: "Ref",
        default: void 0,
        copy: copyValue,
        clone: cloneValue
    }),
    JSON: createType({
        name: "JSON",
        default: null,
        copy: copyJSON,
        clone: cloneJSON
    })
};
function generateId(e) {
    for (var t = "", n = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", s = 0; s < e; s++)
        t += n.charAt(Math.floor(36 * Math.random()));
    return t
}
function injectScript(e, t) {
    var n = document.createElement("script");
    n.src = e,
    n.onload = t,
    (document.head || document.documentElement).appendChild(n)
}
function hookConsoleAndErrors(e) {
    ["error", "warning", "log"].forEach((t => {
        if ("function" == typeof console[t]) {
            var n = console[t].bind(console);
            console[t] = (...s) => (e.send({
                method: "console",
                type: t,
                args: JSON.stringify(s)
            }),
            n.apply(null, s))
        }
    }
    )),
    window.addEventListener("error", (t => {
        e.send({
            method: "error",
            error: JSON.stringify({
                message: t.error.message,
                stack: t.error.stack
            })
        })
    }
    ))
}
function includeRemoteIdHTML(e) {
    let t = document.createElement("div");
    return t.style.cssText = "\n    align-items: center;\n    background-color: #333;\n    color: #aaa;\n    display:flex;\n    font-family: Arial;\n    font-size: 1.1em;\n    height: 40px;\n    justify-content: center;\n    left: 0;\n    opacity: 0.9;\n    position: absolute;\n    right: 0;\n    text-align: center;\n    top: 0;\n  ",
    t.innerHTML = `Open ECSY devtools to connect to this page using the code:&nbsp;<b style="color: #fff">${e}</b>&nbsp;<button onClick="generateNewCode()">Generate new code</button>`,
    document.body.appendChild(t),
    t
}
function enableRemoteDevtools(remoteId) {
    if (!hasWindow)
        return void console.warn("Remote devtools not available outside the browser");
    window.generateNewCode = () => {
        window.localStorage.clear(),
        remoteId = generateId(6),
        window.localStorage.setItem("ecsyRemoteId", remoteId),
        window.location.reload(!1)
    }
    ,
    remoteId = remoteId || window.localStorage.getItem("ecsyRemoteId"),
    remoteId || (remoteId = generateId(6),
    window.localStorage.setItem("ecsyRemoteId", remoteId));
    let infoDiv = includeRemoteIdHTML(remoteId);
    window.__ECSY_REMOTE_DEVTOOLS_INJECTED = !0,
    window.__ECSY_REMOTE_DEVTOOLS = {};
    let Version = ""
      , worldsBeforeLoading = []
      , onWorldCreated = e => {
        var t = e.detail.world;
        Version = e.detail.version,
        worldsBeforeLoading.push(t)
    }
    ;
    window.addEventListener("ecsy-world-created", onWorldCreated);
    let onLoaded = () => {
        var peer = new Peer(remoteId,{
            host: "peerjs.ecsy.io",
            secure: !0,
            port: 443,
            config: {
                iceServers: [{
                    url: "stun:stun.l.google.com:19302"
                }, {
                    url: "stun:stun1.l.google.com:19302"
                }, {
                    url: "stun:stun2.l.google.com:19302"
                }, {
                    url: "stun:stun3.l.google.com:19302"
                }, {
                    url: "stun:stun4.l.google.com:19302"
                }]
            },
            debug: 3
        });
        peer.on("open", ( () => {
            peer.on("connection", (connection => {
                window.__ECSY_REMOTE_DEVTOOLS.connection = connection,
                connection.on("open", (function() {
                    infoDiv.innerHTML = "Connected",
                    connection.on("data", (function(data) {
                        if ("init" === data.type) {
                            var script = document.createElement("script");
                            script.setAttribute("type", "text/javascript"),
                            script.onload = () => {
                                script.parentNode.removeChild(script),
                                window.removeEventListener("ecsy-world-created", onWorldCreated),
                                worldsBeforeLoading.forEach((e => {
                                    var t = new CustomEvent("ecsy-world-created",{
                                        detail: {
                                            world: e,
                                            version: Version
                                        }
                                    });
                                    window.dispatchEvent(t)
                                }
                                ))
                            }
                            ,
                            script.innerHTML = data.script,
                            (document.head || document.documentElement).appendChild(script),
                            script.onload(),
                            hookConsoleAndErrors(connection)
                        } else if ("executeScript" === data.type) {
                            let value = eval(data.script);
                            data.returnEval && connection.send({
                                method: "evalReturn",
                                value: value
                            })
                        }
                    }
                    ))
                }
                ))
            }
            ))
        }
        ))
    }
    ;
    injectScript("https://cdn.jsdelivr.net/npm/peerjs@0.3.20/dist/peer.min.js", onLoaded)
}
if (hasWindow) {
    const e = new URLSearchParams(window.location.search);
    e.has("enable-remote-devtools") && enableRemoteDevtools()
}
class Object3D extends Component {
}
Object3D.schema = {
    object: {
        type: Types.Ref
    }
};
class Button extends Component {
}
Button.schema = {
    currState: {
        type: Types.String,
        default: "resting"
    },
    prevState: {
        type: Types.String,
        default: "resting"
    },
    pressSound: {
        type: Types.Ref,
        default: null
    },
    releaseSound: {
        type: Types.Ref,
        default: null
    },
    restingY: {
        type: Types.Number,
        default: null
    },
    surfaceY: {
        type: Types.Number,
        default: null
    },
    recoverySpeed: {
        type: Types.Number,
        default: .4
    },
    fullPressDistance: {
        type: Types.Number,
        default: null
    },
    action: {
        type: Types.Ref,
        default: () => {}
    }
};
class ButtonSystem extends System {
    init(e) {
        this.renderer = e.renderer,
        this.soundAdded = !1
    }
    execute() {
        let e, t;
        if (this.renderer.xr.getSession() && !this.soundAdded) {
            const n = this.renderer.xr.getCamera()
              , s = new THREE.AudioListener;
            n.add(s),
            e = new THREE.Audio(s),
            t = new THREE.Audio(s);
            const r = new THREE.AudioLoader;
            r.load("sounds/button-press.ogg", (t => {
                e.setBuffer(t)
            }
            )),
            r.load("sounds/button-release.ogg", (e => {
                t.setBuffer(e)
            }
            )),
            this.soundAdded = !0
        }
        this.queries.buttons.results.forEach((n => {
            const s = n.getMutableComponent(Button)
              , r = n.getComponent(Object3D).object;
            null == s.restingY && (s.restingY = r.position.y),
            e && (s.pressSound = e),
            t && (s.releaseSound = t),
            "fully_pressed" == s.currState && "fully_pressed" != s.prevState && (s.pressSound && s.pressSound.play(),
            s.action()),
            "recovering" == s.currState && "recovering" != s.prevState && s.releaseSound && s.releaseSound.play(),
            s.prevState = s.currState,
            s.currState = "resting"
        }
        ))
    }
}
ButtonSystem.queries = {
    buttons: {
        components: [Button]
    }
};
class Pressable extends TagComponent {
}
class FingerInputSystem extends System {
    init(e) {
        this.hands = e.hands
    }
    execute(e) {
        this.queries.pressable.results.forEach((t => {
            const n = t.getMutableComponent(Button)
              , s = t.getComponent(Object3D).object
              , r = [];
            if (this.hands.forEach((e => {
                if (e && e.intersectBoxObject(s)) {
                    const t = e.getPointerPosition();
                    r.push(n.surfaceY - s.worldToLocal(t).y)
                }
            }
            )),
            0 == r.length)
                s.position.y < n.restingY ? (s.position.y += n.recoverySpeed * e,
                n.currState = "recovering") : (s.position.y = n.restingY,
                n.currState = "resting");
            else {
                n.currState = "pressed";
                const e = Math.max(r);
                e > 0 && (s.position.y -= e),
                s.position.y <= n.restingY - n.fullPressDistance && (n.currState = "fully_pressed",
                s.position.y = n.restingY - n.fullPressDistance)
            }
        }
        ))
    }
}
FingerInputSystem.queries = {
    pressable: {
        components: [Pressable]
    }
};
class Rotating extends TagComponent {
}
class RotatingSystem extends System {
    execute(e) {
        this.queries.rotatingObjects.results.forEach((t => {
            const n = t.getComponent(Object3D).object;
            n.rotation.x += .4 * e,
            n.rotation.y += .4 * e
        }
        ))
    }
}
RotatingSystem.queries = {
    rotatingObjects: {
        components: [Rotating]
    }
};
class HandsInstructionText extends TagComponent {
}
class InstructionSystem extends System {
    init(e) {
        this.controllers = e.controllers
    }
    execute() {
        let e = !1;
        this.controllers.forEach((t => {
            t.visible && (e = !0)
        }
        )),
        this.queries.instructionTexts.results.forEach((t => {
            t.getComponent(Object3D).object.visible = e
        }
        ))
    }
}
InstructionSystem.queries = {
    instructionTexts: {
        components: [HandsInstructionText]
    }
};
class OffsetFromCamera extends Component {
}
OffsetFromCamera.schema = {
    x: {
        type: Types.Number,
        default: 0
    },
    y: {
        type: Types.Number,
        default: 0
    },
    z: {
        type: Types.Number,
        default: 0
    }
};
class NeedCalibration extends TagComponent {
}
class NeedCalibrationFrame extends TagComponent {
}
class CalibrationSystem extends System {
    init(e) {
        this.camera = e.camera,
        this.renderer = e.renderer
    }
    execute() {
        this.queries.needCalibration.results.forEach((e => {
            if (this.renderer.xr.getSession()) {
                const t = e.getComponent(OffsetFromCamera)
                  , n = e.getComponent(Object3D).object
                  , s = this.renderer.xr.getCamera();
                n.position.x = s.position.x + t.x,
                n.position.y = s.position.y + t.y,
                n.position.z = s.position.z + t.z;
                const r = new THREE.Euler(s.rotation.x,s.rotation.y,s.rotation.z,"XYZ")
                  , o = new THREE.Vector3(t.x,t.y,t.z);
                o.applyEuler(r),
                n.position.x = s.position.x + o.x,
                n.position.y = s.position.y + o.y,
                n.position.z = s.position.z + o.z,
                n.rotation.x = s.rotation.x,
                n.rotation.y = s.rotation.y,
                n.rotation.z = s.rotation.z,
                e.removeComponent(NeedCalibration)
            }
        }
        )),
        this.queries.needCalibrationFrame.results.forEach((e => {
            if (this.renderer.xr.getSession()) {
                const t = e.getComponent(OffsetFromCamera)
                  , n = e.getComponent(Object3D).object
                  , s = this.renderer.xr.getCamera()
                  , r = new THREE.Euler(s.rotation.x,s.rotation.y,s.rotation.z,"XYZ")
                  , o = new THREE.Vector3(t.x,t.y,t.z);
                o.applyEuler(r),
                n.position.x = s.position.x + o.x,
                n.position.y = s.position.y + o.y,
                n.position.z = s.position.z + o.z,
                n.rotation.x = s.rotation.x,
                n.rotation.y = s.rotation.y,
                n.rotation.z = s.rotation.z
            }
        }
        ))
    }
}
CalibrationSystem.queries = {
    needCalibration: {
        components: [NeedCalibration]
    },
    needCalibrationFrame: {
        components: [NeedCalibrationFrame]
    }
};
const THREE_CAMERA_FOV = 50
  , MINIMUM_DISTANCE_TO_NEW_FOCAL_POINT = .75;
class Viewer {
    constructor(e={}) {
        e.cameraUp || (e.cameraUp = [0, 1, 0]),
        this.cameraUp = (new THREE.Vector3).fromArray(e.cameraUp),
        e.initialCameraPosition || (e.initialCameraPosition = [0, 10, 15]),
        this.initialCameraPosition = (new THREE.Vector3).fromArray(e.initialCameraPosition),
        e.initialCameraLookAt || (e.initialCameraLookAt = [0, 0, 0]),
        this.initialCameraLookAt = (new THREE.Vector3).fromArray(e.initialCameraLookAt),
        this.dropInMode = e.dropInMode || !1,
        void 0 !== e.selfDrivenMode && null !== e.selfDrivenMode || (e.selfDrivenMode = !0),
        this.selfDrivenMode = e.selfDrivenMode && !this.dropInMode,
        this.selfDrivenUpdateFunc = this.selfDrivenUpdate.bind(this),
        void 0 === e.useBuiltInControls && (e.useBuiltInControls = !0),
        this.useBuiltInControls = e.useBuiltInControls,
        this.rootElement = e.rootElement,
        this.ignoreDevicePixelRatio = e.ignoreDevicePixelRatio || !1,
        this.devicePixelRatio = this.ignoreDevicePixelRatio ? 1 : window.devicePixelRatio,
        void 0 !== e.halfPrecisionCovariancesOnGPU && null !== e.halfPrecisionCovariancesOnGPU || (e.halfPrecisionCovariancesOnGPU = !0),
        this.halfPrecisionCovariancesOnGPU = e.halfPrecisionCovariancesOnGPU,
        this.scene = e.scene,
        this.renderer = e.renderer,
        this.camera = e.camera,
        this.gpuAcceleratedSort = e.gpuAcceleratedSort,
        !0 !== this.gpuAcceleratedSort && !1 !== this.gpuAcceleratedSort && (this.isMobile() ? this.gpuAcceleratedSort = !1 : this.gpuAcceleratedSort = !0),
        void 0 !== e.integerBasedSort && null !== e.integerBasedSort || (e.integerBasedSort = !0),
        this.integerBasedSort = e.integerBasedSort,
        void 0 !== e.sharedMemoryForWorkers && null !== e.sharedMemoryForWorkers || (e.sharedMemoryForWorkers = !0),
        this.sharedMemoryForWorkers = e.sharedMemoryForWorkers,
        this.controls = null,
        this.splatMesh = new SplatMesh(!1,this.devicePixelRatio,this.gpuAcceleratedSort,this.integerBasedSort),
        this.group = new THREE.Group,
        this.groupQ = new THREE.Group,
        this.transform = e.transform,
        this.transformVr = e.transformVr,
        this.transformAr = e.transformAr,
        this.backgroundColor = e.backgroundColor ?? 0,
        this.vrAutorotation = e.vrAutorotation ?? !0,
        this.xr = e.xr ?? "ar",
        this.scenes = e.scenes,
        this.listId = 0,
        this.showMeshCursor = !1,
        this.showControlPlane = !1,
        this.showInfo = !1,
        this.sceneHelper = null,
        this.sortWorker = null,
        this.sortRunning = !1,
        this.splatRenderCount = 0,
        this.sortWorkerIndexesToSort = null,
        this.sortWorkerSortedIndexes = null,
        this.sortWorkerPrecomputedDistances = null,
        this.selfDrivenModeRunning = !1,
        this.splatRenderingInitialized = !1,
        this.raycaster = new Raycaster,
        this.infoPanel = null,
        this.infoPanelCells = {},
        this.currentFPS = 0,
        this.lastSortTime = 0,
        this.previousCameraTarget = new THREE.Vector3,
        this.nextCameraTarget = new THREE.Vector3,
        this.mousePosition = new THREE.Vector2,
        this.mouseDownPosition = new THREE.Vector2,
        this.mouseDownTime = null,
        this.loadingSpinner = new LoadingSpinner(null,this.rootElement || document.body),
        this.loadingSpinner.hide(),
        this.usingExternalCamera = !(!this.dropInMode && !this.camera),
        this.usingExternalRenderer = !(!this.dropInMode && !this.renderer),
        this.initialized = !1,
        this.hitTestSource = null,
        this.hitTestSourceRequested = !1,
        this.timer = null,
        this.vrEnabled = "vr" === e.xr,
        this.xrActive = !1,
        this.selectedCamera = this.camera,
        this.dropInMode || this.init()
    }
    init() {
        if (this.initialized)
            return;
        this.rootElement || (this.usingExternalRenderer ? this.rootElement = this.renderer.domElement.parentElement || document.body : (this.rootElement = document.createElement("div"),
        this.rootElement.style.width = "100%",
        this.rootElement.style.height = "100%",
        this.rootElement.style.position = "absolute",
        document.body.appendChild(this.rootElement)));
        const e = new THREE.Vector2;
        if (this.getRenderDimensions(e),
        this.usingExternalCamera || (this.camera = new THREE.PerspectiveCamera(THREE_CAMERA_FOV,e.x / e.y,.1,2e3),
        this.camera.position.copy(this.initialCameraPosition),
        this.camera.lookAt(this.initialCameraLookAt),
        this.camera.up.copy(this.cameraUp).normalize()),
        !this.usingExternalRenderer) {
            this.renderer = new THREE.WebGLRenderer({
                antialias: !0,
                precision: "highp",
                alpha: !0
            }),
            this.renderer.setPixelRatio(this.devicePixelRatio),
            this.renderer.autoClear = !0,
            this.renderer.setClearColor(new THREE.Color(this.backgroundColor ?? 0), 0),
            this.renderer.setSize(e.x, e.y),
            this.renderer.shadowMap.enabled = !0,
            this.renderer.xr.enabled = !0;
            new ResizeObserver(( () => {
                this.getRenderDimensions(e),
                this.renderer.setSize(e.x, e.y)
            }
            )).observe(this.rootElement),
            this.rootElement.appendChild(this.renderer.domElement)
        }
        this.scene = this.scene || new THREE.Scene,
        this.scene.background = new THREE.Color(this.backgroundColor ?? 0),
        this.sceneHelper = new SceneHelper(this.scene),
        this.sceneHelper.setupMeshCursor(),
        this.sceneHelper.setupFocusMarker(),
        this.sceneHelper.setupControlPlane(),
        this.useBuiltInControls && (this.controls = new OrbitControls(this.camera,this.renderer.domElement),
        this.controls.listenToKeyEvents(window),
        this.controls.rotateSpeed = .5,
        this.controls.maxPolarAngle = .75 * Math.PI,
        this.controls.minPolarAngle = .1,
        this.controls.enableDamping = !0,
        this.controls.dampingFactor = .05,
        this.controls.target.copy(this.initialCameraLookAt),
        this.rootElement.addEventListener("pointermove", this.onMouseMove.bind(this), !1),
        this.rootElement.addEventListener("pointerdown", this.onMouseDown.bind(this), !1),
        this.rootElement.addEventListener("pointerup", this.onMouseUp.bind(this), !1),
        window.addEventListener("keydown", this.onKeyDown.bind(this), !1)),
        this.renderer.xr.enabled = !0,
        this.renderer.xr.addEventListener("sessionstart", (e => {
            this.startXr()
        }
        )),
        this.renderer.xr.addEventListener("sessionend", (e => {
            this.endXr()
        }
        )),
        this.vrEnabled ? document.body.appendChild(VRButton.createButton(this.renderer)) : document.body.appendChild(ARButton.createButton(this.renderer, {
            requiredFeatures: ["hit-test"]
        })),
        this.geometry = new THREE.CylinderGeometry(.1,.1,.2,32).translate(0, .1, 0),
        this.controller = this.renderer.xr.getController(0),
        this.controller.addEventListener("select", ( () => {
            this.reticle.visible && !this.splatMesh.visible && (this.reticle.matrix.decompose(this.group.position, this.splatMesh.quaternion, this.splatMesh.scale),
            this.applyTransformAr(this.transformAr),
            this.splatMesh.visible = !0,
            this.reticle.visible = !1)
        }
        )),
        this.scene.add(this.controller),
        this.reticle = new THREE.Mesh(new THREE.RingGeometry(.15,.2,32).rotateX(-Math.PI / 2),new THREE.MeshBasicMaterial),
        this.reticle.matrixAutoUpdate = !1,
        this.reticle.visible = !1,
        this.scene.add(this.reticle),
        this.resetVrTransform(),
        this.applyTransform(this.transform, !0),
        this.splatMesh.visible = !0,
        this.group.add(this.splatMesh),
        this.scene.add(this.group),
        this.selectedCamera = this.camera,
        this.setupInfoPanel(),
        this.loadingSpinner.setContainer(this.rootElement),
        this.angle = 0,
        this.loading = !1,
        this.vrRunning = !1,
        this.scene.add(this.groupQ),
        this.groupQ.visible = !1,
        this.splatMesh.visible = !0,
        this.initQ(),
        this.initialized = !0
    }
    initQ() {
        this.groupQ.add(new THREE.HemisphereLight(13421772,10066329,3)),
        this.world = new World,
        this.clock = new THREE.Clock,
        this.controller1 = this.renderer.xr.getController(0),
        this.groupQ.add(this.controller1),
        this.controller2 = this.renderer.xr.getController(1),
        this.groupQ.add(this.controller2),
        this.controllerModelFactory = new XRControllerModelFactory,
        this.controllerGrip1 = this.renderer.xr.getControllerGrip(0),
        this.controllerGrip1.add(this.controllerModelFactory.createControllerModel(this.controllerGrip1)),
        this.groupQ.add(this.controllerGrip1),
        this.hand1 = this.renderer.xr.getHand(0),
        this.handModel1 = new OculusHandModel(this.hand1),
        this.hand1.add(this.handModel1),
        this.groupQ.add(this.hand1),
        this.controllerGrip2 = this.renderer.xr.getControllerGrip(1),
        this.controllerGrip2.add(this.controllerModelFactory.createControllerModel(this.controllerGrip2)),
        this.groupQ.add(this.controllerGrip2),
        this.hand2 = this.renderer.xr.getHand(1),
        this.handModel2 = new OculusHandModel(this.hand2),
        this.hand2.add(this.handModel2),
        this.groupQ.add(this.hand2),
        this.buttonTimer = null;
        const e = new THREE.BoxGeometry(1,.02,.32)
          , t = (new THREE.TextureLoader).load("webxr/gs/assets/i4.jpg");
        t.wrapS = t.wrapT = THREE.RepeatWrapping,
        t.offset.set(0, 0),
        t.repeat.set(1, 1);
        const n = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: t,
            transparent: !0
        });
        this.consoleMesh = new THREE.Mesh(e,n),
        this.consoleMesh.position.set(0, .6, -.3),
        this.consoleMeshVisible = !0;
        const s = new THREE.EdgesGeometry(e)
          , r = new THREE.LineSegments(s,new THREE.LineBasicMaterial({
            color: 0,
            linewidth: 1,
            transparent: !0
        }));
        this.consoleMesh.add(r),
        this.groupQ.add(this.consoleMesh),
        this.instructionText = createText("Please explore with hands.", .04),
        this.instructionText.position.set(0, 1.6, -.6),
        this.groupQ.add(this.instructionText),
        this.helpText = createText("Visualito https://webxr.cz", .04),
        this.helpText.position.set(0, 1.4, -.6),
        this.helpText.visible = !1,
        this.groupQ.add(this.helpText),
        this.exitText = createText("Exiting session...", .04),
        this.exitText.position.set(0, 1.5, -.6),
        this.exitText.visible = !1,
        this.groupQ.add(this.exitText),
        this.world.registerComponent(Object3D).registerComponent(Button).registerComponent(Pressable).registerComponent(Rotating).registerComponent(HandsInstructionText).registerComponent(OffsetFromCamera).registerComponent(NeedCalibration).registerComponent(NeedCalibrationFrame),
        this.world.registerSystem(RotatingSystem).registerSystem(InstructionSystem, {
            controllers: [this.controllerGrip1, this.controllerGrip2]
        }).registerSystem(CalibrationSystem, {
            renderer: this.renderer,
            camera: this.selectedCamera
        }).registerSystem(ButtonSystem, {
            renderer: this.renderer,
            camera: this.selectedCamera
        }).registerSystem(FingerInputSystem, {
            hands: [this.handModel1, this.handModel2]
        }),
        this.csEntity = this.world.createEntity(),
        this.csEntity.addComponent(OffsetFromCamera, {
            x: 0,
            y: -.3,
            z: -.5
        }),
        this.csEntity.addComponent(NeedCalibration),
        this.csEntity.addComponent(Object3D, {
            object: this.consoleMesh
        });
        const o = new THREE.Vector3(.48,.27,.001)
          , i = new THREE.BoxGeometry(o.x,o.y,o.z)
          , a = new THREE.EdgesGeometry(i);
        this.frameLine = new THREE.LineSegments(a,new THREE.LineBasicMaterial({
            color: 16777215,
            linewidth: 1,
            transparent: !0
        })),
        this.frameLine.visible = !1,
        this.groupQ.add(this.frameLine),
        this.frmEntity = this.world.createEntity(),
        this.frmEntity.addComponent(OffsetFromCamera, {
            x: 0,
            y: 0,
            z: -.25
        }),
        this.frmEntity.addComponent(NeedCalibrationFrame),
        this.frmEntity.addComponent(Object3D, {
            object: this.frameLine
        }),
        this.buttonTexture = (new THREE.TextureLoader).load("webxr/gs/assets/i3.jpg"),
        this.createVrButton({
            position: {
                x: -.45,
                y: .02,
                z: .1
            },
            text: {
                text: "<=",
                rotation: Math.PI / 2
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.y += .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.45,
                y: .02,
                z: 0
            },
            text: {
                text: "=>",
                rotation: Math.PI / 2
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.y -= .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.35,
                y: .02,
                z: .05
            },
            text: {
                text: "<",
                rotation: 0
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.x += .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.15,
                y: .02,
                z: .05
            },
            text: {
                text: ">",
                rotation: 0
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.x -= .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.25,
                y: .02,
                z: .1
            },
            text: {
                text: "<",
                rotation: Math.PI / 2
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.z -= .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.25,
                y: .02,
                z: 0
            },
            text: {
                text: ">",
                rotation: Math.PI / 2
            },
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.position.z += .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.05,
                y: .02,
                z: -0
            },
            text: "<+>",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.rotate.z += .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.05,
                y: .02,
                z: .1
            },
            text: "<->",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.rotate.z -= .05,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.35,
                y: .02,
                z: -.1
            },
            text: "[+]",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.scale.x *= 1.25,
            this.delta.scale.y *= 1.25,
            this.delta.scale.z *= 1.25,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: -.15,
                y: .02,
                z: -.1
            },
            text: "[-]",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && (this.delta.scale.x /= 1.25,
            this.delta.scale.y /= 1.25,
            this.delta.scale.z /= 1.25,
            this.vrTransform())
        }
        )),
        this.createVrButton({
            position: {
                x: .05,
                y: .02,
                z: 0
            },
            image: "webxr/gs/assets/logo.png",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.callWithWait(( () => {
                this.frameLine.visible = !this.frameLine.visible
            }
            ))
        }
        )),
        this.createVrButton({
            position: {
                x: .05,
                y: .02,
                z: .1
            },
            text: "hide",
            color: 0,
            name: "hide"
        }, ( () => {
            this.consoleMeshVisible && this.callWithWait(( () => {
                this.hidePanel()
            }
            ))
        }
        )),
        this.createVrButton({
            position: {
                x: .15,
                y: .02,
                z: .1
            },
            text: "show",
            color: 0,
            name: "show"
        }, ( () => {
            this.consoleMeshVisible || this.callWithWait(( () => {
                this.showPanel()
            }
            ))
        }
        )),
        this.createVrButton({
            position: {
                x: .05,
                y: .02,
                z: -.1
            },
            text: "reset",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.callWithWait(( () => {
                this.resetVrTransform(),
                this.vrTransform()
            }
            ))
        }
        )),
        this.callWithWait(( () => {
            this.showPanel()
        }
        )),
        this.createVrButton({
            position: {
                x: .25,
                y: .02,
                z: -.1
            },
            image: "webxr/gs/assets/lev.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("lion")
        }
        )),
        this.createVrButton({
            position: {
                x: .35,
                y: .02,
                z: .1
            },
            image: "webxr/gs/assets/leg.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("legionaries")
        }
        )),
        this.createVrButton({
            position: {
                x: .45,
                y: .02,
                z: .1
            },
            text: "exit",
            color: 16711680
        }, ( () => {
            this.consoleMeshVisible && (this.exitText.visible = !0,
            setTimeout(( () => {
                this.exitText.visible = !1,
                this.renderer.xr.getSession().end()
            }
            ), 2e3))
        }
        )),
        this.createVrButton({
            position: {
                x: .25,
                y: .02,
                z: -0
            },
            image: "webxr/gs/assets/sousosi.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("grandmother")
        }
        )),
        this.createVrButton({
            position: {
                x: .35,
                y: .02,
                z: -0
            },
            image: "webxr/gs/assets/snowcat.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("snowcat")
        }
        )),
        this.createVrButton({
            position: {
                x: .45,
                y: .02,
                z: -0
            },
            image: "webxr/gs/assets/mutt.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("mutt")
        }
        )),
        this.createVrButton({
            position: {
                x: .35,
                y: .02,
                z: -.1
            },
            image: "webxr/gs/assets/drak.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("dragon")
        }
        )),
        this.createVrButton({
            position: {
                x: .45,
                y: .02,
                z: -.1
            },
            image: "webxr/gs/assets/popelka.jpg",
            color: 0
        }, ( () => {
            this.consoleMeshVisible && this.loadEvent("cinderella")
        }
        )),
        this.itEntity = this.world.createEntity(),
        this.itEntity.addComponent(HandsInstructionText),
        this.itEntity.addComponent(Object3D, {
            object: this.instructionText
        }),
        this.fps = 0,
        this.fpsStartTime = this.clock.elapsedTime
    }
    showPanel() {
        this.consoleMeshVisible = !0,
        this.setVrPanelOpacity(.8);
        const e = this.getObjectByName("hide")
          , t = this.getObjectByName("show");
        e && t && (e.visible = !0,
        t.visible = !1)
    }
    hidePanel() {
        this.consoleMeshVisible = !1,
        this.setVrPanelOpacity(.05);
        const e = this.getObjectByName("hide")
          , t = this.getObjectByName("show");
        e && t && (e.visible = !1,
        t.visible = !0)
    }
    callWithWait(e, t=300) {
        if (this.buttonTimer)
            try {
                clearTimeout(this.buttonTimer)
            } catch (e) {}
        this.buttonTimer = setTimeout(e, t)
    }
    setOpacity(e, t) {
        e.children.forEach((e => {
            this.setOpacity(e, t)
        }
        )),
        e.material && (e.material.opacity = t)
    }
    setVrPanelOpacity(e) {
        this.setOpacity(this.consoleMesh, e)
    }
    getObjectByName(e) {
        return this.consoleMesh.getObjectByName(e)
    }
    createVrButton(e, t) {
        const n = this.makeButtonMesh(.08, .0175, .08, e.color);
        if (e.name && (n.name = e.name),
        e.text) {
            const t = createText(e.text.text ?? e.text, .03, "#000000");
            n.add(t),
            t.rotation.x = -Math.PI / 2,
            t.rotation.z = e.text.rotation ?? 0,
            t.position.set(0, .0101, 0)
        }
        if (e.image) {
            const t = new THREE.Mesh(new THREE.PlaneGeometry(.08,.08),new THREE.MeshStandardMaterial({
                map: (new THREE.TextureLoader).load(e.image),
                transparent: !0
            }));
            n.add(t),
            t.rotation.x = -Math.PI / 2,
            t.position.set(0, .0101, 0)
        }
        if (n.position.set(e.position.x, e.position.y, e.position.z),
        n.material.transparent = !0,
        !e.hideWireframe) {
            const e = new THREE.EdgesGeometry(n.geometry)
              , t = new THREE.LineSegments(e,new THREE.LineBasicMaterial({
                color: 0,
                linewidth: 1,
                transparent: !0
            }));
            n.add(t)
        }
        this.consoleMesh.add(n),
        this.worldEvent(n, t)
    }
    worldEvent(e, t) {
        const n = this.world.createEntity();
        n.addComponent(Pressable),
        n.addComponent(Object3D, {
            object: e
        }),
        n.addComponent(Button, {
            action: t,
            surfaceY: .05,
            recoverySpeed: .2,
            fullPressDistance: .03
        })
    }
    loadEvent(e) {
        this.callWithWait(( () => {
            this.loadScene(e)
        }
        ))
    }
    onKeyDown = function() {
        const e = new THREE.Vector3
          , t = new THREE.Matrix4
          , n = new THREE.Matrix4;
        return function(s) {
            switch (e.set(0, 0, -1),
            e.transformDirection(this.camera.matrixWorld),
            t.makeRotationAxis(e, Math.PI / 128),
            n.makeRotationAxis(e, -Math.PI / 128),
            s.code) {
            case "ArrowLeft":
                this.camera.up.transformDirection(t);
                break;
            case "ArrowRight":
                this.camera.up.transformDirection(n);
                break;
            case "KeyC":
                this.showMeshCursor = !this.showMeshCursor;
                break;
            case "KeyP":
                this.showControlPlane = !this.showControlPlane;
                break;
            case "KeyI":
                this.showInfo = !this.showInfo,
                this.showInfo ? this.infoPanel.style.display = "block" : this.infoPanel.style.display = "none"
            }
        }
    }();
    makeButtonMesh = function(e, t, n, s) {
        const r = new THREE.BoxGeometry(e,t,n)
          , o = new THREE.MeshBasicMaterial({
            map: this.buttonTexture
        });
        return new THREE.Mesh(r,o)
    }
    ;
    onMouseMove(e) {
        this.mousePosition.set(e.offsetX, e.offsetY)
    }
    onMouseDown() {
        this.mouseDownPosition.copy(this.mousePosition),
        this.mouseDownTime = getCurrentTime()
    }
    onMouseUp = function() {
        const e = new THREE.Vector2;
        return function(t) {
            e.copy(this.mousePosition).sub(this.mouseDownPosition);
            getCurrentTime() - this.mouseDownTime < .5 && e.length() < 2 && this.onMouseClick(t)
        }
    }();
    onMouseClick(e) {
        this.mousePosition.set(e.offsetX, e.offsetY),
        this.checkForFocalPointChange()
    }
    checkForFocalPointChange = function() {
        const e = new THREE.Vector2
          , t = new THREE.Vector3
          , n = [];
        return function() {
            if (!this.transitioningCameraTarget && (this.getRenderDimensions(e),
            n.length = 0,
            this.raycaster.setFromCameraAndScreenPosition(this.selectedCamera, this.mousePosition, e),
            this.raycaster.intersectSplatMesh(this.splatMesh, n),
            n.length > 0)) {
                const e = n[0].origin;
                if (t.copy(e).sub(this.selectedCamera.position),
                t.length() > MINIMUM_DISTANCE_TO_NEW_FOCAL_POINT) {
                    this.previousCameraTarget.copy(this.controls.target),
                    this.nextCameraTarget.copy(e),
                    this.transitioningCameraTarget = !0,
                    this.transitioningCameraTargetStartTime = getCurrentTime();
                    new URLSearchParams(location.search).has("debug") && console.log(this.nextCameraTarget)
                }
            }
        }
    }();
    getRenderDimensions(e) {
        this.rootElement ? (e.x = this.rootElement.offsetWidth,
        e.y = this.rootElement.offsetHeight) : this.renderer.getSize(e)
    }
    setupInfoPanel() {
        this.infoPanel = document.createElement("div"),
        this.infoPanel.style.position = "absolute",
        this.infoPanel.style.padding = "10px",
        this.infoPanel.style.backgroundColor = "#cccccc",
        this.infoPanel.style.border = "#aaaaaa 1px solid",
        this.infoPanel.style.zIndex = 100,
        this.infoPanel.style.width = "375px",
        this.infoPanel.style.fontFamily = "arial",
        this.infoPanel.style.fontSize = "10pt",
        this.infoPanel.style.textAlign = "left";
        const e = [["Camera position", "cameraPosition"], ["Camera look-at", "cameraLookAt"], ["Camera up", "cameraUp"], ["Cursor position", "cursorPosition"], ["FPS", "fps"], ["Render window", "renderWindow"], ["Rendering:", "renderSplatCount"], ["Sort time", "sortTime"]]
          , t = document.createElement("div");
        t.style.display = "table";
        for (let n of e) {
            const e = document.createElement("div");
            e.style.display = "table-row";
            const s = document.createElement("div");
            s.style.display = "table-cell",
            s.style.width = "110px",
            s.innerHTML = `${n[0]}: `;
            const r = document.createElement("div");
            r.style.display = "table-cell",
            r.style.width = "10px",
            r.innerHTML = " ";
            const o = document.createElement("div");
            o.style.display = "table-cell",
            o.innerHTML = "",
            this.infoPanelCells[n[1]] = o,
            e.appendChild(s),
            e.appendChild(r),
            e.appendChild(o),
            t.appendChild(e)
        }
        this.infoPanel.appendChild(t),
        this.infoPanel.style.display = "none",
        this.renderer.domElement.parentElement.prepend(this.infoPanel)
    }
    updateSplatMeshUniforms = function() {
        const e = new THREE.Vector2;
        return function() {
            if (!this.splatMesh)
                return;
            this.splatMesh.getSplatCount() > 0 && (this.getRenderDimensions(e),
            this.cameraFocalLengthX = this.selectedCamera.projectionMatrix.elements[0] * this.devicePixelRatio * e.x * .45,
            this.cameraFocalLengthY = this.selectedCamera.projectionMatrix.elements[5] * this.devicePixelRatio * e.y * .45,
            this.splatMesh.updateUniforms(e, this.cameraFocalLengthX, this.cameraFocalLengthY))
        }
    }();
    loadFile(e, t={}) {
        !1 !== t.showLoadingSpinner && (t.showLoadingSpinner = !0),
        t.showLoadingSpinner && this.loadingSpinner.show();
        const n = this.loadFileToSplatBuffer(e, t.splatAlphaRemovalThreshold, ( (e, n) => {
            if (t.showLoadingSpinner)
                if (100 == e)
                    this.loadingSpinner.setMessage("");
                else {
                    if (this.xrActive) {
                        const t = (100 - e) / 100;
                        t < this.splatMesh.scale.x && (this.splatMesh.scale.x = this.splatMesh.scale.y = this.splatMesh.scale.z = t)
                    }
                    this.loadingSpinner.setMessage(n)
                }
            t.onProgress && t.onProgress(e, n, "")
        }
        ));
        return new AbortablePromise(( (s, r) => {
            n.then((e => {
                t.showLoadingSpinner && this.loadingSpinner.hide(),
                t.onProgress && t.onProgress(0, "0%", "");
                const n = {
                    rotation: t.rotation || t.orientation,
                    position: t.position,
                    scale: t.scale,
                    splatAlphaRemovalThreshold: t.splatAlphaRemovalThreshold
                };
                this.addSplatBuffers([e], [n], t.showLoadingSpinner).then(( () => {
                    t.onProgress && t.onProgress(100, "100%", ""),
                    s()
                }
                ))
            }
            )).catch(( () => {
                t.showLoadingSpinner && this.loadingSpinner.hide(),
                r(new Error(`Viewer::loadFile -> Could not load file ${e}`))
            }
            ))
        }
        ),n.abortHandler)
    }
    loadFiles(e, t=!0, n=void 0) {
        const s = e.length
          , r = [];
        t && this.loadingSpinner.show();
        const o = (e, o, i) => {
            r[e] = o;
            let a = 0;
            for (let e = 0; e < s; e++)
                a += r[e] || 0;
            a /= s,
            i = `${a.toFixed(0)} %`,
            t && (100 == a ? this.loadingSpinner.setMessage("") : this.loadingSpinner.setMessage(i)),
            n && n(a, i, "")
        }
          , i = []
          , a = [];
        for (let t = 0; t < e.length; t++) {
            const n = this.loadFileToSplatBuffer(e[t].path, e[t].splatAlphaRemovalThreshold, o.bind(this, t));
            a.push(n.abortHandler),
            i.push(n.promise)
        }
        return new AbortablePromise(( (s, r) => {
            Promise.all(i).then((r => {
                t && this.loadingSpinner.hide(),
                n && options.onProgress(0, "0%", ""),
                this.addSplatBuffers(r, e, t).then(( () => {
                    n && n(100, "100%", ""),
                    s()
                }
                ))
            }
            )).catch(( () => {
                t && this.loadingSpinner.hide(),
                r(new Error("Viewer::loadFiles -> Could not load one or more files."))
            }
            ))
        }
        ),( () => {
            for (let e of a)
                e()
        }
        ))
    }
    loadFileToSplatBuffer(e, t=1, n=void 0) {
        const s = (e, t) => {
            n && n(e, t, "")
        }
        ;
        return SplatLoader.isFileSplatFormat(e) ? (new SplatLoader).loadFromURL(e, s, 0, t) : e.endsWith(".ply") ? (new PlyLoader).loadFromURL(e, s, 0, t) : AbortablePromise.reject(new Error(`Viewer::loadFileToSplatBuffer -> File format not supported: ${e}`))
    }
    addSplatBuffers = function() {
        let e, t = 0;
        return function(n, s=[], r=!0) {
            this.splatRenderingInitialized = !1,
            t++;
            const o = () => new Promise((e => {
                r && (this.loadingSpinner.show(),
                this.loadingSpinner.setMessage("")),
                window.setTimeout(( () => {
                    this.sortWorker && this.sortWorker.terminate(),
                    this.sortWorker = null,
                    this.sortRunning = !1,
                    this.addSplatBuffersToMesh(n, s),
                    this.setupSortWorker(this.splatMesh).then(( () => {
                        t--,
                        0 === t && (r && this.loadingSpinner.hide(),
                        this.splatRenderingInitialized = !0),
                        e()
                    }
                    ))
                }
                ), 1)
            }
            ));
            return e = e ? e.then(( () => o())) : o(),
            e
        }
    }();
    addSplatBuffersToMesh(e, t) {
        this.splatMesh.splatBuffers.length > 0 && (this.splatMesh.splatBuffers.length = 0),
        this.splatMesh.splatBufferOptions.length > 0 && (this.splatMesh.splatBufferOptions.length = 0);
        const n = this.splatMesh.splatBuffers || []
          , s = this.splatMesh.splatBufferOptions || [];
        n.push(...e),
        s.push(...t),
        this.splatMesh.build(n, s, !0),
        this.renderer && this.splatMesh.setRenderer(this.renderer),
        this.splatMesh.frustumCulled = !1,
        setTimeout(( () => {
            this.splatMesh.scale.x = this.splatMesh.scale.y = this.splatMesh.scale.z = 1
        }
        ), 500)
    }
    setupSortWorker(e) {
        return new Promise((t => {
            const n = this.integerBasedSort ? Int32Array : Float32Array
              , s = e.getSplatCount()
              , r = createSortWorker(s, this.sharedMemoryForWorkers, this.integerBasedSort);
            r.onmessage = e => {
                if (e.data.sortDone) {
                    if (this.sortRunning = !1,
                    this.sharedMemoryForWorkers)
                        this.splatMesh.updateRenderIndexes(this.sortWorkerSortedIndexes, e.data.splatRenderCount);
                    else {
                        const t = new Uint32Array(e.data.sortedIndexes,0,e.data.splatRenderCount);
                        this.splatMesh.updateRenderIndexes(t, e.data.splatRenderCount)
                    }
                    this.lastSortTime = e.data.sortTime
                } else if (e.data.sortCanceled)
                    this.sortRunning = !1;
                else if (e.data.sortSetupPhase1Complete) {
                    console.log("Sorting web worker WASM setup complete.");
                    const t = this.integerBasedSort ? this.splatMesh.getIntegerCenters(!0) : this.splatMesh.getFloatCenters(!0);
                    r.postMessage({
                        centers: t.buffer
                    }),
                    this.sharedMemoryForWorkers ? (this.sortWorkerSortedIndexes = new Uint32Array(e.data.sortedIndexesBuffer,e.data.sortedIndexesOffset,s),
                    this.sortWorkerIndexesToSort = new Uint32Array(e.data.indexesToSortBuffer,e.data.indexesToSortOffset,s),
                    this.sortWorkerPrecomputedDistances = new n(e.data.precomputedDistancesBuffer,e.data.precomputedDistancesOffset,s)) : (this.sortWorkerIndexesToSort = new Uint32Array(s),
                    this.sortWorkerPrecomputedDistances = new n(s));
                    for (let e = 0; e < s; e++)
                        this.sortWorkerIndexesToSort[e] = e
                } else if (e.data.sortSetupComplete) {
                    console.log("Sorting web worker ready.");
                    const e = this.splatMesh.getSplatDataTextures()
                      , n = e.covariances.size
                      , s = e.centerColors.size;
                    console.log("Covariances texture size: " + n.x + " x " + n.y),
                    console.log("Centers/colors texture size: " + s.x + " x " + s.y),
                    this.sortWorker = r,
                    t()
                }
            }
        }
        ))
    }
    composeMatrix(e) {
        const t = new THREE.Matrix4;
        return t.compose(new THREE.Vector3(e.position.x,e.position.y,e.position.z), (new THREE.Quaternion).setFromEuler(e.rotation.x / 180 * Math.PI, e.rotation.y / 180 * Math.PI, e.rotation.z / 180 * Math.PI), new THREE.Vector3(e.scale.x,e.scale.y,e.scale.z)),
        t
    }
    applyTransformAr(e) {
        this.splatMesh.rotation.x = 0,
        this.splatMesh.rotation.y = 0,
        this.splatMesh.rotation.z = 0,
        this.group.rotateX(e.rotate.x / 180 * Math.PI),
        this.group.rotateY(e.rotate.y / 180 * Math.PI),
        this.group.rotateZ(e.rotate.z / 180 * Math.PI),
        this.group.scale.x = e.scale.x,
        this.group.scale.y = e.scale.y,
        this.group.scale.z = e.scale.z,
        this.group.position.x += e.position.x,
        this.group.position.y += e.position.y,
        this.group.position.z += e.position.z
    }
    resetVrTransform() {
        this.delta = {
            scale: {
                x: 1,
                y: 1,
                z: 1
            },
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            rotate: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    }
    vrTransform() {
        this.applyTransform(this.transformVr, !1)
    }
    applyTransform(e, t=!1, n=!1) {
        if (this.angle = 0,
        this.splatMesh.rotation.x = 0 + this.delta.rotate.x,
        this.splatMesh.rotation.y = 0 + this.delta.rotate.y,
        this.splatMesh.rotation.z = 0 + this.delta.rotate.z,
        this.group.rotation.x = e.rotate.x / 180 * Math.PI,
        this.group.rotation.y = e.rotate.y / 180 * Math.PI,
        this.group.rotation.z = e.rotate.z / 180 * Math.PI,
        this.group.scale.x = e.scale.x * this.delta.scale.x,
        this.group.scale.y = e.scale.y * this.delta.scale.y,
        this.group.scale.z = e.scale.z * this.delta.scale.z,
        this.group.position.x = e.position.x + this.delta.position.x,
        this.group.position.y = e.position.y + this.delta.position.y,
        this.group.position.z = e.position.z + this.delta.position.z,
        t && e.cameraLookAt) {
            const t = (new THREE.Vector3).fromArray(e.cameraLookAt);
            this.camera.lookAt(t),
            this.controls.target.copy(t)
        }
        n && (this.group.position.x += 1e3,
        this.group.position.y += 1e3,
        this.group.position.z += 1e3)
    }
    loadScene(e) {
        const t = this.scenes.find((t => t.id === e));
        t && this.currScene !== e && (this.resetVrTransform(),
        this.currScene = e,
        this.transformAr = t.transformAr,
        this.transformVr = t.transformVr,
        this.transform = t.transform,
        this.loadFile(t.url).then(( () => {
            this.applyTransform(this.transformVr, !1),
            topFunction(),
            this.loading = !1,
            this.splatMesh.visible = !0,
            this.splatMesh.material.opacity = 1
        }
        )))
    }
    checkNextScene() {
        const e = new URLSearchParams(location.search);
        if (e.has("list") && this.angle > 2 * Math.PI) {
            const t = e.get("list").split(",")
              , n = t[this.listId];
            n && (this.listId++,
            this.listId >= t.length && (this.listId = 0),
            this.loading = !0,
            this.loadScene(n))
        }
    }
    rotateMesh() {
        this.xrActive && this.selfDrivenModeRunning && (this.loading || (this.checkNextScene(),
        this.splatMesh.rotateZ(.04),
        this.angle += .04))
    }
    startXr() {
        this.xrActive = !0,
        this.vrEnabled ? (this.applyTransform(this.transformVr, !1),
        this.splatMesh.visible = !0,
        this.groupQ.visible = this.isQuest(),
        !this.groupQ.visible && this.vrAutorotation && (this.timer = setInterval(( () => this.rotateMesh()), 100)),
        this.vrRunning = !0) : this.splatMesh.visible = !1,
        this.angle = 0
    }
    endXr() {
        this.xrActive = !1,
        this.vrRunning = !1,
        this.groupQ.visible = !1,
        this.timer && clearInterval(this.timer),
        this.angle = 0,
        this.applyTransform(this.transform, !0),
        this.splatMesh.visible = !0
    }
    start() {
        if (!this.selfDrivenMode)
            throw new Error("Cannot start viewer unless it is in self driven mode.");
        this.renderer.setAnimationLoop(this.selfDrivenUpdateFunc),
        this.selfDrivenModeRunning = !0
    }
    stop() {
        this.selfDrivenMode && this.selfDrivenModeRunning && (this.selfDrivenModeRunning = !1)
    }
    selfDrivenUpdate(e, t) {
        if (this.selfDrivenMode,
        this.selfDrivenMode) {
            if (t && !this.vrRunning) {
                const e = this.renderer.xr.getReferenceSpace()
                  , n = this.renderer.xr.getSession();
                if (!1 === this.hitTestSourceRequested && (n.requestReferenceSpace("viewer").then((e => {
                    this.vrEnabled || n.requestHitTestSource({
                        space: e
                    }).then((e => {
                        this.hitTestSource = e
                    }
                    ))
                }
                )),
                n.addEventListener("end", ( () => {
                    this.hitTestSourceRequested = !1,
                    this.hitTestSource = null
                }
                )),
                this.hitTestSourceRequested = !0),
                this.hitTestSource) {
                    const n = t.getHitTestResults(this.hitTestSource);
                    if (n.length) {
                        const t = n[0];
                        this.splatMesh.visible || (this.reticle.visible = !0,
                        this.reticle.matrix.fromArray(t.getPose(e).transform.matrix))
                    } else
                        this.reticle.visible = !1
                }
            }
            this.update(),
            this.render()
        }
    }
    render = function() {
        if (!this.initialized || !this.splatRenderingInitialized)
            return;
        const e = this.clock.getDelta()
          , t = this.clock.elapsedTime;
        this.world.execute(e, t);
        const n = this.renderer.autoClear;
        this.renderer.autoClear = !1,
        (e => {
            for (let t of e.children)
                if (t.visible)
                    return !0;
            return !1
        }
        )(this.scene) && this.renderer.render(this.scene, this.selectedCamera),
        this.sceneHelper.getFocusMarkerOpacity() > 0 && this.renderer.render(this.sceneHelper.focusMarker, this.selectedCamera),
        this.showControlPlane && this.renderer.render(this.sceneHelper.controlPlane, this.selectedCamera),
        this.renderer.autoClear = n
    }
    ;
    update(e, t) {
        this.dropInMode && this.updateForDropInMode(e, this.selectedCamera),
        this.initialized && this.splatRenderingInitialized && (this.controls && this.controls.update(),
        this.vrRunning ? this.updateSplatSort(!0, !0) : this.updateSplatSort(),
        this.updateForRendererSizeChanges(),
        this.updateSplatMeshUniforms(),
        this.updateMeshCursor(),
        this.updateFPS(),
        this.timingSensitiveUpdates(),
        this.updateInfoPanel(),
        this.updateControlPlane())
    }
    updateForDropInMode(e, t) {
        this.renderer = this.renderer,
        this.splatMesh && this.splatMesh.setRenderer(this.renderer),
        this.controls && (this.controls.object = t),
        this.init()
    }
    updateFPS = function() {
        let e = getCurrentTime()
          , t = 0;
        return function() {
            const n = getCurrentTime();
            n - e >= 1 ? (this.currentFPS = t,
            t = 0,
            e = n) : t++
        }
    }();
    updateForRendererSizeChanges = function() {
        const e = new THREE.Vector2
          , t = new THREE.Vector2;
        return function() {
            this.renderer.getSize(t),
            t.x === e.x && t.y === e.y || (this.usingExternalCamera || (this.selectedCamera.aspect = t.x / t.y,
            this.selectedCamera.updateProjectionMatrix()),
            e.copy(t))
        }
    }();
    timingSensitiveUpdates = function() {
        let e;
        return function() {
            const t = getCurrentTime();
            e || (e = t);
            const n = t - e;
            this.updateCameraTransition(t),
            this.updateFocusMarker(n),
            e = t
        }
    }();
    updateCameraTransition = function() {
        let e = new THREE.Vector3
          , t = new THREE.Vector3
          , n = new THREE.Vector3;
        return function(s) {
            if (this.transitioningCameraTarget) {
                t.copy(this.previousCameraTarget).sub(this.selectedCamera.position).normalize(),
                n.copy(this.nextCameraTarget).sub(this.selectedCamera.position).normalize();
                const r = Math.acos(t.dot(n))
                  , o = (r / (Math.PI / 3) * .65 + .3) / r * (s - this.transitioningCameraTargetStartTime);
                if (e.copy(this.previousCameraTarget).lerp(this.nextCameraTarget, o),
                this.selectedCamera.lookAt(e),
                this.controls.target.copy(e),
                o >= 1) {
                    this.transitioningCameraTarget = !1;
                    new URLSearchParams(location.search).has("debug") && console.log(e, this.selectedCamera.position, this.selectedCamera.rotation)
                }
            }
        }
    }();
    updateFocusMarker = function() {
        const e = new THREE.Vector2;
        let t = !1;
        return function(n) {
            this.getRenderDimensions(e);
            if (this.transitioningCameraTarget) {
                this.sceneHelper.setFocusMarkerVisibility(!0);
                const s = Math.max(this.sceneHelper.getFocusMarkerOpacity(), 0);
                let r = Math.min(s + 10 * n, 1);
                this.sceneHelper.setFocusMarkerOpacity(r),
                this.sceneHelper.updateFocusMarker(this.nextCameraTarget, this.selectedCamera, e),
                t = !0
            } else {
                let s;
                if (s = t ? 1 : Math.min(this.sceneHelper.getFocusMarkerOpacity(), 1),
                s > 0) {
                    this.sceneHelper.updateFocusMarker(this.nextCameraTarget, this.selectedCamera, e);
                    let t = Math.max(s - 2.5 * n, 0);
                    this.sceneHelper.setFocusMarkerOpacity(t),
                    0 === t && this.sceneHelper.setFocusMarkerVisibility(!1)
                }
                t = !1
            }
        }
    }();
    updateMeshCursor = function() {
        const e = []
          , t = new THREE.Vector2;
        return function() {
            this.showMeshCursor ? (this.getRenderDimensions(t),
            e.length = 0,
            this.raycaster.setFromCameraAndScreenPosition(this.selectedCamera, this.mousePosition, t),
            this.raycaster.intersectSplatMesh(this.splatMesh, e),
            e.length > 0 ? (this.sceneHelper.setMeshCursorVisibility(!0),
            this.sceneHelper.positionAndOrientMeshCursor(e[0].origin, this.selectedCamera)) : this.sceneHelper.setMeshCursorVisibility(!1)) : this.sceneHelper.setMeshCursorVisibility(!1)
        }
    }();
    updateInfoPanel = function() {
        const e = new THREE.Vector2;
        return function() {
            if (!this.showInfo)
                return;
            const t = this.splatMesh.getSplatCount();
            this.getRenderDimensions(e);
            const n = this.camera.position
              , s = `[${n.x.toFixed(5)}, ${n.y.toFixed(5)}, ${n.z.toFixed(5)}]`;
            this.infoPanelCells.cameraPosition.innerHTML = s;
            const r = this.controls.target
              , o = `[${r.x.toFixed(5)}, ${r.y.toFixed(5)}, ${r.z.toFixed(5)}]`;
            this.infoPanelCells.cameraLookAt.innerHTML = o;
            const i = this.camera.up
              , a = `[${i.x.toFixed(5)}, ${i.y.toFixed(5)}, ${i.z.toFixed(5)}]`;
            if (this.infoPanelCells.cameraUp.innerHTML = a,
            this.showMeshCursor) {
                const e = this.sceneHelper.meshCursor.position
                  , t = `[${e.x.toFixed(5)}, ${e.y.toFixed(5)}, ${e.z.toFixed(5)}]`;
                this.infoPanelCells.cursorPosition.innerHTML = t
            } else
                this.infoPanelCells.cursorPosition.innerHTML = "N/A";
            this.infoPanelCells.fps.innerHTML = this.currentFPS,
            this.infoPanelCells.renderWindow.innerHTML = `${e.x} x ${e.y}`;
            const l = this.splatRenderCount / t * 100;
            this.infoPanelCells.renderSplatCount.innerHTML = `${this.splatRenderCount} splats out of ${t} (${l.toFixed(0)}%)`,
            this.infoPanelCells.sortTime.innerHTML = `${this.lastSortTime.toFixed(3)} ms`
        }
    }();
    updateControlPlane() {
        this.showControlPlane ? (this.sceneHelper.setControlPlaneVisibility(!0),
        this.sceneHelper.positionAndOrientControlPlane(this.controls.target, this.selectedCamera.up)) : this.sceneHelper.setControlPlaneVisibility(!1)
    }
    updateSplatSort = function() {
        const e = new THREE.Matrix4
          , t = []
          , n = new THREE.Vector3(0,0,-1)
          , s = new THREE.Vector3(0,0,-1)
          , r = new THREE.Vector3
          , o = new THREE.Vector3
          , i = [];
        let a = 0;
        const l = [{
            angleThreshold: .55,
            sortFractions: [.125, .33333, .75]
        }, {
            angleThreshold: .65,
            sortFractions: [.33333, .66667]
        }, {
            angleThreshold: .8,
            sortFractions: [.5]
        }];
        return function(c=!1, h=!1) {
            if (this.sortRunning)
                return;
            if (!this.initialized || !this.splatRenderingInitialized)
                return;
            let u = 0
              , d = 0
              , p = !1
              , m = !1;
            if (s.set(0, 0, -1).applyQuaternion(this.selectedCamera.quaternion),
            u = s.dot(n),
            d = o.copy(this.selectedCamera.position).sub(r).length(),
            !c && 0 === i.length && a > 0 && (u <= .95 && (p = !0),
            d >= 1 && (m = !0),
            !p && !m))
                return;
            if (this.sortRunning = !0,
            this.splatRenderCount = this.gatherSceneNodesForSort(h, this.selectedCamera),
            e.copy(this.selectedCamera.matrixWorld).invert(),
            e.premultiply(this.selectedCamera.projectionMatrix),
            e.multiply(this.splatMesh.matrixWorld),
            this.gpuAcceleratedSort && (i.length <= 1 || i.length % 2 == 0) && this.splatMesh.computeDistancesOnGPU(e, this.sortWorkerPrecomputedDistances),
            0 === i.length) {
                for (let e of l)
                    if (u < e.angleThreshold) {
                        for (let t of e.sortFractions)
                            i.push(Math.floor(this.splatRenderCount * t));
                        break
                    }
                i.push(this.splatRenderCount)
            }
            const f = Math.min(i.shift(), this.splatRenderCount);
            t[0] = this.selectedCamera.position.x,
            t[1] = this.selectedCamera.position.y,
            t[2] = this.selectedCamera.position.z;
            const g = {
                modelViewProj: this.integerBasedSort ? SplatMesh.getIntegerMatrixArray(e) : e.elements,
                cameraPosition: t,
                splatRenderCount: this.splatRenderCount,
                splatSortCount: f,
                usePrecomputedDistances: this.gpuAcceleratedSort
            };
            this.sharedMemoryForWorkers || (g.indexesToSort = this.sortWorkerIndexesToSort,
            this.gpuAcceleratedSort && (g.precomputedDistances = this.sortWorkerPrecomputedDistances)),
            this.sortWorker.postMessage({
                sort: g
            }),
            0 === i.length && (r.copy(this.selectedCamera.position),
            n.copy(s)),
            a++
        }
    }();
    gatherSceneNodesForSort = function() {
        const e = []
          , t = new THREE.Vector3
          , n = new THREE.Vector3
          , s = new THREE.Vector3
          , r = new THREE.Matrix4
          , o = new THREE.Vector3
          , i = new THREE.Vector3(0,0,-1)
          , a = new THREE.Vector3
          , l = e => a.copy(e.max).sub(e.min).length();
        return function(a, c) {
            this.getRenderDimensions(o);
            const h = o.y / 2 / Math.tan(c.fov / 2 * THREE.MathUtils.DEG2RAD)
              , u = Math.atan(o.x / 2 / h)
              , d = Math.atan(o.y / 2 / h)
              , p = Math.cos(u)
              , m = Math.cos(d);
            r.copy(c.matrixWorld).invert(),
            r.multiply(this.splatMesh.matrixWorld);
            const f = this.splatMesh.getSplatTree();
            let g = 0
              , y = 0;
            const E = f.nodesWithIndexes.length;
            for (let o = 0; o < E; o++) {
                const c = f.nodesWithIndexes[o];
                s.copy(c.center).applyMatrix4(r);
                const h = s.length();
                s.normalize(),
                t.copy(s).setX(0).normalize(),
                n.copy(s).setY(0).normalize();
                const u = i.dot(n)
                  , d = i.dot(t)
                  , E = l(c);
                !a && (u < p - .6 || d < m - .6 || h > 125) && h > E || (y += c.data.indexes.length,
                e[g] = c,
                c.data.distanceToNode = h,
                g++)
            }
            e.length = g,
            e.sort(( (e, t) => e.data.distanceToNode < t.data.distanceToNode ? -1 : 1));
            let T = y * Constants$1.BytesPerInt;
            for (let t = 0; t < g; t++) {
                const n = e[t]
                  , s = n.data.indexes.length
                  , r = s * Constants$1.BytesPerInt;
                new Uint32Array(this.sortWorkerIndexesToSort.buffer,T - r,s).set(n.data.indexes),
                T -= r
            }
            return y
        }
    }();
    getSplatMesh() {
        return this.splatMesh
    }
    isMobile() {
        return navigator.userAgent.includes("Mobi")
    }
    isQuest() {
        return navigator.userAgent.includes("Quest")
    }
}
class DropInViewer extends THREE.Group {
    constructor(e={}) {
        super(),
        e.selfDrivenMode = !1,
        e.useBuiltInControls = !1,
        e.rootElement = null,
        e.ignoreDevicePixelRatio = !1,
        e.dropInMode = !0,
        e.camera = void 0,
        e.renderer = void 0,
        this.viewer = new Viewer(e),
        this.callbackMesh = DropInViewer.createCallbackMesh(),
        this.add(this.callbackMesh),
        this.callbackMesh.onBeforeRender = DropInViewer.onBeforeRender.bind(this, this.viewer)
    }
    addSceneFromFile(e, t={}) {
        !1 !== t.showLoadingSpinner && (t.showLoadingSpinner = !0);
        const n = this.viewer.loadFile(e, t);
        return n.then(( () => {
            this.add(this.viewer.splatMesh)
        }
        )),
        n
    }
    addScenesFromFiles(e, t) {
        !1 !== t && (t = !0);
        const n = this.viewer.loadFiles(e, t);
        return n.then(( () => {
            this.add(this.viewer.splatMesh)
        }
        )),
        n
    }
    static onBeforeRender(e, t, n, s) {
        e.update(t, s)
    }
    static createCallbackMesh() {
        const e = new THREE.SphereGeometry(1,8,8)
          , t = new THREE.MeshBasicMaterial;
        t.colorWrite = !1,
        t.depthWrite = !1;
        const n = new THREE.Mesh(e,t);
        return n.frustumCulled = !1,
        n
    }
}
export {AbortablePromise, DropInViewer, OrbitControls, PlyLoader, PlyParser, SplatBuffer, SplatCompressor, SplatLoader, Viewer};
