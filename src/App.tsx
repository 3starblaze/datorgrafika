import Init from "./pages/init";
import Task1b from "./pages/task1b";
import Task2a from "./pages/task2a";
import Task3d from "./pages/task3d";
import Task5a from "./pages/task5a";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

function App() {
    return (
        // NOTE: 100vw includes the scrollbar which causes undesired horizontal overflow in
        // Chromium browsers on non-mobile devices. This is why we use this peculiar calc, see
        // https://stackoverflow.com/a/34884924
        <div className="bg-white w-[calc(100vw-(100vw-100%)] min-h-screen p-4">
            <Tabs defaultValue="init">
                <TabsList className="mb-4">
                    <TabsTrigger value="init">Mājas</TabsTrigger>

                    <TabsTrigger value="task_1b">Uzdevums 1b</TabsTrigger>
                    <TabsTrigger value="task_2a">Uzdevums 2a</TabsTrigger>
                    <TabsTrigger value="task_3d">Uzdevums 3d</TabsTrigger>
                    <TabsTrigger value="task_5a">Uzdevums 5a</TabsTrigger>
                </TabsList>

                <TabsContent value="init">
                    <Init />
                </TabsContent>
                <TabsContent value="task_1b">
                    <Task1b />
                </TabsContent>
                <TabsContent value="task_2a">
                    <Task2a />
                </TabsContent>
                <TabsContent value="task_3d">
                    <Task3d />
                </TabsContent>
                <TabsContent value="task_5a">
                    <Task5a />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default App;
