if (typeof CartProductQuantity !== 'function') {

    class CartProductQuantity extends HTMLElement {

        constructor() {
            super();

            const qty = this.querySelector('.product__quantity'),
            qtyMinus = this.querySelector('.qty-minus'),
            qtyPlus = this.querySelector('.qty-plus'),
            qtyMin = qty.getAttribute('min') ? parseInt(qty.getAttribute('min')) : 1,
            qtyMax = qty.getAttribute('max') ? parseInt(qty.getAttribute('max')) : 999,
            qtyIncrement = qty.getAttribute('increment') ? parseInt(qty.getAttribute('increment')) : 1;

            if (parseInt(qty.value) - qtyMin < qtyMin) {
                qtyMinus.classList.add('disabled');
            }
            if (parseInt(qty.value) + qtyMin > qtyMax) {
                qtyPlus.classList.add('disabled');
            }

            qtyMinus.addEventListener('click', (e) => {
                e.preventDefault();
                if (!qtyMinus.classList.contains('disabled')) {
                    const currentQty = parseInt(qty.value);
                    if (currentQty - qtyIncrement >= qtyMin) {
                        qty.value = currentQty - qtyIncrement;
                        qtyPlus.classList.remove('disabled');
                        this.updateCart(qty.value);
                    }
                    if (currentQty - qtyIncrement <= qtyMin) {
                        qtyMinus.classList.add('disabled');
                    }
                }
            });

            qtyPlus.addEventListener('click', (e) => {
                e.preventDefault();
                if (!qtyPlus.classList.contains('disabled')) {
                    const currentQty = parseInt(qty.value);
                    if (currentQty + qtyIncrement <= qtyMax) {
                        qty.value = currentQty + qtyIncrement;
                        qtyMinus.classList.remove('disabled');
                        this.updateCart(qty.value);
                    }
                    if (currentQty + qtyIncrement >= qtyMax) {
                        qtyPlus.classList.add('disabled');
                    }
                }
            });
        }
        updateCart(quantity){
			setTimeout(()=>{
				document.getElementById('AjaxCartForm').updateCartQty(this.closest('[data-js-cart-item]'), parseInt(quantity));
			}, 50);
		}
    }

    if ( typeof customElements.get('cart-product-quantity') == 'undefined' ) {
        customElements.define('cart-product-quantity', CartProductQuantity);
    }

}
