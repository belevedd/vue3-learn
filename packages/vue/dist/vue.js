var Vue = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var isArray = Array.isArray;

    /**
     * 创建并返回一个 Set 合集
     */
    var createDep = function (effects) {
        /**
         * Set 对象允许存储任何类型（无论是原始值还是对象引用）的唯一值。
         */
        var dep = new Set(effects);
        return dep;
    };

    /**
     * 收集所有依赖的 WeakMap 实例:
     * targetMap: {
     *   key(响应性对象): targetObj,
     *   value(Map 对象): {
     *     key(响应性对象的指定属性): targetObj.key,
     *     value(指定对象的指定属性的 执行函数合集 Set 数组): [ReactiveEffect, ReactiveEffect, ...]
     *   }
     * }
     */
    var targetMap = new WeakMap();
    /**
     * 给函数注册响应式更新
     * 给定的函数将立即运行一次。
     * 每当在其中访问的任何响应性属性被更新时，该函数将再次运行。
     * @param fn 响应式更新的函数
     */
    function effect(fn) {
        var _effect = new ReactiveEffect(fn);
        _effect.run();
    }
    // 记录当前活跃的 响应函数
    var activeEffect;
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn) {
            this.fn = fn;
        }
        ReactiveEffect.prototype.run = function () {
            // this = {fn: () => {...}}
            activeEffect = this;
            return this.fn();
        };
        return ReactiveEffect;
    }());
    /**
     * 在触发 get 的时候进行依赖收集
     * @param target 持有响应性属性的对象
     * @param key 要跟踪的响应属性的标识符
     */
    function track(target, key) {
        // 如果当前不存在执行函数, 则直接 return
        if (!activeEffect)
            return;
        // 尝试从 targetMap 中, 根据 target 获取 map
        var depsMap = targetMap.get(target);
        // 如果获取到的 map 不存在, 则生成新的 map 对象, 并把该对象赋值给对应的 value
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        // 尝试从 depsMap 中, 根据 key 获取 Set
        var dep = depsMap.get(key);
        // 如果获取到的 Set 不存在, 则生成新的 Set 数组, 并把该 Set 数组赋值给对应的 value
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
    /**
     * 利用 dep 依次跟踪指定 key 的所有 effect
     */
    function trackEffects(dep) {
        /**
         * Set.add()
         * 如果 Set 中尚不存在具有相同值的元素，则在 Set 对象中插入一个新的具有指定值的元素。
         * activeEffect! '!'的作用: 非空断言, 认为 activeEffect 一定存在。
         */
        dep.add(activeEffect);
    }
    /**
     * 在触发 set 的时候进行触发依赖
     * @param target reactive 对象
     * @param key reactive 对象中的属性值
     * @param newValue 设置的新值
     */
    function trigger(target, key, newValue) {
        // 根据 target 获取存储的 map 实例
        var depsMap = targetMap.get(target);
        // 如果 map 不存在，则直接 return
        if (!depsMap)
            return;
        // 根据 key 获取存储的 dep (Set 数组)
        var dep = depsMap.get(key);
        // 如果 dep 不存在，则直接 return
        if (!dep)
            return;
        triggerEffects(dep);
    }
    function triggerEffects(dep) {
        var e_1, _a;
        var effects = isArray(dep) ? dep : __spreadArray([], __read(dep), false);
        try {
            // 依次触发依赖
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                triggerEffect(effect_1);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    /**
     * 触发指定依赖
     */
    function triggerEffect(effect) {
        effect.run();
    }

    var get = createGetter();
    // 返回一个闭包 get 方法
    function createGetter() {
        return function get(target, key, receiver) {
            /**
             * Reflect 是一个内置的对象，它提供拦截 JavaScript 操作的方法。
             * Reflect.get(target, key[, receiver]) 获取对象身上某个属性的值，类似于 target[key]。
             *  -target: 需要取值的目标对象;
             *  -key: 需要获取的值的键值;
             *  -receiver: 如果 target 对象中指定了 getter, receiver 则为 getter 调用时的 this 值。
             */
            var res = Reflect.get(target, key, receiver);
            // 在触发 get 的时候进行依赖收集
            track(target, key);
            return res;
        };
    }
    var set = createSetter();
    // 返回一个闭包 set 方法
    function createSetter() {
        return function set(target, key, value, receiver) {
            /**
             * Reflect.set(target, key, value[, receiver]) 将值分配给属性的函数, 类似于 target[key] = value。
             *  -target: 设置属性的目标对象;
             *  -key: 设置的属性的名称;
             *  -value: 设置的值;
             *  -receiver: 如果 target 对象中指定 setter, receiver则为 setter 调用时的 this 值。
             *  -返回一个Boolean，如果更新成功，则返回true。
             */
            var result = Reflect.set(target, key, value, receiver);
            // 在触发 set 的时候进行触发依赖
            trigger(target, key);
            return result;
        };
    }
    /**
     * 响应性的 handler
     * 执行 get 或 set 方法
     */
    var mutableHandlers = {
        get: get,
        set: set
    };

    /**
     * 响应性 Map 缓存对象
     * WeakMap 对象是一组键/值对的集合, 其中的键是弱引用的。其键必须是对象，而值可以是任意的。
     *  -弱引用: 不会影像垃圾回收机制。即: WeakMap 的 key 不再存在任何引用时, 会被直接回收。
     *  -强引用: 会影像垃圾回收机制。存在强引用的对象永远不会被回收。
     *  -使用 WeakMap 为了优化性能，减少内存占用。
     * Map 对象保存键/值对, 并且能够记住键的原始插入顺序。任何值都可以作为一个键或一个值。
     * key: target
     * val: proxy
     */
    var reactiveMap = new WeakMap();
    /**
     * 为复杂数据类型，创建响应性对象
     * @param target 被代理对象
     * @returns 代理对象
     */
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    /**
     * 创建响应性对象
     * @param target 被代理对象
     * @param baseHandlers handler
     * @param proxyMap WeakMap
     * @returns proxy
     */
    function createReactiveObject(target, baseHandlers, proxyMap) {
        // 如果该实例已经被代理, 则直接读取即可
        // WeakMap.get(key) 返回 WeakMap 中与 key 相关联的值，如果 key 不存在则返回 undefined。
        // 如果存在返回 target 对象的 proxy 代理对象
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // 未被代理则生成 proxy 实例
        var proxy = new Proxy(target, baseHandlers);
        // 缓存代理对象
        // WeakMap.set(key，value) 给 WeakMap 中的 key 设置一个 value。该方法返回一个 WeakMap 对象。
        // 给 proxyMap 中的 target 设置一个 value: proxy 的代理对象
        // 当调用多个 reactive 方法时, target 会相应添加进 proxyMap 数组中
        // eg:[{key: target, value: proxy}, {key: target, value: proxy} ...]
        proxyMap.set(target, proxy);
        return proxy;
    }

    exports.effect = effect;
    exports.reactive = reactive;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map