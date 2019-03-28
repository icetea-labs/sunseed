const { transpile } = require('./index')

const src = `
@contract class NumberStore  {
    @state value: ?number
    @transaction setValue (value: number): void {
        this.value = value
        this.emitEvent("ValueChanged", { value })
    }
}
`

transpile(src, { prettier: true })