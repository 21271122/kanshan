const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = process.env.QA_OUTPUT || path.resolve("qa-output");
fs.mkdirSync(output, {recursive:true});
(async()=>{
  const browser = await chromium.launch({headless:true,channel:"chrome"});
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://localhost:3111",{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"去我的演示农场",exact:true}).click();
  await page.waitForTimeout(400);
  await page.getByRole("button",{name:"关闭提示",exact:true}).click();
  await page.screenshot({path:path.join(output,"farm-desktop.png")});
  assert.equal(await page.getByRole("button",{name:/号地/}).count(),10);
  await page.getByRole("button",{name:/1 号地 · 成熟/}).click();
  await page.getByRole("button",{name:"先留在农场",exact:true}).click();
  assert.equal(await page.getByRole("button",{name:/1 号地 · 成熟/}).count(),1);
  await page.getByRole("button",{name:/2 号地 · 空地/}).click();
  await page.getByRole("button",{name:/2 号地 · 种子/}).click();
  await page.getByRole("button",{name:"浇一点水 · 早一点见面",exact:true}).click();
  await page.getByRole("button",{name:/2 号地/}).click();
  assert.equal(await page.getByRole("button",{name:"已经浇过水了，交给看山吧"}).isDisabled(),true);
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:/1 号地 · 成熟/}).click();
  await page.evaluate(()=>{window.__open = window.open; window.open = ()=>null;});
  await page.getByRole("button",{name:"体验收获 · 搜索这个话题",exact:true}).click();
  const blocked = await page.evaluate(()=>JSON.parse(localStorage.getItem("kanshan-woye-workspace-v2")));
  assert.equal(blocked.demo.reviewed.length,0);
  await page.evaluate(()=>{window.open=window.__open});
  await context.route("https://www.zhihu.com/**",route=>route.fulfill({status:200,contentType:"text/html",body:"<h1>External destination intercepted for QA</h1>"}));
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button",{name:"体验收获 · 搜索这个话题",exact:true}).click();
  const popup = await popupPromise; await popup.close();
  await page.getByRole("navigation",{name:"农场操作"}).getByRole("button",{name:/收获记录/}).click();
  await page.getByRole("heading",{name:"一个人如何建立稳定的内在秩序？"}).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({path:path.join(output,"harvest-record.png")});
  await page.keyboard.press("Escape");
  await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.getByRole("button",{name:/1 号地 · 空地/}).count(),1);
  assert.equal(await page.getByRole("button",{name:/2 号地/}).count(),1);
  await page.getByRole("button",{name:"内容来源",exact:true}).click();
  await page.getByRole("button",{name:"导入旧收藏",exact:true}).click();
  await page.getByText("批量导入已有收藏文件",{exact:true}).click();
  await page.getByLabel("收藏元数据（JSON 数组）").fill(JSON.stringify([{title:"用户自己收藏的标题",url:"https://www.zhihu.com/question/1/answer/2",favlist:"重读清单"}]));
  await page.getByRole("button",{name:"导入并进入个人农场",exact:true}).click();
  await page.getByRole("button",{name:/1 号地 · 成熟/}).waitFor();
  const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem("kanshan-woye-workspace-v2")));
  assert.equal(saved.mode,"personal"); assert.equal(saved.demo.log.length,1); assert.equal(saved.personalItems.length,1);
  await page.getByRole("button",{name:"农场设置",exact:true}).click();
  await page.getByRole("button",{name:"切换到演示",exact:true}).click();
  const dismiss = page.getByRole("button",{name:"关闭提示",exact:true}); if (await dismiss.count()) await dismiss.click();
  const sizes=[{width:1440,height:900},{width:1366,height:768},{width:390,height:844},{width:375,height:667},{width:667,height:375}];
  for(const size of sizes){
    await page.setViewportSize(size);
    await page.waitForTimeout(150);
    const metrics=await page.evaluate(()=>{
      const vw=innerWidth,vh=innerHeight;
      const plots=[...document.querySelectorAll(".plot")].map(n=>{const r=n.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {width:r.width,height:r.height,inside:r.x>=0&&r.y>=0&&r.right<=vw&&r.bottom<=vh,clickable:n.contains(h)}} );
      return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,plots};
    });
    assert(metrics.width<=size.width && metrics.height<=size.height, "outer overflow "+JSON.stringify(size));
    assert(metrics.plots.every(p=>p.inside&&p.clickable&&p.width>=44&&p.height>=44), "plot visibility "+JSON.stringify({size,metrics}));
    await page.screenshot({path:path.join(output,"farm-"+size.width+"x"+size.height+".png")});
  }
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.getByRole("button",{name:"玩法帮助",exact:true}).click();
  for(let i=0;i<8;i++) {await page.keyboard.press("Tab"); assert(await page.evaluate(()=>!!document.activeElement.closest("dialog")));}
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("button",{name:"玩法帮助",exact:true}).evaluate(n=>n===document.activeElement),true);
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log("UI flow passed: preview/cancel, one-time care, popup blocked/success, harvest log, persistence, personal import, 5 viewports, keyboard focus");
})().catch(e=>{console.error(e);process.exit(1)});






