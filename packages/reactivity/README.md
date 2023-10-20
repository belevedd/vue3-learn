# reactivity —— 响应性核心

## 1.Reactive 响应式原理

- 在执行以下代码时：

```javascript
const obj = reactive({
  name: '张三'
})
```

### 1.1. 执行 reactive 函数

1. 首先执行 reactive 函数：

```typescript
// reactive.ts
/**
 * @param target {name: '张三'}
 */
function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}
```

在此函数中，返回一个 createReactiveObject 函数。此函数传入三个参数：

```
target: {name: '张三'}
mutableHandlers: 在 baseHandlers.ts 中定义的响应数据处理器, 存在 get/set 方法
reactiveMap: 在 reactive.ts 中定义的 WeakMap 对象数组
```

2. 执行返回的 createReactiveObject 函数：

```typescript
// reactive.ts
function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)

  proxyMap.set(target, proxy)
  return proxy
}
```

在此函数中，将 target 对象进行 Proxy 代理，绑定对应的处理操作。

3. mutableHandlers 响应拦截对象：

```typescript
// baseHandlers.ts
const get = createGetter()
const set = createSetter()
const mutableHandlers: ProxyHandler<object> = {
  get,
  set
}
```

```typescript
// baseHandlers.ts
function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return res
  }
}
```

createGetter 函数主要返回 target[key] 内容，并执行 track 依赖收集函数。

```typescript
// baseHandlers.ts
function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key, value)
    return result
  }
}
```

createSetter 函数主要将 target[key] = value，并执行 trigger 触发依赖函数。

- 再执行以下赋值代码：

```javascript
effect(() => {
  document.querySelector('#app').innerText = obj.name
})
```

### 1.2. 执行 effect 函数

1. 首先执行 effect 函数：

```typescript
// effect.ts
/**
 * @param fn () => { document.querySelector('#app').innerText = obj.name }
 */
function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
```

创建 ReactiveEffect 类，并直接执行 fn 函数，先进行赋值。

2. ReactiveEffect 类：

```typescript
// effect.ts
class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}
  run() {
    // this = {fn: () => {...}}
    activeEffect = this
    return this.fn()
  }
}
```

3. 在获取 obj.name 时，触发 mutableHandlers 的 get 方法，执行 track 函数收集依赖

```typescript
// dep.ts
type Dep = Set<ReactiveEffect>
```

```typescript
// effect.ts
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()
function track(target: object, key: unknown) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}
function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}
```

- targetMap 的主要结构为：

```
targetMap: {
  key(响应性对象): targetObj,
  value(Map 对象): {
    key(响应性对象的指定属性): targetObj.key,
    value(指定对象的指定属性的 执行函数合集 Set 对象): [ReactiveEffect, ReactiveEffect, ...]
  }
}
```

### 1.3. 当对象中的值发生改变时

1. 当对象中的值发生改变时：

```javascript
obj.name = '李四'
```

2. 触发 mutableHandlers 的 set 方法，执行 trigger 函数触发依赖

```typescript
// dep.ts
const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}
```

```typescript
// effect.ts
function trigger(target: object, key: unknown, newValue: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep: Dep | undefined = depsMap.get(key)
  if (!dep) return

  triggerEffects(dep)
}
function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]

  for (const effect of effects) {
    triggerEffect(effect)
  }
}
function triggerEffect(effect: ReactiveEffect) {
  effect.run()
}
```

当执行 trigger 函数时，会执行 get 方法中收集到该触发属性的每一个 fn 函数，将 dom 中的值进行修改。
在执行 fn 函数又会调用 get 方法。

### 1.4. 为什么 reactive 只能是对 object 进行响应？

因为使用的 Proxy 语句 new Proxy(target, handler)，target 只能是任何类型的对象，包括原生数组、函数、甚至另一个代理。