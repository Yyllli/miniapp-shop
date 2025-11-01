import { fetchUserCenter } from '../../services/usercenter/fetchUsercenter';
import Toast from 'tdesign-miniprogram/toast/index';

const menuData = [
  [
    {
      title: '收货地址',
      tit: '',
      url: '',
      type: 'address',
    },
    {
      title: '优惠券',
      tit: '',
      url: '',
      type: 'coupon',
    },
    {
      title: '积分',
      tit: '',
      url: '',
      type: 'point',
    },
  ],
  [
    {
      title: '帮助中心',
      tit: '',
      url: '',
      type: 'help-center',
    },
    {
      title: '客服热线',
      tit: '',
      url: '',
      type: 'service',
      icon: 'service',
    },
  ],
];

const orderTagInfos = [
  {
    title: '待付款',
    iconName: 'wallet',
    orderNum: 0,
    tabType: 5,
    status: 1,
  },
  {
    title: '待发货',
    iconName: 'deliver',
    orderNum: 0,
    tabType: 10,
    status: 1,
  },
  {
    title: '待收货',
    iconName: 'package',
    orderNum: 0,
    tabType: 40,
    status: 1,
  },
  {
    title: '待评价',
    iconName: 'comment',
    orderNum: 0,
    tabType: 60,
    status: 1,
  },
  {
    title: '退款/售后',
    iconName: 'exchang',
    orderNum: 0,
    tabType: 0,
    status: 1,
  },
];

const getDefaultData = () => ({
  showMakePhone: false,
  userInfo: {
    avatarUrl: '',
    nickName: '正在登录...',
    phoneNumber: '',
  },
  menuData,
  orderTagInfos,
  customerServiceInfo: {},
  currAuthStep: 1,
  showKefu: true,
  versionNo: '',
});

