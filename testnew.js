const { babelify } = require('./transform')
const new_ = require('./new')

const src = `
class C {
   @state c
   @transaction doC() {
   }
}

class A extends C {
   @state a
   @transaction doA() {
   }
}
 
 @contract class B extends A {
   @state b
   @view doB() {
   }
   constructor() {
      super()
   }
}
`

console.log(babelify(src, [new_]))