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
                { 'kind': 'block', 'type': 'wc_component_sampler' }
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
                { 'kind': 'block', 'type': 'wc_perform' },  // 演奏
                { 'kind': 'block', 'type': 'wc_loop' },     // 背景循環
                {
                    'kind': 'block',
                    'type': 'wc_count_in',   // 預備拍
                    'inputs': {
                        'MEASURES': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'BEATS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } },
                        'BEAT_UNIT': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } },
                        'VELOCITY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_transport_set_bpm',  // 設定 BPM
                    'inputs': {
                        'BPM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 120 } } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_define_chord' }, // 新增：定義和弦
                { 'kind': 'block', 'type': 'wc_select_current_instrument' },  // 選擇樂器
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
                { 'kind': 'block', 'type': 'wc_rhythm_v2' }, // 進階序列器
                { 'kind': 'block', 'type': 'wc_wait', 'inputs': { 'MS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } } } },
                {
                    'kind': 'block',
                    'type': 'wc_wait_musical', // 音樂性等待
                    'inputs': {
                        'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_release_note', // 釋放音符
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'wc_note' } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_note' },
                { 'kind': 'block', 'type': 'wc_stop' }
            ]
        },

        { 'kind': 'sep' },  
        
        // 8. 序列埠與硬體 (Serial & Hardware)          
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
        }
    ]
};
