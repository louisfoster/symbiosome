export type OriginMessageHandler = ( origin: string, message: unknown ) => void

export interface Portal
{
	frame: HTMLIFrameElement
	window: Window
}

export interface SymbiosomeContext
{
	isPortal: boolean
	onPortalAdded?: ( origin: string ) => void
	onListenToOrigin?: ( origin: string ) => void
	onPushedMessage?: ( origin: string, message: unknown ) => void
	onPortalRemoved?: ( origin: string ) => void
	onListenerRemoved?: ( origin: string ) => void
	debug?: ( message: string, data?: unknown[] ) => void
}

/**
 * Symbiosome allows for communicating between web apps. Its central
 * key is the "origin" which is a base domain, e.g. `https://example.com`
 * 
 * It provides the following functionality:
 * 
 * - open portal URL for other origin
 * - send message (literal or structured data [object, nested object, array]) to portal
 * - receive message from portal
 * - re-broadcast message to own origin
 * 
 * Callbacks are optional and instances are **not** portals by default.
 * If you provide a default context.onPortalAdded function, it will be called
 * on instantiation with the context's window.origin such that it
 * can be used for lists of push endpoints.
 * 
 * Debug function can be passed which will receive an array where the
 * first item is a message and optional subsequent items are data
 * related to the message.
 */
export class Symbiosome
{
	private listeners: {[origin: string]: ( origin: string, message: unknown ) => void}

	private portals: {[origin: string]: Portal}

	private parent?: Window

	private parentOrigin?: string

	private broadcastChannel: BroadcastChannel

	private channelID: string

	constructor( private context: SymbiosomeContext )
	{
		this.portals = {}

		this.listeners = {}

		this.channelID = `symbiosome__${window.location.origin}`

		this.context.debug?.( `Channel ID`, [ this.channelID ] )

		if ( this.context.isPortal )
		{
			/**
			 * A portal is meant to be opened in an iframe from a different domain.
			 * Therefore it should _always_ have 1 and only 1 parent.
			 */
			const parent = new URLSearchParams( window.location.search ).get( `parent` )

			this.context.debug?.( `Parent origin`, [ parent ] )

			this.parent = !parent || parent === window.origin
				? undefined
				: window.parent
	
			this.parentOrigin = this.parent && parent ? parent : undefined

			/**
			 * An instance can be a portal and not have a parent if an instance is
			 * also used in non-portal contexts. However, we don't fail here
			 * because there's nothing wrong with that, but we can log this anyway.
			 */
			if ( !this.parentOrigin )
			{
				this.context.debug?.( `Is portal but parent is undefined` )
			}
			
			/**
			 * Only portals receive messages on this port, which originate at the parent.
			 * Communication is unidirectional from parent -> portal. So to send messages
			 * back to the parent, the parent requires it's own portal to be referenced
			 * from the child (inverting the relationship).
			 */
			this.handlePortalMessage = this.handlePortalMessage.bind( this )

			window.addEventListener( `message`, this.handlePortalMessage, false )
		}

		/**
		 * Every instance of symbiosome can receive messages on this ID.
		 * Each instance will need to be provided with its own list of allowed origins,
		 * that is, all domains (including its own) that it can receive messages from.
		 * Instances broadcasting messages don't receive their own messages.
		 */
		this.broadcastChannel = new BroadcastChannel( this.channelID )

		this.handleBroadcast = this.handleBroadcast.bind( this )

		this.broadcastChannel.addEventListener( `message`, this.handleBroadcast )

		this.addPortal = this.addPortal.bind( this )

		this.listenToOrigin = this.listenToOrigin.bind( this )

		this.pushToOrigin = this.pushToOrigin.bind( this )

		/**
		 * Emit own origin for use in lists of origins that can be messaged
		 */
		this.context.onPortalAdded?.( window.origin )
	}

	private handleBroadcast( event: MessageEvent )
	{
		this.context.debug?.( `Incoming broadcast`, [ event ] )

		/**
		 * We only handle broadcasts originating from origins we've white-listed
		 * for the instance. Each context's instance maintains its own list that is
		 * built using the listenToOrigin function. Any further filtering
		 * of the broadcast message should be done via onMessage function.
		 */
		if ( !this.listeners[ event.data.origin ] )
		{
			this.context.debug?.( `Broadcast received from unlisted origin`, [ event ] )
			
			return
		}

		this.listeners[ event.data.origin ]( event.data.origin, event.data.data )
	}

	private broadcast( origin: string, data: unknown )
	{
		/**
		 * Message event can't be passed, although it can be destructured
		 * to retain the 2 relevant pieces of information.
		 */
		this.broadcastChannel.postMessage( { origin, data } )

		/**
		 * If this context also listens for messages from the parent, then it will
		 * need to emit this event as it won't receive the broadcasts it sends.
		 */
		if ( this.listeners[ origin ] )
		{
			this.listeners[ origin ]( origin, data )
		}
	}

