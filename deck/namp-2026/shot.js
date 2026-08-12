const { chromium } = require('playwright-core');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:1056,height:704},deviceScaleFactor:1.4});
  for(const id of ['s18','s21','s01']){
    await p.goto('http://localhost:8080/preview-'+id+'.html',{waitUntil:'networkidle'});
    await p.screenshot({path:'/tmp/prev-'+id+'.png'});
  }
  await b.close(); console.log('스크린샷 3장');
})();
