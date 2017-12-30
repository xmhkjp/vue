function observe(data) {
  if (!data || typeof data !== 'object') {
    return;
  }
  // 取出所有属性遍历
  Object.keys(data).forEach(function(key) {
    defineReactive(data, key, data[key]);
  });
};

function defineReactive(data, key, val) {
  observe(val); // 监听子属性
  Object.defineProperty(data, key, {
    enumerable: true, // 可枚举
    configurable: false, // 不能再define
    get: function() {
      // 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
      Dep.target && dep.addDep(Dep.target);
      return val;
    },
    set: function(newVal) {
      console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
      val = newVal;
    }
  });
}