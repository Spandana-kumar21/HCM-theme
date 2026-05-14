if ( typeof ProductPage !== 'function' ) {

	class ProductPage extends HTMLElement {

		constructor(){

			super();

			this.productGallery = this.querySelector('[data-js-product-gallery]');
			this.productSlider = this.querySelector('css-slider');

			this.pickupAvailabilityCompact = this.querySelector('pickup-availability-compact');
			this.pickupAvailabilityExtended = this.querySelector('pickup-availability-extended');

			// Gallery thumbnails

			if ( this.productSlider ) {

				const productGaleryThumbnails = this.querySelector('.product-gallery__thumbnails-holder');

				if ( this.querySelector('.product-gallery__thumbnails .thumbnail') ) {

					this.querySelectorAll('.product-gallery__thumbnails .thumbnail').forEach((elm, i)=>{
						if ( i == 0 )  {
							elm.classList.add('active');
						}
						elm.addEventListener('click',e=>{
							if ( this.productSlider.sliderEnabled ) {
								this.productSlider.changeSlide(e.currentTarget.dataset.index);
							} else {
								window.scrollTo({
									top: this.productGallery.querySelector(`.product-gallery-item[data-index="${e.currentTarget.dataset.index}"]`).offsetTop + this.offsetTop,
									behavior: 'smooth'
								});
								this.thumbnailNavigationHelper(e.currentTarget.dataset.index);
							}
							this._pauseAllMedia();
							this._playMedia(this.productGallery.querySelector(`.product-gallery-item[data-index="${e.currentTarget.dataset.index}"]`));
							productGaleryThumbnails.scrollTo({
								left: elm.offsetLeft - 50,
								behaviour: 'smooth'
							})
						});
					})

					this.productSlider.addEventListener('change', e=>{
						this.thumbnailNavigationHelper(e.target.index);
					});

				}

				this.productSlider.addEventListener('navigation', e=>{
					this._playMedia(this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`));
				})
				this.productSlider.addEventListener('change', e=>{
					this._pauseAllMedia();
					if ( this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`).dataset.productMediaType == 'model' ) {
						if ( this.xrButton ) {
							this.xrButton.setAttribute('data-shopify-model3d-id', this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`).dataset.mediaId);
						}
						setTimeout(()=>{
							this.productSlider.querySelector('.css-slider-holder').classList.add('css-slider--disable-dragging');
						}, 150);
					}
				});

				// Parallax

				this.productSlider.addEventListener('ready', (e)=>{

					if ( this.firstProductGalleryIndex ) {
						this.productSlider.changeSlide(this.firstProductGalleryIndex, "auto");
					}

					const productSlides = this.productSlider.querySelectorAll('.product-gallery-item');
					const productFigures = this.querySelectorAll('.apply-gallery-animation');
					this.productSlider.addEventListener('scroll', ()=>{
						const scrollX = -this.productSlider.element.scrollLeft;
						productSlides.forEach((slide,i)=>{
							const media = productFigures[i];
							if ( media ) {
								media.style.transform = `translateX(${( slide.offsetLeft + scrollX ) * -1/3}px)`;
							}
						});
					});

				});

			}

			// Product variant event listener for theme specific logic
			const isSubscription = this.querySelector('[name="is_subscription_product"]')?.value;			

			this.productVariants = this.querySelector('product-variants');
			if ( this.productVariants ) {
				this.productVariants.addEventListener('VARIANT_CHANGE', this.onVariantChangeHandler.bind(this));
				this.onVariantChangeHandler({target:this.productVariants});
				
				if (!KROWN.customer.isB2B && isSubscription) {
					this.subscribeListener();
				}
			}

			if (!KROWN.customer.isB2B) {
				this.bundleListener();
			}

			// show cart drawer when element is added to cart

			if ( ! document.body.classList.contains('template-cart') && KROWN.settings.cart_action == 'overlay' ) {

				let addToCartEnter = false;
				if ( this.querySelector('[data-js-product-add-to-cart]') ) {
					this.querySelector('[data-js-product-add-to-cart]').addEventListener('keyup', e=>{
						if ( e.keyCode == window.KEYCODES.RETURN ) {
							addToCartEnter = true;
						}
					})
				}

				if ( this.querySelector('[data-js-product-form]') ) {
					this.querySelector('[data-js-product-form]').addEventListener('add-to-cart', ()=>{
						document.getElementById('site-cart-sidebar').show();
						if ( document.getElementById('cart-recommendations') ) {
							document.getElementById('cart-recommendations').generateRecommendations();
						}
						if ( addToCartEnter ) {
							setTimeout(()=>{
								document.querySelector('#site-cart-sidebar [data-js-close]').focus();
							}, 200);
						}
					});
				}

			}

			// Check for models

			const models = this.querySelectorAll('product-model');
			if ( models.length > 0 ) {
				window.ProductModel.loadShopifyXR();
				this.xrButton = this.querySelector('.product-gallery__view-in-space');
			}

			// hide buy now button if stock disabled

			const addToCartButton = this.querySelector('[data-js-product-add-to-cart]');
			if ( addToCartButton ) {
				if ( addToCartButton.classList.contains('disabled') ) {
					this.querySelector('product-form').classList.add('disable-buy-button');
				} else {
					this.querySelector('product-form').classList.remove('disable-buy-button');
				}
				const buyObserver = new MutationObserver(()=>{
					if ( addToCartButton.classList.contains('disabled') ) {
						this.querySelector('product-form').classList.add('disable-buy-button');
					} else {
						this.querySelector('product-form').classList.remove('disable-buy-button');
					}
				});
				buyObserver.observe(addToCartButton,{ attributes: true, childList: false, subtree: false });
			}

			// update secondary price if present

			this.priceCompact = this.querySelector('[data-js-product-price-compact');
			this.priceExtended = this.querySelector('[data-js-product-price-extended');

			if ( this.priceCompact ) {
				this.priceCompact.priceOriginal = this.priceCompact.querySelector('[data-js-product-price-original]');
				this.priceCompact.priceCompare = this.priceCompact.querySelector('[data-js-product-price-compare]');
				this.priceCompact.priceUnit = this.priceCompact.querySelector('[data-js-product-price-unit]');
			}
			if ( this.priceExtended ) {
				this.priceExtended.priceOriginal = this.priceExtended.querySelector('[data-js-product-price-original]');
				this.priceExtended.priceCompare = this.priceExtended.querySelector('[data-js-product-price-compare]');
				this.priceExtended.priceUnit = this.priceExtended.querySelector('[data-js-product-price-unit]');
			}

		}

		bundleListener() {
      const vatRate = parseFloat(23 || 0) / 100;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.querySelector('.rbu-qb-tier-container')) {
              const finalPrices = node.querySelectorAll('.rbu-qb-tier-price-final, .rbu-qb-tier-price-original');
              finalPrices.forEach((priceNode) => {
                const price = parseFloat(priceNode.textContent.slice(1).replace(',', '.')).toFixed(2) * (1 + vatRate);
                priceNode.textContent = priceNode.textContent.replace(/[\d,.]+/, price.toFixed(2));
              });

            }

            if (node.nodeType === 1 && node.classList.contains('samita-container')) {
              const finalPrices = node.querySelectorAll('.samita_productLabel-content-text > div:last-child > span');
              finalPrices.forEach((priceNode) => {
                const price = parseFloat(priceNode.textContent.slice(1).replace(',', '.')).toFixed(2) * (1 + vatRate);
                priceNode.textContent = priceNode.textContent.replace(/[\d,.]+/, price.toFixed(2));
              });

            }
          });
        });
      });
              observer.disconnect();

      observer.observe(document.body, { childList: true, subtree: true });
    }

        subscribeListener() {
			this.querySelector('.homecare-price-type').innerHTML = 'Inc VAT'; 

			document.addEventListener('sealsubs:price_update', (e) => {
				const vatRate = parseFloat(23 || 0) / 100;
				const price = e.detail.price * (1 + vatRate);
				const element = e.detail.element;
				const priceFormatted = this.productVariants._formatMoney(price, KROWN.settings.shop_money_format);

				const oneTimePurchasePrice = element.querySelector('.sls-one-time-price .conversion-bear-money');
				const subscriptionPrice = element.querySelector('.sls-selling-plan-group-price .conversion-bear-money');

				if (e.detail.isSubscriptionPrice) {
					oneTimePurchasePrice.innerHTML = this.productVariants._formatMoney(price / 0.9, KROWN.settings.shop_money_format);
					subscriptionPrice.innerHTML = priceFormatted;
				} else {
					oneTimePurchasePrice.innerHTML = priceFormatted;
					subscriptionPrice.innerHTML = this.productVariants._formatMoney(price * 0.9, KROWN.settings.shop_money_format);
				}
				
				if (this.priceCompact && this.priceCompact.priceOriginal.innerHTML !== priceFormatted) {
					this.priceCompact.priceOriginal.innerHTML = priceFormatted;
				} else if (this.priceExtended && this.priceExtended.priceOriginal.innerHTML !== priceFormatted) {
					this.priceExtended.priceOriginal.innerHTML = priceFormatted;
				}
			});
		}

		thumbnailNavigationHelper(index=0){
			this.querySelectorAll('.product-gallery__thumbnails .thumbnail').forEach((elm, i)=>{
				if ( i == index )
					elm.classList.add('active');
				else
					elm.classList.remove('active');
			});
		}

		onVariantChangeHandler(e){
			let variant = e.target.currentVariant;
            let target = e.target;
			let productId;

			if (e.target.dataset.productId) {
				productId = e.target.dataset.productId;
			}

			if (variant) {

				// image handling
				if (variant.featured_media != null) {
					let variantImg = this.productGallery.querySelector('.product-gallery-item[data-media-id="' + variant.featured_media.id + '"]');
					if (variantImg) {
						if (this.productGallery.classList.contains('product-gallery--slider') || (this.productGallery.classList.contains('product-gallery--scroll') && window.innerWidth < 1024)) {
							if (this.productGallery.querySelector('css-slider') && this.productGallery.querySelector('css-slider').sliderEnabled) {
								this.productGallery.querySelector('css-slider').changeSlide(variantImg.dataset.index);
							} else {
								this.firstProductGalleryIndex = variantImg.dataset.index;
							}
						} else {
							window.scrollTo({
								top: variantImg.offsetTop,
								behavior: 'smooth'
							});
						}
					}
				}

				// refresh pickup availability widgets
				if (this.pickupAvailabilityCompact && this.pickupAvailabilityCompact.classList.contains('active')) {
					this.querySelector('pickup-availability-compact').style.display = 'block';
					this.querySelector('pickup-availability-compact').fetchAvailability(variant.id);
				}

				if (this.pickupAvailabilityExtended && this.pickupAvailabilityExtended.classList.contains('active')) {
					this.querySelector('pickup-availability-extended').style.display = 'block';
					this.querySelector('pickup-availability-extended').fetchAvailability(variant.id);
				}

              	// Set minimum quantity for B2B customers
				if (KROWN.customer.isB2B === 'true') {
					if (this.querySelector('.qty-selector')) {
						const qty = this.querySelector('.qty-selector');
						qty.setAttribute('min', variant.quantity_rule.min);
						qty.setAttribute('value', variant.quantity_rule.min);
						qty.value = variant.quantity_rule.min;
					}
				}

				// Update the B2B quantity rules banner in product-quantity.liquid
				const b2bQtyRulesContainer = document.querySelector('.b2b-qty-rules-container');
				if (b2bQtyRulesContainer) {
					const quantityIncrement = variant.quantity_rule.min;
					b2bQtyRulesContainer.textContent = `Sold in cases of: ${quantityIncrement} units`;
				}

			} else {

				if (this.pickupAvailabilityCompact && this.pickupAvailabilityCompact.classList.contains('active')) {
					this.querySelector('pickup-availability-compact').style.display = 'none';
				}

				if (this.pickupAvailabilityExtended && this.pickupAvailabilityExtended.classList.contains('active')) {
					this.querySelector('pickup-availability-extended').style.display = 'none';
				}

			}

			// update prices (overwrites the framework)
			this.updatePriceDisplay(variant, target, this.priceCompact, productId);
			this.updatePriceDisplay(variant, target, this.priceExtended, productId);
		}

        updatePriceDisplay(variant, target, priceElement, productId) {
            if (!priceElement) return;

            if (!variant) {
                priceElement.priceOriginal.innerHTML = '';
                priceElement.priceCompare.innerHTML = '';
                priceElement.priceUnit.innerHTML = '';
            } else {
                let price, compareAtPrice, unitPrice;

                // Fetch metafields data from the JSON script element
                let metafieldsData;


				if (document.getElementById(`ProductVariantMetafields`)) {
					metafieldsData = JSON.parse(document.getElementById(`ProductVariantMetafields`).textContent);
				} else {
					metafieldsData = JSON.parse(document.getElementById(`ProductVariantMetafields-${productId}`).textContent);
				}
                // Find the metafields for the current variant
                const metafields = metafieldsData.find(meta => meta.id === variant.id)?.metafields || {};

                console.error('Metafields', metafields);
                console.error('Tax rate', parseFloat(metafields.custom?.tax_rate || 0));

                if (KROWN.customer.isB2B === 'true') {
                    // B2B Customer
                    price = variant.price;
                    compareAtPrice = variant.compare_at_price;
                    unitPrice = variant.unit_price;
                } else {
                    // Non-B2B Customer, apply VAT
                    const vatRate = parseFloat(metafields.custom?.tax_rate || 0) / 100;
                    price = variant.price * (1 + vatRate);
                    compareAtPrice = variant.compare_at_price * (1 + vatRate);
                    unitPrice = variant.unit_price * (1 + vatRate);
                }

                priceElement.priceOriginal.innerHTML = `${KROWN.customer.isB2B === 'true' ? '<span class="now-price-b2b-text">Now</span>': ''}` + this.productVariants._formatMoney(price, KROWN.settings.shop_money_format);
                if (compareAtPrice > price) {
					if (KROWN.customer.isB2B === 'true') {
						priceElement.priceCompare.innerHTML = `<span class="was-price-b2b-text">Unit Price was: </span><span class="was-rice-b2b-amount">${this.productVariants._formatMoney(compareAtPrice, KROWN.settings.shop_money_format)}</span>`;

					} else {
						priceElement.priceCompare.innerHTML = `<span>${this.productVariants._formatMoney(compareAtPrice, KROWN.settings.shop_money_format)}</span><span>${KROWN.settings.locales.product_compare_price.replace('$SAVE_PRICE', this.productVariants._formatMoney(compareAtPrice - price, KROWN.settings.shop_money_format))}</span>`;
					}
                } else {
                    priceElement.priceCompare.innerHTML = '';
                }

                if (variant.unit_price_measurement) {
                    priceElement.priceUnit.innerHTML = `
                        ${this.productVariants._formatMoney(unitPrice, KROWN.settings.shop_money_format)} /
                        ${(variant.unit_price_measurement.reference_value != 1 ? variant.unit_price_measurement.reference_value + ' ' : '' )}
                        ${variant.unit_price_measurement.reference_unit}
                    `;
                } else {
                    priceElement.priceUnit.innerHTML = '';
                }
            }
        }

		_pauseAllMedia(){

			document.querySelectorAll('.product-gallery .js-youtube').forEach(video => {
				video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
			});
			document.querySelectorAll('.product-gallery .js-vimeo').forEach(video => {
				video.contentWindow.postMessage('{"method":"pause"}', '*');
			});
			document.querySelectorAll('.product-gallery video').forEach(video => video.pause());
			document.querySelectorAll('.product-gallery product-model').forEach(model => {
				if ( model.modelViewerUI )
					model.modelViewerUI.pause()
			});
		}

		_playMedia(media){
			switch ( media.dataset.productMediaType ) {
				case 'video':
					if ( media.querySelector('video') ) {
						media.querySelector('video').play();
					}
					break;
				case 'external_video-youtube':
					if ( media.querySelector('.js-youtube') ) {
						media.querySelector('.js-youtube').contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
					}
					break;
				case 'external_video-vimeo':
					if ( media.querySelector('.js-vimeo') ) {
						media.querySelector('.js-vimeo').contentWindow.postMessage('{"method":"play"}', '*');
					}
					break;
			}
		}

	}

  if ( typeof customElements.get('product-page') == 'undefined' ) {
		customElements.define('product-page', ProductPage);
	}

}