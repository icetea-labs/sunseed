const { transpile } = require('./index')

const src = `
@contract class NumberStore  {
    @state value: ?number = 0
    @transaction setValue (value: number): void {
        this.value = value
        this.emitEvent("ValueChanged", { value })
    }
}
`

transpile(src, { prettier: true })