/**
 * WaveCode Toolbox Definition - 對齊 #processing 分類
 */

export const WaveCodeToolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        // 0. 系統與硬體
        {
            'kind': 'category',
            'name': '%{BKY_CAT_SYSTEM}',
            'colour': '%{BKY_SYSTEM_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_init' },
                { 'kind': 'block', 'type': 'wc_text_print', 'inputs': { 'TEXT': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'Hello WaveCode' } } } } },
                { 'kind': 'block', 'type': 'wc_comment' }
            ]
        },
        // 1. 邏輯與控制
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOGIC}',
            'colour': '%{BKY_LOGIC_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'controls_if' },
                { 'kind': 'block', 'type': 'logic_compare' },
                { 'kind': 'block', 'type': 'logic_operation' },
                { 'kind': 'block', 'type': 'logic_negate' },
                { 'kind': 'block', 'type': 'logic_boolean' },
                { 'kind': 'block', 'type': 'logic_null' },
                { 'kind': 'block', 'type': 'logic_ternary' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOOPS}',
            'colour': '%{BKY_LOOPS_HUE}',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'controls_repeat_ext',
                    'inputs': { 'TIMES': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } } }
                },
                { 'kind': 'block', 'type': 'controls_whileUntil' },
                {
                    'kind': 'block',
                    'type': 'controls_for',
                    'inputs': {
                        'FROM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'TO': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10 } } },
                        'BY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                { 'kind': 'block', 'type': 'controls_forEach' },
                { 'kind': 'block', 'type': 'controls_flow_statements' }
            ]
        },

        { 'kind': 'sep' },

        // 2. 數學與變數
        {
            'kind': 'category',
            'name': '%{BKY_CAT_MATH}',
            'colour': '%{BKY_MATH_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'math_number' },
                {
                    'kind': 'block',
                    'type': 'math_arithmetic',
                    'inputs': {
                        'A': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'B': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                { 'kind': 'block', 'type': 'math_single', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 9 } } } } },
                { 'kind': 'block', 'type': 'math_trig', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 45 } } } } },
                { 'kind': 'block', 'type': 'math_constant' },
                { 'kind': 'block', 'type': 'math_number_property', 'inputs': { 'NUMBER_TO_CHECK': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } } } },
                { 'kind': 'block', 'type': 'math_round', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 3.1 } } } } },
                { 'kind': 'block', 'type': 'math_on_list' },
                { 'kind': 'block', 'type': 'math_modulo', 'inputs': { 'DIVIDEND': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 64 } } }, 'DIVISOR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10 } } } } },
                { 'kind': 'block', 'type': 'math_constrain', 'inputs': { 'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50 } } }, 'LOW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }, 'HIGH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } } } },
                {
                    'kind': 'block',
                    'type': 'math_map',
                    'inputs': {
                        'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 512 } } },
                        'FROM_LOW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'FROM_HIGH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1023 } } },
                        'TO_LOW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'TO_HIGH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } }
                    }
                },
                { 'kind': 'block', 'type': 'math_random_int', 'inputs': { 'FROM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }, 'TO': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } } } },
                { 'kind': 'block', 'type': 'math_random_float' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_TEXT}',
            'colour': '%{BKY_TEXT_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'text' },
                { 'kind': 'block', 'type': 'text_join' },
                { 'kind': 'block', 'type': 'text_append', 'inputs': { 'TEXT': { 'shadow': { 'type': 'text' } } } },
                { 'kind': 'block', 'type': 'text_length', 'inputs': { 'VALUE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'abc' } } } } },
                { 'kind': 'block', 'type': 'text_isEmpty', 'inputs': { 'VALUE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': '' } } } } }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_VARIABLES}',
            'custom': 'VARIABLE',
            'colour': '%{BKY_VARIABLES_HUE}'
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_FUNCTIONS}',
            'custom': 'PROCEDURE',
            'colour': '%{BKY_FUNCTIONS_HUE}'
        },

        { 'kind': 'sep' },

        // 3. 主輸出控制 (Master Out)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_MASTER}',
            'colour': '#e74c3c',
            'contents': [
                { 'kind': 'block', 'type': 'wc_master' }
            ]
        },


        // 4. 音源定義 (Sound Sources)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_SOUND_SOURCES}',
            'colour': '%{BKY_SOUND_SOURCES_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_instrument' },
                { 'kind': 'block', 'type': 'wc_component_osc' },
                { 'kind': 'block', 'type': 'wc_create_additive_synth' },
                { 'kind': 'block', 'type': 'wc_sampler_percussion' },
                { 'kind': 'block', 'type': 'wc_sampler_melodic' }
            ]
        },

        // 5. 樂器控制 (Instrument Control)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_INSTRUMENT_CONTROL}',
            'colour': '%{BKY_INSTRUMENT_CONTROL_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_component_adsr' },
                { 'kind': 'block', 'type': 'wc_component_volume' }
            ]
        },

        // 6. 音訊效果 (Audio Effects)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_EFFECTS}',
            'colour': '%{BKY_EFFECTS_HUE}',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'wc_effect_filter',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1000 } } },
                        'Q': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },

                {
                    'kind': 'block',
                    'type': 'wc_effect_reverb',
                    'inputs': {
                        'SECONDS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 3 } } },
                        'DECAY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 2 } } },
                        'MIX': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.5 } } }
                    }
                },


                {
                    'kind': 'block',
                    'type': 'wc_effect_delay',
                    'inputs': {
                        'TIME': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.5 } } },
                        'FEEDBACK': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.5 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_effect_bitcrush',
                    'inputs': {
                        'BITS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 8 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_effect_distortion',
                    'inputs': {
                        'AMOUNT': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_effect_compressor',
                    'inputs': {
                        'THRESH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': -24 } } },
                        'RATIO': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 12 } } },
                        'ATTACK': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.003 } } },
                        'RELEASE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0.25 } } },
                        'MAKEUP': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_set_effect_param',
                    'inputs': {
                        'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1000 } } }
                    }
                }
            ]
        },

        // 7. 演奏指令 (Performance)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_PERFORMANCE}',
            'colour': '%{BKY_PERFORMANCE_HUE}',
            'contents': [
                { 'kind': 'label', 'text': '--- 演奏容器 (Containers) ---' },
                { 'kind': 'block', 'type': 'wc_perform' },
                { 'kind': 'block', 'type': 'wc_loop' },
                
                { 'kind': 'sep', 'gap': '32' },
                { 'kind': 'label', 'text': '--- 和弦與樂句封裝 (Chords and Phrases) ---' },
                { 'kind': 'block', 'type': 'wc_define_chord' },
                { 'kind': 'block', 'type': 'wc_phrase_def' },
                { 'kind': 'block', 'type': 'wc_phrase_call' },

                { 'kind': 'sep', 'gap': '32' },
                { 'kind': 'label', 'text': '--- 核心演奏 (Core Play) ---' },
                {
                    'kind': 'block',
                    'type': 'wc_play_note',
                    'inputs': {
                        'NOTE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'C4' } } },
                        'DUR': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': '1' } } },
                        'VELOCITY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_play_note_async',
                    'inputs': {
                        'NOTE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'C4' } } },
                        'DUR': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': '1' } } },
                        'VELOCITY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_play_melody' },
                { 'kind': 'block', 'type': 'wc_rhythm_v2' },

                { 'kind': 'sep', 'gap': '32' },
                { 'kind': 'label', 'text': '--- 控制與等待 (Control) ---' },
                {
                    'kind': 'block',
                    'type': 'wc_transport_set_bpm',
                    'inputs': {
                        'BPM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 120 } } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_select_current_instrument' },
                {
                    'kind': 'block',
                    'type': 'wc_count_in',
                    'inputs': {
                        'MEASURES': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'BEATS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } },
                        'BEAT_UNIT': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } },
                        'VELOCITY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_wait_musical',
                    'inputs': {
                        'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_wait', 'inputs': { 'MS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } } } },
                { 'kind': 'block', 'type': 'wc_stop' },

                { 'kind': 'sep', 'gap': '32' },
                { 'kind': 'label', 'text': '--- 進階控制 (Advanced) ---' },
                {
                    'kind': 'block',
                    'type': 'wc_release_note',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'wc_note' } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_note' }
            ]
        },

        { 'kind': 'sep' },  
        
        // 8. 序列埠、PC 鍵盤與 MIDI 裝置 (Serial & Hardware)          
        {
            'kind': 'category',
            'name': '%{BKY_CAT_SERIAL}',
            'colour': '%{BKY_SERIAL_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_serial_init' },
                { 'kind': 'block', 'type': 'wc_serial_data_received' },
                { 'kind': 'block', 'type': 'wc_serial_check_ttp' },
                { 'kind': 'block', 'type': 'wc_serial_get_field' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_PC_KEYBOARD}',
            'colour': '%{BKY_PC_KEYBOARD_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_key_event' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_MIDI}',
            'colour': '%{BKY_MIDI_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_midi_on_note' },
                { 'kind': 'block', 'type': 'wc_midi_on_note_off' },
                { 'kind': 'block', 'type': 'wc_midi_on_cc' },
                {
                    'kind': 'block',
                    'type': 'wc_midi_lp_xy_to_note',
                    'inputs': {
                        'X': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } },
                        'Y': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } }
                    }
                }
            ]
        }
    ]
};
