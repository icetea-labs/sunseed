const { babelify, transform } = require('./src/transform')
const new_ = require('./src/new')

let src = `
const { SurveyBot, Message } = require('https://raw.githubusercontent.com/TradaTech/icetea/master/icetea/bot/index.js')

const RATE = 5
const MAX = 6
const MAX_BET = 5

@contract class DiceBot extends SurveyBot {
    @pure getName() {
        return 'Dice Bot'
    }

    @pure getDescription() {
        return 'Play dice game.'
    }

    @pure getSteps() {
        return ['Starting','Number', 'Amount', 'Confirm']
    }

    succeedStarting() {
        const m = Message
        .text('Pick your number.')
        .buttonRow()

        for (let i = 1; i <= MAX; i++) {
          m.button(String(i))
        }

        return m.endRow().done()
    }

    collectNumber(number, collector) {
        return collector.number = number
    }

    succeedNumber(number) {
      const max = this.#getMaxBet()
        return Message.input('Bet amount', {
              value: parseInt(max),
              sub_type: 'number'
            })
            .done()
    }

    collectAmount(amount, collector) {
      amount = +amount
      if (amount <= 0 || amount > this.#getMaxBet()) {
        throw new Error('Invalid bet amount')
      }
        return collector.amount = +amount
    }

    failAmount(amount) {
      const max = this.#getMaxBet()
      return Message.input('Bet amount', {
            value: parseInt(max),
            sub_type: 'number'
          })
          .done() 
    }

    succeedAmount(amount, collector) {
        
    }

    succeedConfirm(confirm, collector) {
      const r = this.#randomize()
      const win = (r === +collector.number)
      const receiveAmount = win ? msg.value * RATE : 0
      if (receiveAmount) {
        this.transfer(msg.sender, receiveAmount)
      }
      return Message.html("cc")
        .button('Restart')
        .done()
  }

  #randomize() {
    return parseInt(block.hash.substr(-16), 16) % MAX + 1
  }

  #getMaxBet() {
    return Math.min(this.balance / (RATE - 1), MAX_BET)
  }
    
}
`

async function main() {
  src = await transform(src)
  src = babelify(src, [new_])
  console.log(src)
}
 
main()