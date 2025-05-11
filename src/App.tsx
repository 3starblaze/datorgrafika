import Init from "./pages/init";
import Task1b from "./pages/task1b";
import Task2a from "./pages/task2a";
import Task3d from "./pages/task3d";
import Task5a from "./pages/task5a";
import Task8a from "./pages/task8a";
import Task10a from "./pages/task10a";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

type TabInfo = {
    key: string,
    title: string,
    component: React.FC,
};

const tabs: TabInfo[] = [
    { key: "init", title: "Mājas", component: Init },
    { key: "task_1b", title: "Uzdevums 1b", component: Task1b },
    { key: "task_2a", title: "Uzdevums 2a", component: Task2a },
    { key: "task_3d", title: "Uzdevums 3d", component: Task3d },
    { key: "task_5a", title: "Uzdevums 5a", component: Task5a },
    { key: "task_8a", title: "Uzdevums 8a", component: Task8a },
    { key: "task_10a", title: "Uzdevums 10a", component: Task10a },
];

function App() {
    return (
        // NOTE: 100vw includes the scrollbar which causes undesired horizontal overflow in
        // Chromium browsers on non-mobile devices. This is why we use this peculiar calc, see
        // https://stackoverflow.com/a/34884924
        <div className="bg-white w-[calc(100vw-(100vw-100%)] min-h-screen p-4">
            <Tabs defaultValue="init">
                <TabsList className="mb-4">
                    {tabs.map(({ key, title }) => (
                        <TabsTrigger key={key} value={key}>{title}</TabsTrigger>
                    ))}
                </TabsList>

                {tabs.map(({ key, component: Component }) => (
                    <TabsContent key={key} value={key}><Component /></TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

export default App;
