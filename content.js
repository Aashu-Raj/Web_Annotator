(function () {
    // Inject CSS for the annotator
    const style = document.createElement('style');
    style.textContent = `
        .highlighted {
            background-color: #8FBC8F;
        }
        #annotation-popup {
            position: fixed;
            background: white;
            border: 1px solid #ccc;
            padding: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 10000;
        }
        .hidden {
            display: none;
        }
        .annotation {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 5px;
            margin-bottom: 5px;
        }
        #annotations {
            position: fixed;
            bottom: 10px;
            right: 10px;
            max-width: 300px;
            background: white;
            border: 1px solid #ccc;
            padding: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-height: 300px;
            overflow: auto;
        }
    `;
    document.head.append(style);
  
    // Create annotation popup
    const popup = document.createElement('div');
    popup.id = 'annotation-popup';
    popup.classList.add('hidden');
    popup.innerHTML = `
        <textarea id="annotation-text" placeholder="Add your annotation here..."></textarea>
        <button id="save-annotation">Save</button>
        <button id="cancel-annotation">Cancel</button>
    `;
    document.body.append(popup);
  
    // Create annotations container
    const annotationsContainer = document.createElement('div');
    annotationsContainer.id = 'annotations';
    document.body.append(annotationsContainer);
  
    let selectedRange = null;
  
    // Function to show popup
    function showPopup(rect) {
      popup.style.top = `${rect.bottom + window.scrollY}px`;
      popup.style.left = `${rect.left + window.scrollX}px`;
      popup.classList.remove('hidden');
    }
  
    // Function to hide popup
    function hidePopup() {
      document.getElementById('annotation-text').value = '';
      popup.classList.add('hidden');
    }
  
    // Function to save annotations to localStorage
    function saveAnnotations(annotations) {
      localStorage.setItem('annotations', JSON.stringify(annotations));
    }
  
    // Function to load annotations from localStorage
    function loadAnnotations() {
      const annotations = JSON.parse(localStorage.getItem('annotations') || '[]');
      annotations.forEach(annotation => {
        const { text, annotationText, startOffset, endOffset, containerPath } = annotation;
        const container = document.evaluate(containerPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  
        if (!container || container.textContent.length < endOffset) {
          console.error('Invalid container or offsets for annotation', annotation);
          return;
        }
  
        const range = document.createRange();
        range.setStart(container, startOffset);
        range.setEnd(container, endOffset);
  
        const span = document.createElement('span');
        span.classList.add('highlighted');
        span.textContent = text;
        range.deleteContents();
        range.insertNode(span);
  
        const annotationDiv = document.createElement('div');
        annotationDiv.className = 'annotation';
        annotationDiv.textContent = `${text}: ${annotationText}`;
  
        annotationsContainer.appendChild(annotationDiv);
      });
    }
  
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (selectedText) {
        selectedRange = selection.getRangeAt(0);
        const rect = selectedRange.getBoundingClientRect();
        showPopup(rect);
      }
    });
  
    document.getElementById('save-annotation').addEventListener('click', () => {
      if (selectedRange) {
        const span = document.createElement('span');
        span.classList.add('highlighted');
        span.appendChild(selectedRange.extractContents());
        selectedRange.insertNode(span);
  
        const selectedText = span.textContent;
        const annotationText = document.getElementById('annotation-text').value;
        const annotationDiv = document.createElement('div');
        annotationDiv.className = 'annotation';
        annotationDiv.textContent = `${selectedText}: ${annotationText}`;
  
        annotationsContainer.appendChild(annotationDiv);
  
        // Save annotation to localStorage
        const annotations = JSON.parse(localStorage.getItem('annotations') || '[]');
        const container = selectedRange.startContainer;
        const containerPath = getXPath(container);
        annotations.push({
          text: selectedText,
          annotationText,
          startOffset: selectedRange.startOffset,
          endOffset: selectedRange.endOffset,
          containerPath
        });
        saveAnnotations(annotations);
  
        // Clear the textarea and hide the popup
        hidePopup();
        window.getSelection().removeAllRanges();
        selectedRange = null;
      }
    });
  
    document.getElementById('cancel-annotation').addEventListener('click', () => {
      // Clear the textarea and hide the popup
      hidePopup();
      selectedRange = null;
    });
  
    // Function to get XPath of a node
    function getXPath(node) {
      if (node.id !== '') {
        return `//*[@id="${node.id}"]`;
      }
      if (node === document.body) {
        return node.tagName;
      }
  
      let index = 1;
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.nodeName === node.nodeName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }
  
      const path = `${getXPath(node.parentNode)}/${node.nodeName.toLowerCase()}[${index}]`;
      return path;
    }
  
    // Load annotations on page load
    window.addEventListener('load', loadAnnotations);
  })();