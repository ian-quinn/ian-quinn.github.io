---
title:  "Pitfalls of wkhtmltopdf"
pubDate:   2025-06-01
tags:
    - wkhtmltopdf
    - python
description: "Looking back when moving toward weasyprint, just a memo for the pitfalls using wkhtmltopdf"
---

alternatives:  
wkhtmltopdf https://wkhtmltopdf.org | binary | v0.12.6 2020  
python-pdfkit (wkhtmltopdf wrapper) | Python | v1.0.0 2021  
pypdf https://pypdf.readthedocs.io/en/stable | v5.6.0 2025  
weasyprint https://weasyprint.org/ | v65.1 2025  

wkhtmltopdf 已经无力支持现有前端生态了  
[Wkhtmltopdf Considered Harmful](https://blog.rebased.pl/2018/07/12/wkhtmltopdf-considered-harmful.html)
[Best wkhtmltopdf Alternatives](https://docraptor.com/wkhtmltopdf-alternatives)  
> In addition to not supporting CSS Paged Media, wkhtmltopdf lacks full support for many newer, powerful HTML, CSS, and JavaScript features, including CSS Columns, CSS Flexbox, CSS Grid Layouts, ES6 JavaScript, and more.

## Installation

wkhtmltopdf 0.12.6, 2020 [latest] https://wkhtmltopdf.org/. You can manually copy the wkhtmltopdf installer to server if network issues occur. The default installation path of `yum` is `/usr/local/bin/`  
ref: [How to Setup wkhtmltopdf on CentOS 7](https://gist.github.com/calebbrewer/aca424fb14618df8aadd?permalink_comment_id=4403616)

```bash
# Make sure to remove below two packages first for the clean installations
yum remove -y wkhtmltopdf  
yum remove -y wkhtmltox
# And then execute below two commands
wget https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox-0.12.6-1.centos8.x86_64.rpm
yum localinstall wkhtmltox-0.12.6-1.centos8.x86_64.rpm
# check installation status
wkhtmltopdf --version
# remove installer if you like
rm wkhtmltox-0.12.6-1.centos8.x86_64.rpm
```

Configure the executive path:
```python
from sys import platform
if platform == 'linux' or platform == 'linux2':
	WKHTMLTOPDF_PATH = '/usr/local/bin/wkhtmltopdf'
else:
	WKHTMLTOPDF_PATH = r'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe'
```

## Font support

**install fonts**  
If the system does not have Asian Fonts configured, the output PDF will display Asian characters in blank squares. You can simply install the Asian Fonts support that contains [google-noto-sans-cjk-ttc-fonts](https://github.com/notofonts/noto-cjk) (Simplified, Traditional, Hong Kong Chinese and Japanese, Korean)  
```bash
# for CentOS 7/8, see what's inside the Fonts group
$ yum group info "Fonts"
$ yum group install -y Fonts
# /usr/share/fonts/google-noto-cjk/NotoSansCJK-Black.ttc: Noto Sans CJK SC Black:style=Black,Regular
# /usr/share/fonts/google-noto-cjk/NotoSansCJK-Medium.ttc: Noto Sans CJK SC Medium:style=Medium,Regular
```

Google fonts are more than ideal for HTML/PDF. You can install other font packages as this thread suggests: [Chinese Characters in PDF displaying as square](https://github.com/wkhtmltopdf/wkhtmltopdf/issues/2886#issuecomment-312238153). [Ubuntu環境下，一些字型套件](https://samwhelp.github.io/blog/read/linux/ubuntu/font/font-package/). However, the repo may not have those font packages supported then you have to copy and paste those files to `/usr/share/fonts`
```bash
$ yum install wqy-zenhei-fonts # centos
$ apt-get install fonts-wqy-microhei ttf-wqy-microhei # ubuntu
```

Uninstall fonts:
```bash
$ yum group remove "Fonts"
# or remove font files directly then refresh cache
$ rm -rf /usr/share/fonts/google-noto-cjk
$ fc-cache -f -v # force to regenerate your font cache
```

\
**server configuration**  
Still we don't know which font file is used when needed? ref: [How To Set Default Fonts and Font Aliases on Linux](https://jichu4n.com/posts/how-to-set-default-fonts-and-font-aliases-on-linux/)  
What are the default font choice of Linux system? As shown below, when 'serif' type font is required, 'DejaVu Serif' will be used as default. When 'YaHei' is not installed, 'DejaVu Sans' will be used as default since they are both sans-serif font. The system will always use the same type of font (serif, sans, mono) as fall backs.
```bash
$ fc-match "serif"
# serif - DejaVuSerif.ttf: "DejaVu Serif" "Book"
# sans-serif - DejaVuSans.ttf: "DejaVu Sans" "Book"
# monospace - DejaVuSansMono.ttf: "DejaVu Sans Mono" "Book"
# Times New Roman - DejaVuSerif.ttf: "DejaVu Serif" "Book"
# 黑体 - DejaVuSans.ttf: "DejaVu Sans" "Book"
```

How to know the name of the font? 
```bash
$ fc-list 
# /usr/share/fonts/dejavu/DejaVuSerif-Bold.ttf: DejaVu Serif:style=Bold
# /usr/share/fonts/google-noto-cjk/NotoSansCJK-Light.ttc: Noto Sans CJK SC,Noto Sans CJK SC Light:style=Light,Regular
```
The meta information is listed in three parts separated by comma:
- DejaVuSerif-Bold.ttf | font file
- Noto Sans CJK SC | font name
- Noto Sans CJK SC Light | subfamily name
- style=Light,Regular | styles supported by this file.

How to change the matching relations? In configuration file you can set the search folder of fonts, define the default fonts for font family, match the alias.
```xml
$ vim /etc/fonts/fonts.conf
<fontconfig>
	<dir>/usr/share/fonts</dir>
	<alias>
		<family>serif</family>
		<prefer><family>Tinos</family></prefer>
	</alias>
	...
	<match>
	 	<test name="family"><string>黑体</string></test>
		<edit name="family" mode="assign" binding="strong"> 
			<string>Microsoft YaHei</string> 
		</edit>
	</match>
</fontconfig>
```

\
**font-face at front-end**  
Or, you can register `@font-face` in CSS targeting the static font resource shipped with your application. Thus, you do not need to configure the server and maintain everything in a docker fashion. The system applies fonts in the following order:
- default fonts configured in `<alias>`
- font with name defined in `font-family`
- font defined in `<match>` that matches the alias defined in `font-family`
- font defined and loaded by `@font-face`

```css
<style type="text/css">
	@font-face {
		font-family: 'Arial';
		src: url('{{ font_arial }}') format('truetype');
	}
	@font-face {
		font-family: 'Arial';
		src: url('{{ font_ariali }}') format('truetype');
		font-style: italic;
	}
	@font-face {
		font-family: 'Arial';
		src: url('{{ font_arialbd }}') format('truetype');
		font-weight: 700;
	}
	@font-face {
		font-family: 'Arial';
		src: url('{{ font_arialbi }}') format('truetype');
		font-style: italic;
		font-weight: 700;
	}
	@font-face {
        font-family: 'Noto Sans CJK SC';
        src: url('{{ font_cjk }}') format('truetype');
    }
	body {
		font-family: 'Arial', 'Noto Sans CJK SC', sans-serif;
	}
</style>
```

You need to specify the font file for each style by `@font-face`.  
The font fallbacks follow the order defined in `font-family`. The sequence should end with a generic family to keep the overall page style, such as "serif", "sans-serif", "cursive", "fantasy", "monospace". If not defined, the Chinese characters not fit in a sans Latin font may fall back to serif font such as SimSun. You should not mix different generic families in one font-family declaration. Notes on font fallbacks:  
-  Mixed typesetting. Place Latin fonts before Asian ones so that characters not supported will fall back to the latter one automatically. (Not supported by wkhtmltopdf)
- Unicode level setting. Specify `unicode-range` in `@font-face` so the renderer knows where to look up the characters. (Not supported by wkhtmltopdf)

ALERT. Wkhtmltopdf only uses the first font defined in `font-family` so Chinese-Latin mixed typesetting is NOT possible on CSS side! You have to remove all CSS font configurations and fall back to the system default. This is because? the legacy version (2017) does not support modern CSS. That is why we need weasyprint in place for wkhtmltopdf.  


## Resource

wkhtmltopdf uses file: scheme to locate local resources. Do not use absolute or relative path. They may work in Jinja2 rendered HTML but not for wkhtmltopdf.  
[How to specify a local file within html using the file: scheme?](https://stackoverflow.com/questions/12711584/how-to-specify-a-local-file-within-html-using-the-file-scheme)  
- `file:///home/User/2ndFile.html` on Unix
- `file:///Users/User/2ndFile.html` on Mac OS X
- `file:///C:/Users/User/2ndFile.html` on windows
In essence, the file URL starts with `file://` and usually omits the host domain `localhost` prefixed to the file path. For example, you can browse local file by `file://localhost/C:/file.html`. 

To construct the path, just prefix the absolute path generated by `os.path` based on Flask core configurations. This will automatically adapt to various platforms. Since file URL always use slash `/`, you need to replace the escaped backslash `\\` on Windows platform with slash.  
```python
# hardcode it, the worst idea
src_path = "file:///home/getech/app/static/logo.png"
# from Flask settings:
app = Flask(__name__)
app.config['STATIC_FOLDER'] = "static"
src_path = "file:///" + os.path.join(app.static_folder, "logo.png").replace("\\","/")
src_path = "file:///" + os.path.join(app.root_path, "static/logo.png").replace("\\","/")
# or get it from Flask application: app/__init__.py
root_dir = os.path.abspath(os.path.dirname(__file__))
src_path = "file:///" + os.path.join(root_dir, "static/logo.png").replace("\\","/")
```
Then render the template by passing variable in context
```python
import jinja2
template_loader = jinja2.FileSystemLoader("$PATH_TO_TEMPLATE_FOLDER")
template_env = jinja2.Environment(loader=template_loader)
context = { 'logo': src_path }
template = template_env.get_template("$TEMPLATE_FILE_NAME")
output_text = template.render(context)
```


## Style

> In addition to not supporting CSS Paged Media, wkhtmltopdf lacks full support for many newer, powerful HTML, CSS, and JavaScript features, including CSS Columns, CSS Flexbox, CSS Grid Layouts, ES6 JavaScript, and more.

Modern CSS support is necessary because you do not what to fall back to legacy solutions coding webpage like an email, where you have to do the layout with `<table>` tag, yes, not even `<div>` is available. The truth is, you cannot use such as `flex` `grid` excellent features and keep switching work-set across different platforms.

**PNG not supported**  
There is shadow around pixels for printed PNG image. Although wkhtmltopdf does support transparent PNG, the appearance is nasty.

**justify text**  
[text-align: justify; not working with wkhtmltopdf](https://stackoverflow.com/questions/28154353/text-align-justify-not-working-with-wkhtmltopdf)

**table rendering**  
Hide the border-style if wkhtmltopdf insists on drawing the border:
```css
td { border-style : hidden !important; }
```