	private handlePortalMessage( event: MessageEvent )
	{
		this.context.debug?.( `Incoming message`, [ event ] )

		/**
		 * We only handle messages that come from the parent.
		 */
		if ( event.origin !== this.parentOrigin )
		{
			this.context.debug?.( `Incoming message from ${event.origin} not from parent ${this.parentOrigin}`, [ event ] )

			return
		}

		this.broadcast( event.origin, event.data )
	}

	/**
	 * Invisible iFrame is used as the communication portal
	 */
	private createFrame( name: string ): HTMLIFrameElement
	{
		const frame = document.createElement( `iframe` )

		frame.name = name

		frame.width = `1`

		frame.height = `1`

		frame.style.visibility = `hidden`

		frame.style.position = `absolute`

		document.body.append( frame )

		return frame
	}

	public listenToOrigin( 
		origin: string,
		handler: ( origin: string, message: unknown ) => void,
		onListen?: ( origin: string ) => void ): void
	{
		/**
		 * Sometimes a user might put in a url that isn't considered "just" the origin.
		 * Any other filtering of data should be within the data of the event and
		 * managed separately through some API definition.
		 */
		const _origin = new URL( origin ).origin

		/**
		 * Only one listener per origin per instance, the handler should filter
		 * and call any other functions that might respond to the event.
		 */
		if ( this.listeners[ _origin ] )
		{
			throw Error( `Listener for ${_origin} already exists.` )
		}

		this.listeners[ _origin ] = handler

		/**
		 * Use provided fn or base function as callback when listener is added
		 */
		;( onListen ?? this.context.onListenToOrigin )?.( _origin )
	}

	/**
	 * Add portal creates a cross-domain-capable communication port for passes messages.
	 * The provided url string should be the exact url of a portal (this should be
	 * clear from the context being connected to, unrelated to symbiosome). The portal
	 * will be opened in an iframe, and any pages on that portal's domain that is listening
	 * to messages from the parent domain will receive messages sent.
	 * 
	 * @param portalURL URL of page known to be a symbiosome portal (ie can receive messages)
	 * @param onAdded optional callback after portal is added
	 */
	public addPortal( portalURL: string, onAdded?: ( origin: string ) => void ): void
	{
		const src = new URL( portalURL )

		const _origin = src.origin

		if ( _origin === window.origin )
		{
			throw Error( `Portal ${origin} is own origin and is always connected.` )
		}

		if ( this.portals[ _origin ] )
		{
			throw Error( `Portal ${_origin} already connected.` )
		}
		
		const frame = this.createFrame( _origin )

		/**
		 * The parent origin needs to be sent via a query param as the parent.origin
		 * value isn't always accessible due to security reasons.
		 */
		src.searchParams.set( `parent`, window.origin )

		frame.src = src.toString()

		const _window = frame.contentWindow

		if ( !_window )
		{
			throw Error( `Couldn't get reference for ${_origin}.` )
		}

		this.portals[ _origin ] = {
			frame,
			window: _window
		}

		;( onAdded ?? this.context.onPortalAdded )?.( _origin )
	}

	/**
	 * Send a message to an **origin**.
	 * 
	 * @param origin **Must be origin returned from added callback, full URLs/portal URLs will not work!!!**
	 * @param message Any message in literal or structure data type (objects, nested objects, arrays)
	 * @param onPush Bespoke on push function, overrides root context.onPushedMessage
	 */
	public pushToOrigin( origin: string, message: unknown, onPush?: ( origin: string, message: unknown ) => void ): void
	{
		if ( origin === window.origin )
		{
			/**
			 * We are only sending within own origin, so this won't go through
			 * a frame intermediary. Use broadcast channel directly.
			 */
			this.broadcast( origin, message )
		}
		else
		{
			/**
			 * Send message to frame to be broadcast
			 */
			if ( !this.portals[ origin ] )
			{
				throw Error( `Cannot push to missing portal ${origin}.` )
			}
	
			this.portals[ origin ].window.postMessage( message, origin )
		}

		( onPush ?? this.context.onPushedMessage )?.( origin, message )
	}

	/**
	 * Remove a portal using it's origin (as returned via callback when added using addPortal) 
	 */
	public removePortal( origin: string, onRemoved?: ( origin: string ) => void ): void
	{
		if ( origin === window.origin )
		{
			throw Error( `Origin ${origin} is this origin, removal not possible.` )
		}

		if ( !this.portals[ origin ] )
		{
			throw Error( `Cannot remove missing portal ${origin}.` )
		}

		this.portals[ origin ].frame.remove()

		delete this.portals[ origin ]

		;( onRemoved ?? this.context.onPortalRemoved )?.( origin )
	}

	/**
	 * Remove a listener using it's origin (as returned via callback when added using listenToOrigin) 
	 */
	public removeListener( origin: string, onRemoved?: ( origin: string ) => void ): void
	{
		if ( !this.listeners[ origin ] )
		{
			throw Error( `Cannot remove missing listener ${origin}.` )
		}

		delete this.listeners[ origin ]

		;( onRemoved ?? this.context.onListenerRemoved )?.( origin )
	}

	/**
	 * Return all origins known to instance
	 */
	public getOrigins(): string[]
	{
		const origins = Object.assign( {}, this.portals )
		
		Object.assign( origins, this.listeners )

		return Object.keys( origins )
	}
}