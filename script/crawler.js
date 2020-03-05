/** @format */

/**
 * 导入辅助模块
 */
const path = require("path");
const fs_node = require("fs");
const fs_extra = require("fs-extra");
const super_agent = require("superagent");
const await_stream_writer = require("await-stream-ready").write;

/**
 * @constant IMAGE_DIR 图片保存位置
 * @constant WALLPAPER_URL 壁纸获取地址
 * @constant USER_AGENT 浏览器 UA
 * @constant TIMEOUT 超时配置
 */
const IMAGE_DIR = path.join(__dirname, "../image");
const WALLPAPER_URL = "https://api.vc.bilibili.com/link_draw/v1/doc/doc_list?uid=6823116&page_num=0&page_size=500&biz=all";
const USER_AGENT = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
};
const TIMEOUT = { response: 5000, deadline: 60000 };

/**
 * 获取壁纸路径
 * @async
 */
async function getWallpaperPaths() {
  let imgAddrArray = [];
  const res = await super_agent
    .get(WALLPAPER_URL)
    .set(USER_AGENT)
    .timeout(TIMEOUT);
  let res_json = JSON.parse(res.text);
  let res_info = res_json.data.items;
  res_info.map(res_info_value => {
    let { title, description, pictures } = res_info_value;
    let pic_desc = title + description;
    pictures.map((pic_url, pic_index) => {
      let url_list = pic_url.img_src.split(".");
      let file_name = `${pic_desc}(${pic_index + 1})-${Date.now()}.${url_list.pop()}`;
      imgAddrArray.push([pic_url.img_src, file_name]);
    });
  });
  return imgAddrArray;
}

// 下载图片
async function download(img_and_path) {
  let file_name = img_and_path[1];
  let ws = fs_extra.createWriteStream(path.join(IMAGE_DIR, file_name));
  let image_stream = super_agent.get(img_and_path[0]).pipe(ws);
  ws.on("finish", () => {
    console.log("下载完成: " + file_name);
    return file_name;
  });
  await await_stream_writer(image_stream);
}

(async () => {
  fs_node.existsSync(IMAGE_DIR) && fs_node.rmdirSync(IMAGE_DIR, { recursive: true });
  fs_node.mkdirSync(IMAGE_DIR);

  let wallpaper_paths = await getWallpaperPaths();
  for (let i = 0; i < wallpaper_paths.length; i++) {
    try {
      await download(wallpaper_paths[i]);
    } catch (err) {
      console.log("下载失败: ", err);
    }
  }
})();
