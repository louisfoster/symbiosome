export declare type OriginMessageHandler = (origin: string, message: unknown) => void;
export interface Portal {
    frame: HTMLIFrameElement;
    window: Window;
}
export interface SymbiosomeContext {
    isPortal: boolean;
    onPortalAdded?: (origin: string) => void;
    onListenToOrigin?: (origin: string) => void;
    onPushedMessage?: (origin: string, message: unknown) => void;
    onPortalRemoved?: (origin: string) => void;
    onListenerRemoved?: (origin: string) => void;
    debug?: (message: string, data?: unknown[]) => void;
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
export declare class Symbiosome {
    private context;
    private listeners;
    private portals;
    private parent?;
    private parentOrigin?;
    private broadcastChannel;
    private channelID;
    constructor(context: SymbiosomeContext);
    private handleBroadcast;
    private broadcast;
    private handlePortalMessage;
    /**
     * Invisible iFrame is used as the communication portal
     */
    private createFrame;
    listenToOrigin(origin: string, handler: (origin: string, message: unknown) => void, onListen?: (origin: string) => void): void;
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
    addPortal(portalURL: string, onAdded?: (origin: string) => void): void;
    /**
     * Send a message to an **origin**.
     *
     * @param origin **Must be origin returned from added callback, full URLs/portal URLs will not work!!!**
     * @param message Any message in literal or structure data type (objects, nested objects, arrays)
     * @param onPush Bespoke on push function, overrides root context.onPushedMessage
     */
    pushToOrigin(origin: string, message: unknown, onPush?: (origin: string, message: unknown) => void): void;
    /**
     * Remove a portal using it's origin (as returned via callback when added using addPortal)
     */
    removePortal(origin: string, onRemoved?: (origin: string) => void): void;
    /**
     * Remove a listener using it's origin (as returned via callback when added using listenToOrigin)
     */
    removeListener(origin: string, onRemoved?: (origin: string) => void): void;
    /**
     * Return all origins known to instance
     */
    getOrigins(): string[];
}
//# sourceMappingURL=symbiosome.d.ts.map