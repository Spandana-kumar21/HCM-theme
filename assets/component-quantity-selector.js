if (typeof ProductQuantity !== 'function') {

	class ProductQuantity extends HTMLElement {

	  constructor() {
		super();

		const productId = this.getAttribute('data-product-id');
		const packPriceDisplay = document.querySelector(`[data-js-product-price-pack="${productId}"]`);
		const qty = this.querySelector('.qty-selector');
		const qtyMinus = this.querySelector('.qty-minus');
		const qtyPlus = this.querySelector('.qty-plus');
		let qtyMin = qty.getAttribute('min') ? parseInt(qty.getAttribute('min')) : 1;
		let qtyMax = qty.getAttribute('max') ? parseInt(qty.getAttribute('max')) : 999;

		if (parseInt(qty.value) - qtyMin < qtyMin) {
		  qtyMinus.classList.add('disabled');
		}
		if (parseInt(qty.value) + qtyMin > qtyMax) {
		  qtyPlus.classList.add('disabled');
		}

		qtyMinus.addEventListener('click', (e) => {
		  e.preventDefault();
          qtyMin = parseInt(qty.getAttribute('min'));
		  qtyMax = parseInt(qty.getAttribute('max'));
		  if (!qtyMinus.classList.contains('disabled')) {
			const currentQty = parseInt(qty.value);
			if (currentQty - qtyMin >= qtyMin) {
			  qty.value = currentQty - qtyMin;
			  qtyPlus.classList.remove('disabled');
			}
			if (currentQty - qtyMin <= qtyMin) {
			  qtyMinus.classList.add('disabled');
			}

			this.updatePackPrice(productId, qty.value);
		  }
		});

		qtyPlus.addEventListener('click', (e) => {
		  e.preventDefault();
          qtyMin = parseInt(qty.getAttribute('min'));
		  qtyMax = parseInt(qty.getAttribute('max'));
		  if (!qtyPlus.classList.contains('disabled')) {
			const currentQty = parseInt(qty.value);
			if (currentQty + qtyMin <= qtyMax) {
			  qty.value = currentQty + qtyMin;
			  qtyMinus.classList.remove('disabled');
			}
			if (currentQty + qtyMin >= qtyMax) {
			  qtyPlus.classList.add('disabled');
			}

			this.updatePackPrice(productId, qty.value);
		  }
		});


		const variantValues = document.querySelectorAll('.product-variant-value');
		const originalPriceElement = document.querySelector(`[data-js-product-price-original="${productId}"]`);

		if (originalPriceElement) {
			const observer = new MutationObserver(() => {
				this.updatePackPrice(productId, parseInt(qty.value));
			});

			// Start observing the original price element for changes
			observer.observe(originalPriceElement, { childList: true, characterData: true });

			variantValues.forEach(element => {
				element.addEventListener('click', () => {
					this.updatePackPrice(productId, parseInt(qty.value));
				});
			});
		} else {
			console.error(`Original price element not found for product ID: ${productId}`);
		}

	  }

	  updatePackPrice(productId, quantity) {
		const originalPriceElement = document.querySelector(`[data-js-product-price-original="${productId}"]`);
		let packPriceDisplay = document.querySelector(`[data-js-product-price-pack="${productId}"]`);
		let priceContainer = packPriceDisplay?.closest('.product-price-original-container_1');

		// if (packPriceDisplay) {
		// 	priceContainer = packPriceDisplay.closest('.product-price-original-container_1');
		// } else {
		// 	packPriceDisplay = document.querySelector(`[data-js-product-price-original="${productId}"]`);
		// 	priceContainer = packPriceDisplay.closest('.product-price-original-container_2');
		// }

		if (originalPriceElement && packPriceDisplay) {
			const currency = originalPriceElement.innerText.replace(/[0-9.:,a-zA-Z]/g, '');
			const unitPrice = parseFloat(originalPriceElement.innerText.replace(/[^\d.-]/g, ''));
			const newPackPrice = unitPrice * quantity;
			const formattedPrice = newPackPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

			if (newPackPrice) {
				packPriceDisplay.innerText = `${currency + formattedPrice}`;
				priceContainer.style.display = 'block';
			} else  {
				packPriceDisplay.innerText = 0;
				priceContainer.style.display = 'none';
			}
		} else {
			console.error(`Original price element or pack price display not found for product ID: ${productId}`);
		}
	  }
	}

	if (typeof customElements.get('product-quantity') == 'undefined') {
	  customElements.define('product-quantity', ProductQuantity);
	}
  }
