import { Observable } from 'rxjs';
import axios from 'axios';

class HtmlHelperService {
    static loaderVisibilityCount = 0;

    //read from file using FileReader
    readFromFile = (file, options) => new Promise((resolve, reject) => {
        if (!FileReader) {
            reader.onerror = error => reject("browser can't support FileReader");
            return;
        }
        options = options || { readAsDataURL: true };

        const reader = new FileReader();

        if (options.readAsBinaryString)
            reader.readAsBinaryString(file);
        else if (options.readAsText)
            reader.readAsText(file);
        else if (options.readAsDataURL)
            reader.readAsDataURL(file);
        else if (options.readAsArrayBuffer)
            reader.readAsArrayBuffer(file);

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    //convert file data to attachment
    base64ToAttachment(data, fileName) {
        let split = data.substring(5).split(";base64,");
        let contentType = split[0];
        let base64 = split[1];

        return {
            fileName: fileName,
            contentType: contentType,
            source: base64
        };
    }

    downloadFile(fileURL, fileName) {
        // for non-IE
        if (!window.ActiveXObject) {
            var save = document.createElement('a');
            save.href = fileURL;
            save.target = '_blank';
            var filename = fileURL.substring(fileURL.lastIndexOf('/')+1);
            save.download = fileName || filename;
               if ( navigator.userAgent.toLowerCase().match(/(ipad|iphone|safari)/) && navigator.userAgent.search("Chrome") < 0) {
                    document.location = save.href; 
    // window event not working here
                }else{
                    var evt = new MouseEvent('click', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': false
                    });
                    save.dispatchEvent(evt);
                    (window.URL || window.webkitURL).revokeObjectURL(save.href);
                }	
        }
    
        // for IE < 11
        else if ( !! window.ActiveXObject && document.execCommand)     {
            var _window = window.open(fileURL, '_blank');
            _window.document.close();
            _window.document.execCommand('SaveAs', true, fileName || fileURL)
            _window.close();
        }
    }

    //copy text to clipboard
    copyToClipboard(text) {
        let input = document.createElement("input");
        input.value = text;
        document.body.appendChild(input);
        try {
            input.select();
            document.execCommand("Copy");
        }
        catch (e) {
            console.error(e);
        }
        finally {
            input.remove();
        }
    }

    //show Loader
    loaderVisible(visible) {
        if (visible) {
            if (!HtmlHelperService.loaderVisibilityCount) {
                setTimeout(_ => {
                    if (HtmlHelperService.loaderVisibilityCount) return { showLoader: true }; //enable loader script
                }, 400);
            }
            HtmlHelperService.loaderVisibilityCount++;
        }
        else {
            if (HtmlHelperService.loaderVisibilityCount > 0) HtmlHelperService.loaderVisibilityCount--;
            if (!HtmlHelperService.loaderVisibilityCount) return { showLoader: true }; //disable loader script
        }
    }

    createScrollPaging() {
        let lastScrollTop = 0;
        return {
            hasScollHeight: (element) => {
                if (!element) element = document.documentElement;
                return element.clientHeight < element.scrollHeight;
            },

            onScrollDown: (e, fn, scroll = 50) => {
               
                let target = e.target;
                let { clientHeight, scrollHeight } = (target == document ? target.documentElement : target);
                let scrollTop = (target == document ? (target.body.scrollTop || target.documentElement.scrollTop) : target.scrollTop);

                let lastTop = lastScrollTop;
                lastScrollTop = scrollTop;
             
                if (lastTop >= scrollTop) return;
                if ((clientHeight + scrollTop + scroll) < scrollHeight) return;
                fn();
            }
        };
    }

    pasteUrl = (returnData = false) => {
        return navigator.clipboard.readText()
          .then(clipText => {
            const el = document.activeElement;
            if (el.nodeName === 'INPUT' && !returnData) {
             // el.value = clipText
            }
            return clipText;
          });
    }

    skipRelativeUrl(url) {
        if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) return "//" + url;
        return url;
    }

    getScrollbarWidth = () => {
        let scrollbox = document.createElement('div');
        scrollbox.style.overflow = 'scroll';
        document.body.appendChild(scrollbox);
        let offsetWidth = scrollbox.offsetWidth;
        let clientWidth = scrollbox.clientWidth;
        document.body.removeChild(scrollbox);
        return  offsetWidth - clientWidth;
    }

    isElementVisible(el, onlyHeight) {
        let rect = el.getBoundingClientRect();

        if (onlyHeight !== true) {
            if (!(rect.left >= 0 && rect.right <= (window.innerWidth || document.documentElement.clientWidth))) return false;
        }

        if (onlyHeight !== false) {
            if (!(rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight))) return false;
        }

        return true;
    }

    setIdleTimer(time, element, events) {
        element = element || window;
        events = events || 'mousemove,mousedown,click,scroll,keypress';
        events = events.split(',').map(x => x.trim());

        return {
            subscribe: (fn) => {
                let timeout;
                let startTime = new Date().getTime();
                let onFocus = () => {
                    if (timeout) clearTimeout(timeout);
                    let diff = new Date().getTime() - startTime;

                    if (diff >= time) fn();
                    else timeout = setTimeout(fn, time - diff);

                }

                let listener = () => {
                    startTime = new Date().getTime();
                    if (timeout) clearTimeout(timeout);
                    timeout = setTimeout(fn, time);
                }

                element.addEventListener('focus', onFocus);
                for (let event of events)
                    element.addEventListener(event, listener);

                listener();

                return {
                    unsubscribe: () => {
                        element.removeEventListener('focus', onFocus);
                        for (let event of events)
                            element.removeEventListener(event, listener);
                    }
                };
            }
        };
    }

    onBlur(...elements) {
        elements = elements.filter(x => x);

        return new Observable(observer => {
            let isDescendant = e => {
                if (e == null || e == window || e == document) return false;

                for (let element of elements)
                    if (e == element) return true;

                return isDescendant(e.parentNode);
            }

            let onClick = e => {
                if (isDescendant(e.target)) return;
                observer.next(e);
            }

            let timeout = setTimeout(() => { document.body.addEventListener('click', onClick); }, 0);
            return {
                unsubscribe: () => {
                    if (timeout) clearTimeout(timeout);
                    window.removeEventListener('click', onClick);
                }
            }
        });
    }

    getBASEFromUrl = (url) => {
        return axios
          .get(url, {
            responseType: 'arraybuffer'
          })
          .then(response => {
              
            return `data:application/pdf;base64, ${Buffer.from(response.data, 'binary').toString('base64')}`
          })
    }
}

export default new HtmlHelperService();