---
title:  "Property vs. Attribute"
pubDate:   2025-06-11
tags:
    - HTML
    - JavaScript
description: "Try to monitor the value change of an input field, but there seems a big difference in HTML attributes and DOM properties... with some real-world solutions"
---

[how to monitor the HTML input value changed by javascript](https://stackoverflow.com/questions/54758162/how-to-monitor-the-html-input-value-changed-by-javascript)

##  Behaviors

**what's going on when you see a webpage?**
- server renders the HTML by Jinja2, Vue then delivers to your browser (markup info)
- browser parses static HTML file and loads resources
- browser creates the DOM Tree from HTML (property and attribute generation)
- browser executes JS to modify the DOM Tree (property is preferred)
- browser renders the DOM Tree for a visual page

**mapping relation between attribute and property**

| HTML attribute | DOM property | example value |
| :------------- | :----------- | :------ |
| `value` | `defaultValue` | |
| `class` | `className` | |
| `href`  | `href` | '#' -> 'file:///C:/exmale.html/#' | 

Notes:
- `class` is a reserved word for JavaScript so every time you need it use `className` instead
- `href` attribute records the original text in your markup HTML, while `.href` property is the rendered URL for actual usage.

**how to grab and modify these?**  
When browser renders the webpage, it reads out the information in markup HTML and parses it into two shares: 1. the `property` of live DOM recording the current status of the webpage, including user input or JS behaviors; 2. the `attribute` recording the initial status of the markup HTML. The keywords for property are reserved and in line with the living HTML standard, but with attribute you can customize your own definitions.   
Check their relations as below, as the post [.prop() vs .attr()](https://stackoverflow.com/questions/5874652/prop-vs-attr) illustrates:

```
+−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−+
|              HTMLAnchorElement             |
+−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−+
| href:        "http://example.com/foo.html" |
| id:          "fooAnchor"                   | -> the DOM property
| className:   "test one"                    |
| attributes:  +−−−−−−−−−−−−−−−−−−−−−−−−−−+  |
|              | href:  "foo.html"        |  |
|              | id:    "fooAnchor"       |  | -> the attribute for HTML
|              | class: "test one"        |  |
|              +−−−−−−−−−−−−−−−−−−−−−−−−−−+  |
+−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−+
```

You can edit the content of property or attribute by the following code. Generally, these two shares are bundled and synchronized by the browser when you (or the JS) change one of them. However, the `<input>` is a typical exception:

```html
<input id="foo" class="hidden w-full" value="noob"/>
```

```js
document.getElementById('foo').value = 'master' // change value property
document.getElementById('foo').value // 'master'
document.getElementById('foo').defaultValue // noob
document.getElementById('foo').getAttribute('value') // noob
document.getElementById('foo').setAttribute('value', 'master') // change value attribute
// jQuery
$('#foo').val('master') // change the value property to 'master'
$('#foo').val() // 'master'
// $('#foo').value // undefined, cannot be use
$('#foo').prop('value', 'doctor')
$('#foo').prop('value') // 'doctor'
$('#foo').attr('value') // 'noob'
```

Notes:
- the browser updates `src` both property and attribute when JS modifies any one of them
- the property `.value` and attribute `getAttribute('value')` are decoupled, since the attribute has additional functions to represent the initial (default) value
- the browser renders `.value` property for the input field, not the attribute. Exception: when the value property has not changed since DOMContentLoaded, the browser renders the value attribute change because it stands for the 'initial value'
- user input changes `.value` property, not the attribute
- the form submission delivers `.value` property, not the attribute

**you have 3 layers of data when browsing the webpage**  
- HTML source. *invisible* and fixed once received from the server
- Live DOM with attribute. *visible in Elements*/DevTools. The DOM is displayed in a HTML markup fashion so only attributes are displayed. Any information for display will be rendered as webpage lively, such as `innerHTML`, `src`, `href`, but not the `value`
- Live DOM. *visible in Properties*/DevTools. The webpage is rendered lively to the current properties. You can also access them by JS in Console, but not that straightforward in a markup HTML fashion.


## Value Monitors


| item               | .value | .setAttribute() | DOM trans | user-input | auto-fill | 
| :----------------- | :-------: | :-------: | :----: | :-----: | :----: |
| setInterval        | ✓ | ✓ | ✓ | ✓ | ✓ |
| EventListener      | × | × | × | ✓ | ? |
| PropertyDescriptor | ✓ | × | × | × | × |
| MutationObserver   | × | ✓ | ✓ | × | × |

Browser auto-fill bypasses JS setter and updates the value on native rendering level, not even through DOM API. Thus, any method at JS side will not work. However, during auto-fill there may exist focus, animation event for specific fields (not for batch-fill) that can be monitored.

Example for my case. I have a hidden input to record the base64 image during form submission. The image string is passed to the input by Jcrop. Here is the basic setting:
```html
<input id="image" value="" name="name" type="hidden" />
<button id="btn" onclick="setImage()">UPDATE</button>
<script>
function setImage() { // simulate Jcrop workflows
	input.setAttribute('value', 'data:images');
	//input.value = 'data:images';
}
</script>
```


**Pooling method** (Browser host env function 1980+)  

```js
let lastValue = input.value;
setInterval(() => {
	if (input.value !== lastValue) {
		lastValue = input.value;
		console.log('New value property: ', input.value);
	}
}, 100);
```


**Event Listener** (DOM Level 2 2000)  

```js
input.addEventListener('input', function() {
	console.log('New value property: ', this.value);
});
```


**Property Descriptor hijacking** (JavaScript ES5 2009)  
Hijacking the getter/setter of JS allows you to inject a function when JS tries to assign a value to any property. This works inside the JS logic, irrelevant to the interaction between user and the browser.

```js
const { get, set } = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(input, 'value', {
	get() { return get.call(this); },
	set(newVal) {
		set.call(this, newVal);
		console.log('New value property: ', input.value);
		return newVal;
	}
});
```


**Mutation Observer** (DOM Level 4 2015+)  

```js
const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.attributeName === 'value') {
			console.log('New value attribute: ', input.getAttribute('value'));
    	}
  	});
});
observer.observe(input, {
	attributes: true,
	attributeFilter: ['value']
});
```

