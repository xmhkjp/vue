function Vue(options = {}) {
  this.$options = options;//将所有的属性挂载到了$options
  let data = this._data = this.$options.data;
  observe(data); //观察对象进行劫持
  for (let key in data) {//this代理的this._data
    Object.defineProperty(this, key, {
      enumerable: true,
      get(){
        return this._data[key];
      },
      set(newVal){
        this._data[key] = newVal;
      }
    })
  }
  initComputed.call(this);
  compile(options.el, this);
}
function initComputed() {//具有缓存功能的
  let vm = this;
  let computed = this.$options.computed;//Object.keys
  Object.keys(computed).forEach(key => {
    Object.defineProperty(vm, key, {
      get: typeof computed[key] == "function" ? computed[key] : computed[key].get
    })
  });
}
function compile(el, vm) {
  // el 表示替换的范围
  let root = document.querySelector(el);
  let fragment = document.createDocumentFragment();
  let child;
  while (child = root.firstChild) {
    fragment.appendChild(child);
  }
  replace(fragment);
  function subscribe(exp, replaceVal) {
    replaceVal();
    let publisher = exp.lastIndexOf('.') > 0 ? eval(`vm.${exp.slice(0, exp.lastIndexOf('.'))}`)._publisher : vm._publisher;
    let watcher = new Watcher(replaceVal);
    publisher && publisher.subscribe(watcher);
  }

  function replace(fragment) {
    //如果文本里有多个表达式的话?
    Array.from(fragment.childNodes).forEach(function (node) {
      let text = node.textContent;
      let reg = /\{\{(.*)\}\}/;
      if (node.nodeType === 3) {
        let result = text.match(reg);
        if (result) {
          let exp = result[1];
          let replaceVal = () => {
            node.textContent = text.replace(reg, eval(`vm.${exp}`));
          }
          subscribe(exp, replaceVal);
        }
      }
      if (node.nodeType == 1) {
        Array.from(node.attributes).forEach(attr => {
          let name = attr.name;
          let exp = attr.value;
          if (name == 'v-model') {
            let replaceVal = () => {
              node.value = eval(`vm.${exp}`);
            }
            subscribe(exp, replaceVal);
            node.addEventListener('input', event => {
              vm[exp] = event.target.value;
            })
          }
        });
      }
      if (node.childNodes) {
        replace(node);
      }
    });
  }
  root.appendChild(fragment);
}

//实例上有一个 vm.$options 为何还要搞成对象
function observe(data) {
  if (typeof data == 'object') {
    data._publisher = new Publisher();
    for (let key in data) { //将data属性通过Object.defineProperty的方式定义属性
      if (key != '_publisher') {
        let val = data[key];//取出来以前的值
        observe(val);//观察 这个值
        Object.defineProperty(data, key, {
          enumerable: true,
          get(){
            return val;
          },
          set(newVal){
            if (newVal !== val) {
              val = newVal;
              observe(newVal);
              data._publisher.notify();
            }
          }
        })
      }
    }
  }
}
class Publisher {
  constructor() {
    this.watchers = [];
  }
  subscribe(watcher) {
    this.watchers.push(watcher);
  }
  notify() {
    this.watchers.forEach(item => item.update());
  }
}
class Watcher {
  constructor(update) {
    this.update = update;
  }
}
