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

				// Drag-to-scroll for standard thumbnail strip
				if (productGaleryThumbnails) {
					let _dragStart = 0, _dragScrollLeft = 0, _isDragging = false;
					productGaleryThumbnails.addEventListener('mousedown', e => {
						_isDragging = true;
						_dragStart = e.pageX - productGaleryThumbnails.offsetLeft;
						_dragScrollLeft = productGaleryThumbnails.scrollLeft;
						productGaleryThumbnails.classList.add('is-dragging');
					});
					document.addEventListener('mouseup', () => {
						_isDragging = false;
						productGaleryThumbnails.classList.remove('is-dragging');
					});
					document.addEventListener('mousemove', e => {
						if (!_isDragging) return;
						e.preventDefault();
						productGaleryThumbnails.scrollLeft = _dragScrollLeft - (e.pageX - productGaleryThumbnails.offsetLeft - _dragStart);
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

				// image handling — variant gallery metafield (custom.gallery_images) takes priority
				const _metafieldsEl = document.getElementById('ProductVariantMetafields');
				const _allMeta = _metafieldsEl ? JSON.parse(_metafieldsEl.textContent) : [];
				const _variantMeta = _allMeta.find(v => v.id === variant.id);
				// Only use metafield gallery when the product has more than one variant;
				// single-variant products use the standard uploaded media instead.
				const _hasMultipleVariants = _allMeta.length > 1;
				let _galleryImages = (_hasMultipleVariants
					? (_variantMeta?.metafields?.custom?.gallery_images || [])
					: []
				).slice();

				const _galleryGrid = this.productGallery.querySelector('.grid');
				let _thumbsHolder = this.querySelector('.product-gallery__thumbnails-holder');
				const _cssSlider = this.productGallery.querySelector('css-slider');
				const _sliderHolder = _cssSlider?.querySelector('.css-slider-holder') || _galleryGrid;
				const _isSlider = this.productGallery.classList.contains('product-gallery--slider') ||
					(this.productGallery.classList.contains('product-gallery--scroll') && window.innerWidth < 1024);

				// True when the current variant has metafield images to replace the gallery
				const _usingMetafield = _galleryImages.length > 0;

				// Single-variant (or variant with no metafield): use all uploaded product media
				if (!_usingMetafield) {
					const _allMediaEl = document.getElementById('ProductAllMedia');
					if (_allMediaEl) {
						try { _galleryImages = JSON.parse(_allMediaEl.textContent); } catch(e) {}
					}
					// Ensure the uploaded video always sits at position 1 (same as metafield path)
					const _vidIdx = _galleryImages.findIndex(m => m.isVideo);
					if (_vidIdx > 1) {
						const [_vid] = _galleryImages.splice(_vidIdx, 1);
						_galleryImages.splice(1, 0, _vid);
					}
				}

				if (_galleryImages.length > 0) {

					if (_usingMetafield) {
						// Prepend variant featured image if not already first
						if (variant.featured_image && variant.featured_image.src) {
							const fSrc   = variant.featured_image.src;
							const fBase  = fSrc.split('?')[0];
							const fThumb = fBase + '?width=200';
							const fZoom  = fBase + '?width=2048';
							const fAlt   = variant.featured_image.alt || '';
							const alreadyFirst = _galleryImages[0]?.src?.split('?')[0].split('/').pop() ===
								fBase.split('/').pop();
							if (!alreadyFirst) {
								_galleryImages.unshift({ src: fSrc, zoom: fZoom, thumb: fThumb, alt: fAlt });
							}
						}

						// Inject product video at position 1 (video already present in ProductAllMedia)
						const _videoScriptEl = document.getElementById('ProductVideoMedia');
						if (_videoScriptEl) {
							try {
								const _vd = JSON.parse(_videoScriptEl.textContent);
								_vd.isVideo = true;
								_galleryImages.splice(Math.min(1, _galleryImages.length), 0, _vd);
							} catch(e) {}
						}

						// Save original gallery HTML once (before first swap)
						if (!this._origGalleryHTML) {
							this._origGalleryHTML = _galleryGrid ? _galleryGrid.innerHTML : null;
							this._origThumbsHTML  = _thumbsHolder ? _thumbsHolder.innerHTML : null;
						}

						// Build slides — add css-slide class so css-slider recognises them after resetSlider()
						if (_galleryGrid) {
							_galleryGrid.innerHTML = _galleryImages.map((img, i) => {
								if (img.isVideo) {
									const _sources = (img.sources || []).map(s =>
										`<source src="${s.url}" type="${s.type}">`).join('');
									return `<div class="product-gallery-item css-slide element--border-radius"
										data-product-media-type="video"
										data-media-id="variant-video-${i}"
										data-index="${i}"
										style="padding-top:100%;background:#000">
										<video controls playsinline preload="auto" poster="${img.preview}"
											style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain">
											${_sources}
										</video>
									</div>`;
								}
								return `<div class="product-gallery-item css-slide element--border-radius"
									data-product-media-type="image"
									data-media-id="variant-${i}"
									data-index="${i}"
									data-image-zoom
									style="padding-top:100%">
									<img src="${img.src}"
										alt="${img.alt}"
										loading="${i === 0 ? 'eager' : 'lazy'}"
										class="element--border-radius"
										style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;display:block">
									${img.zoom ? `<product-image-zoom class="product-gallery-item__zoom" data-image="${img.zoom}" aria-hidden="true" tabindex="-1"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9.08008" cy="9" r="8" stroke="var(--main-text)" stroke-width="2" style="fill:none!important" /><rect x="14.2988" y="15.9062" width="1.98612" height="6.65426" transform="rotate(-45 14.2988 15.9062)" fill="#111111"/><path d="M8.08008 5H10.0801V13H8.08008V5Z" fill="#111111"/><path d="M13.0801 8V10L5.08008 10L5.08008 8L13.0801 8Z" fill="#111111"/></svg></product-image-zoom>` : ''}
								</div>`;
							}).join('');
						}

						// Force css-slider to rescan new slides and rebuild dots/nav
						if (_cssSlider && _cssSlider.sliderEnabled) {
							_cssSlider.items = _cssSlider.querySelectorAll(_cssSlider.o.selector);
							_cssSlider.resetSlider();
						} else if (_sliderHolder) {
							_sliderHolder.scrollLeft = 0;
						}

					} else {
						// Single-variant: rebuild gallery from ProductAllMedia so video slides
						// are plain <video> elements that _syncVideo can control.
						if (!this._origGalleryHTML) {
							this._origGalleryHTML = _galleryGrid ? _galleryGrid.innerHTML : null;
							this._origThumbsHTML  = _thumbsHolder ? _thumbsHolder.innerHTML : null;
						}
						if (_galleryGrid) {
							_galleryGrid.innerHTML = _galleryImages.map((img, i) => {
								if (img.isVideo) {
									const _sources = (img.sources || []).map(s =>
										`<source src="${s.url}" type="${s.type}">`).join('');
									return `<div class="product-gallery-item css-slide element--border-radius"
										data-product-media-type="video"
										data-media-id="variant-video-${i}"
										data-index="${i}"
										style="padding-top:100%;background:#000">
										<video controls playsinline preload="auto" poster="${img.preview}"
											style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain">
											${_sources}
										</video>
									</div>`;
								}
								return `<div class="product-gallery-item css-slide element--border-radius"
									data-product-media-type="image"
									data-media-id="variant-${i}"
									data-index="${i}"
									data-image-zoom
									style="padding-top:100%">
									<img src="${img.src}"
										alt="${img.alt}"
										loading="${i === 0 ? 'eager' : 'lazy'}"
										class="element--border-radius"
										style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;display:block">
									${img.zoom ? `<product-image-zoom class="product-gallery-item__zoom" data-image="${img.zoom}" aria-hidden="true" tabindex="-1"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9.08008" cy="9" r="8" stroke="var(--main-text)" stroke-width="2" style="fill:none!important" /><rect x="14.2988" y="15.9062" width="1.98612" height="6.65426" transform="rotate(-45 14.2988 15.9062)" fill="#111111"/><path d="M8.08008 5H10.0801V13H8.08008V5Z" fill="#111111"/><path d="M13.0801 8V10L5.08008 10L5.08008 8L13.0801 8Z" fill="#111111"/></svg></product-image-zoom>` : ''}
								</div>`;
							}).join('');
						}
						if (_cssSlider && _cssSlider.sliderEnabled) {
							_cssSlider.items = _cssSlider.querySelectorAll(_cssSlider.o.selector);
							_cssSlider.resetSlider();
						} else if (_sliderHolder) {
							_sliderHolder.scrollLeft = 0;
						}
					}

					// Build thumbnail viewport — inserted BETWEEN the slider's own < > arrows on desktop
					// No own arrows; the existing css-slider arrows navigate slides and sync thumbnails
					if (!this._variantThumbViewport) {
						const _vp = document.createElement('div');
						_vp.className = 'variant-thumb-carousel__viewport';
						const _tr = document.createElement('div');
						_tr.className = 'variant-thumb-carousel__track';
						_vp.appendChild(_tr);
						this._variantThumbViewport = _vp;
					}

					const _viewport = this._variantThumbViewport;
					const _track = _viewport.querySelector('.variant-thumb-carousel__track');
					_viewport._offset = 0;
					let _VISIBLE = 4;

					// Populate thumbnail images
					_track.innerHTML = _galleryImages.map((img, i) => `
						<button class="thumbnail element--border-radius ${i === 0 ? 'active' : ''}"
							data-vt="${i}" tabindex="0" style="position:relative;overflow:hidden">
							<img src="${img.thumb}" alt="${img.alt}"
								class="thumbnail__image" loading="lazy"
								style="width:100%;height:100%;object-fit:cover">
							${img.isVideo ? `<span class="thumbnail__badge" aria-hidden="true"
								style="position:absolute;bottom:4px;right:4px;display:flex;align-items:center;justify-content:center;
								width:20px;height:20px;background:rgba(0,0,0,0.55);border-radius:50%">
								<svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 1.5L8 5L1 8.5V1.5Z" fill="white"/>
								</svg></span>` : ''}
						</button>`).join('');

					// When all thumbs fit without scrolling, size viewport to content
					// so no empty gap appears after the last thumbnail
					_viewport.style.flex = _galleryImages.length <= _VISIBLE ? '0 0 auto' : '1';

					const _vtUpdate = () => {
						const _th = _track.querySelector('.thumbnail');
						const _tw = _th ? (_th.offsetWidth + 8) : 88; // thumb width + 0.5rem gap
						_track.style.transform = `translateX(-${_viewport._offset * _tw}px)`;
					};

					// Pause all gallery videos then autoplay the one at idx after slide transition
					const _syncVideo = (idx) => {
						_galleryGrid.querySelectorAll('video').forEach(v => { v.pause(); v.currentTime = 0; });
						if (_galleryImages[idx] && _galleryImages[idx].isVideo) {
							setTimeout(() => {
								const _slide = _galleryGrid.querySelectorAll('.product-gallery-item')[idx];
								const _vid = _slide && _slide.querySelector('video');
								if (_vid) _vid.play().catch(() => {});
							}, 350);
						}
					};

					// Thumbnail click → navigate main image
					_track.querySelectorAll('.thumbnail').forEach((thumb, i) => {
						thumb.addEventListener('click', () => {
							const _max = Math.max(0, _galleryImages.length - _VISIBLE);
							if (i < _viewport._offset) {
								_viewport._offset = i;
							} else if (i >= _viewport._offset + _VISIBLE) {
								_viewport._offset = Math.min(i - _VISIBLE + 1, _max);
							}
							_vtUpdate();
							_track.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
							thumb.classList.add('active');
							if (_cssSlider && _cssSlider.sliderEnabled) { _cssSlider.changeSlide(i); }
							_syncVideo(i);
						});
					});

					// Sync active thumbnail + scroll track when slider arrows / swipe navigate
					if (_cssSlider) {
						if (this._vtSliderListener) {
							_cssSlider.removeEventListener('change', this._vtSliderListener);
						}
						this._vtSliderListener = () => {
							const _ai = _cssSlider.index;
							_track.querySelectorAll('.thumbnail').forEach((t, i) => t.classList.toggle('active', i === _ai));
							const _max = Math.max(0, _galleryImages.length - _VISIBLE);
							if (_ai < _viewport._offset) {
								_viewport._offset = _ai;
								_vtUpdate();
							} else if (_ai >= _viewport._offset + _VISIBLE) {
								_viewport._offset = Math.min(_ai - _VISIBLE + 1, _max);
								_vtUpdate();
							}
							_syncVideo(_ai);
						};
						_cssSlider.addEventListener('change', this._vtSliderListener);
					}

					// Place viewport — defer until slider ready if nav container not yet created (first page load)
					const _insertViewport = () => {
						const _navContC = _cssSlider?.querySelector('.css-slider-navigation-container');
						if (_navContC) {
							const _nextC = _navContC.querySelector('.css-slider-next');
							const _prevC = _navContC.querySelector('.css-slider-prev');
							const _dotsC = _navContC.querySelector('.css-slider-dot-navigation');
							if (_dotsC) _dotsC.style.display = 'none';
							if (_viewport.parentNode !== _navContC) {
								_nextC ? _navContC.insertBefore(_viewport, _nextC) : _navContC.appendChild(_viewport);
							}
							_navContC.style.marginBottom = '0.5rem';
							// Make nav container a centred flex row so thumbnails sit in the middle
							_navContC.style.display = 'flex';
							_navContC.style.alignItems = 'center';
							_navContC.style.justifyContent = 'center';
							_navContC.style.gap = '0.5rem';

							const _refresh = () => {
								const _th = _track.querySelector('.thumbnail');
								const _tw = _th ? (_th.offsetWidth + 8) : 88;
								const _containerW = _navContC.offsetWidth;
								// Arrows appear only when there are more than 6 thumbnails
								const _overflow = _galleryImages.length > 6;
								if (_overflow) {
									// Compute how many thumbnails fit with arrows present
									const _arrowW = (_prevC?.offsetWidth || 36) + 8;
									_VISIBLE = Math.max(1, Math.floor((_containerW - 2 * _arrowW) / _tw));
									// Use exact pixel width so no empty gap appears after last thumbnail
									const _exactW = _VISIBLE * _tw - 8;
									_viewport.style.flex = `0 0 ${_exactW}px`;
								} else {
									// No scrolling — treat all thumbnails as visible so track stays at 0
									_VISIBLE = _galleryImages.length;
									_viewport.style.flex = '0 0 auto';
								}
								// Centre thumbnails in the track when no scrolling is needed
								_track.style.justifyContent = _overflow ? '' : 'center';
								if (_prevC) _prevC.style.display = _overflow ? '' : 'none';
								if (_nextC) _nextC.style.display = _overflow ? '' : 'none';
								_vtUpdate();
							};

							if (this._vtResizeListener) window.removeEventListener('resize', this._vtResizeListener);
							this._vtResizeListener = _refresh;
							window.addEventListener('resize', _refresh, { passive: true });
							setTimeout(_refresh, 50);
						} else if (_cssSlider) {
							_cssSlider.addEventListener('ready', _insertViewport, { once: true });
						}
					};
					_insertViewport();

				} else {
					// No metafield — restore original gallery
					if (this._origGalleryHTML && _galleryGrid) {
						_galleryGrid.innerHTML = this._origGalleryHTML;
						this._origGalleryHTML = null;
						if (_cssSlider && _cssSlider.sliderEnabled) {
							_cssSlider.items = _cssSlider.querySelectorAll(_cssSlider.o.selector);
							_cssSlider.resetSlider();
						}
					}

					// Remove thumbnail viewport from nav container and cleanup
					if (this._variantThumbViewport) {
						this._variantThumbViewport.remove();
						this._variantThumbViewport = null;
					}
					if (this._vtSliderListener && _cssSlider) {
						_cssSlider.removeEventListener('change', this._vtSliderListener);
						this._vtSliderListener = null;
					}
					if (this._vtResizeListener) {
						window.removeEventListener('resize', this._vtResizeListener);
						this._vtResizeListener = null;
					}

					// Restore slider dot navigation and nav container margin
					const _navContR = _cssSlider?.querySelector('.css-slider-navigation-container');
					const _dotsR = _navContR?.querySelector('.css-slider-dot-navigation');
					const _prevR = _navContR?.querySelector('.css-slider-prev');
					const _nextR = _navContR?.querySelector('.css-slider-next');
					if (_dotsR) _dotsR.style.display = '';
					if (_prevR) _prevR.style.display = 'none';
					if (_nextR) _nextR.style.display = 'none';
					if (_navContR) {
						_navContR.style.marginBottom = '';
						_navContR.style.display = '';
						_navContR.style.alignItems = '';
						_navContR.style.justifyContent = '';
						_navContR.style.gap = '';
					}

					// Restore original thumbnail strip content if one existed
					const _origHolder = this.querySelector('.product-gallery__thumbnails-holder');
					if (this._origThumbsHTML && _origHolder) {
						_origHolder.innerHTML = this._origThumbsHTML;
						this._origThumbsHTML = null;
						_origHolder.querySelectorAll('.thumbnail').forEach((elm, i) => {
							if (i === 0) elm.classList.add('active');
							elm.addEventListener('click', e => {
								if (_cssSlider && _cssSlider.sliderEnabled) {
									_cssSlider.changeSlide(e.currentTarget.dataset.index);
								}
							});
						});
					}

					// Fall back to featured_media jump
					if (variant.featured_media != null) {
						const variantImg = this.productGallery.querySelector(
							'.product-gallery-item[data-media-id="' + variant.featured_media.id + '"]');
						if (variantImg) {
							if (_isSlider && _cssSlider && _cssSlider.sliderEnabled) {
								_cssSlider.changeSlide(variantImg.dataset.index);
							} else if (_isSlider) {
								this.firstProductGalleryIndex = variantImg.dataset.index;
							} else {
								window.scrollTo({ top: variantImg.offsetTop, behavior: 'smooth' });
							}
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

                if (priceElement.priceUnit) {
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