Page({
  data: getDefaultData(),

  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.fetUseriInfoHandle();
  },

  fetUseriInfoHandle() {
    fetchUserCenter().then(({ userInfo, countsData, orderTagInfos: orderInfo, customerServiceInfo }) => {
      // eslint-disable-next-line no-unused-expressions
      menuData?.[0].forEach((v) => {
        countsData.forEach((counts) => {
          if (counts.type === v.type) {
            // eslint-disable-next-line no-param-reassign
            v.tit = counts.num;
          }
        });
      });
      const info = orderTagInfos.map((v, index) => ({
        ...v,
        ...orderInfo[index],
      }));
      this.setData({
        userInfo,
        menuData,
        orderTagInfos: info,
        customerServiceInfo,
        currAuthStep: 2,
      });
      wx.stopPullDownRefresh();
    });
  },

  onClickCell({ currentTarget }) {
    const { type } = currentTarget.dataset;

    switch (type) {
      case 'address': {
        wx.navigateTo({ url: '/pages/user/address/list/index' });
        break;
      }
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  jumpNav(e) {
    const status = e.detail.tabType;

    if (status === 0) {
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      wx.navigateTo({ url: `/pages/order/order-list/index?status=${status}` });
    }
  },

  jumpAllOrder() {
    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  openMakePhone() {
    this.setData({ showMakePhone: true });
  },

  closeMakePhone() {
    this.setData({ showMakePhone: false });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone,
    });
  },

  gotoUserEditPage() {
    const { currAuthStep } = this.data;
    if (currAuthStep === 2) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
    } else {
      this.fetUseriInfoHandle();
    }
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const { version, envVersion = __wxConfig } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },

  /**
   * 用户登录流程
   * 1. 显示服务协议和隐私政策确认弹窗
   * 2. 用户确认后，检查本地是否有有效的登录态（token）
   * 3. 如果没有，调用 wx.login 获取 code
   * 4. 将 code 发送到后端换取 token 和用户信息
   * 5. 保存 token 到本地存储
   * 6. 更新用户信息
   */
  async testLogin() {
    // 1. 首先显示服务协议和隐私政策确认弹窗
    const userAgreed = await this.showServiceAgreement();

    if (!userAgreed) {
      // 用户取消了协议确认
      Toast({
        context: this,
        selector: '#t-toast',
        message: '需要同意协议才能继续使用',
        icon: 'close',
        duration: 2000,
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true,
    });

    try {
      // 2. 检查本地是否有有效的登录态
      const token = wx.getStorageSync('token');
      const expireTime = wx.getStorageSync('tokenExpireTime');

      // 如果 token 存在且未过期，直接使用
      if (token && expireTime && Date.now() < expireTime) {
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '您已登录',
          icon: 'success',
          duration: 2000,
        });
        // 刷新用户信息
        this.fetUseriInfoHandle();
        return;
      }

      // 3. 调用 wx.login 获取临时登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: (res) => {
            console.log(res);
            if (res.code) {
              resolve(res);
            } else {
              reject(new Error('获取登录凭证失败'));
            }
          },
          fail: (err) => {
            reject(err);
          },
        });
      });

      console.log('获取到 code:', loginRes.code);

      // 3. 将 code 发送到后端换取 token（这里模拟真实接口调用）
      // 实际开发中，这里应该调用你的后端接口
      const loginResult = await this.exchangeCodeForToken(loginRes.code);

      // 4. 保存 token 到本地存储（一般 token 有效期 7 天）
      const newExpireTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天后过期
      wx.setStorageSync('token', loginResult.token);
      wx.setStorageSync('tokenExpireTime', newExpireTime);
      wx.setStorageSync('userId', loginResult.userId);
      wx.setStorageSync('userInfo', loginResult.userInfo);

      // 5. 更新页面用户信息
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          ...loginResult.userInfo,
        },
        currAuthStep: 2,
      });

      wx.hideLoading();

      Toast({
        context: this,
        selector: '#t-toast',
        message: '登录成功',
        icon: 'success',
        duration: 2000,
      });

      // 刷新用户中心数据
      this.fetUseriInfoHandle();
    } catch (error) {
      wx.hideLoading();
      console.error('登录失败:', error);

      Toast({
        context: this,
        selector: '#t-toast',
        message: error.message || '登录失败，请稍后重试',
        icon: 'close',
        duration: 2000,
      });
    }
  },

  /**
   * 用 code 换取 token
   * 实际开发中，这里应该调用真实的后端接口
   */
  exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
      // 模拟网络请求延迟
      setTimeout(() => {
        // 这里应该调用真实的后端接口
        // wx.request({
        //   url: 'https://your-api.com/auth/login',
        //   method: 'POST',
        //   data: { code },
        //   success: (res) => {
        //     if (res.statusCode === 200 && res.data.success) {
        //       resolve(res.data.data);
        //     } else {
        //       reject(new Error(res.data.message || '登录失败'));
        //     }
        //   },
        //   fail: (err) => {
        //     reject(err);
        //   },
        // });

        // 模拟接口返回（开发阶段使用）
        if (code) {
          resolve({
            token: `mock_token_${Date.now()}`,
            userId: `user_${Math.random().toString(36).substr(2, 9)}`,
            userInfo: {
              nickName: '微信用户',
              avatarUrl: '',
              phoneNumber: '',
            },
          });
        } else {
          reject(new Error('code 不能为空'));
        }
      }, 500);
    });
  },

  /**
   * 显示服务协议和隐私政策确认弹窗
   * 返回 Promise<boolean>，true 表示用户同意，false 表示用户拒绝
   */
  showServiceAgreement() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '服务协议与隐私政策',
        content:
          '为了向您提供更好的服务，本小程序需要获取您的基本信息。\n\n点击"同意"即表示您已阅读并同意《用户协议》和《隐私政策》',
        confirmText: '同意',
        cancelText: '不同意',
        confirmColor: '#FA550F',
        showCancel: true,
        success: (res) => {
          if (res.confirm) {
            // 用户点击了同意
            // 保存用户同意状态（可选，用于记录）
            wx.setStorageSync('agreedServiceTerms', true);
            wx.setStorageSync('agreedTime', Date.now());
            resolve(true);
          } else if (res.cancel) {
            // 用户点击了不同意
            resolve(false);
          }
        },
        fail: () => {
          // 弹窗显示失败，默认拒绝
          resolve(false);
        },
      });
    });
  },
});
