/**
  * 购物车合并服务
  * 游客模式下，用户在本地购物车添加商品后登录，需要与现有购物车数据合并
  */
const app = getApp()

/**
  * 合并购物车
  * 原则：
  * 1. 以本地购物车 product_id 为主键
  * 2. 本地已有商品 → 更新数量为 max(本地数量, 远程数量)
  * 3. 本地没有但远程有的商品 → 追加到本地
  * 4. 合并完成后保存到本地存储
  * 5. 将合并结果同步到远程服务器（如后端已实现）
  */
function mergeCart(localCart, remoteCart = []) {
  // 深拷贝本地购物车
  const merged = localCart.map(item =>({ ...item }))

  // 合并远程购物车数据（待后端 API 就绪后启用）
  // remoteCart.forEach(remoteItem =>{
  //     localItem.product_id ===remoteItem.product_id
  //   )
  //     // 本地已有，取最大数量
  //     merged[existIndex].quantity = Math.max(
  //       merged[existIndex].quantity || 1,
  //       remoteItem.quantity || 1
  //     )
  //   } else {
  //     // 本地没有，追加
  //     merged.push({ ...remoteItem })
  //   }
  // })

  // 保存合并结果
  wx.setStorageSync('cartItems', merged)

  // 更新全局购物车数量
  const totalCount = merged.reduce((sum, item) =>sum + (item.quantity || 1), 0)
  app.globalData.cartCount = totalCount

  // 更新 TabBar 角标
  if (totalCount > 0) {
  wx.setTabBarBadge({
      index: 2,
      text: totalCount > 99 ? '99+' : totalCount.toString()
  })
  } else {
  wx.removeTabBarBadge({
      index: 2
  })
  }

  return merged
}

module.exports = {
  mergeCart
}
