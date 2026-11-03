import {cpSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
const backend=process.argv[2] || JSON.parse(readFileSync('cloudflare.deploy.json','utf8')).backend_origin;
if(!backend || new URL(backend).protocol!=='https:' || new URL(backend).origin!==backend) throw new Error('Pass your Cloudflare HTTPS origin, without a trailing slash.');
const destination=resolve('dist/github-pages');
rmSync(destination,{recursive:true,force:true});
mkdirSync(destination,{recursive:true});
cpSync('public',destination,{recursive:true,filter:source=>!source.endsWith('/.DS_Store')});
let home=readFileSync('public/companion.html','utf8');
home=home.replace('<head>',`<head>\n  <meta name="qalina-api-origin" content="${backend}">`)
  .replace('href="/inbox"',`href="${backend}/inbox"`)
  .replace('href="/feelings"','href="feelings.html"');
writeFileSync(`${destination}/index.html`,home);
let feelings=readFileSync('public/feelings.html','utf8').replaceAll('href="/"','href="./"').replaceAll('href="/feelings.css"','href="feelings.css"').replaceAll('src="/feelings.js"','src="feelings.js"').replaceAll('src="/assets/','src="assets/');
writeFileSync(`${destination}/feelings.html`,feelings);
writeFileSync(`${destination}/.nojekyll`,'');
console.log(destination);
