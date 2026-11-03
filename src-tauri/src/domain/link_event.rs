//! Event-viewer lines when the link engine applies a mapping.

use crate::domain::device::ButtonId;
use crate::domain::profile::{Action, Activator, MouseClickButton, SystemCommand};
use crate::platform::input_monitor;

pub enum LinkPhase {
    Press,
    LongPress,
}

pub fn announce(input: &Activator, action: &Action, inject_id: ButtonId, phase: LinkPhase) {
    if action.is_noop() {
        return;
    }
    if matches!(action, Action::Default)
        && crate::domain::remap::action_is_native_for(inject_id, action)
    {
        return;
    }
    let input_label = input_monitor::activator_label(input);
    let output = format_action(action);
    let summary = match phase {
        LinkPhase::Press => format!("link · {input_label} → {output}"),
        LinkPhase::LongPress => format!("link · {input_label} → {output} (long press)"),
    };
    input_monitor::publish_link_line(summary);
}

pub fn format_action(action: &Action) -> String {
    match action {
        Action::Default => "기본".into(),
        Action::Disabled => "없음".into(),
        Action::MouseClick { button } => format!("클릭 {}", mouse_button_label(button)),
        Action::DoubleClick => "더블클릭".into(),
        Action::KeyStroke { keys } => {
            if keys.is_empty() {
                "키".into()
            } else {
                format!("키 {}", keys.join("+"))
            }
        }
        Action::System { command } => format!("시스템 {}", system_command_label(command)),
        Action::OpenApp { name, bundle_id } => {
            if let Some(name) = name {
                format!("앱 {name}")
            } else {
                format!("앱 {bundle_id}")
            }
        }
        Action::Scroll { dx, dy } => format!("스크롤 ({dx},{dy})"),
        Action::Macro { steps } => format!("매크로 {}단계", steps.len()),
    }
}

fn mouse_button_label(button: &MouseClickButton) -> String {
    match button {
        MouseClickButton::Left => "왼쪽".into(),
        MouseClickButton::Right => "오른쪽".into(),
        MouseClickButton::Middle => "가운데".into(),
        MouseClickButton::Back => "뒤로".into(),
        MouseClickButton::Forward => "앞으로".into(),
        MouseClickButton::Other { number } => format!("Button {}", number + 1),
    }
}

fn system_command_label(command: &SystemCommand) -> &'static str {
    match command {
        SystemCommand::MissionControl => "Mission Control",
        SystemCommand::AppExpose => "App Exposé",
        SystemCommand::ShowDesktop => "바탕화면",
        SystemCommand::Launchpad => "Launchpad",
        SystemCommand::Spotlight => "Spotlight",
        SystemCommand::AppSwitcher => "앱 전환",
        SystemCommand::CloseWindow => "창 닫기",
        SystemCommand::Save => "저장",
        SystemCommand::Cut => "잘라내기",
        SystemCommand::Copy => "복사",
        SystemCommand::Paste => "붙여넣기",
        SystemCommand::Undo => "실행 취소",
        SystemCommand::Redo => "다시 실행",
        SystemCommand::VolumeUp => "볼륨 업",
        SystemCommand::VolumeDown => "볼륨 다운",
        SystemCommand::Mute => "음소거",
        SystemCommand::PreviousTrack => "이전 트랙",
        SystemCommand::NextTrack => "다음 트랙",
        SystemCommand::PlayPause => "재생/일시정지",
        SystemCommand::MoveSpaceLeft => "Space 왼쪽",
        SystemCommand::MoveSpaceRight => "Space 오른쪽",
        SystemCommand::InputSourceNext => "입력 소스 다음",
        SystemCommand::InputSourcePrevious => "입력 소스 이전",
    }
}
