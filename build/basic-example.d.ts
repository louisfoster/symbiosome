import { SymbiosomeContext } from "./symbiosome";
export declare class BasicExample implements SymbiosomeContext {
    private sym;
    private el;
    isPortal: boolean;
    onPortalAdded?: ((origin: string) => void) | undefined;
    onListenToOrigin?: ((origin: string) => void) | undefined;
    onPushedMessage?: ((origin: string, message: unknown) => void) | undefined;
    onPortalRemoved?: ((origin: string) => void) | undefined;
    onListenerRemoved?: ((origin: string) => void) | undefined;
    constructor();
    private handleDebug;
    private onPush;
    private removeListener;
    private onListen;
    private removePortal;
    private onAdded;
    private onMessage;
    private onRemovedListener;
    private onRemovedPortal;
}
//# sourceMappingURL=basic-example.d.ts.map