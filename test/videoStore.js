import { getInfoFromLogs, setupParatiiContracts, videoRegistry, paratiiAvatar, paratiiToken, videoStore } from './utils.js'

contract('VideoStore', function (accounts) {
  it('should be able to buy a registered video', async function () {
    await setupParatiiContracts()
    let buyer = accounts[1]
    let owner = accounts[2]
    let videoId = '0x1234'
    let price = 14 * 10 ** 18
    assert.equal(price, web3.toWei(14))
    assert.isOk(price === Number(web3.toWei(14)))
    price = web3.toWei(14)

    await videoRegistry.registerVideo(videoId, owner, Number(price))
    // get the buyer some PTI
    await paratiiToken.transfer(buyer, Number(price) + (1 * 10 ** 18))

    // PTI balance of owner before the transaction
    let ownerBalance = await paratiiToken.balanceOf(owner)
    let avatarBalance = await paratiiToken.balanceOf(paratiiAvatar.address)

    // the actualtransaction takes two steps:
    //  (1) give the paratiiAvatar an allowance to spend the price fo the video
    await paratiiToken.approve(paratiiAvatar.address, Number(price), {from: buyer})
    assert.equal(Number(await paratiiToken.allowance(buyer, paratiiAvatar.address)), price)

    //  (2) instruct the paratiiAvatar to actually buy the video (calling videoStore.buyVideo())
    let tx = await videoStore.buyVideo(videoId, {from: buyer})
    assert.equal(getInfoFromLogs(tx, 'videoId', 'LogBuyVideo'), videoId)
    assert.equal(getInfoFromLogs(tx, 'buyer', 'LogBuyVideo'), buyer)
    assert.equal(Number(getInfoFromLogs(tx, 'price', 'LogBuyVideo')), price)

    // 30% of the price should have gone to the redistribution pool (i.e. the avatar)
    assert.equal(Number(await paratiiToken.balanceOf(paratiiAvatar.address)) - avatarBalance, 0.3 * price)

    // and 70% to the owner
    assert.equal(Number(await paratiiToken.balanceOf(owner)) - ownerBalance, 0.7 * price)
  })
})
