"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.Config = exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'gameinfo';
exports.Config = koishi_1.Schema.intersect([
  koishi_1.Schema.object({
 desc: koishi_1.Schema.boolean().description('显示描述').default(true),
is_cn: koishi_1.Schema.boolean().description('显示是否支持中文').default(true),
  date: koishi_1.Schema.boolean().description('显示发售日期').default(true),
 tag: koishi_1.Schema.boolean().description('显示游戏标签').default(true),
 played_rating: koishi_1.Schema.boolean().description('显示玩家评分').default(true),
price: koishi_1.Schema.boolean().description('显示售价').default(true),
comments:koishi_1.Schema.boolean().description('显示评论').default(true),
medium_ratings:koishi_1.Schema.boolean().description('显示媒体评分').default(true),
  }).description('显示条目设置'),
])
const axios = require('axios');
const axiosRetry = require('axios-retry');

// Enable axios-retry
axiosRetry(axios, { retries: 3 });
let signal = false;
      

function apply(ctx, config) {
     ctx
    .command("查询 <text:text>", "检索游戏名称")
    .action(async ({ session }, text) => {
    const response = await axios.get(`https://v2.diershoubing.com/eb/combine_game/search/?src=ios&version=9.54&search_name=${text}`);
    const gamedata = response.data.combine_games
    const chinese_name = gamedata[0].name
    const game_id = gamedata[0].game_id
    signal = true;
  session.send(`\n猜你想搜：${chinese_name}\n\n如果您对搜索结果不满意，请回复“错误的”`);
  session.execute(`id ${game_id}`);
  signal = false;
  session.prompt((session) => {
    const appid = session.content;
if (appid == "错误的") {
const games = gamedata.slice(0, 10).map((game) => `游戏名称：${game.name}，name_id：${game.game_id}`).join('\n')

  session.send(games + "\n\n请输入您需要的name_id");
  session.prompt((session) => {
       const appid = session.content.match(/\d+/);
if (appid) {
     session.execute(`id ${appid}`);
     signal = false;
} else {
  return session.send("请输入正确的name_id");
}
});
} else {
  return;
}
});
  });
  
  
ctx
    .command("id <appid>", "检索游戏的game_id")
    .alias('id：', 'ID' , 'game_id')
  .action(async ({ session }, appid) => {
      let response;
    const link = `https://v2.diershoubing.com/eb/combine_game/detail/${appid}/?src=ios&version=9.54&pf=1`;
    response = await axios.get(link)
   if (response.ret === "-1") {
        return 'name_id不存在！';
   }else{
    const data = response.data.combine_game;
    const values = [];
    
    if (data.name) {
      values.push(`名称：${data.name}`);
    }

 if (data.desc && config.desc) {
      values.push(`简介：${data.desc}`);
    }
    
    if (config.is_cn) {
        if(data.is_cn){
      values.push(`中文支持：True`);
        }else{
            values.push(`中文支持：False`);
        }
    }
    
    if (data.release_date && config.date) {
      let dateString = data.release_date;
      let date = new Date(dateString);
      let formattedDate = date.toLocaleDateString("zh-cn", {year: 'numeric', month: 'long', day: 'numeric'});
      values.push(`发售日期：${formattedDate}`);
    }

    if (data.tag && config.tag) {
      values.push(`标签：${data.tag}`);
      
}

    if (data.price_detail && config.price ) {
      let priceDetails = data.price_detail.map(price => 
        `平台名称: ${price.platform_name}，史低：${price.history_price}，原价：${price.origin_price}，现价: ${price.price}\n`
      );
      values.push(`全区售价：${priceDetails}`);
    }
if (data.played_rating && config.played_rating) {
      values.push(`玩家评分：${data.played_rating}`);
    }
     if (response.data.medium_ratings && config.medium_ratings ) {
    const ratings = response.data.medium_ratings.map(rating => 
        `媒体: ${rating.source_name}，评分：${rating.rating}\n`
      );
values.push(`\n${ratings.join('')}`);
if (config.comments) {
      const link = `https://v2.diershoubing.com/eb/combine_comment/list/game/${appid}/?src=ios&version=9.54&has_filter=1&is_load_steam_review=1&pn=0&rn=20`;
    response = await axios.get(link)
    if(response.data.combine_comments){
    const data_comments = response.data.combine_comments;
    const comments = data_comments.splice(0, 3).map(comment => 
        `“${comment.content}”\n`
      );
      values.push(`评论：${comments}`);
    }
    }
    }
    let imageData = null;
    let image1 = null;
    let image2 = null;

    if (data.game_photo) {
      imageData = await ctx.http.get(data.game_photo, { responseType: 'arraybuffer' });
    }

    if (data.img) {
      image1 = await ctx.http.get(data.img, { responseType: 'arraybuffer' });
}

// 将图片数据拼接在返回的字符串中

let result = values.join('\n');

if (imageData) {
  result += koishi_1.segment.image(imageData);
}

if (image1) {
  result += koishi_1.segment.image(image1);
}

return result;
    
  } 
    
    
  });
    }



exports.apply = apply;