import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { getLogger } from 'log4njs';
import { logEvent } from './lib/log-event';
import { normalize } from './lib/normalize';
import { responseSuccess, responseError } from './lib/cfn-response';

const log = getLogger();

type LuloOptions = {
    logEvent?: boolean
    logResponse?: boolean
    maskedProperties?: string[],
}

type LuloPluginOptions = Partial<LuloOptions>;
type LuloPlugin = {
    validate?: (event: CloudFormationCustomResourceEvent) => void,
    create: (event: CloudFormationCustomResourceEvent, context: Context) => any,
    update: (event: CloudFormationCustomResourceEvent, context: Context) => any,
    delete: (event: CloudFormationCustomResourceEvent, context: Context) => any,
    schema?: object
};
type LuloPluginConfig = { plugin: LuloPlugin, options?: LuloPluginOptions };

export class Lulo {
    private readonly logEvents: boolean;
    private readonly logResponse: boolean;
    private readonly maskedProperties: string[];
    private readonly plugins: Map<string, LuloPluginConfig>;

    constructor(options: LuloOptions = {}) {
        this.logEvents = options.logEvent || false;
        this.logResponse = options.logResponse || false;
        this.maskedProperties = options.maskedProperties || [];
        this.plugins = new Map<string, LuloPluginConfig>();
    }

    /**
     * Register a new Lulo Plugin
     * @param pluginName The plugin name. Defines how this plugin is referenced in Cfn: Custom::PluginName
     * @param plugin
     * @param options
     * @returns {Lulo}
     */
    register(pluginName: string, plugin: LuloPlugin, options?: LuloPluginOptions) {
        if (this.plugins.has(pluginName)) {
            throw new Error('Trying to register same plugin name twice: ' + pluginName);
        }
        this.plugins.set(pluginName, { plugin, options });

        return this;
    }

    async handler(event: CloudFormationCustomResourceEvent, context: Context) {
        let pluginConfig: LuloPluginConfig | undefined;
        let logResponse = false;

        try {
            pluginConfig = this._loadPlugin(event);
            if (!pluginConfig) {
                return await responseSuccess(event, context, logResponse);
            }

            logResponse = this._shouldLogResponse(pluginConfig.options);
            if (this._shouldLogEvent(pluginConfig.options)) {
                logEvent(event, this._getMaskedProperties(pluginConfig.options));
            }

            event = this._normalizeEventAgainstSchema(event, pluginConfig);
            await this._validateInput(event, pluginConfig);

            let pluginResponseData;
            switch (event.RequestType) {
                case 'Create':
                    pluginResponseData = await pluginConfig.plugin.create(event, context);
                    break;
                case 'Delete':
                    pluginResponseData = await pluginConfig.plugin.delete(event, context);
                    break;
                default:
                    pluginResponseData = await pluginConfig.plugin.update(event, context);
                    break;
            }

            await responseSuccess(event, context, logResponse, pluginResponseData);
        } catch (error: any) {
            await responseError(event, context, logResponse, error);
        }
    }

    private _loadPlugin(event: CloudFormationCustomResourceEvent): LuloPluginConfig | undefined {
        const pluginName = event.ResourceType.split('::')[1];
        if (!this.plugins.has(pluginName)) {
            log.info('Missing plugin, exiting', { pluginName });
            if (event.RequestType === 'Delete') {
                log.info('Not causing failure since request is of type Delete', { pluginName });
                return undefined;
            }

            log.info('Causing failure since request is not of type Delete', { pluginName });
            throw new Error(`Unknown resource type: ${event.ResourceType}`);
        }

        log.info('Loading Custom Resource Plugin', { pluginName });
        return this.plugins.get(pluginName) as LuloPluginConfig;
    }

    /**
     * Validates the input provided to the plugin.
     * If the RequestType equals 'Delete', validation is skipped to ensure that rollbacks do not fail.
     * @param event
     * @param pluginConfig
     * @private
     */
    private async _validateInput(event: CloudFormationCustomResourceEvent, pluginConfig: LuloPluginConfig) {
        if (event.RequestType !== 'Delete' && pluginConfig.plugin.validate) {
            await pluginConfig.plugin.validate(event);
        }
    }

    private _normalizeEventAgainstSchema(event: CloudFormationCustomResourceEvent, pluginConfig: LuloPluginConfig) {
        /* istanbul ignore if */
        if (pluginConfig.plugin.schema) {
            log.info('Normalizing event using plugin schema', { schema: pluginConfig.plugin.schema });
            event = normalize(event, pluginConfig.plugin.schema);
            log.info('Event normalized', { event });
        }
        return event;
    }

    /**
     * Checks the logResponse setting in Plugin configuration or Lulo configuration
     * @param options
     */
    private _shouldLogResponse(options?: LuloPluginOptions) {
        if (options && typeof options.logResponse === 'boolean') {
            return options.logResponse;
        }

        return this.logResponse;
    }

    /**
     * Checks the logEvent setting in Plugin configuration or Lulo configuration
     * @param options
     */
    private _shouldLogEvent(options?: LuloPluginOptions) {
        if (options && typeof options.logEvent === 'boolean') {
            return options.logEvent;
        }

        return this.logEvents;
    }

    /**
     * Checks the maskedProperties setting in Plugin configuration or Lulo configuration
     * @param options
     */
    private _getMaskedProperties(options?: LuloPluginOptions) {
        if (options && Array.isArray(options.maskedProperties)) {
            return options.maskedProperties;
        }

        return this.maskedProperties;
    }
}
