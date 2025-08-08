/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCliVersion } from '../../utils/version.js';
import { CommandKind, SlashCommand } from './types.js';
import process from 'node:process';
import { MessageType, type HistoryItemAbout } from '../types.js';

export const aboutCommand: SlashCommand = {
  name: 'about',
  description: 'show version info',
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const osVersion = process.platform;
    let sandboxEnv = 'no sandbox';
    if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
      sandboxEnv = process.env.SANDBOX;
    } else if (process.env.SANDBOX === 'sandbox-exec') {
      sandboxEnv = `sandbox-exec (${
        process.env.SEATBELT_PROFILE || 'unknown'
      })`;
    }
    const modelVersion = context.services.config?.getModel() || 'Unknown';
    const cliVersion = await getCliVersion();
    const provider = context.services.settings.merged.provider || '';
    // const selectedAuthType = context.services.settings.merged.selectedAuthType || '';
    // const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || '';

    const aboutItem: Omit<HistoryItemAbout, 'id'> = {
      cliVersion,
      osVersion,
      sandboxEnv,
      modelVersion,
      provider,
    };

    context.ui.addItem(aboutItem, Date.now());
  },
};
