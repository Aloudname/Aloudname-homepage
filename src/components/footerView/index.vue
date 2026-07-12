<!--
 * @Author: chaichai chaichai@cute.com
 * @Date: 2022-09-26 15:50:49
 * @LastEditors: chaichai chaichai@cute.com
 * @LastEditTime: 2022-11-09 10:40:24
 * @FilePath: \blog3.0\src\components\footerView\index.vue
 * @Description: 
 * 
 * Copyright (c) 2022 by CQUCC-4-433, All Rights Reserved. 
-->
<template>
  <div>
    <div class="footerBox">
      © 2024 版权所有<br />
      已运行 {{ day }}天 {{ h }}小时 {{ min }}分钟 {{ sec }}秒<br />
      Powered by Vue & Supabase<br />
      开源协议 MIT License
    </div>
  </div>
</template>



<script async src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
<script>
export default {
  name: "footerView",
  mounted() {
    this.getNowFormatDate();
    let myTimeDisplay = setInterval(() => {
      this.getNowFormatDate(); //每秒更新一次时间
    }, 1000);
  },
  data() {
    return {
      day: "",
      h: "",
      min: "",
      sec: "",
    };
  },
  methods: {
    getNowFormatDate() {
      var t1 = new Date("2024/1/1 0:00:00");
      var data = new Date(); //获取当前时间
      var times = data.getTime() - t1.getTime(); //时间差的毫秒数
      var days = parseInt(times / (24 * 1000 * 3600)); //计算相差的天数
      var leave = times % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
      var h = parseInt(leave / (3600 * 1000)); //计算小时数
      //计算分钟数
      var h_leave = leave % (3600 * 1000);
      var min = parseInt(h_leave / (60 * 1000));
      //计算秒数
      var min_leave = h_leave % (60 * 1000);
      var sec = parseInt(min_leave / 1000);
      this.day = days;
      this.h = h;
      this.min = min;
      this.sec = sec;
    },
  },
};
</script>

<style>
.footerBox {
  position: relative;
  width: 100%;
  /* height: 100px; */
  padding-top: 7px;
  background: #000;
  bottom: 0;
  color: #fff;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>