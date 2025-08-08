/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from 'ink';
import { type Config } from '@google/gemini-cli-core';

export function PrivacyNotice({ onExit, config }: { onExit: () => void; config: Config }) {
  const provider = 'Google Gemini via API Key';
  return (
    <Box borderStyle="round" padding={1} flexDirection="column">
      <Text>
        {`Using ${provider}. Your API key will be used to access the selected model.`}
      </Text>
    </Box>
  );
}
