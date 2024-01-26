#include "Engine.h"
#include "Core/Window.h"
#include "Core/Input.h"

void Engine::Run()
{	

	Window::Init(1920 * 1.5f, 1080 * 1.5f);

	while (Window::WindowIsOpen())
	{

		if (Input::KeyPressed(GLFW_KEY_F)) {
			Window::ToggleFullscreen();
		}
		if (Input::KeyPressed(GLFW_KEY_ESCAPE)) {
			return;
		}
		
		Window::ProcessInput();
		Input::Update();
		Window::SwapBuffersPollEvents();

		
	}

}