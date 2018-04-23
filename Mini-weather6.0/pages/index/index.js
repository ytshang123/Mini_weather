//index.js
//获取应用实例
const app = getApp()
//格式化日期
var util = require('../../utils/util.js');
// 引用百度地图微信小程序JSAPI模块
var bmap = require('../../libs/bmap-wx.js');
var wxMarkerData = [];
Page({
    data: {
        weather: {},
        latitude: 0,
        longitude: 0,
        locationString: ' ',  //当前定位所在区位
        currentCity: ' ',   //当前定位所在城市
        weatherData: ' ',
        currentTemp: ' ',
        weatherDesc: ' ',
        forecastWe: ' ',
        today: {},//今天天气情况
        tomorrow: {},//明天天气情况
        afterTomor: {},//后天天气情况
        playCurrentTemp: ' ',    //语音播报当天天气信息
        flag: true,
        //生活指数九宫格
        routers: [
          {
            name: '舒适度',
            value: '',
            url: '',
            icon: '../../img/comf.png'
          },
          {
            name: '穿衣',
            value: '',
            url: '',
            icon: '../../img/drsg.png'
          },
          {
            name: '感冒',
            value: '',
            url: '',
            icon: '../../img/flu.png'
          },
          {
            name: '运动',
            value: '',
            url: '',
            icon: '../../img/sport.png'
          },
          {
            name: '旅游',
            value: '',
            url: '',
            icon: '../../img/trav.png'
          },
          {
            name: '紫外线',
            value: '',
            url: '',
            icon: '../../img/uv.png'
          },
          {
            name: '洗车',
            value: '',
            url: '',
            icon: '../../img/cw.png'
          },
          {
            name: '空气污染',
            value: '',
            url: '',
            icon: '../../img/air.png'
          },
          {
            name: '晾晒',
            value: '不宜',
            url: '',
            icon: '../../img/airc.png'
          }
        ]  
    },
    onReady: function (e) {
      // 使用 wx.createAudioContext 获取 audio 上下文 context
      this.audioCtx = wx.createAudioContext('myAudio')
    },
    //语音播报当天天气   --syt
    audioPlay: function () {
      if(this.flag){
        this.audioCtx.play();
        this.flag = false;
      }else{
        this.audioCtx.pause();
        this.flag = true;
      } 
    },
    //事件处理函数
    switchCity: function () {
        wx.navigateTo({
            url: '../switchCity/switchCity'
        })
    },
    //搜索框内容触发事件
    inputing: function (e) {
        this.setData({
            inputCity: e.detail.value
        });
    },
    //点击查询事件
    bindSearch: function () {
      this.forecastWeather(this.data.inputCity);
    },
    onLoad: function (options) {
        this.setData({
            todaydate: util.formatTime(new Date()).split(' ')[0],
        });
        // this.currentWeather(this.locationString);
        var that = this;
        // 新建百度地图对象
        var BMap = new bmap.BMapWX({
            ak: 'NfYU8TXEgEGpnUdVEcNHPSOkKCgG2HZt'
        });
        //请求百度地图api并返回模糊位置
        wx.getLocation({
            type: 'wgs84',
            success: function (res) {
                that.setData({
                    latitude: res.latitude,//经度
                    longitude: res.longitude,//纬度
                    location: res.latitude + ',' + res.longitude,
                })
                that.loadCity(res.longitude, res.latitude);
                BMap.regeocoding({
                    location: location,
                    success: function (res) {
                        that.setData({
                          locationString: res.originalData.result.addressComponent.district,
                        });
                        // 打印输出当前所在区位    --syt
                        // console.debug(res.originalData.result.addressComponent.district);
                    },
                    fail: function () {
                        wx.showToast({
                            title: '请检查位置服务是否开启',
                        })
                    },
                })
                var fail = function (data) {
                    console.log(data)
                };
                var success = function (data) {
                    var weatherData = data.currentWeather[0];
                    // console.debug(weatherData);
                    var futureWeather = data.originalData.results[0].weather_data;//未来天气           
                    var foo = weatherData.date.split("(")[1];
                    var currentTemp = foo[3] + "" + foo[4] + foo[5];
                    // console.debug(currentTemp);
                    // var weatherDesc = weatherData.weatherDesc;
                    that.setData({
                        weatherData: weatherData,
                        futureWeather: futureWeather,
                        currentTemp: currentTemp,
                        // weatherDesc: weatherDesc,
                        // playCurrentTemp: encodeURI("当前气温是" + currentTemp),
                    });
                }
                // 发起weather请求
                BMap.weather({
                    location: location,
                    fail: fail,
                    success: success
                });
            },
            fail: function () {
                console.log('小程序得到坐标失败')
            }
        });
    },

    // 自动获取当前城市定位
    loadCity: function (longitude, latitude) {
        var page = this;
        wx.request({
            url: 'https://api.map.baidu.com/geocoder/v2/?ak=NfYU8TXEgEGpnUdVEcNHPSOkKCgG2HZt&location=' + latitude + ',' + longitude + '&output=json',
            data: {},
            header: {
                'Content-Type': 'application/json'
            },
            success: function (res) {
                // success
                //console.log(res);
                var city = res.data.result.addressComponent.city;
                //console.debug(city);
                page.forecastWeather(city);//拿到定位好的城市后就去获取天气数据
                page.lifeStyle(city);
                // page.allWeather(city);
                // page.hourWeather(city);
                // page.currentWeather(city);
                page.setData({currentCity: city});
            },
            fail: function () {
                page.setData({currentCity: "获取定位失败"});
            },

        })
    },
    inputing: function (e) {
        this.setData({
            inputCity: e.detail.value
        });
    },
    bindSearch: function () {
        this.forecastWeather(this.data.inputCity);//按照城市名查询天气
    },

   
   //实况天气  即当前温度    --invalid url
    // currentWeather: function (cityName){
    //   var that = this;
    //   var url = 'https://free-api.heweather.com/s6/weather/now?key=6af31d8447864bc388d9617a165c643e&location=' + cityName ;
    //   wx.request({
    //     url: 'url',
    //     data: {},
    //     method: 'GET',
    //     header: {
    //       'content-type': 'application/json'
    //     },
    //     success: function(res){
    //       console.debug(res);
    //     }
    //   })
    // },


    // 逐小时预报  --permission denied
    // hourWeather: function (cityName){
    //     var that = this;
    //     var url = 'https://free-api.heweather.com/s6/weather/hourly?key=6af31d8447864bc388d9617a165c643e&location=' + cityName;
    //     wx.request({
    //       url: url,
    //       data: {},
    //       method: 'GET',
    //       header: {
    //         'content-type': 'application/json'
    //       },
    //       success: function(res){
    //         // console.debug(res);
    //       }
    //     })
    //   },


      // 预测未来三天天气     --OK
      forecastWeather: function (cityName) {
          var that = this;
          var url = 'https://free-api.heweather.com/s6/weather/forecast?key=6af31d8447864bc388d9617a165c643e&location=' + cityName;
          //发出请求
          wx.request({
              url: url,
              data: {},
              method: 'GET',
              header: {
                  'content-type': 'application/json'
              },
              success: function (res) {
                  if(res.data.HeWeather6[0].status=='unknown city'){//如果输入错误提示，看JSON返回值写
                      wx.showModal({
                          title:'提示',
                          content:'城市名不存在，请重新输入',
                          showCancel:false,
                          success:function (res) {
                              self.setData({inputCity:''});
                          }
                      })
                  }else{ that.setData({
                      city: cityName,
                      today: res.data.HeWeather6[0].daily_forecast[0],
                      tomorrow: res.data.HeWeather6[0].daily_forecast[1],
                      afterTomor: res.data.HeWeather6[0].daily_forecast[2],
                      inputCity: ' ',//清空输入框内容
                      weatherDesc: res.data.HeWeather6[0].daily_forecast[0].cond_txt_d
                      + "转" + res.data.HeWeather6[0].daily_forecast[0].cond_txt_n, 
                      playCurrentTemp: encodeURI("微天气为您播报,今天白天到夜间" + res.data.HeWeather6[0].daily_forecast[0].cond_txt_d + "转" + res.data.HeWeather6[0].daily_forecast[0].cond_txt_n + "温度" + res.data.HeWeather6[0].daily_forecast[0].tmp_min + "到" + res.data.HeWeather6[0].daily_forecast[0].tmp_max + "摄氏度," + res.data.HeWeather6[0].daily_forecast[0].wind_dir + res.data.HeWeather6[0].daily_forecast[0].wind_sc + "级"),
                  })
                  // console.debug(res.data);
                  // console.debug(res.data.HeWeather6[0].daily_forecast[0]);
                  }
              }
          });
      },

    // 获取生活指数   --OK
    lifeStyle: function (cityName){
      var that = this;
      var url = 'https://free-api.heweather.com/s6/weather/lifestyle?key=6af31d8447864bc388d9617a165c643e&location=' + cityName;
      //发出请求
      wx.request({
        url: url,
        data: {},
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          if(res.data.HeWeather6[0].status == 'ok'){
            var lifeStyle = res.data.HeWeather6[0].lifestyle;
            // console.debug(lifeStyle);
            for(var i=0; i<lifeStyle.length; i++){
              // console.debug(lifeStyle[i].brf);
              that.setData({
                ['routers[' + i + '].value']: lifeStyle[i].brf,
              })
            }
          }
        }
      });
    },

    //获取所有天气数据的集合  --OK
    //   allWeather: function (cityName) {
    //   var that = this;
    //   var url = 'https://free-api.heweather.com/s6/weather?key=6af31d8447864bc388d9617a165c643e&location=' + cityName;
    //   //发出请求
    //   wx.request({
    //     url: url,
    //     data: {},
    //     method: 'GET',
    //     header: {
    //       'content-type': 'application/json'
    //     },
    //     success: function (res) {
    //       // console.debug(res);
    //     }
    //   });
    // },

})
