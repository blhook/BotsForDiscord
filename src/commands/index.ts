// Author: Brandon Hook
//
// Copyright (c) 2024 Brandon Hook. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// For a copy, see <https://opensource.org/licenses/MIT>.

import { Hunt } from '../bots/hunt-bot/hunt';
import { SlashCommands } from '../classes';

export const commands: SlashCommands[] = [new Hunt()];
